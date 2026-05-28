import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/constants/theme';
import { getPlanById, type PlanReview } from '@/data/plans';
import { CircleBackButton, OnboardingContinueButton } from '@/components';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useWorkoutStore } from '@/stores/workoutStore';

const IMG_RATIO = 1848 / 739;
const REVIEW_ROTATIONS = ['-1.5deg', '1deg', '-1deg', '1.5deg', '-0.5deg'] as const;

function Stars({ rating }: { rating: number }) {
  return (
    <Text>
      {Array.from({ length: 5 }, (_, i) => (
        <Text key={i} style={[styles.star, i < rating ? styles.starFilled : styles.starEmpty]}>
          {'★'}
        </Text>
      ))}
    </Text>
  );
}

function ReviewCard({ review, rotation }: { review: PlanReview; rotation: string }) {
  return (
    <View style={[styles.reviewCard, { transform: [{ rotate: rotation }] }]}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewName}>{review.name}</Text>
        <Stars rating={review.rating} />
      </View>
      <Text style={styles.reviewText}>{review.text}</Text>
    </View>
  );
}

export default function PlanDetailScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { width } = useWindowDimensions();
  const { profile, updateProfile } = useUserProfileStore();
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const plan = getPlanById(planId);

  const [isSaving, setIsSaving] = useState(false);

  const currentPlanId = profile?.plan_id ?? 'summer-body';
  const isCurrentPlan = planId === currentPlanId;

  const cardWidth = width - spacing.lg * 2;
  const cardHeight = Math.round(cardWidth / IMG_RATIO);

  if (!plan) return null;

  async function handleChangePlan() {
    if (isCurrentPlan) {
      router.back();
      return;
    }

    // An in-progress workout is tied to the OLD plan's scheduled-workout row.
    // Switching plans deletes that row, leaving the active session orphaned.
    // Block the switch and tell the user what to do.
    if (activeWorkout) {
      Alert.alert(
        'Finish your current workout first',
        'You have a workout in progress. Finish or discard it before switching plans.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Switch Plans?',
      "Switching plans will restart your program progress. Your workout history won't be affected, but your current plan streak will reset.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Plan',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            const success = await updateProfile({ plan_id: plan.id });
            setIsSaving(false);
            if (!success) {
              Alert.alert('Error', 'Could not switch plans. Please try again.');
              return;
            }
            // The planner's mount effect handles clearing stale plan workouts
            // and seeding the new plan when planId changes — no need to do it
            // synchronously here. Just navigate back snappily.
            if (router.canGoBack()) {
              router.back();
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <CircleBackButton />
        <Text style={styles.headerTitle}>Plan Details</Text>
        <View style={{ width: 46 }} />
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
          {plan.name}
        </Text>

        {/* Hero image */}
        <Image
          source={plan.image}
          style={{ width: cardWidth, height: cardHeight, marginTop: spacing.sm }}
          contentFit="cover"
        />

        {/* Highlights */}
        <View style={styles.highlights}>
          {plan.highlights.map((text, i) => (
            <View key={i} style={styles.highlightRow}>
              <Ionicons name="checkmark-circle" size={36} color="#000000" />
              <Text style={styles.highlightText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Program Overview */}
        <Text style={styles.sectionTitle}>Program Overview:</Text>
        <Text style={styles.overview}>{plan.overview}</Text>

        {/* Reviews */}
        <View style={styles.reviews}>
          {plan.reviews.map((review, i) => (
            <ReviewCard
              key={i}
              review={review}
              rotation={REVIEW_ROTATIONS[i % REVIEW_ROTATIONS.length]}
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating button */}
      <View style={styles.floatingButton}>
        <OnboardingContinueButton
          onPress={handleChangePlan}
          label={isCurrentPlan ? 'Current Plan' : 'Change Plan'}
          disabled={isSaving}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + 8,
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: '#000000',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 60,
    color: '#000000',
    textAlign: 'center',
    paddingTop: spacing.xl,
    lineHeight: 70,
  },
  highlights: {
    marginTop: spacing.md,
    gap: 14,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#000000',
    flex: 1,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#000000',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  overview: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#333333',
    lineHeight: 21,
  },
  reviews: {
    marginTop: spacing.xl,
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#000000',
  },
  star: {
    fontSize: 17,
  },
  starFilled: {
    color: '#000000',
  },
  starEmpty: {
    color: '#D9D9D9',
  },
  reviewText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#333333',
    lineHeight: 20,
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
