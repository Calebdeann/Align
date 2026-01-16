import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

interface Exercise {
  id: string;
  name: string;
}

const exercises: Exercise[] = [
  { id: 'hip-thrust', name: 'Hip Thrust' },
  { id: 'barbell-squat', name: 'Barbell Squat' },
  { id: 'leg-extension', name: 'Leg Extension' },
  { id: 'shoulder-press', name: 'Shoulder Press' },
];

export default function TrackExerciseSelectScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string, name: string) => {
    setSelected(id);
    setTimeout(() => {
      router.push({
        pathname: '/onboarding/track-tutorial',
        params: { exerciseName: name },
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
          <View style={[styles.progressBarFill, { width: '75%' }]} />
        </View>

        <Pressable onPress={() => router.push('/onboarding/track-tutorial')}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
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
              onPress={() => handleSelect(exercise.id, exercise.name)}
            >
              <View style={styles.imagePlaceholder} />
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
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.border,
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
