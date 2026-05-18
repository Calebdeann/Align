import { useState } from 'react';
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
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/constants/theme';
import {
  TRAIT_CATEGORIES,
  TRAITS_BOX_H,
  TRAITS_PILL_H,
  TRAITS_SCALE_MIN,
  TRAITS_SCALE_MAX,
  type PlacedTrait,
} from '@/constants/traits';
import { useUserProfileStore } from '@/stores/userProfileStore';

const SLOTS = [
  { xN: 0.02, yN: 0.05, rot: 0.12 }, // top-left
  { xN: 0.52, yN: 0.03, rot: -0.08 }, // top-right
  { xN: 0.28, yN: 0.38, rot: 0.18 }, // center
  { xN: 0.05, yN: 0.62, rot: -0.14 }, // bottom-left
  { xN: 0.54, yN: 0.58, rot: 0.06 }, // bottom-right
];

type MoveCallback = (
  categoryId: string,
  x: number,
  y: number,
  rotation: number,
  scale: number
) => void;

function DraggableTraitPill({
  trait,
  color,
  boxWidth,
  onMove,
}: {
  trait: PlacedTrait;
  color: string;
  boxWidth: number;
  onMove: MoveCallback;
}) {
  const initX = trait.x * boxWidth;
  const initY = trait.y * TRAITS_BOX_H;
  const initScale = trait.scale ?? 1;

  const tx = useSharedValue(initX);
  const ty = useSharedValue(initY);
  const savedTx = useSharedValue(initX);
  const savedTy = useSharedValue(initY);
  const rot = useSharedValue(trait.rotation);
  const savedRot = useSharedValue(trait.rotation);
  const sc = useSharedValue(initScale);
  const savedSc = useSharedValue(initScale);

  function notify(catId: string, px: number, py: number, r: number, s: number) {
    onMove(catId, px / boxWidth, py / TRAITS_BOX_H, r, s);
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
      runOnJS(notify)(trait.categoryId, tx.value, ty.value, rot.value, sc.value);
    });

  const rotate = Gesture.Rotation()
    .onUpdate((e) => {
      rot.value = savedRot.value + e.rotation;
    })
    .onEnd(() => {
      savedRot.value = rot.value;
      runOnJS(notify)(trait.categoryId, tx.value, ty.value, rot.value, sc.value);
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedSc.value * e.scale;
      sc.value = Math.min(Math.max(next, TRAITS_SCALE_MIN), TRAITS_SCALE_MAX);
    })
    .onEnd(() => {
      savedSc.value = sc.value;
      runOnJS(notify)(trait.categoryId, tx.value, ty.value, rot.value, sc.value);
    });

  const composed = Gesture.Simultaneous(pan, rotate, pinch);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}rad` },
      { scale: sc.value },
    ] as ViewStyle['transform'],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.placedPill, { backgroundColor: color }, animStyle]}>
        <Text style={styles.placedPillText}>{trait.tag}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

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
  const saveTraits = useUserProfileStore((s) => s.saveTraits);

  const initial = (profile?.traits ?? []) as PlacedTrait[];
  const [placedTraits, setPlacedTraits] = useState<PlacedTrait[]>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(TRAIT_CATEGORIES[0].id);

  function handleTagPress(categoryId: string, tag: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const existing = placedTraits.find((t) => t.categoryId === categoryId);

    if (existing?.tag === tag) {
      setPlacedTraits((prev) => prev.filter((t) => t.categoryId !== categoryId));
      return;
    }

    const catIdx = TRAIT_CATEGORIES.findIndex((c) => c.id === categoryId);
    const slot = SLOTS[catIdx] ?? SLOTS[0];

    const newTrait: PlacedTrait = {
      categoryId,
      tag,
      x: slot.xN,
      y: slot.yN,
      rotation: slot.rot,
      scale: 1,
    };

    setPlacedTraits((prev) => [...prev.filter((t) => t.categoryId !== categoryId), newTrait]);
  }

  function handleMove(categoryId: string, x: number, y: number, rotation: number, scale: number) {
    setPlacedTraits((prev) =>
      prev.map((t) => (t.categoryId === categoryId ? { ...t, x, y, rotation, scale } : t))
    );
  }

  async function handleSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back button — top left, same circle style as profile gear */}
      <View style={[styles.backButtonContainer, { top: insets.top + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.circleButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#000" />
        </Pressable>
      </View>

      {/* Gear button — top right, same as profile screen */}
      <View style={[styles.gearButtonContainer, { top: insets.top + 4 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      >
        {/* Avatar — same position/size as profile screen */}
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <Image
              source={require('../../assets/Profile Assets/no-pfp.png')}
              style={styles.avatar}
              contentFit="cover"
            />
          )}
        </View>

        {/* Name — exact same style as profile screen */}
        <Text style={styles.name}>{profile?.name ?? 'Your Name'}</Text>

        {/* Bio — display only, no edit icon */}
        <Text style={styles.bio}>{profile?.bio || 'Add a bio'}</Text>

        {/* Trait canvas — same dimensions as profile traitsContainer */}
        <View style={[styles.canvas, { width: boxWidth }]}>
          {placedTraits.map((trait) => {
            const cat = TRAIT_CATEGORIES.find((c) => c.id === trait.categoryId);
            return (
              <DraggableTraitPill
                key={`${trait.categoryId}-${trait.tag}`}
                trait={trait}
                color={cat?.color ?? '#f0f0f0'}
                boxWidth={boxWidth}
                onMove={handleMove}
              />
            );
          })}
        </View>

        <Text style={styles.instruction}>
          Drag to move · pinch to scale · two fingers to rotate
        </Text>

        {/* Category tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
          style={styles.tabBar}
        >
          {TRAIT_CATEGORIES.map((category) => {
            const isActive = activeCategoryId === category.id;
            const isSelected = placedTraits.some((t) => t.categoryId === category.id);
            return (
              <Pressable
                key={category.id}
                style={styles.tab}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveCategoryId(category.id);
                }}
              >
                <View style={styles.tabLabelRow}>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {category.name}
                  </Text>
                  {isSelected && (
                    <View style={[styles.tabSelectedDot, { backgroundColor: category.dotColor }]} />
                  )}
                </View>
                {isActive && (
                  <View style={[styles.tabUnderline, { backgroundColor: category.dotColor }]} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Active category pills */}
        {(() => {
          const category = TRAIT_CATEGORIES.find((c) => c.id === activeCategoryId)!;
          const selectedTag = placedTraits.find((t) => t.categoryId === category.id)?.tag;
          return (
            <View style={styles.tagRow}>
              {category.tags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <Pressable
                    key={tag}
                    style={[
                      styles.tagPill,
                      { backgroundColor: category.color },
                      isSelected && styles.tagPillSelected,
                    ]}
                    onPress={() => handleTagPress(category.id, tag)}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={12} color="#000" style={styles.checkIcon} />
                    )}
                    <Text style={styles.tagText}>{tag}</Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })()}
      </ScrollView>

      {/* Save footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
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
    marginTop: -17,
  },
  avatar: {
    width: 166,
    height: 166,
    borderRadius: 83,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000000',
    textAlign: 'center',
    marginTop: -26,
    letterSpacing: -0.4,
  },
  bio: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: -0.2,
  },
  canvas: {
    height: TRAITS_BOX_H,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    borderStyle: 'dashed',
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 12,
    overflow: 'visible',
  },
  placedPill: {
    position: 'absolute',
    height: TRAITS_PILL_H,
    borderRadius: TRAITS_PILL_H / 2,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  checkIcon: {
    marginRight: 4,
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000000',
    letterSpacing: -0.3,
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
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveBtn: {
    height: 52,
    backgroundColor: '#000000',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
});
