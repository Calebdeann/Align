import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  Animated,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '@/constants/theme';
import { LIQUID_TAB_BAR_HEIGHT } from '@/components/ui/LiquidGlassTabBar';
import { UserAvatar, CircleBackButton, SkeletonBlock } from '@/components';
import { useUserProfileStore } from '@/stores/userProfileStore';
import {
  getPublicProfile,
  getPublicWorkouts,
  type PublicProfile,
  type PublicWorkout,
} from '@/services/api/publicProfile';
import { sendFriendRequest, blockUser } from '@/services/api/friends';
import {
  TRAIT_CATEGORIES,
  TRAITS_BOX_H,
  TRAITS_PILL_H,
  type PlacedTrait,
} from '@/constants/traits';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

function groupByWeek(workouts: PublicWorkout[]) {
  const getMondayKey = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };
  const map = new Map<string, PublicWorkout[]>();
  for (const w of workouts) {
    const key = getMondayKey(new Date(w.completedAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(w);
  }
  const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return sorted
    .map(([key, items], idx) => ({
      weekKey: key,
      label: `Week ${idx + 1}`,
      workouts: items.sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    }))
    .reverse();
}

export default function PublicProfileScreen() {
  const params = useLocalSearchParams<{
    userId: string;
    prefillName?: string;
    prefillAvatar?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const traitsContainerWidth = width - 32;

  const myProfile = useUserProfileStore((s) => s.profile);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [workouts, setWorkouts] = useState<PublicWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const openMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setMenuOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMenuOpen(false);
    });
  };

  async function handleSendFriendRequest() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    closeMenu();
    if (!myProfile?.id || !publicProfile?.id) return;
    const ok = await sendFriendRequest(myProfile.id, publicProfile.id);
    if (ok) {
      Alert.alert('Friend request sent', `${publicProfile.name || 'They'} will see your request.`);
    } else {
      Alert.alert("Couldn't send request", 'Please try again.');
    }
  }

  async function handleShareProfile() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    closeMenu();
    try {
      await Share.share({
        message: `Check out ${publicProfile?.name || 'this profile'} on It Girl 💪`,
      });
    } catch {
      // user cancelled — silent
    }
  }

  function handleBlock() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    closeMenu();
    Alert.alert(
      `Block ${publicProfile?.name || 'this user'}?`,
      "They won't be able to interact with you or see your profile.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            if (!myProfile?.id || !publicProfile?.id) return;
            const ok = await blockUser(myProfile.id, publicProfile.id);
            if (ok) {
              router.back();
            } else {
              Alert.alert("Couldn't block", 'Please try again.');
            }
          },
        },
      ]
    );
  }

  useEffect(() => {
    // Reset cached profile when switching between users so the previous
    // person's name/avatar doesn't flash before the new fetch lands.
    setPublicProfile(null);
    setWorkouts([]);
    setLoading(true);

    async function load() {
      if (!myProfile?.id || !params.userId) return;
      const viewingSelf = myProfile.id === params.userId;
      const profPromise = viewingSelf
        ? Promise.resolve<PublicProfile>({
            id: myProfile.id,
            name: myProfile.name ?? '',
            avatarUrl: myProfile.avatar_url ?? null,
            bio: myProfile.bio ?? null,
            traits: (myProfile.traits ?? []) as PlacedTrait[],
            planId: myProfile.plan_id ?? null,
            createdAt: myProfile.created_at ?? new Date().toISOString(),
          })
        : getPublicProfile(myProfile.id, params.userId);
      const [prof, wkts] = await Promise.all([
        profPromise,
        getPublicWorkouts(myProfile.id, params.userId),
      ]);
      setPublicProfile(prof);
      setWorkouts(wkts);
      setLoading(false);
    }
    load();
    // Intentionally limited to id + viewer id; we don't want to refetch the
    // public profile every time the viewer edits their own bio/avatar/traits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile?.id, params.userId]);

  const weekGroups = useMemo(() => groupByWeek(workouts), [workouts]);
  const isSelf = !!myProfile?.id && myProfile.id === params.userId;
  const savedTraits = (publicProfile?.traits ?? []) as PlacedTrait[];
  const planImage = publicProfile?.planId
    ? (PLAN_PROFILE_IMAGES[publicProfile.planId] ?? PLAN_PROFILE_IMAGES['summer-body'])
    : PLAN_PROFILE_IMAGES['summer-body'];

  // Use prefill data for instant first-frame render while API loads
  const displayName = publicProfile?.name ?? params.prefillName ?? '';
  const displayAvatar = publicProfile?.avatarUrl ?? params.prefillAvatar ?? undefined;

  if (!loading && !publicProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.headerLeft, { top: insets.top + 4 }]}>
          <CircleBackButton />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back button (top-left) */}
      <View style={[styles.headerLeft, { top: insets.top + 4 }]}>
        <CircleBackButton />
      </View>

      {/* Menu button (top-right) */}
      <View style={[styles.headerRight, { top: insets.top + 4 }]}>
        <Pressable onPress={openMenu} style={styles.circleButton} hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#000000" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar — shows immediately from prefill data */}
        <View style={styles.avatarContainer}>
          <UserAvatar uri={displayAvatar} size={120} />
        </View>

        {/* Name — shows immediately from prefill data */}
        <Text style={styles.name}>{displayName || 'User'}</Text>

        {/* Bio */}
        {!!publicProfile?.bio && <Text style={styles.bioText}>{publicProfile.bio}</Text>}

        {/* Scattered traits pills */}
        {savedTraits.length > 0 && (
          <View style={styles.traitsContainer}>
            {savedTraits.map((trait, idx) => {
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
            })}
          </View>
        )}

        {/* Plan banner — skip while loading to avoid flashing wrong default */}
        {!loading && (
          <Image
            source={planImage}
            style={[
              styles.planImage,
              { marginTop: savedTraits.length === 0 && !publicProfile?.bio ? 16 : 0 },
            ]}
            contentFit="cover"
          />
        )}

        {/* Workout history — skeleton while loading, real cards after */}
        {loading ? (
          <View style={styles.skeletonWeekSection}>
            <SkeletonBlock style={{ width: 72, height: 22, borderRadius: 6, marginBottom: 12 }} />
            <View style={styles.skeletonRow}>
              {[0, 1, 2].map((i) => (
                <SkeletonBlock key={i} style={{ width: 140, height: 168, borderRadius: 20 }} />
              ))}
            </View>
          </View>
        ) : (
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
                            userName: publicProfile?.name ?? '',
                            userAvatarUrl: publicProfile?.avatarUrl ?? '',
                            ownerUserId: publicProfile?.id ?? '',
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
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>

      {/* Action menu */}
      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeMenu}>
        <Pressable
          style={styles.menuOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            closeMenu();
          }}
        >
          <Animated.View
            style={[
              styles.menuSheet,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.menuHandle} />
              {!isSelf && (
                <>
                  <Pressable style={styles.menuRow} onPress={handleSendFriendRequest}>
                    <Ionicons name="person-add-outline" size={22} color="#000" />
                    <Text style={styles.menuRowText}>Send friend request</Text>
                  </Pressable>
                  <View style={styles.menuDivider} />
                </>
              )}
              <Pressable style={styles.menuRow} onPress={handleShareProfile}>
                <Ionicons name="share-outline" size={22} color="#000" />
                <Text style={styles.menuRowText}>Share profile</Text>
              </Pressable>
              {!isSelf && (
                <>
                  <View style={styles.menuDivider} />
                  <Pressable style={styles.menuRow} onPress={handleBlock}>
                    <Ionicons name="ban-outline" size={22} color="#FF3B30" />
                    <Text style={[styles.menuRowText, { color: '#FF3B30' }]}>Block</Text>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
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
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#888888',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  menuHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuRowText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#000',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginLeft: 56,
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
    marginTop: 8,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000000',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: -0.4,
  },
  bioText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#444444',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: -0.2,
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
  planImage: {
    width: '100%',
    aspectRatio: 1836 / 769,
    borderRadius: 20,
    overflow: 'hidden',
  },
  skeletonWeekSection: {
    marginTop: 30,
    gap: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
  },
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
});
