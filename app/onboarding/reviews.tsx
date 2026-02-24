import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useNavigationLock } from '@/hooks/useNavigationLock';

const LeafLeft = require('../../assets/images/LeafLeft.png');
const LeafRight = require('../../assets/images/LeafRight.png');
const Girl1 = require('../../assets/images/Girl1.png');
const Girl2 = require('../../assets/images/Girl2.png');
const Girl3 = require('../../assets/images/Girl3.png');
const EllieSullivan = require('../../assets/images/EllieSullivan.jpg');
const AlexisSandra = require('../../assets/images/AlexisSandra.jpg');

const LEAF_GOLD = '#D4A574';

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  avatar: ReturnType<typeof require>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={[styles.star, star <= rating && styles.starFilled]}>
          ★
        </Text>
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const { t } = useTranslation();
  const { isNavigating: navLocked, withLock } = useNavigationLock();
  const [hasRated, setHasRated] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const reviews: Review[] = useMemo(
    () => [
      {
        id: '1',
        name: t('onboarding.reviews.review1Author'),
        rating: 5,
        text: t('onboarding.reviews.review1Text'),
        avatar: EllieSullivan,
      },
      {
        id: '2',
        name: t('onboarding.reviews.review2Author'),
        rating: 5,
        text: t('onboarding.reviews.review2Text'),
        avatar: AlexisSandra,
      },
    ],
    [t]
  );

  const handleRatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsButtonDisabled(true);

    if (__DEV__) {
      // Native StoreKit dialog freezes iOS Simulator, show alert instead
      Alert.alert(
        'Rate Align',
        'Thanks for your support! The native review dialog will appear in production builds.'
      );
    } else {
      StoreReview.isAvailableAsync()
        .then((isAvailable) => {
          console.log('[StoreReview] isAvailable:', isAvailable);
          if (isAvailable) {
            StoreReview.requestReview()
              .then(() => console.log('[StoreReview] requestReview called'))
              .catch((e) => console.warn('[StoreReview] requestReview error:', e));
          }
        })
        .catch((e) => console.warn('[StoreReview] isAvailableAsync error:', e));
    }

    setTimeout(() => {
      setHasRated(true);
      setIsButtonDisabled(false);
    }, 2000);
  };

  const handleContinue = () => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      router.push('/onboarding/generate-plan');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          disabled={navLocked}
          onPress={() =>
            withLock(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            })
          }
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '88%' }]} />
        </View>

        <View style={styles.skipPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.titleText}>{t('onboarding.reviews.title')}</Text>

        {/* Rating card */}
        <View style={styles.ratingCard}>
          <Image source={LeafLeft} style={styles.leafImage} resizeMode="contain" />
          <View style={styles.ratingContent}>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingNumber}>{t('onboarding.reviews.rating')}</Text>
              <StarRating rating={5} />
            </View>
            <Text style={styles.ratingLabel}>{t('onboarding.reviews.appStoreRating')}</Text>
          </View>
          <Image source={LeafRight} style={styles.leafImage} resizeMode="contain" />
        </View>

        {/* Made for you section */}
        <Text style={styles.sectionTitle}>{t('onboarding.reviews.sectionTitle')}</Text>

        {/* User avatars */}
        <View style={styles.avatarsContainer}>
          <Image source={Girl1} style={styles.avatar} />
          <Image source={Girl2} style={[styles.avatar, styles.avatarOverlap]} />
          <Image source={Girl3} style={[styles.avatar, styles.avatarOverlap]} />
        </View>

        <Text style={styles.usersLoveText}>{t('onboarding.reviews.usersLove')}</Text>

        {/* Reviews */}
        <View style={styles.reviewsContainer}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image source={review.avatar} style={styles.reviewAvatar} />
                <Text style={styles.reviewName}>{review.name}</Text>
                <StarRating rating={review.rating} />
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Rate / Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={[styles.continueButton, isButtonDisabled && styles.continueButtonDisabled]}
          onPress={hasRated ? handleContinue : handleRatePress}
          disabled={isButtonDisabled || navLocked}
        >
          <Text style={[styles.continueText, isButtonDisabled && styles.continueTextDisabled]}>
            {hasRated ? t('common.continue') : t('onboarding.reviews.rate5Stars')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundOnboarding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressBarFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  skipPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  titleText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
  },
  leafImage: {
    width: 40,
    height: 50,
  },
  ratingContent: {
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingNumber: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
  },
  ratingLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 18,
    color: colors.border,
  },
  starFilled: {
    color: LEAF_GOLD,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 32,
  },
  avatarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarOverlap: {
    marginLeft: -20,
  },
  usersLoveText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  loveBold: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
  reviewsContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  reviewName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  reviewText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
  },
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
  continueTextDisabled: {
    color: colors.textSecondary,
  },
});
