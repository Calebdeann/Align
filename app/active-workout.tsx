import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';

interface Exercise {
  id: string;
  name: string;
  muscle: string;
}

interface ExerciseSet {
  id: string;
  previous: string;
  kg: string;
  reps: string;
  completed: boolean;
}

interface WorkoutExercise {
  exercise: Exercise;
  notes: string;
  restTimerEnabled: boolean;
  sets: ExerciseSet[];
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function createDefaultSets(): ExerciseSet[] {
  // Start with 1 empty set - no history yet
  return [{ id: '1', previous: '-', kg: '', reps: '', completed: false }];
}

export default function ActiveWorkoutScreen() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [menuOpenIndex, setMenuOpenIndex] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const params = useLocalSearchParams();

  // Start timer automatically when screen mounts
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle added exercises from add-exercise screen
  useEffect(() => {
    if (params.addedExercises) {
      try {
        const exercises: Exercise[] = JSON.parse(params.addedExercises as string);
        const newWorkoutExercises: WorkoutExercise[] = exercises.map((exercise) => ({
          exercise,
          notes: '',
          restTimerEnabled: false,
          sets: createDefaultSets(),
        }));
        setWorkoutExercises((prev) => [...prev, ...newWorkoutExercises]);
      } catch (e) {
        console.error('Failed to parse added exercises:', e);
      }
    }
  }, [params.addedExercises]);

