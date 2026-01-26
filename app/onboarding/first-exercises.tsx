import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { ExerciseImage } from '@/components/ExerciseImage';

// Exercise GIF URLs from Ascend API (ExerciseDB)
const exercises = [
  { id: 'qKBpF7I', label: 'Hip Thrust', gifUrl: 'https://static.exercisedb.dev/media/qKBpF7I.gif' },
  {
    id: 'qXTaZnJ',
    label: 'Barbell Squat',
    gifUrl: 'https://static.exercisedb.dev/media/qXTaZnJ.gif',
  },
  {
    id: 'my33uHU',
    label: 'Leg Extension',
    gifUrl: 'https://static.exercisedb.dev/media/my33uHU.gif',
  },
  {
    id: 'znQUdHY',
    label: 'Shoulder Press',
    gifUrl: 'https://static.exercisedb.dev/media/znQUdHY.gif',
  },
];

export default function FirstExercisesScreen() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedExercise(id);
    const exercise = exercises.find((e) => e.id === id);
    setTimeout(() => {
      router.push({
        pathname: '/onboarding/exercise-tutorial',
        params: { exerciseName: exercise?.label || 'Exercise', gifUrl: exercise?.gifUrl || '' },
      });
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '72%' }]} />
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push('/onboarding/complete');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Lets track your first exercises!</Text>
        <Text style={styles.subtitle}>
          If you don't recognise an exercise, just pick one that seems interesting
        </Text>
      </View>

      {/* Exercise List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.exerciseList}>
          {exercises.map((exercise) => {
            const isSelected = selectedExercise === exercise.id;
            return (
              <Pressable
                key={exercise.id}
                style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}
                onPress={() => handleSelect(exercise.id)}
              >
                <ExerciseImage gifUrl={exercise.gifUrl} size={60} borderRadius={8} />
                <Text style={[styles.exerciseLabel, isSelected && styles.exerciseLabelSelected]}>
                  {exercise.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // White background for exercise images to blend
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
  skipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  titleContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  exerciseList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  exerciseCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  exerciseLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  exerciseLabelSelected: {
    color: '#FFFFFF',
  },
});
