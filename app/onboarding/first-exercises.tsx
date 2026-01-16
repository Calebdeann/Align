import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

const exercises = [
  { id: 'hip-thrust', label: 'Hip Thrust' },
  { id: 'barbell-squat', label: 'Barbell Squat' },
  { id: 'leg-extension', label: 'Leg Extension' },
  { id: 'shoulder-press', label: 'Shoulder Press' },
];

export default function FirstExercisesScreen() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedExercise(id);
    const exercise = exercises.find((e) => e.id === id);
    setTimeout(() => {
      router.push({
        pathname: '/onboarding/exercise-tutorial',
        params: { exerciseName: exercise?.label || 'Exercise' },
      });
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '92%' }]} />
        </View>

        <Pressable onPress={() => router.push('/onboarding/complete')}>
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
                <View style={styles.exerciseImage} />
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
    backgroundColor: colors.background,
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
  exerciseImage: {
    width: 60,
    height: 60,
    backgroundColor: colors.border,
    borderRadius: 8,
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
