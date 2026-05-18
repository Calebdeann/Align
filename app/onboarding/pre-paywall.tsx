import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OnboardingContinueButton } from '@/components';

const PLAN_BACKGROUNDS: Record<string, ReturnType<typeof require>> = {
  'pilates-princess': require('../../assets/Onboarding Assets/Onboarding P20/p20-pilates.png'),
  hourglass: require('../../assets/Onboarding Assets/Onboarding P20/p20-hourglass.png'),
  booty: require('../../assets/Onboarding Assets/Onboarding P20/p20-booty.png'),
  'summer-body': require('../../assets/Onboarding Assets/Onboarding P20/p20-summer.png'),
  'it-girl': require('../../assets/Onboarding Assets/Onboarding P20/p20-it-girl.png'),
  'glow-up': require('../../assets/Onboarding Assets/Onboarding P20/p20-glow.png'),
  'muscle-mommy': require('../../assets/Onboarding Assets/Onboarding P20/p20-muscle-mommy.png'),
  home: require('../../assets/Onboarding Assets/Onboarding P20/p20-home.png'),
};

export default function PrePaywallScreen() {
  const { selectedPlanId } = useOnboardingStore();
  const bgImage =
    PLAN_BACKGROUNDS[selectedPlanId ?? 'summer-body'] ?? PLAN_BACKGROUNDS['summer-body'];

  function handleStart() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/onboarding/paywall');
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
          <OnboardingContinueButton onPress={handleStart} label="Start now" />
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
