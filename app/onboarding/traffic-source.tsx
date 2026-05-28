import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { strongHaptic } from '@/utils/haptics';
import { fonts, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  OnboardingBackButton,
  OnboardingContinueButton,
  OnboardingRadioCircle,
} from '@/components';

const BG_IMAGE = require('../../assets/programs/p5-background.png');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

const OPTIONS = [
  'TikTok',
  'Instagram',
  'Pinterest',
  'App Store',
  'Friend/Family',
  'Content Creator',
  'Other',
];

export default function TrafficSourceScreen() {
  const setAndSave = useOnboardingStore((s) => s.setAndSave);
  const savedTrafficSource = useOnboardingStore((s) => s.trafficSource);
  const [selected, setSelected] = useState<string | null>(savedTrafficSource);
  const [isSaving, setIsSaving] = useState(false);

  function handleSelect(option: string) {
    strongHaptic();
    setSelected((prev) => (prev === option ? null : option));
  }

  async function handleContinue() {
    if (!selected || isSaving) return;
    setIsSaving(true);
    try {
      await setAndSave('trafficSource', selected);
    } finally {
      setIsSaving(false);
      router.push('/onboarding/achieve');
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={BG_IMAGE}
        style={{ position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header: back button + progress bar */}
        <View style={styles.header}>
          <OnboardingBackButton />
          <View style={styles.progressCenter}>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>{'How did you\nhear about us?'}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option;
            return (
              <Pressable key={option} style={styles.optionRow} onPress={() => handleSelect(option)}>
                <OnboardingRadioCircle selected={isSelected} />
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        {/* Continue button */}
        <View style={styles.bottomSection}>
          <OnboardingContinueButton onPress={handleContinue} disabled={!selected || isSaving} />
        </View>
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
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  progressCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    width: 100,
    height: 4,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: 20,
    height: 4,
    backgroundColor: '#000000',
  },
  heading: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 48,
    lineHeight: 56,
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  optionsContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: 48,
    gap: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionLabel: {
    fontFamily: fonts.regular,
    fontSize: 17,
    color: '#000000',
  },
  optionLabelSelected: {
    fontFamily: fonts.semiBold,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 4,
  },
});
