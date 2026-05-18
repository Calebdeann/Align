import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts, spacing } from '@/constants/theme';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import {
  OnboardingBackButton,
  OnboardingContinueButton,
  OnboardingRadioCircle,
} from '@/components';

const OPTIONS = [
  {
    id: 'flexible',
    label: 'Flexible, but\nconsistent',
    image: require('../../assets/Onboarding Assets/Onboarding P7/Flexible.png'),
    rotation: '-1deg',
  },
  {
    id: 'early',
    label: 'Early mornings,\nstructured',
    image: require('../../assets/Onboarding Assets/Onboarding P7/EarlyMornings.png'),
    rotation: '2deg',
  },
  {
    id: 'balanced',
    label: 'Balanced work\nhard, rest too',
    image: require('../../assets/Onboarding Assets/Onboarding P7/BalancedWorkHard.png'),
    rotation: '-1.5deg',
  },
  {
    id: 'gentle',
    label: 'Gentle reset,\nstart fresh',
    image: require('../../assets/Onboarding Assets/Onboarding P7/GentleReset.png'),
    rotation: '2deg',
  },
];

const H_PAD = 16;
const CARD_GAP = 12;
const ROW_GAP = 20;

export default function IdealDayScreen() {
  const { isNavigating, withLock } = useNavigationLock();
  const { width: screenWidth } = useWindowDimensions();
  const [selected, setSelected] = useState<string | null>(null);

  const cardWidth = (screenWidth - H_PAD * 2 - CARD_GAP) / 2;
  const cardHeight = Math.round(cardWidth * (241 / 283));
  const cardRadius = Math.round(cardWidth * (40 / 283));

  function handleSelect(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected((prev) => (prev === id ? null : id));
  }

  function handleContinue() {
    if (!selected) return;
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      router.push('/onboarding/challenge');
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <OnboardingBackButton />
        <View style={styles.progressCenter}>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <Text style={styles.title}>
        {'What does your '}
        <Text style={styles.titleItalic}>ideal</Text>
        {'\nday look like?'}
      </Text>

      <View style={[styles.grid, { paddingHorizontal: H_PAD }]}>
        {([OPTIONS.slice(0, 2), OPTIONS.slice(2, 4)] as (typeof OPTIONS)[]).map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((option) => {
              const isSelected = selected === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelect(option.id)}
                  style={[styles.optionWrapper, { transform: [{ rotate: option.rotation }] }]}
                >
                  {/* Card: shadow on outer, image clip on inner */}
                  <View
                    style={[
                      styles.cardOuter,
                      { width: cardWidth, height: cardHeight, borderRadius: cardRadius },
                    ]}
                  >
                    <View style={[styles.cardInner, { borderRadius: cardRadius }]}>
                      <Image source={option.image} style={styles.cardImage} contentFit="cover" />
                    </View>
                  </View>

                  {/* Label row below card */}
                  <View style={styles.labelRow}>
                    <OnboardingRadioCircle selected={isSelected} />
                    <Text style={[styles.label, isSelected && styles.labelBold]}>
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.bottomSection}>
        <OnboardingContinueButton onPress={handleContinue} disabled={!selected || isNavigating} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: 12,
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
    width: 40,
    height: 4,
    backgroundColor: '#000000',
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 48,
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    lineHeight: 56,
  },
  titleItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 48,
  },
  grid: {
    marginTop: spacing.xl,
    gap: ROW_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  optionWrapper: {
    flex: 1,
  },
  // Shadow on outer, no overflow:hidden
  cardOuter: {
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  // overflow:hidden clips image to rounded corners
  cardInner: {
    flex: 1,
    overflow: 'hidden',
  },
  cardImage: {
    flex: 1,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    gap: 8,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    flex: 1,
  },
  labelBold: {
    fontFamily: fonts.semiBold,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
});
