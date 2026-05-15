import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { OnboardingContinueButton, OnboardingBackButton } from '@/components';
import { fonts, colors } from '@/constants/theme';

const BG = require('../../assets/Onboarding Assets/Onboarding P5/FullBackground.png');

const SOURCES = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'appstore', label: 'App Store' },
  { id: 'friend', label: 'Friend / Family' },
  { id: 'creator', label: 'Content Creator' },
  { id: 'other', label: 'Other' },
];

export default function ReferralScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(id);
  };

  const handleContinue = () => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (selected) setAndSave('referralSource', selected);
      else skipField('referralSource');
      router.push('/onboarding/goals');
    });
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        {/* Header — matches QuestionLayout style */}
        <View style={styles.header}>
          <OnboardingBackButton />
          <View style={styles.progressTrack}>
            <View style={styles.progressTrackBg} />
            <View style={styles.progressFill} />
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{'How did you\nhear about us?'}</Text>
        </View>

        {/* Radio options */}
        <View style={styles.optionsContainer}>
          {SOURCES.map((source) => {
            const isSelected = selected === source.id;
            return (
              <Pressable
                key={source.id}
                style={styles.optionRow}
                onPress={() => handleSelect(source.id)}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {source.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Continue button */}
        <View style={styles.bottom}>
          <OnboardingContinueButton onPress={handleContinue} disabled={isNavigating} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Mirrors QuestionLayout header exactly
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    position: 'relative',
  },
  progressTrackBg: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    height: 4,
    width: '8%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  headerSpacer: {
    width: 44,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 52,
    color: '#000000',
    lineHeight: 58,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 14,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.bold,
    lineHeight: 15,
  },
  optionLabel: {
    fontFamily: fonts.regular,
    fontSize: 20,
    color: '#000000',
  },
  optionLabelSelected: {
    fontFamily: fonts.bold,
  },
  bottom: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 8,
  },
});
