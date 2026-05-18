import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts, spacing } from '@/constants/theme';
import { OnboardingContinueButton } from '@/components';

export default function PaywallScreen() {
  function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Paywall</Text>
        <Text style={styles.sub}>Superwall integration coming soon</Text>
      </View>

      <View style={styles.bottom}>
        <OnboardingContinueButton onPress={handleContinue} label="Continue to app" />
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          style={styles.back}
        >
          <Text style={styles.backLabel}>Go back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontFamily: fonts.frauncesBold,
    fontSize: 48,
    color: '#000000',
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 20,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  bottom: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: spacing.lg,
  },
  back: {
    paddingVertical: 8,
  },
  backLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: 'rgba(0,0,0,0.4)',
  },
});
