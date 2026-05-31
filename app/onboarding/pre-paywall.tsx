import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePlacement } from 'expo-superwall';
import { strongHaptic } from '@/utils/haptics';
import { fonts, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useDiscoverPrefetchStore } from '@/stores/discoverPrefetchStore';
import { useAppConfigStore } from '@/stores/appConfigStore';
import { OnboardingContinueButton } from '@/components';
import { logger } from '@/utils/logger';

// Superwall placement triggered when the user taps "Start now". Same
// placement name as the in-app gate (useSubscriptionGate) — they share the
// paywall template configured in the Superwall dashboard. The two surfaces
// just trigger it from different places in the flow.
const PLACEMENT = 'campaign_trigger';

const PLAN_BACKGROUNDS: Record<string, ReturnType<typeof require>> = {
  'pilates-princess': require('../../assets/Onboarding Assets/Onboarding P20/p20-pilates.png'),
  hourglass: require('../../assets/Onboarding Assets/Onboarding P20/p20-hourglass.png'),
  booty: require('../../assets/Onboarding Assets/Onboarding P20/p20-booty.png'),
  'summer-body': require('../../assets/Onboarding Assets/Onboarding P20/p20-summer.png'),
  'it-girl': require('../../assets/Onboarding Assets/Onboarding P20/p20-it-girl.png'),
  'busy-girl': require('../../assets/Onboarding Assets/Onboarding P20/p20-busygirl.png'),
  'muscle-mommy': require('../../assets/Onboarding Assets/Onboarding P20/p20-muscle-mommy.png'),
  home: require('../../assets/Onboarding Assets/Onboarding P20/p20-home.png'),
};

export default function PrePaywallScreen() {
  const { selectedPlanId } = useOnboardingStore();
  const bgImage =
    PLAN_BACKGROUNDS[selectedPlanId ?? 'summer-body'] ?? PLAN_BACKGROUNDS['summer-body'];
  const [isPresenting, setIsPresenting] = useState(false);

  // Shake-style haptic burst the moment "Congrats!" lands.
  useEffect(() => {
    const intervals = [0, 80, 160, 240, 320, 400];
    const timers = intervals.map((ms) =>
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), ms)
    );

    // Warm the discover feed so it's painted from disk cache when the user
    // lands in /(tabs) and Superwall briefly reveals the UI underneath.
    const viewerId = useUserProfileStore.getState().profile?.id;
    useDiscoverPrefetchStore.getState().hydrate(viewerId);

    return () => timers.forEach(clearTimeout);
  }, []);

  // Superwall callbacks. Whichever fires, the user proceeds — we never strand
  // them on the celebration screen.
  const { registerPlacement } = usePlacement({
    onDismiss: () => {
      setIsPresenting(false);
      // Apple-review bypass: while the `apple_review_mode` flag is true in
      // app_config, dismissing the paywall takes the user into the app so
      // reviewers can test the rest of the experience. Flip the flag off in
      // Supabase once App Review approves to restore the hard paywall.
      if (useAppConfigStore.getState().appleReviewMode) {
        router.replace('/(tabs)');
      }
    },
    onSkip: () => {
      // No paywall attached to this placement / no audience match — proceed.
      setIsPresenting(false);
      router.replace('/(tabs)');
    },
    onError: (err) => {
      setIsPresenting(false);
      logger.warn('pre-paywall: superwall error, proceeding to app', { err });
      router.replace('/(tabs)');
    },
  });

  async function handleStart() {
    if (isPresenting) return;
    strongHaptic();

    setIsPresenting(true);
    try {
      await registerPlacement({
        placement: PLACEMENT,
        feature: () => {
          router.replace('/(tabs)');
        },
      });
    } catch (e) {
      logger.warn('pre-paywall: registerPlacement threw, proceeding to app', { error: e });
      setIsPresenting(false);
      router.replace('/(tabs)');
    }
  }

  return (
    <ImageBackground source={bgImage} style={styles.container} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.textBlock}>
          <Text style={styles.congrats}>Congrats!</Text>
          <Text style={styles.subtitle}>
            {"You're ready to begin\n"}
            <Text style={styles.subtitleItalic}>your</Text>
            {' transformation'}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.bottomSection}>
          <OnboardingContinueButton
            onPress={handleStart}
            label="Start now"
            disabled={isPresenting}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  textBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 35,
    alignItems: 'center',
    gap: 4,
  },
  congrats: {
    fontFamily: fonts.frauncesBold,
    fontSize: 58,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 62,
  },
  subtitle: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 38,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 48,
  },
  subtitleItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 38,
    lineHeight: 48,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
});
