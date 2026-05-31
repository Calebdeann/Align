import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/constants/theme';
import { UserAvatar, OnboardingContinueButton, NameShells } from '@/components';
import {
  TRAIT_CATEGORIES,
  TRAITS_BOX_H,
  TRAITS_PILL_H,
  TRAITS_SCALE_MIN,
  TRAITS_SCALE_MAX,
  getTraitLabel,
  getTraitVerifyKey,
  type PlacedTrait,
} from '@/constants/traits';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useStatTraitEligibility } from '@/utils/traitEligibility';

const MAX_TRAITS = 5;

// Invisible vertical padding around the visible canvas inside the
// GestureDetector. Gives the user a much larger area to land the second
// finger for pinch/rotate without changing the visible dashed box. The
// visual whitespace is offset by negative outer margins in `gestureZone`
// so the page layout looks the same as before the gesture-zone change.
// Bottom is kept smaller than top so the touch-capture box doesn't extend
// into the tab bar / tag pressables below the instruction text.
const GESTURE_ZONE_PADDING_TOP = 80;
const GESTURE_ZONE_PADDING_BOTTOM = 40;

// Drop-in slots used when adding a trait — staggered across the canvas so
// multiple traits don't all land on top of each other. Tuned for the 140px
// canvas.
const SLOTS = [
  { xN: 0.04, yN: 0.1, rot: 0.12 },
  { xN: 0.5, yN: 0.06, rot: -0.08 },
  { xN: 0.26, yN: 0.4, rot: 0.18 },
  { xN: 0.06, yN: 0.66, rot: -0.14 },
  { xN: 0.52, yN: 0.62, rot: 0.06 },
];

// Snapshot of each placed pill's position/transform used for rotated-rect
// hit-testing inside worklets. Pixel-space (not normalized).
type PillSnapshot = {
  categoryId: string;
  x: number;
  y: number;
  w: number;
  rot: number;
  scale: number;
};

function GearIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        fill="#000000"
        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      />
    </Svg>
  );
}

