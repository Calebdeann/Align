import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { Exercise, getExerciseById } from '@/services/api/exercises';
import { ExerciseImage } from '@/components/ExerciseImage';
import { toTitleCase } from '@/utils/textFormatters';

// Muscle chip component
function MuscleChip({ muscle }: { muscle: string }) {
  return (
    <View style={styles.muscleChip}>
      <Text style={styles.muscleChipText}>{muscle}</Text>
    </View>
  );
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [id]);

  async function loadData() {
    if (!id) return;

    setIsLoading(true);

    try {
      // Load exercise from Supabase (now includes all detail fields)
      const exerciseData = await getExerciseById(id);
      if (!isMountedRef.current) return;
      setExercise(exerciseData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading exercise data:', error);
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Exercise</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Exercise</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Exercise not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use data from local database (no more API calls needed)
  const rawInstructions = exercise.instructions_array || [];
  const instructions = rawInstructions.map((step) =>
    step.replace(/^step\s*:?\s*\d+\s*:?\s*/i, '').trim()
  );
  const primaryMuscles = exercise.target_muscles || [exercise.muscle_group];
  const secondaryMuscles = exercise.secondary_muscles || [];
  const equipment = exercise.equipment || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {toTitleCase(exercise.name)}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Large GIF Animation */}
        <View style={styles.gifContainer}>
          <ExerciseImage gifUrl={exercise.image_url} size={280} borderRadius={16} animated={true} />
        </View>

        {/* Primary Muscles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Muscles</Text>
          <View style={styles.muscleChipsContainer}>
            {primaryMuscles.length > 0 ? (
              primaryMuscles.map((muscle, index) => (
                <MuscleChip key={`primary-${index}`} muscle={muscle} />
              ))
            ) : (
              <Text style={styles.noDataText}>{exercise.muscle_group || 'Unknown'}</Text>
            )}
          </View>
        </View>

        {/* Secondary Muscles */}
        {secondaryMuscles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Secondary Muscles</Text>
            <View style={styles.muscleChipsContainer}>
              {secondaryMuscles.map((muscle, index) => (
                <MuscleChip key={`secondary-${index}`} muscle={muscle} />
              ))}
            </View>
          </View>
        )}

        {/* How to Perform */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Perform</Text>

          {instructions.length > 0 ? (
            <View style={styles.instructionsContainer}>
              {instructions.map((step, index) => (
                <View key={index} style={styles.instructionStep}>
                  <Text style={styles.stepText}>
                    <Text style={styles.stepLabel}>Step {index + 1}: </Text>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noInstructionsContainer}>
              <Ionicons name="help-circle-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.noInstructionsText}>Instructions coming soon</Text>
              <Text style={styles.noInstructionsSubtext}>
                Search YouTube for "{toTitleCase(exercise.name)}" to learn proper form.
              </Text>
            </View>
          )}
        </View>

        {/* Equipment */}
        {equipment.length > 0 && (
          <View style={styles.equipmentSection}>
            <Text style={styles.equipmentLabel}>Equipment</Text>
            <Text style={styles.equipmentValue}>
              {Array.isArray(equipment) ? equipment.join(', ') : equipment}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  gifContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  muscleChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  muscleChip: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  muscleChipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  noDataText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  instructionsContainer: {
    gap: spacing.md,
  },
  instructionStep: {
    marginBottom: spacing.xs,
  },
  stepLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  stepText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  noInstructionsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noInstructionsText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: spacing.sm,
  },
  noInstructionsSubtext: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  equipmentSection: {
    ...cardStyle,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipmentLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  equipmentValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    textTransform: 'capitalize',
  },
  bottomSpacer: {
    height: 40,
  },
});
