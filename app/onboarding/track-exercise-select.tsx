import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { ExerciseImage } from '@/components/ExerciseImage';

interface Exercise {
  id: string;
  name: string;
  gifUrl: string;
}

// Exercise GIF URLs from Ascend API (ExerciseDB)
const exercises: Exercise[] = [
  { id: 'qKBpF7I', name: 'Hip Thrust', gifUrl: 'https://static.exercisedb.dev/media/qKBpF7I.gif' },
  {
    id: 'qXTaZnJ',
    name: 'Barbell Squat',
    gifUrl: 'https://static.exercisedb.dev/media/qXTaZnJ.gif',
  },
  {
    id: 'rkg41Fb',
    name: 'Lat Pull Down',
    gifUrl: 'https://static.exercisedb.dev/media/rkg41Fb.gif',
  },
  {
    id: 'znQUdHY',
    name: 'Shoulder Press (Dumbbells)',
    gifUrl: 'https://static.exercisedb.dev/media/znQUdHY.gif',
  },
];

export default function TrackExerciseSelectScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (exercise: Exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected(exercise.id);
    setTimeout(() => {
      router.push({
        pathname: '/onboarding/track-tutorial',
        params: { exerciseName: exercise.name, gifUrl: exercise.gifUrl },
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
          <View style={[styles.progressBarFill, { width: '75%' }]} />
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Lets track your{'\n'}first exercises!</Text>
        <Text style={styles.subtitle}>
          If you don't recognise an exercise,{'\n'}just pick one that seems interesting
        </Text>
      </View>

      {/* Exercise options */}
      <View style={styles.optionsContainer}>
        {exercises.map((exercise) => {
          const isSelected = selected === exercise.id;
          return (
            <Pressable
              key={exercise.id}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => handleSelect(exercise)}
            >
              <View style={styles.imageContainer}>
                <ExerciseImage gifUrl={exercise.gifUrl} size={50} borderRadius={8} />
              </View>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {exercise.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
    alignItems: 'center',
  },
  titleText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  imageContainer: {
    marginRight: spacing.lg,
  },
  optionText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
  },
});