export default function TraitsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const boxWidth = width - 32;

  const profile = useUserProfileStore((s) => s.profile);
  const sessionAvatarUri = useUserProfileStore((s) => s.sessionAvatarUri);
  const saveTraits = useUserProfileStore((s) => s.saveTraits);

  const initial = (profile?.traits ?? []) as PlacedTrait[];
  const [placedTraits, setPlacedTraits] = useState<PlacedTrait[]>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(TRAIT_CATEGORIES[0].id);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const unlockedStats = useStatTraitEligibility();

  // JS-side refs that mirror state so worklets can call back consistently.
  const activeIdxRef = useRef<number | null>(null);
  const placedTraitsRef = useRef<PlacedTrait[]>(initial);
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);
  useEffect(() => {
    placedTraitsRef.current = placedTraits;
  }, [placedTraits]);

  // Per-pill measured widths from onLayout. Drives hit-testing accuracy.
  const pillWidthsRef = useRef<number[]>([]);

  // Pillsnapshot array used by the worklet hit-test. Re-built whenever the
  // committed traits or measured widths change.
  const pillsSV = useSharedValue<PillSnapshot[]>([]);

  // Live shared values for the currently-active pill. Drive its animated
  // style during interaction. Re-synced atomically inside the worklet when
  // a new pill becomes active, so there's no race with React state.
  const aTx = useSharedValue(0);
  const aTy = useSharedValue(0);
  const aScale = useSharedValue(1);
  const aRotation = useSharedValue(0);
  const aSavedTx = useSharedValue(0);
  const aSavedTy = useSharedValue(0);
  const aSavedScale = useSharedValue(1);
  const aSavedRotation = useSharedValue(0);
  const aMeasuredW = useSharedValue(120);
  const aPressing = useSharedValue(0);
  const activeIdxSV = useSharedValue(-1);

  // Sync pillsSV whenever the committed trait list (or canvas width) changes.
  useEffect(() => {
    pillsSV.value = placedTraits.map((t, i) => ({
      categoryId: t.categoryId,
      x: t.x * boxWidth,
      y: t.y * TRAITS_BOX_H,
      w: pillWidthsRef.current[i] ?? 120,
      rot: t.rotation,
      scale: t.scale ?? 1,
    }));
  }, [placedTraits, boxWidth, pillsSV]);

  function onPillLayout(idx: number, w: number) {
    pillWidthsRef.current[idx] = w;
    // Reflect into snapshot array so hit-test picks it up immediately.
    pillsSV.value = pillsSV.value.map((p, i) => (i === idx ? { ...p, w } : p));
    if (activeIdxRef.current === idx) {
      aMeasuredW.value = w;
    }
  }

  function commitActive() {
    const idx = activeIdxRef.current;
    if (idx == null) return;
    const x = aTx.value / boxWidth;
    const y = aTy.value / TRAITS_BOX_H;
    const rotation = aRotation.value;
    const scale = aScale.value;
    setPlacedTraits((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, x, y, rotation, scale } : t))
    );
  }

  function setActiveFromWorklet(idx: number | null) {
    setActiveIdx(idx);
    if (idx != null) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }

  function removeTrait(idx: number) {
    setPlacedTraits((prev) => prev.filter((_, i) => i !== idx));
    pillWidthsRef.current.splice(idx, 1);
    setActiveIdx((curr) => {
      if (curr == null) return curr;
      if (curr === idx) {
        activeIdxSV.value = -1;
        return null;
      }
      const next = curr > idx ? curr - 1 : curr;
      activeIdxSV.value = next;
      return next;
    });
  }

  // One canvas-level Pan + Pinch + Rotate composed simultaneously. The
  // GestureDetector wraps a transparent zone larger than the visible canvas
  // (paddingTop/Bottom = GESTURE_ZONE_PADDING_*), so finger 2 can land well
  // outside the visible dashed box and pinch/rotate still recognize.
  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      'worklet';
      // e.x / e.y are in the WRAPPED zone's local coords. Convert to
      // canvas-local for the hit-test by subtracting the zone's top padding.
      const canvasX = e.x;
      const canvasY = e.y - GESTURE_ZONE_PADDING_TOP;

      // Rotated-rect hit-test, front to back. Pill visual center is at
      // (p.x + p.w/2, p.y + h/2); scale pivots around the View center so
      // it does NOT shift the center.
      const pills = pillsSV.value;
      let hit = -1;
      for (let i = pills.length - 1; i >= 0; i--) {
        const p = pills[i];
        const cx = p.x + p.w / 2;
        const cy = p.y + TRAITS_PILL_H / 2;
        const dx = canvasX - cx;
        const dy = canvasY - cy;
        const cosR = Math.cos(-p.rot);
        const sinR = Math.sin(-p.rot);
        const lx = dx * cosR - dy * sinR;
        const ly = dx * sinR + dy * cosR;
        const ux = lx / p.scale;
        const uy = ly / p.scale;
        // Generous touch slop so small pills are easy to grab.
        const halfW = p.w / 2 + 12;
        const halfH = TRAITS_PILL_H / 2 + 12;
        if (ux >= -halfW && ux <= halfW && uy >= -halfH && uy <= halfH) {
          hit = i;
          break;
        }
      }
      if (hit >= 0) {
        const p = pills[hit];
        // Sync live SVs atomically so onUpdate worklets see consistent state.
        aTx.value = p.x;
        aTy.value = p.y;
        aScale.value = p.scale;
        aRotation.value = p.rot;
        aSavedTx.value = p.x;
        aSavedTy.value = p.y;
        aSavedScale.value = p.scale;
        aSavedRotation.value = p.rot;
        aMeasuredW.value = p.w;
        activeIdxSV.value = hit;
        aPressing.value = withTiming(1, { duration: 90 });
        runOnJS(setActiveFromWorklet)(hit);
      } else {
        activeIdxSV.value = -1;
        runOnJS(setActiveFromWorklet)(null);
      }
    })
    .onUpdate((e) => {
      'worklet';
      if (activeIdxSV.value < 0) return;
      const nextX = aSavedTx.value + e.translationX;
      const nextY = aSavedTy.value + e.translationY;
      const halfW = (aMeasuredW.value * aScale.value) / 2;
      const halfH = (TRAITS_PILL_H * aScale.value) / 2;
      aTx.value = Math.max(-halfW, Math.min(boxWidth - halfW, nextX));
      aTy.value = Math.max(-halfH, Math.min(TRAITS_BOX_H - halfH, nextY));
    })
    .onEnd(() => {
      'worklet';
      if (activeIdxSV.value < 0) return;
      aSavedTx.value = aTx.value;
      aSavedTy.value = aTy.value;
      runOnJS(commitActive)();
    })
    .onFinalize(() => {
      'worklet';
      aPressing.value = withTiming(0, { duration: 140 });
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      'worklet';
      if (activeIdxSV.value < 0) return;
      const next = aSavedScale.value * e.scale;
      aScale.value = Math.min(Math.max(next, TRAITS_SCALE_MIN), TRAITS_SCALE_MAX);
    })
    .onEnd(() => {
      'worklet';
      if (activeIdxSV.value < 0) return;
      aSavedScale.value = aScale.value;
      runOnJS(commitActive)();
    });

  const rotate = Gesture.Rotation()
    .onUpdate((e) => {
      'worklet';
      if (activeIdxSV.value < 0) return;
      aRotation.value = aSavedRotation.value + e.rotation;
    })
    .onEnd(() => {
      'worklet';
      if (activeIdxSV.value < 0) return;
      aSavedRotation.value = aRotation.value;
      runOnJS(commitActive)();
    });

  // Single-tap on a placed pill → switch the tag list to that pill's
  // category. `.maxDistance(10)` + default single-finger + default
  // maxDuration disambiguates this from drags and pinch/rotate gestures.
  const tap = Gesture.Tap()
    .maxDistance(10)
    .onEnd((e, success) => {
      'worklet';
      if (!success) return;
      const canvasX = e.x;
      const canvasY = e.y - GESTURE_ZONE_PADDING_TOP;
      const pills = pillsSV.value;
      for (let i = pills.length - 1; i >= 0; i--) {
        const p = pills[i];
        const cx = p.x + p.w / 2;
        const cy = p.y + TRAITS_PILL_H / 2;
        const dx = canvasX - cx;
        const dy = canvasY - cy;
        const cosR = Math.cos(-p.rot);
        const sinR = Math.sin(-p.rot);
        const lx = dx * cosR - dy * sinR;
        const ly = dx * sinR + dy * cosR;
        const ux = lx / p.scale;
        const uy = ly / p.scale;
        const halfW = p.w / 2 + 12;
        const halfH = TRAITS_PILL_H / 2 + 12;
        if (ux >= -halfW && ux <= halfW && uy >= -halfH && uy <= halfH) {
          runOnJS(setActiveCategoryId)(p.categoryId);
          return;
        }
      }
    });

  const canvasGesture = Gesture.Simultaneous(pan, pinch, rotate, tap);

  // Animated style for the active pill — applied to whichever pill is
  // currently selected. Includes the touch-lift bump and shadow ramp.
  const activeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: aTx.value },
      { translateY: aTy.value },
      { rotate: `${aRotation.value}rad` },
      { scale: aScale.value * (1 + 0.04 * aPressing.value) },
    ] as ViewStyle['transform'],
    shadowOpacity: 0.18 * aPressing.value,
    shadowRadius: 6 + 4 * aPressing.value,
  }));

  function handleTagPress(categoryId: string, tag: string) {
    const existingIdx = placedTraits.findIndex((t) => t.categoryId === categoryId && t.tag === tag);

    // Already on canvas → toggle off
    if (existingIdx !== -1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      removeTrait(existingIdx);
      return;
    }

    // Hit max — warn, don't add
    if (placedTraits.length >= MAX_TRAITS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Add new trait — drop into the next staggered slot
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const slot = SLOTS[placedTraits.length] ?? SLOTS[0];
    const newTrait: PlacedTrait = {
      categoryId,
      tag,
      x: slot.xN,
      y: slot.yN,
      rotation: slot.rot,
      scale: 1,
    };
    setPlacedTraits((prev) => [...prev, newTrait]);
  }

  async function handleSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSaving(true);
    const ok = await saveTraits(placedTraits);
    setIsSaving(false);
    if (!ok) {
      Alert.alert(
        'Save failed',
        'Could not save your traits. Check your connection and try again.'
      );
      return;
    }
    router.back();
  }

  // Render order: non-active pills first, active pill last so it sits on top.
  const renderOrder = placedTraits
    .map((trait, index) => ({ trait, index }))
    .sort((a, b) => {
      if (a.index === activeIdx) return 1;
      if (b.index === activeIdx) return -1;
      return 0;
    });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.backButtonContainer, { top: insets.top + 4 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          style={styles.circleButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color="#000" />
        </Pressable>
      </View>

      <View style={[styles.gearButtonContainer, { top: insets.top + 4 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push('/settings');
          }}
          style={styles.circleButton}
          hitSlop={8}
        >
          <GearIcon />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        <View style={styles.avatarContainer}>
          <UserAvatar
            uri={sessionAvatarUri ?? profile?.avatar_url ?? null}
            size={120}
            version={profile?.updated_at}
          />
        </View>

        <Text style={styles.name}>{profile?.name ?? 'Your Name'}</Text>

        {(profile?.show_shells ?? true) && (
          <NameShells
            name={profile?.name ?? ''}
            maxSize={51}
            minSize={17}
            gap={8}
            minRowHeight={58}
            style={{ marginTop: 12 }}
          />
        )}

        <Text style={styles.bio}>{profile?.bio || 'Add a bio'}</Text>

        {/* Trait canvas — single GestureDetector wraps a transparent zone
            larger than the visible dashed box. The padding above/below the
            visible canvas gives finger 2 plenty of room to land outside the
            small box for pinch/rotate. Deletion is via the tag list below. */}
        <GestureDetector gesture={canvasGesture}>
          <View
            style={[styles.gestureZone, { width: boxWidth }]}
            onTouchStart={() => setScrollEnabled(false)}
            onTouchEnd={() => setScrollEnabled(true)}
            onTouchCancel={() => setScrollEnabled(true)}
          >
            <View style={styles.canvas}>
              {renderOrder.map(({ trait, index }) => {
                const cat = TRAIT_CATEGORIES.find((c) => c.id === trait.categoryId);
                const isActive = activeIdx === index;
                if (isActive) {
                  return (
                    <Animated.View
                      key={`${trait.categoryId}-${trait.tag}-${index}`}
                      style={[
                        styles.placedPill,
                        { backgroundColor: cat?.color ?? '#f0f0f0' },
                        activeAnimatedStyle,
                      ]}
                      onLayout={(e) => onPillLayout(index, e.nativeEvent.layout.width)}
                      pointerEvents="none"
                    >
                      <Text style={styles.placedPillText}>{trait.tag}</Text>
                    </Animated.View>
                  );
                }
                return (
                  <View
                    key={`${trait.categoryId}-${trait.tag}-${index}`}
                    style={[
                      styles.placedPill,
                      { backgroundColor: cat?.color ?? '#f0f0f0' },
                      {
                        transform: [
                          { translateX: trait.x * boxWidth },
                          { translateY: trait.y * TRAITS_BOX_H },
                          { rotate: `${trait.rotation}rad` },
                          { scale: trait.scale ?? 1 },
                        ],
                      },
                    ]}
                    onLayout={(e) => onPillLayout(index, e.nativeEvent.layout.width)}
                    pointerEvents="none"
                  >
                    <Text style={styles.placedPillText}>{trait.tag}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </GestureDetector>

        <Text style={styles.instruction}>
          Drag with one finger, pinch / rotate with two{' '}
          {`  ·  ${placedTraits.length}/${MAX_TRAITS}`}
        </Text>

        {/* Category tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
          style={styles.tabBar}
        >
          {TRAIT_CATEGORIES.map((category) => {
            const isActiveCat = activeCategoryId === category.id;
            const isSelected = placedTraits.some((t) => t.categoryId === category.id);
            return (
              <Pressable
                key={category.id}
                style={styles.tab}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setActiveCategoryId(category.id);
                }}
              >
                <View style={styles.tabLabelRow}>
                  <Text style={[styles.tabLabel, isActiveCat && styles.tabLabelActive]}>
                    {category.name}
                  </Text>
                  {isSelected && (
                    <View style={[styles.tabSelectedDot, { backgroundColor: category.dotColor }]} />
                  )}
                </View>
                {isActiveCat && (
                  <View style={[styles.tabUnderline, { backgroundColor: category.dotColor }]} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Active category pills */}
        {(() => {
          const category = TRAIT_CATEGORIES.find((c) => c.id === activeCategoryId)!;
          const selectedTags = new Set(
            placedTraits.filter((t) => t.categoryId === category.id).map((t) => t.tag)
          );
          return (
            <View style={styles.tagRow}>
              {category.tags.map((entry) => {
                const tag = getTraitLabel(entry);
                const verifyKey = getTraitVerifyKey(entry);
                const isLocked = verifyKey != null && !unlockedStats.has(verifyKey);
                const isSelected = selectedTags.has(tag);
                return (
                  <Pressable
                    key={tag}
                    style={[
                      styles.tagPill,
                      { backgroundColor: category.color },
                      isSelected && styles.tagPillSelected,
                      isLocked && styles.tagPillLocked,
                    ]}
                    onPress={() => {
                      if (isLocked) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        return;
                      }
                      handleTagPress(category.id, tag);
                    }}
                  >
                    {isLocked && (
                      <Ionicons
                        name="lock-closed"
                        size={12}
                        color="rgba(0,0,0,0.5)"
                        style={styles.checkIcon}
                      />
                    )}
                    {isSelected && !isLocked && (
                      <Ionicons name="checkmark" size={12} color="#000" style={styles.checkIcon} />
                    )}
                    <Text style={[styles.tagText, isLocked && styles.tagTextLocked]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })()}
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingContinueButton
          onPress={handleSave}
          disabled={isSaving}
          label={isSaving ? 'Saving...' : 'Save'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  gearButtonContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: '#000000',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: -0.4,
  },
  bio: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: '#888888',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: -0.2,
  },
  gestureZone: {
    paddingTop: GESTURE_ZONE_PADDING_TOP,
    paddingBottom: GESTURE_ZONE_PADDING_BOTTOM,
    // Negative outer margins offset the padding so the visible layout
    // matches what it was before the gesture-zone was added. The
    // touch-capture box still extends into the (non-interactive) bio area
    // above and the instruction-text area below.
    marginTop: 10 - GESTURE_ZONE_PADDING_TOP,
    marginBottom: 12 - GESTURE_ZONE_PADDING_BOTTOM,
  },
  canvas: {
    height: TRAITS_BOX_H,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
  },
  placedPill: {
    position: 'absolute',
    height: TRAITS_PILL_H,
    borderRadius: TRAITS_PILL_H / 2,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    top: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0,
    shadowRadius: 6,
    elevation: 0,
  },
  placedPillText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000000',
    letterSpacing: -0.3,
  },
  instruction: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#aaaaaa',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: -0.2,
  },
  tabBar: {
    marginBottom: 16,
  },
  tabBarContent: {
    gap: 4,
    paddingBottom: 2,
  },
  tab: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: 'rgba(0,0,0,0.3)',
    letterSpacing: -0.3,
  },
  tabLabelActive: {
    color: '#000000',
  },
  tabSelectedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  tabUnderline: {
    marginTop: 4,
    height: 3,
    width: '100%',
    borderRadius: 100,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TRAITS_PILL_H,
    borderRadius: TRAITS_PILL_H / 2,
    paddingHorizontal: 14,
  },
  tagPillSelected: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  tagPillLocked: {
    opacity: 0.45,
  },
  checkIcon: {
    marginRight: 4,
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000000',
    letterSpacing: -0.3,
  },
  tagTextLocked: {
    color: 'rgba(0,0,0,0.6)',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
});
