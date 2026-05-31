import { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/constants/theme';
import { LIQUID_TAB_BAR_HEIGHT } from '@/components/ui/LiquidGlassTabBar';
import { UserAvatar, NameShells, VerifiedBadge } from '@/components';
import RecoverySection from '@/components/recovery/RecoverySection';
import { supabase } from '@/services/supabase';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useWorkoutStore, type CachedCompletedWorkout } from '@/stores/workoutStore';
import { uploadAvatar } from '@/services/api/user';
import { getAppConfig } from '@/services/api/appConfig';
import { getPlanById } from '@/data/plans';
import {
  TRAIT_CATEGORIES,
  TRAITS_BOX_H,
  TRAITS_PILL_H,
  type PlacedTrait,
} from '@/constants/traits';

const PLAN_PROFILE_IMAGES: Record<string, ReturnType<typeof require>> = {
  'summer-body': require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_Summer.png'),
  'pilates-princess': require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_Pilates.png'),
  hourglass: require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_Hourglass.png'),
  booty: require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_Booty.png'),
  'it-girl': require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_itgirl.png'),
  'busy-girl': require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_BusyGirl.png'),
  'muscle-mommy': require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_muscle.png'),
  home: require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_Home.png'),
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

function formatWeekRange(mondayKey: string): string {
  const monday = new Date(mondayKey + 'T00:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const monthName = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' });
  return `${ordinal(monday.getDate())} ${monthName(monday)} - ${ordinal(sunday.getDate())} ${monthName(sunday)}`;
}

