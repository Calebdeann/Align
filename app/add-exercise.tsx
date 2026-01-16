import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';

// Sample exercises - will be replaced with real data later
const SAMPLE_EXERCISES = [
  { id: '1', name: 'Chest Press (Machine)', muscle: 'Chest' },
  { id: '2', name: 'Lat Pulldown', muscle: 'Back' },
  { id: '3', name: 'Leg Press', muscle: 'Legs' },
  { id: '4', name: 'Shoulder Press', muscle: 'Shoulders' },
  { id: '5', name: 'Bicep Curl', muscle: 'Arms' },
];

interface ExerciseItemProps {
  exercise: { id: string; name: string; muscle: string };
  isSelected: boolean;
  isAlreadyAdded: boolean;
  onToggle: () => void;
}

function ExerciseItem({ exercise, isSelected, isAlreadyAdded, onToggle }: ExerciseItemProps) {
  const showSelected = isSelected || isAlreadyAdded;

  return (
    <Pressable
      style={[styles.exerciseItem, isAlreadyAdded && styles.exerciseItemDisabled]}
      onPress={isAlreadyAdded ? undefined : onToggle}
      disabled={isAlreadyAdded}
    >
      <View style={[styles.exerciseIndicator, showSelected && styles.exerciseIndicatorSelected]} />
      <View style={styles.exerciseImagePlaceholder}>
        <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.exerciseInfo}>
        <Text style={[styles.exerciseName, isAlreadyAdded && styles.exerciseNameDisabled]}>
          {exercise.name}
        </Text>
        <Text style={styles.exerciseMuscle}>
          {isAlreadyAdded ? 'Already in workout' : exercise.muscle}
        </Text>
      </View>
      <View
        style={[
          styles.checkbox,
          showSelected && styles.checkboxSelected,
          isAlreadyAdded && styles.checkboxDisabled,
        ]}
      >
        {showSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}

export default function AddExerciseScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const params = useLocalSearchParams();

  // Parse existing exercise IDs from params
  const existingExerciseIds: string[] = params.existingExerciseIds
    ? JSON.parse(params.existingExerciseIds as string)
    : [];

  const toggleExercise = (id: string) => {
    // Don't allow toggling exercises that are already in the workout
    if (existingExerciseIds.includes(id)) return;

    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const filteredExercises = SAMPLE_EXERCISES.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.muscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddExercises = () => {
    const selected = SAMPLE_EXERCISES.filter((e) => selectedExercises.includes(e.id));
    // Navigate back to active-workout with the selected exercises
    router.navigate({
      pathname: '/active-workout',
      params: { addedExercises: JSON.stringify(selected) },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Exercise</Text>
        <Pressable onPress={() => {}}>
          <Text style={styles.createText}>Create</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercise"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        <Pressable style={styles.filterButton}>
          <Text style={styles.filterButtonText}>All Equipment</Text>
        </Pressable>
        <Pressable style={styles.filterButton}>
          <Text style={styles.filterButtonText}>All Muscles</Text>
        </Pressable>
      </View>

      {/* Exercise List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Recent Exercises</Text>
        {filteredExercises.slice(0, 3).map((exercise) => (
          <ExerciseItem
            key={exercise.id}
            exercise={exercise}
            isSelected={selectedExercises.includes(exercise.id)}
            isAlreadyAdded={existingExerciseIds.includes(exercise.id)}
            onToggle={() => toggleExercise(exercise.id)}
          />
        ))}

        <Text style={styles.sectionTitle}>All Exercises</Text>
        {filteredExercises.slice(3).map((exercise) => (
          <ExerciseItem
            key={exercise.id}
            exercise={exercise}
            isSelected={selectedExercises.includes(exercise.id)}
            isAlreadyAdded={existingExerciseIds.includes(exercise.id)}
            onToggle={() => toggleExercise(exercise.id)}
          />
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add Button */}
      {selectedExercises.length > 0 && (
        <View style={styles.addButtonContainer}>
          <Pressable style={styles.addButton} onPress={handleAddExercises}>
            <Text style={styles.addButtonText}>
              Add {selectedExercises.length} Exercise{selectedExercises.length > 1 ? 's' : ''}
            </Text>
          </Pressable>
        </View>
      )}
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
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  createText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...cardStyle,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    ...cardStyle,
  },
  filterButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  exerciseIndicator: {
    width: 3,
    height: 40,
    backgroundColor: 'transparent',
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  exerciseIndicatorSelected: {
    backgroundColor: colors.primary,
  },
  exerciseImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  exerciseMuscle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bottomSpacer: {
    height: 100,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
  exerciseItemDisabled: {
    opacity: 0.6,
  },
  exerciseNameDisabled: {
    color: colors.textSecondary,
  },
  checkboxDisabled: {
    backgroundColor: colors.textSecondary,
    borderColor: colors.textSecondary,
  },
});
