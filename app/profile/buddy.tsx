import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '@/constants/theme';
import { LIQUID_TAB_BAR_HEIGHT } from '@/components/ui/LiquidGlassTabBar';
import { GYM_BUDDIES, type GymBuddyTagKey } from '@/data/gymBuddies';
import { TRAITS_BOX_H, TRAITS_PILL_H } from '@/constants/traits';

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

type TagPlacement = {
  key: GymBuddyTagKey;
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

const TAG_COLOR: Record<GymBuddyTagKey, string> = {
  goal: '#d3e9c5',
  identity: '#e3c5e9',
  stat: '#fcc4bd',
  why: '#f9e597',
  lifestyle: '#97d5f9',
};

// 20 hand-authored layouts — one per buddy index. Only includes keys this
// buddy actually has in their tags object (so 3-/4-/5-tag buddies get
// proportionate scatter, and the 2 no-tag buddies get an empty array).
const BUDDY_TAG_PLACEMENTS: TagPlacement[][] = [
  // 0 — Emma (4 tags: goal, identity, why, lifestyle)
  [
    { key: 'goal', x: 0.04, y: 0.06, rotation: -0.06, scale: 1.0 },
    { key: 'identity', x: 0.46, y: 0.04, rotation: 0.05, scale: 1.02 },
    { key: 'why', x: 0.06, y: 0.66, rotation: 0.05, scale: 1.0 },
    { key: 'lifestyle', x: 0.4, y: 0.7, rotation: -0.07, scale: 0.99 },
  ],
  // 1 — Tilly (5 tags) — stat + why nudged right per user
  [
    { key: 'identity', x: 0.04, y: 0.04, rotation: 0.06, scale: 1.0 },
    { key: 'stat', x: 0.56, y: 0.06, rotation: -0.07, scale: 1.02 },
    { key: 'goal', x: 0.28, y: 0.38, rotation: 0.04, scale: 1.0 },
    { key: 'lifestyle', x: 0.04, y: 0.7, rotation: -0.05, scale: 0.99 },
    { key: 'why', x: 0.56, y: 0.68, rotation: 0.06, scale: 1.01 },
  ],
  // 2 — Rachel (5 tags) — all centred / pushed right
  [
    { key: 'goal', x: 0.2, y: 0.04, rotation: -0.05, scale: 1.0 },
    { key: 'lifestyle', x: 0.52, y: 0.06, rotation: 0.06, scale: 1.01 },
    { key: 'stat', x: 0.2, y: 0.38, rotation: 0.05, scale: 0.99 },
    { key: 'identity', x: 0.52, y: 0.4, rotation: -0.04, scale: 1.02 },
    { key: 'why', x: 0.36, y: 0.7, rotation: 0.05, scale: 1.0 },
  ],
  // 3 — Priya (5 tags) — spread out + top right
  [
    { key: 'goal', x: 0.46, y: 0.02, rotation: 0.07, scale: 1.01 },
    { key: 'lifestyle', x: 0.04, y: 0.34, rotation: -0.05, scale: 1.0 },
    { key: 'why', x: 0.56, y: 0.44, rotation: 0.04, scale: 0.99 },
    { key: 'identity', x: 0.18, y: 0.72, rotation: -0.03, scale: 1.0 },
    { key: 'stat', x: 0.52, y: 0.72, rotation: 0.06, scale: 1.02 },
  ],
  // 4 — Sarah (5 tags) — all pushed right
  [
    { key: 'identity', x: 0.2, y: 0.04, rotation: 0.04, scale: 1.02 },
    { key: 'lifestyle', x: 0.56, y: 0.06, rotation: -0.05, scale: 0.99 },
    { key: 'stat', x: 0.2, y: 0.38, rotation: 0.07, scale: 1.0 },
    { key: 'goal', x: 0.56, y: 0.4, rotation: -0.04, scale: 1.01 },
    { key: 'why', x: 0.4, y: 0.7, rotation: 0.06, scale: 0.99 },
  ],
  // 5 — Bec (5 tags) — all pushed right
  [
    { key: 'goal', x: 0.2, y: 0.04, rotation: 0.05, scale: 1.0 },
    { key: 'stat', x: 0.56, y: 0.04, rotation: -0.06, scale: 1.02 },
    { key: 'why', x: 0.2, y: 0.4, rotation: 0.04, scale: 0.99 },
    { key: 'identity', x: 0.56, y: 0.4, rotation: 0.06, scale: 1.0 },
    { key: 'lifestyle', x: 0.38, y: 0.7, rotation: -0.05, scale: 1.01 },
  ],
  // 6 — Mila (3 tags: goal, stat, lifestyle — identity removed)
  [
    { key: 'lifestyle', x: 0.06, y: 0.06, rotation: -0.06, scale: 1.0 },
    { key: 'goal', x: 0.46, y: 0.04, rotation: 0.06, scale: 1.01 },
    { key: 'stat', x: 0.26, y: 0.68, rotation: 0.05, scale: 1.02 },
  ],
  // 7 — Hannah (3 tags: goal, identity, why)
  [
    { key: 'goal', x: 0.12, y: 0.06, rotation: -0.05, scale: 1.02 },
    { key: 'identity', x: 0.46, y: 0.38, rotation: 0.05, scale: 1.0 },
    { key: 'why', x: 0.06, y: 0.7, rotation: 0.06, scale: 1.01 },
  ],
  // 8 — Aaliyah (no tags)
  [],
  // 9 — Lauren (no tags)
  [],
  // 10 — Sofia (4 tags: goal, identity, why, lifestyle)
  [
    { key: 'identity', x: 0.04, y: 0.04, rotation: -0.05, scale: 1.01 },
    { key: 'lifestyle', x: 0.46, y: 0.06, rotation: 0.06, scale: 1.0 },
    { key: 'goal', x: 0.06, y: 0.68, rotation: 0.04, scale: 1.02 },
    { key: 'why', x: 0.46, y: 0.7, rotation: -0.06, scale: 0.99 },
  ],
  // 11 — Jess (5 tags) — all pushed right
  [
    { key: 'why', x: 0.2, y: 0.04, rotation: 0.05, scale: 1.01 },
    { key: 'goal', x: 0.56, y: 0.06, rotation: -0.07, scale: 1.0 },
    { key: 'lifestyle', x: 0.2, y: 0.4, rotation: 0.06, scale: 0.99 },
    { key: 'stat', x: 0.56, y: 0.4, rotation: -0.04, scale: 1.02 },
    { key: 'identity', x: 0.4, y: 0.7, rotation: 0.05, scale: 1.0 },
  ],
  // 12 — Liv (5 tags) — all pushed right
  [
    { key: 'identity', x: 0.2, y: 0.04, rotation: 0.04, scale: 0.99 },
    { key: 'goal', x: 0.56, y: 0.04, rotation: -0.06, scale: 1.02 },
    { key: 'lifestyle', x: 0.2, y: 0.4, rotation: 0.07, scale: 1.0 },
    { key: 'stat', x: 0.56, y: 0.4, rotation: -0.04, scale: 0.99 },
    { key: 'why', x: 0.4, y: 0.7, rotation: 0.05, scale: 1.01 },
  ],
  // 13 — Cazz (5 tags) — all pushed right
  [
    { key: 'stat', x: 0.2, y: 0.04, rotation: -0.06, scale: 1.02 },
    { key: 'identity', x: 0.56, y: 0.06, rotation: 0.04, scale: 0.99 },
    { key: 'why', x: 0.2, y: 0.38, rotation: 0.06, scale: 1.0 },
    { key: 'goal', x: 0.56, y: 0.4, rotation: -0.05, scale: 1.02 },
    { key: 'lifestyle', x: 0.4, y: 0.7, rotation: 0.04, scale: 0.99 },
  ],
  // 14 — Tay (5 tags) — all pushed right
  [
    { key: 'goal', x: 0.2, y: 0.04, rotation: 0.05, scale: 1.0 },
    { key: 'lifestyle', x: 0.56, y: 0.04, rotation: -0.05, scale: 1.02 },
    { key: 'stat', x: 0.2, y: 0.4, rotation: 0.07, scale: 1.03 },
    { key: 'why', x: 0.56, y: 0.4, rotation: 0.04, scale: 0.99 },
    { key: 'identity', x: 0.4, y: 0.7, rotation: -0.06, scale: 1.0 },
  ],
  // 15 — Mei (4 tags: goal, identity, why, lifestyle) — all pushed right
  [
    { key: 'lifestyle', x: 0.2, y: 0.04, rotation: -0.04, scale: 0.99 },
    { key: 'goal', x: 0.56, y: 0.06, rotation: 0.06, scale: 1.01 },
    { key: 'why', x: 0.2, y: 0.68, rotation: 0.05, scale: 1.0 },
    { key: 'identity', x: 0.56, y: 0.7, rotation: -0.06, scale: 1.02 },
  ],
  // 16 — Donna (3 tags: identity, stat, why) — all pushed right
  [
    { key: 'identity', x: 0.2, y: 0.06, rotation: 0.06, scale: 1.02 },
    { key: 'stat', x: 0.56, y: 0.38, rotation: -0.05, scale: 1.0 },
    { key: 'why', x: 0.2, y: 0.7, rotation: 0.05, scale: 1.01 },
  ],
  // 17 — Ruby (5 tags) — all pushed right
  [
    { key: 'why', x: 0.2, y: 0.04, rotation: 0.05, scale: 1.0 },
    { key: 'goal', x: 0.56, y: 0.06, rotation: -0.07, scale: 1.02 },
    { key: 'identity', x: 0.2, y: 0.4, rotation: 0.04, scale: 0.99 },
    { key: 'stat', x: 0.56, y: 0.4, rotation: -0.05, scale: 1.0 },
    { key: 'lifestyle', x: 0.4, y: 0.7, rotation: 0.06, scale: 1.01 },
  ],
  // 18 — Remi (5 tags)
  [
    { key: 'stat', x: 0.04, y: 0.04, rotation: -0.06, scale: 1.03 },
    { key: 'goal', x: 0.46, y: 0.06, rotation: 0.05, scale: 1.01 },
    { key: 'identity', x: 0.06, y: 0.38, rotation: -0.04, scale: 1.0 },
    { key: 'why', x: 0.5, y: 0.42, rotation: 0.06, scale: 0.99 },
    { key: 'lifestyle', x: 0.26, y: 0.7, rotation: -0.05, scale: 1.02 },
  ],
];

function getTagPlacements(buddyIndex: number): TagPlacement[] {
  return BUDDY_TAG_PLACEMENTS[buddyIndex] ?? [];
}

export default function BuddyProfileScreen() {
  const params = useLocalSearchParams<{ buddyIndex: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const traitsContainerWidth = width - 32;

  const idx = parseInt(params.buddyIndex ?? '0', 10);
  const buddy = GYM_BUDDIES[idx] ?? GYM_BUDDIES[0];

  const planImage = PLAN_PROFILE_IMAGES[buddy.planId];

  const placements = getTagPlacements(idx).filter((p) => buddy.tags[p.key]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Close button — same style as [userId].tsx */}
      <View style={[styles.closeButtonContainer, { top: insets.top + 4 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          style={styles.circleButton}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color="#000000" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.uploadedAvatarClip}>
            <Image source={buddy.image} style={styles.uploadedAvatarImg} contentFit="cover" />
          </View>
        </View>

        {/* Name */}
        <Text style={styles.name}>{buddy.name}</Text>

        {/* Bio (optional) */}
        {buddy.bio && <Text style={styles.bioText}>{buddy.bio}</Text>}

        {/* Scattered tag pills — per-buddy layout, skipped entirely when no tags */}
        {placements.length > 0 && (
          <View style={[styles.traitsContainer, { width: traitsContainerWidth }]}>
            {placements.map((p) => (
              <View
                key={p.key}
                style={[
                  styles.savedTraitPill,
                  {
                    backgroundColor: TAG_COLOR[p.key],
                    left: p.x * traitsContainerWidth,
                    top: p.y * TRAITS_BOX_H,
                    transform: [{ rotate: `${p.rotation}rad` }, { scale: p.scale }],
                  },
                ]}
              >
                <Text style={styles.savedTraitText}>{buddy.tags[p.key]}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Plan banner — read-only, same as public profile */}
        <Image source={planImage} style={styles.planImage} contentFit="cover" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  closeButtonContainer: {
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
  uploadedAvatarClip: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  uploadedAvatarImg: {
    width: 120,
    height: 120,
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
});