function groupByWeek(workouts: CachedCompletedWorkout[]) {
  const getMondayKey = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };
  const map = new Map<string, CachedCompletedWorkout[]>();
  for (const w of workouts) {
    const key = getMondayKey(new Date(w.completedAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(w);
  }
  const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return sorted
    .map(([key, items]) => ({
      weekKey: key,
      label: formatWeekRange(key),
      workouts: items.sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    }))
    .reverse();
}

function CircleIconButton({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onPress();
      }}
      style={styles.circleButton}
      hitSlop={8}
    >
      {children}
    </Pressable>
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

function EditIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="#888888"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="#888888"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const traitsContainerWidth = width - 32; // matches paddingHorizontal: 16 each side
  const [activeTab, setActiveTab] = useState<'profile' | 'recovery'>('profile');
  const [bioModalVisible, setBioModalVisible] = useState(false);
  const [bioText, setBioText] = useState('');
  const [displayBio, setDisplayBio] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const shellsRef = useRef<View>(null);

  const profile = useUserProfileStore((state) => state.profile);
  const userId = useUserProfileStore((state) => state.userId);
  const fetchProfile = useUserProfileStore((state) => state.fetchProfile);
  const updateProfile = useUserProfileStore((state) => state.updateProfile);
  const sessionAvatarUri = useUserProfileStore((state) => state.sessionAvatarUri);
  const setSessionAvatarUri = useUserProfileStore((state) => state.setSessionAvatarUri);
  const cachedCompletedWorkouts = useWorkoutStore((s) => s.cachedCompletedWorkouts);
  const weekGroups = useMemo(() => groupByWeek(cachedCompletedWorkouts), [cachedCompletedWorkouts]);
  const currentPlan = getPlanById(profile?.plan_id ?? 'summer-body');

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRefreshing(true);
    try {
      await fetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    setDisplayBio(profile?.bio ?? '');
  }, [profile?.bio]);

  function handleSettings() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/settings');
  }

  async function handlePickAvatar() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    if (!userId) return;

    const asset = result.assets[0];
    // Push the local file:// URI into the global store so every screen showing
    // the current user's avatar (this profile, discover feed, friend cards,
    // workout summary, etc.) renders the new photo immediately. It survives
    // for the rest of the session; on next app launch, profile.avatar_url
    // loads from the DB.
    setSessionAvatarUri(asset.uri);
    setUploadingAvatar(true);
    const url = await uploadAvatar(userId, asset.uri);
    if (__DEV__) console.log('[avatar] uploadAvatar returned URL:', url);
    if (url) {
      const ok = await updateProfile({ avatar_url: url });
      if (__DEV__) console.log('[avatar] updateProfile ok:', ok);
      if (!ok) {
        Alert.alert(
          'Save Failed',
          'Photo uploaded but could not save to profile. Please try again.'
        );
      }
    } else {
      setSessionAvatarUri(null);
      Alert.alert('Upload Failed', 'Could not upload photo. Check your connection and try again.');
    }
    setUploadingAvatar(false);
  }

  function handleBio() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setBioText(profile?.bio ?? '');
    setBioModalVisible(true);
  }

  async function handleSaveBio() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const trimmed = bioText.trim();
    setDisplayBio(trimmed);
    setBioModalVisible(false);
    await updateProfile({ bio: trimmed });
  }

  function handleTraits() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/profile/traits');
  }

  async function handleShareShells() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!shellsRef.current) return;
    try {
      const uri = await captureRef(shellsRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your shells',
        });
      }
    } catch (error) {
      console.warn('Failed to share shells:', error);
    }
  }

  const savedTraits = (profile?.traits ?? []) as PlacedTrait[];
  const hasSavedTraits = savedTraits.length > 0;

  async function handleReview() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Remote-controlled URL via the `review_url` row in the app_config table.
    // Empty / null → fall back to the native review prompt (current behaviour).
    const remoteUrl = await getAppConfig('review_url');
    if (remoteUrl && remoteUrl.length > 0) {
      Linking.openURL(remoteUrl).catch(() => {});
      return;
    }
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      StoreReview.requestReview();
    } else {
      Linking.openURL('https://apps.apple.com/app/id0000000000');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Settings gear */}
      <View style={[styles.gearButtonContainer, { top: insets.top + 4 }]}>
        <CircleIconButton onPress={handleSettings}>
          <GearIcon />
        </CircleIconButton>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }
      >
        {/* Avatar — priority: local pick → DB URL → placeholder (handled inside UserAvatar) */}
        <Pressable style={styles.avatarContainer} onPress={handlePickAvatar}>
          <UserAvatar
            uri={sessionAvatarUri ?? profile?.avatar_url ?? null}
            size={120}
            loading={uploadingAvatar}
            version={profile?.updated_at}
          />
        </Pressable>

        {/* Name */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Text style={styles.name}>{profile?.name ?? 'Your Name'}</Text>
          {profile?.is_verified && (
            <View style={{ marginTop: 10 }}>
              <VerifiedBadge size={18} />
            </View>
          )}
        </View>

        {/* Shells under the name — tap anywhere on the row to share the whole row as a transparent PNG */}
        {(profile?.show_shells ?? true) && (
          <Pressable onPress={handleShareShells}>
            <View ref={shellsRef} collapsable={false} style={styles.shellsCapture}>
              <NameShells
                name={profile?.name ?? ''}
                maxSize={51}
                minSize={17}
                gap={8}
                minRowHeight={58}
                style={{ marginTop: 12 }}
              />
            </View>
          </Pressable>
        )}

        {/* Bio */}
        <Pressable style={styles.bioRow} onPress={handleBio}>
          <Text style={[styles.bioText, displayBio && styles.bioTextFilled]}>
            {displayBio || 'Add a bio'}
          </Text>
          <View style={styles.bioIconGap}>
            <EditIcon />
          </View>
        </Pressable>

        {/* Scattered traits pills */}
        <Pressable style={styles.traitsContainer} onPress={handleTraits}>
          {hasSavedTraits ? (
            savedTraits.map((trait, idx) => {
              const cat = TRAIT_CATEGORIES.find((c) => c.id === trait.categoryId);
              return (
                <View
                  key={`${trait.categoryId}-${trait.tag}-${idx}`}
                  style={[
                    styles.savedTraitPill,
                    {
                      backgroundColor: cat?.color ?? '#f0f0f0',
                      left: trait.x * traitsContainerWidth,
                      top: trait.y * TRAITS_BOX_H,
                      transform: [{ rotate: `${trait.rotation}rad` }, { scale: trait.scale ?? 1 }],
                    },
                  ]}
                >
                  <Text style={styles.savedTraitText}>{trait.tag}</Text>
                </View>
              );
            })
          ) : (
            <>
              <View
                style={[
                  styles.traitPill,
                  styles.traitPillRound,
                  { top: 22, left: 35, width: 88, transform: [{ rotate: '4deg' }] },
                ]}
              >
                <Text style={styles.traitLabel}>Add traits</Text>
              </View>
              <View
                style={[
                  styles.traitPill,
                  styles.traitPillRound,
                  { top: 80, left: 82, width: 88, transform: [{ rotate: '-3deg' }] },
                ]}
              >
                <Text style={styles.traitLabel}>Add traits</Text>
              </View>
              <View
                style={[
                  styles.traitPill,
                  styles.traitPillRound,
                  { top: 8, left: 148, width: 88, transform: [{ rotate: '4deg' }] },
                ]}
              >
                <Text style={styles.traitLabel}>Add traits</Text>
              </View>
              <View
                style={[
                  styles.traitPill,
                  styles.traitPillRound,
                  { top: 78, left: 190, width: 88, transform: [{ rotate: '3deg' }] },
                ]}
              >
                <Text style={styles.traitLabel}>Add traits</Text>
              </View>
              <View
                style={[
                  styles.traitPill,
                  styles.traitPillRound,
                  { top: 18, left: 246, width: 88, transform: [{ rotate: '-6deg' }] },
                ]}
              >
                <Text style={styles.traitLabel}>Add traits</Text>
              </View>
            </>
          )}
        </Pressable>

        {/* Sub-tab bar */}
        <View style={styles.tabBar}>
          <Pressable
            style={styles.tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setActiveTab('profile');
            }}
          >
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
              Profile
            </Text>
            {activeTab === 'profile' && <View style={styles.tabUnderline} />}
          </Pressable>
          <Pressable
            style={styles.tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setActiveTab('recovery');
            }}
          >
            <Text style={[styles.tabLabel, activeTab === 'recovery' && styles.tabLabelActive]}>
              Recovery
            </Text>
            {activeTab === 'recovery' && <View style={styles.tabUnderline} />}
          </Pressable>
        </View>

        {/* Plan image banner — shown above both Profile and Recovery tab content */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push('/profile/change-plan');
          }}
        >
          <Image
            source={
              PLAN_PROFILE_IMAGES[profile?.plan_id ?? 'summer-body'] ??
              PLAN_PROFILE_IMAGES['summer-body']
            }
            style={styles.planImage}
            contentFit="contain"
          />
        </Pressable>

        {/* Tab content */}
        {activeTab === 'recovery' && <RecoverySection />}

        {/* Workout history by week — profile tab only */}
        {/* TODO: When other-user profile view is built, replicate this section.
            Photos are persistent Supabase Storage public URLs in workout.imageUri.
            Query via getWorkoutsByDateRange(viewedUserId, ...) and verify photo thumbnails
            display on their profile. May need a public SELECT RLS policy on workouts. */}
        {activeTab === 'profile' &&
          weekGroups.map((group, index) => (
            <View
              key={group.weekKey}
              style={[styles.weekSection, index === 0 && { marginTop: 30 }]}
            >
              <Text style={styles.weekLabel}>{group.label}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.weekRow}
                style={styles.weekScroll}
              >
                {group.workouts.map((workout, i) => {
                  const rotation = ['-0.5deg', '1deg', '-1deg'][i % 3];
                  return (
                    <Pressable
                      key={workout.id}
                      style={[styles.photoCardShadow, { transform: [{ rotate: rotation }] }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        router.push({
                          pathname: '/workout-summary',
                          params: {
                            workoutId: workout.id,
                            mode: 'view',
                            workoutTitle: workout.name ?? '',
                            imageUri: workout.imageUri ?? '',
                            imageAspectRatio: workout.imageAspectRatio
                              ? String(workout.imageAspectRatio)
                              : '',
                            userName: profile?.name ?? '',
                            userAvatarUrl: profile?.avatar_url ?? '',
                            ownerUserId: profile?.id ?? '',
                            completedAt: workout.completedAt ?? '',
                          },
                        });
                      }}
                    >
                      <View style={styles.photoCardInner}>
                        {workout.imageUri ? (
                          <Image
                            source={{ uri: workout.imageUri }}
                            style={styles.photoCardImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.photoCardPlaceholder}>
                            <Text style={styles.photoCardName} numberOfLines={3}>
                              {workout.name ?? 'Workout'}
                            </Text>
                          </View>
                        )}
                        {workout.imageAudience && workout.imageAudience !== 'everyone' && (
                          <View style={styles.photoCardLockBadge}>
                            <Ionicons name="lock-closed" size={12} color="#fff" />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ))}

        {/* Help Us Grow — profile tab only */}
        {activeTab === 'profile' && (
          <Pressable style={styles.reviewShadow} onPress={handleReview}>
            <View style={styles.reviewInner}>
              <Image
                source={require('../../assets/Profile Assets/help-us-grow.png')}
                style={styles.reviewImage}
                contentFit="cover"
              />
            </View>
          </Pressable>
        )}
      </ScrollView>

      {/* Bio edit modal */}
      <Modal
        visible={bioModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBioModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setBioModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKAV}
          pointerEvents="box-none"
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Your Bio</Text>
            <TextInput
              autoCorrect={false}
              style={styles.modalInput}
              value={bioText}
              onChangeText={setBioText}
              placeholder="Write something about yourself..."
              placeholderTextColor="#BBBBBB"
              multiline
              maxLength={150}
              autoFocus
            />
            <Text style={styles.modalCount}>{bioText.length}/150</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setBioModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleSaveBio}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    paddingBottom: LIQUID_TAB_BAR_HEIGHT + 24,
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
  shellsCapture: {
    backgroundColor: 'transparent',
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 5,
  },
  bioText: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: '#888888',
    letterSpacing: -0.2,
  },
  bioTextFilled: {
    color: '#444444',
  },
  bioIconGap: {
    marginTop: 1,
  },
  traitsContainer: {
    height: TRAITS_BOX_H,
    marginTop: 10,
    position: 'relative',
  },
  savedTraitPill: {
    position: 'absolute',
    height: TRAITS_PILL_H,
    borderRadius: TRAITS_PILL_H / 2,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedTraitText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000000',
    letterSpacing: -0.3,
  },
  traitPill: {
    position: 'absolute',
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F3F3',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  traitPillRound: {
    borderRadius: 22,
  },
  traitLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#BDBDBD',
    letterSpacing: -0.2,
  },
  planImage: {
    width: '100%',
    aspectRatio: 1836 / 769,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 6,
  },
  tab: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  tabLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: 'rgba(0,0,0,0.2)',
    letterSpacing: -0.3,
  },
  tabLabelActive: {
    color: '#000000',
  },
  tabUnderline: {
    marginTop: 4,
    height: 3,
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 100,
  },
  reviewShadow: {
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  reviewInner: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  reviewImage: {
    width: '100%',
    aspectRatio: 3.2,
  },
  // Workout history
  weekSection: {
    marginTop: 0,
  },
  weekLabel: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000000',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  weekScroll: {
    marginHorizontal: -16,
    overflow: 'visible',
  },
  weekRow: {
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 4,
    paddingBottom: 30,
  },
  photoCardShadow: {
    width: 140,
    height: 168,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  photoCardInner: {
    width: 140,
    height: 168,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoCardLockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCardImage: {
    width: 140,
    height: 168,
  },
  photoCardPlaceholder: {
    width: 140,
    height: 168,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  photoCardName: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  // Bio modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalKAV: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  modalInput: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    padding: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    letterSpacing: -0.2,
  },
  modalCount: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#BBBBBB',
    textAlign: 'right',
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 500,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#888888',
  },
  modalSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 500,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
