import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { strongHaptic } from '@/utils/haptics';
import { fonts, spacing } from '@/constants/theme';
import { OnboardingContinueButton } from '@/components';
import { GYM_BUDDIES } from '@/data/gymBuddies';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { supabase } from '@/services/supabase';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { addSeedBuddyAsFriend } from '@/services/api/friends';
import { authStateManager } from '@/services/authState';
import { logger } from '@/utils/logger';

const FIGMA_W = 642;
const PHOTO_RATIO = 318 / FIGMA_W;
const ONLINE_BADGE_LEFT_RATIO = 242 / FIGMA_W;
const ONLINE_BADGE_TOP_RATIO = 10 / FIGMA_W;

export default function PartnerMatchScreen() {
  const params = useLocalSearchParams<{ profileIndex: string }>();
  const idx = Math.min(
    Math.max(parseInt(params.profileIndex ?? '0', 10), 0),
    GYM_BUDDIES.length - 1
  );
  const buddy = GYM_BUDDIES[idx];
  const setAndSave = useOnboardingStore((s) => s.setAndSave);

  const { width, height } = useWindowDimensions();
  const s = width / FIGMA_W;

  const photoSize = Math.round(width * PHOTO_RATIO);
  const onlineBadgeLeft = Math.round(width * ONLINE_BADGE_LEFT_RATIO);
  const onlineBadgeTop = Math.round(width * ONLINE_BADGE_TOP_RATIO);

  // userProfileStore.userId hydrates via an async chain (onAuthStateChange →
  // storeManager → refreshProfile → fetchProfile). On a fresh sign-up that
  // chain may not have completed by the time the user reaches this screen.
  // authStateManager is sourced from getSession() (locally stored as soon as
  // signInWithIdToken resolves), and supabase.auth.getUser() is a hard fallback.
  async function resolveUserId(): Promise<string | null> {
    const cached = authStateManager.getUserId();
    if (cached) return cached;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  }

  function persistBuddyToProfile(userId: string) {
    supabase
      .from('profiles')
      .update({ matched_buddy_index: idx })
      .eq('id', userId)
      .then(() => useUserProfileStore.getState().refreshProfile());
  }

  // "Start with {buddy}" — saves the match AND adds the buddy as a real friend
  // so they show up in the Friends tab immediately. Awaits the friendship insert
  // so failures surface in the logs instead of being swallowed.
  async function handleStart() {
    strongHaptic();
    setAndSave('matchedBuddyIndex', idx);

    const userId = await resolveUserId();
    if (!userId) {
      logger.error('partner-match handleStart: no userId, skipping buddy add', {
        idx,
        buddyId: buddy.id,
      });
      router.push('/onboarding/not-by-accident');
      return;
    }

    persistBuddyToProfile(userId);

    const added = await addSeedBuddyAsFriend(userId, buddy.id);
    if (!added) {
      logger.error('partner-match handleStart: addSeedBuddyAsFriend returned false', {
        userId: userId.slice(0, 8),
        buddyId: buddy.id,
        sentinel: `seed-buddy-${buddy.id}`,
      });
    }

    router.push('/onboarding/not-by-accident');
  }

  // "Continue without partner" — saves the match index (so the buddy banner
  // still appears on the user's profile) but does NOT add them as a friend.
  async function handleSolo() {
    strongHaptic();
    setAndSave('matchedBuddyIndex', idx);
    const userId = await resolveUserId();
    if (userId) {
      persistBuddyToProfile(userId);
    } else {
      logger.error('partner-match handleSolo: no userId, skipping profile update', { idx });
    }
    router.push('/onboarding/not-by-accident');
  }

  return (
    <View style={styles.container}>
      {/* P17 background has the trait pills baked in */}
      <Image
        source={require('../../assets/Onboarding Assets/Onboarding P17/match-bg.png')}
        style={{ position: 'absolute', width, height }}
        contentFit="cover"
      />

      <SafeAreaView style={styles.safeArea}>
        <Text
          style={[styles.name, { fontSize: Math.round(60 * s), marginTop: Math.round(60 * s) }]}
        >
          {buddy.name}
        </Text>

        {/* Photo + online badge */}
        <View style={{ alignSelf: 'center', marginTop: Math.round(20 * s) }}>
          <View style={{ width: photoSize, height: photoSize }}>
            <View
              style={{
                width: photoSize,
                height: photoSize,
                borderRadius: photoSize / 2,
                overflow: 'hidden',
              }}
            >
              <Image source={buddy.image} style={{ flex: 1 }} contentFit="cover" />
            </View>
            <View style={[styles.floatingBadge, { left: onlineBadgeLeft, top: onlineBadgeTop }]}>
              <View style={styles.onlineDot} />
              <Text style={[styles.badgeLabel, { fontSize: Math.round(22 * s) }]}>online</Text>
            </View>
          </View>
        </View>

        {/* 91% match badge */}
        <View style={[styles.matchWrapper, { marginTop: Math.round(-16 * s) }]}>
          <View style={styles.matchBadge}>
            <Text style={[styles.badgeLabel, { fontSize: Math.round(24 * s) }]}>91% match</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Fixed bottom buttons */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSection}>
        <OnboardingContinueButton
          onPress={handleStart}
          label={`Start with ${buddy.name}`}
          autoSize
        />
        <Pressable onPress={handleSolo} style={styles.soloButton}>
          <Text style={styles.soloText}>
            {'Prefer solo? '}
            <Text style={styles.soloLink}>Continue without partner</Text>
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    alignItems: 'center',
  },
  name: {
    fontFamily: fonts.bold,
    color: '#000000',
    textAlign: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 555,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 555,
    paddingVertical: 7,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 4,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  badgeLabel: {
    fontFamily: fonts.bold,
    color: '#000000',
    letterSpacing: -0.44,
  },
  matchWrapper: {
    alignItems: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
  soloButton: {
    paddingVertical: 4,
    marginTop: 8,
  },
  soloText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#b9b9b9',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  soloLink: {
    textDecorationLine: 'underline',
  },
});
