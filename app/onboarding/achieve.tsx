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
    id: 'confident',
    label: 'Feel confident',
    image: require('../../assets/Onboarding Assets/Onboarding P6/FeelConfident.png'),
    rotation: '1deg',
    contentPosition: 'center' as const,
  },
  {
    id: 'physique',
    label: 'Build my dream\nphysique',
    image: require('../../assets/Onboarding Assets/Onboarding P6/BuildMyDreamPhysique.png'),
    rotation: '-2deg',
    contentPosition: 'top' as const,
  },
  {
    id: 'discipline',
    label: 'Build discipline',
    image: require('../../assets/Onboarding Assets/Onboarding P6/BuildDiscipline.png'),
    rotation: '2deg',
    contentPosition: 'top' as const,
  },
  {
    id: 'health',
    label: 'Improve health',
    image: require('../../assets/Onboarding Assets/Onboarding P6/ImproveHealth.png'),
    rotation: '-2deg',
    contentPosition: 'center' as const,
  },
];

export default function AchieveScreen() {
  const { isNavigating, withLock } = useNavigationLock();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const cardWidth = (width - spacing.lg * 2 - 12) / 2;
  const cardHeight = cardWidth * 1.17;

  function handleSelect(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleContinue() {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      router.push('/onboarding/ideal-day');
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

      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          {'What are you\nlooking to '}
          <Text style={styles.titleItalic}>{'achieve?'}</Text>
        </Text>
      </View>

      <View style={styles.grid}>
        {OPTIONS.map((option) => {
          const isSelected = selected.has(option.id);
          return (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option.id)}
              style={[
                styles.cardOuter,
                { width: cardWidth, height: cardHeight },
                { transform: [{ rotate: option.rotation }] },
              ]}
            >
              {/* Inner clips image to rounded rect — must be separate from outer so shadow isn't clipped */}
              <View style={styles.cardInner}>
                <Image
                  source={option.image}
                  style={styles.cardImage}
                  contentFit="cover"
                  contentPosition={option.contentPosition}
                />
                <View style={styles.cardBottom}>
                  <OnboardingRadioCircle selected={isSelected} />
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.bottomSection}>
        <OnboardingContinueButton
          onPress={handleContinue}
          disabled={selected.size === 0 || isNavigating}
        />
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
    width: 30,
    height: 4,
    backgroundColor: '#000000',
  },
  titleContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 44,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 52,
  },
  titleItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 44,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    rowGap: 20,
    columnGap: 12,
  },
  // Shadow + rotation live here — no overflow:hidden so shadow isn't clipped
  cardOuter: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },
  // Image clipping lives here — overflow:hidden clips to the rounded corners
  cardInner: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    flex: 1,
    width: '100%',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  optionLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#000000',
    flexShrink: 1,
  },
  optionLabelSelected: {
    fontFamily: fonts.semiBold,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 8,
  },
});