  const handleBack = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    router.back();
  };

  const handleSave = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // TODO: Save workout logic
    router.back();
  };

  const handleAddExercise = () => {
    const existingIds = workoutExercises.map((we) => we.exercise.id);
    router.push({
      pathname: '/add-exercise',
      params: { existingExerciseIds: JSON.stringify(existingIds) },
    });
  };

  const addSet = (exerciseIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const newSetId = (updated[exerciseIndex].sets.length + 1).toString();
      updated[exerciseIndex].sets.push({
        id: newSetId,
        previous: '-',
        kg: '60',
        reps: '8',
        completed: false,
      });
      return updated;
    });
  };

  const toggleSetCompletion = (exerciseIndex: number, setIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex].completed =
        !updated[exerciseIndex].sets[setIndex].completed;
      return updated;
    });
  };

  const updateNotes = (exerciseIndex: number, notes: string) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].notes = notes;
      return updated;
    });
  };

  const deleteExercise = (exerciseIndex: number) => {
    setWorkoutExercises((prev) => prev.filter((_, index) => index !== exerciseIndex));
  };

  const updateSetValue = (
    exerciseIndex: number,
    setIndex: number,
    field: 'kg' | 'reps',
    value: string
  ) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex][field] = value;
      return updated;
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>

        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="time-outline" size={24} color={colors.text} />
          </Pressable>
          <Pressable onPress={handleSave}>
            <Text style={styles.saveText}>SAVE</Text>
          </Pressable>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {workoutExercises.length === 0 ? (
        // Empty State
        <View style={styles.content}>
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark" size={26} color={colors.border} />
          </View>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>Add an exercise to start your workout</Text>
          <Pressable style={styles.addExerciseButton} onPress={handleAddExercise}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </Pressable>
          <View style={styles.bottomButtons}>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </Pressable>
            <Pressable style={styles.discardButton}>
              <Text style={styles.discardButtonText}>Discard</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // Filled State with Exercises
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {workoutExercises.map((workoutExercise, exerciseIndex) => (
            <View
              key={`${workoutExercise.exercise.id}-${exerciseIndex}`}
              style={styles.exerciseCard}
            >
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseImagePlaceholder}>
                  <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
                </View>
                <Text style={styles.exerciseTitle}>{workoutExercise.exercise.name}</Text>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <View>
                  <Pressable
                    style={styles.moreButton}
                    onPress={() =>
                      setMenuOpenIndex(menuOpenIndex === exerciseIndex ? null : exerciseIndex)
                    }
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
                  </Pressable>
                  {menuOpenIndex === exerciseIndex && (
                    <View style={styles.dropdownMenu}>
                      <Pressable
                        style={styles.dropdownItem}
                        onPress={() => {
                          deleteExercise(exerciseIndex);
                          setMenuOpenIndex(null);
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#E53935" />
                        <Text style={styles.dropdownItemTextDelete}>Delete Exercise</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>

              {/* Notes Input */}
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes here..."
                placeholderTextColor={colors.textSecondary}
                value={workoutExercise.notes}
                onChangeText={(text) => updateNotes(exerciseIndex, text)}
              />

              {/* Rest Timer */}
              <View style={styles.restTimerRow}>
                <Ionicons name="stopwatch-outline" size={18} color={colors.text} />
                <Text style={styles.restTimerText}>Rest Timer: OFF</Text>
              </View>

              {/* Sets Table Header */}
              <View style={styles.setsHeader}>
                <Text style={[styles.setHeaderText, styles.setColumn]}>SET</Text>
                <Text style={[styles.setHeaderText, styles.previousColumn]}>PREVIOUS</Text>
                <Text style={[styles.setHeaderText, styles.kgColumn]}>KG</Text>
                <Text style={[styles.setHeaderText, styles.repsColumn]}>REPS</Text>
                <View style={styles.checkColumn}>
                  <Ionicons name="checkmark" size={16} color={colors.textSecondary} />
                </View>
              </View>

              {/* Sets Rows */}
              {workoutExercise.sets.map((set, setIndex) => (
                <View key={set.id} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
                  <Text style={[styles.setText, styles.setColumn, styles.setNumber]}>{set.id}</Text>
                  <Text style={[styles.setText, styles.previousColumn, styles.previousText]}>
                    {set.previous}
                  </Text>
                  <TextInput
                    style={[styles.setText, styles.kgColumn, styles.setInput]}
                    value={set.kg}
                    onChangeText={(value) => updateSetValue(exerciseIndex, setIndex, 'kg', value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.setText, styles.repsColumn, styles.setInput]}
                    value={set.reps}
                    onChangeText={(value) => updateSetValue(exerciseIndex, setIndex, 'reps', value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <Pressable
                    style={styles.checkColumn}
                    onPress={() => toggleSetCompletion(exerciseIndex, setIndex)}
                  >
                    <View
                      style={[styles.setCheckbox, set.completed && styles.setCheckboxCompleted]}
                    >
                      {set.completed && (
                        <Ionicons name="checkmark" size={12} color={colors.primary} />
                      )}
                    </View>
                  </Pressable>
                </View>
              ))}

              {/* Add Set Button */}
              <Pressable style={styles.addSetButton} onPress={() => addSet(exerciseIndex)}>
                <Text style={styles.addSetText}>+ Add Set</Text>
              </Pressable>
            </View>
          ))}

          {/* Bottom Buttons */}
          <Pressable style={styles.addExerciseButtonFilled} onPress={handleAddExercise}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </Pressable>

          <View style={styles.bottomButtonsFilled}>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </Pressable>
            <Pressable style={styles.discardButton}>
              <Text style={styles.discardButtonText}>Discard Workout</Text>
            </Pressable>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
    position: 'absolute',
    left: spacing.lg,
    zIndex: 1,
  },
  timer: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
  },
  iconButton: {
    padding: spacing.xs,
  },
  saveText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
  },
  checkmarkContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    width: '100%',
    gap: spacing.sm,
  },
  addExerciseText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
  bottomButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F4FA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
  },
  secondaryButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  discardButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F4FA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
  },
  discardButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#E53935',
  },
  scrollView: {
    flex: 1,
  },
  exerciseCard: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exerciseImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  moreButton: {
    padding: spacing.xs,
  },
  notesInput: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
  },
  restTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  restTimerText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  setHeaderText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  setColumn: {
    width: 40,
  },
  previousColumn: {
    flex: 1,
  },
  kgColumn: {
    width: 60,
    textAlign: 'center',
  },
  repsColumn: {
    width: 50,
    textAlign: 'center',
  },
  checkColumn: {
    width: 40,
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderRadius: 8,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(148, 122, 255, 0.2)',
  },
  setText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  setNumber: {
    fontFamily: fonts.bold,
  },
  previousText: {
    color: colors.textSecondary,
  },
  setCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCheckboxCompleted: {
    backgroundColor: '#F0EBFF',
    borderColor: colors.primary,
  },
  addSetButton: {
    ...cardStyle,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addSetText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  addExerciseButtonFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    gap: spacing.sm,
  },
  bottomButtonsFilled: {
    flexDirection: 'row',
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  bottomSpacer: {
    height: 40,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dropdownItemTextDelete: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#E53935',
  },
  setInput: {
    textAlign: 'center',
    padding: 0,
  },
});
