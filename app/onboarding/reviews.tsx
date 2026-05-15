import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { fonts, spacing } from '@/constants/theme';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { OnboardingContinueButton } from '@/components';

const STARS_IMAGE = require('../../assets/Onboarding Assets/Onboarding P13/Stars.png');

export default function ReviewsScreen() {
  const { isNavigating, withLock } = useNavigationLock();
  const [rated, setRated] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  function handlePress() {
    if (rated) {
      withLock(() => router.push('/onboarding/personalising'));
      return;
    }
    setRated(true);
    StoreReview.requestReview();
    setTimeout(() => setCanContinue(true), 3000);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }} />

      <View style={styles.card}>
        <Text style={styles.title}>Help us Grow!</Text>
        <Image source={STARS_IMAGE} style={styles.stars} contentFit="contain" />
        <Text style={styles.body}>
          We dedicate countless hours to help you become the best version of yourself!
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.bottomSection}>
        <OnboardingContinueButton
          onPress={handlePress}
          disabled={isNavigating || (rated && !canContinue)}
          label={rated ? 'Continue' : 'Rate 5 Stars'}
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
  card: {
    marginHorizontal: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 27,
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 8,
    gap: 9,
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 40,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 47,
  },
  stars: {
    width: '100%',
    height: 72,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
});
