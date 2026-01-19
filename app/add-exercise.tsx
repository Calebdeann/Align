import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { fetchExercises, filterExercises, Exercise } from '@/services/api/exercises';
import { useWorkoutStore } from '@/stores/workoutStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Equipment options
const EQUIPMENT_OPTIONS = [
  { id: 'all', label: 'All Equipment' },
  { id: 'none', label: 'None (Bodyweight)' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'cable', label: 'Cable' },
  { id: 'machine', label: 'Machine' },
  { id: 'smith machine', label: 'Smith Machine' },
  { id: 'resistance band', label: 'Resistance Band' },
  { id: 'ez bar', label: 'EZ Bar' },
  { id: 'trap bar', label: 'Trap Bar' },
  { id: 'medicine ball', label: 'Medicine Ball' },
  { id: 'stability ball', label: 'Stability Ball' },
  { id: 'foam roller', label: 'Foam Roller' },
  { id: 'pull-up bar', label: 'Pull-up Bar' },
  { id: 'dip station', label: 'Dip Station' },
  { id: 'bench', label: 'Bench' },
  { id: 'box', label: 'Box/Platform' },
  { id: 'suspension trainer', label: 'Suspension Trainer (TRX)' },
  { id: 'battle ropes', label: 'Battle Ropes' },
];

// Muscle options
const MUSCLE_OPTIONS = [
  { id: 'all', label: 'All Muscles' },
  { id: 'abdominals', label: 'Abdominals' },
  { id: 'abductors', label: 'Abductors' },
  { id: 'adductors', label: 'Adductors' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'calves', label: 'Calves' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'chest', label: 'Chest' },
  { id: 'forearms', label: 'Forearms' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'lats', label: 'Lats' },
  { id: 'lower back', label: 'Lower Back' },
  { id: 'middle back', label: 'Middle Back' },
  { id: 'neck', label: 'Neck' },
  { id: 'quadriceps', label: 'Quadriceps' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'traps', label: 'Traps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'full body', label: 'Full Body' },
];

// SVG Icons
function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={colors.primary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface ExerciseItemProps {
  exercise: Exercise;
  isSelected: boolean;
  isAlreadyAdded: boolean;
  onToggle: () => void;
  onInfoPress: () => void;
}

function ExerciseItem({
  exercise,
  isSelected,
  isAlreadyAdded,
  onToggle,
  onInfoPress,
}: ExerciseItemProps) {
  const showSelected = isSelected || isAlreadyAdded;

  return (
    <View style={[styles.exerciseItem, isAlreadyAdded && styles.exerciseItemDisabled]}>
      <View style={[styles.exerciseIndicator, showSelected && styles.exerciseIndicatorSelected]} />
      <Pressable style={styles.exerciseImagePlaceholder} onPress={onInfoPress}>
        <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
      </Pressable>
      <Pressable style={styles.exerciseInfo} onPress={onInfoPress}>
        <Text style={[styles.exerciseName, isAlreadyAdded && styles.exerciseNameDisabled]}>
          {exercise.name}
        </Text>
        <Text style={styles.exerciseMuscle}>
          {isAlreadyAdded ? 'Already in workout' : exercise.muscle}
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.checkbox,
          showSelected && styles.checkboxSelected,
          isAlreadyAdded && styles.checkboxDisabled,
        ]}
        onPress={isAlreadyAdded ? undefined : onToggle}
        disabled={isAlreadyAdded}
      >
        {showSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </Pressable>
    </View>
  );
}

interface FilterOption {
  id: string;
  label: string;
}

interface FilterModalProps {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function FilterModal({ visible, title, options, selectedId, onSelect, onClose }: FilterModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Pressable style={styles.modalCloseButton} onPress={onClose}>
                <CloseIcon />
              </Pressable>
              <Text style={styles.modalTitle}>{title}</Text>
              <View style={styles.modalCloseButton} />
            </View>

            <ScrollView
              style={styles.filterOptionsScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {options.map((option) => (
                <Pressable
                  key={option.id}
                  style={styles.filterOptionItem}
                  onPress={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedId === option.id && styles.filterOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedId === option.id && <CheckIcon />}
                </Pressable>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// Multi-select filter modal for muscles
interface MultiSelectFilterModalProps {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function MultiSelectFilterModal({
  visible,
  title,
  options,
  selectedIds,
  onToggle,
  onClear,
  onClose,
}: MultiSelectFilterModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Filter out the "all" option for multi-select display
  const selectableOptions = options.filter((o) => o.id !== 'all');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Pressable style={styles.modalCloseButton} onPress={onClose}>
                <CloseIcon />
              </Pressable>
              <Text style={styles.modalTitle}>{title}</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={onClear}
                disabled={selectedIds.length === 0}
              >
                {selectedIds.length > 0 && <Text style={styles.clearText}>Clear</Text>}
              </Pressable>
            </View>

            {selectedIds.length > 0 && (
              <View style={styles.selectedChipsContainer}>
                {selectedIds.map((id) => {
                  const option = options.find((o) => o.id === id);
                  return (
                    <Pressable key={id} style={styles.selectedChip} onPress={() => onToggle(id)}>
                      <Text style={styles.selectedChipText}>{option?.label}</Text>
                      <Ionicons name="close" size={14} color={colors.primary} />
                    </Pressable>
                  );
                })}
              </View>
            )}

            <ScrollView
              style={styles.filterOptionsScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {selectableOptions.map((option) => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    style={styles.filterOptionItem}
                    onPress={() => onToggle(option.id)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        isSelected && styles.filterOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <View
                      style={[
                        styles.multiSelectCheckbox,
                        isSelected && styles.multiSelectCheckboxSelected,
                      ]}
                    >
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                  </Pressable>
                );
              })}
              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.applyButton} onPress={onClose}>
                <Text style={styles.applyButtonText}>
                  {selectedIds.length > 0 ? `Apply (${selectedIds.length} selected)` : 'Show All'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default function AddExerciseScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useLocalSearchParams();

  // Filter state
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]); // Multi-select for muscles
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showMuscleModal, setShowMuscleModal] = useState(false);

  // Parse existing exercise IDs from params
  const existingExerciseIds: string[] = params.existingExerciseIds
    ? JSON.parse(params.existingExerciseIds as string)
    : [];

  // Fetch exercises on mount
  useEffect(() => {
    loadExercises();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadExercises();
  }, [selectedEquipment, selectedMuscles]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadExercises();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function loadExercises() {
    setIsLoading(true);
    setError(null);

    const equipment = selectedEquipment === 'all' ? undefined : selectedEquipment;
    const muscles = selectedMuscles.length > 0 ? selectedMuscles : undefined;
    const query = searchQuery.trim() || undefined;

    const data = await filterExercises({ equipment, muscles, query });

    if (data.length === 0 && !equipment && !muscles && !query) {
      setError('No exercises found. Make sure to run the seed SQL in Supabase.');
    }
    setExercises(data);
    setIsLoading(false);
  }

  // Toggle muscle selection for multi-select
  const toggleMuscleFilter = (muscleId: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscleId) ? prev.filter((m) => m !== muscleId) : [...prev, muscleId]
    );
  };

  const clearMuscleFilters = () => {
    setSelectedMuscles([]);
  };

  const toggleExercise = (id: string) => {
    if (existingExerciseIds.includes(id)) return;

    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const setPendingExercises = useWorkoutStore((state) => state.setPendingExercises);

  const handleAddExercises = () => {
    const selected = exercises.filter((e) => selectedExercises.includes(e.id));
    // Store the selected exercises in the global store
    setPendingExercises(selected.map((e) => ({ id: e.id, name: e.name, muscle: e.muscle })));
    // Go back to active-workout - it will pick up the pending exercises from the store
    router.back();
  };

  // Get display labels for filters
  const equipmentLabel =
    EQUIPMENT_OPTIONS.find((o) => o.id === selectedEquipment)?.label || 'All Equipment';
  const muscleLabel =
    selectedMuscles.length === 0
      ? 'All Muscles'
      : selectedMuscles.length === 1
        ? MUSCLE_OPTIONS.find((o) => o.id === selectedMuscles[0])?.label || 'Muscle'
        : `${selectedMuscles.length} Muscles`;

  // Check if filters are active
  const hasActiveFilters = selectedEquipment !== 'all' || selectedMuscles.length > 0;

  // Split exercises: first 3 as "recent", rest as "all"
  // In the future, "recent" could be based on actual user history
  const recentExercises = hasActiveFilters ? [] : exercises.slice(0, 3);
  const allExercises = hasActiveFilters ? exercises : exercises.slice(3);

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
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterButton, selectedEquipment !== 'all' && styles.filterButtonActive]}
          onPress={() => setShowEquipmentModal(true)}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedEquipment !== 'all' && styles.filterButtonTextActive,
            ]}
            numberOfLines={1}
          >
            {equipmentLabel}
          </Text>
          <ChevronDownIcon />
        </Pressable>
        <Pressable
          style={[styles.filterButton, selectedMuscles.length > 0 && styles.filterButtonActive]}
          onPress={() => setShowMuscleModal(true)}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedMuscles.length > 0 && styles.filterButtonTextActive,
            ]}
            numberOfLines={1}
          >
            {muscleLabel}
          </Text>
          <ChevronDownIcon />
        </Pressable>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadExercises}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Exercise List */}
      {!isLoading && !error && (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {recentExercises.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent Exercises</Text>
              {recentExercises.map((exercise) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  isSelected={selectedExercises.includes(exercise.id)}
                  isAlreadyAdded={existingExerciseIds.includes(exercise.id)}
                  onToggle={() => toggleExercise(exercise.id)}
                  onInfoPress={() => router.push(`/exercise/${exercise.id}`)}
                />
              ))}
            </>
          )}

          {allExercises.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                {hasActiveFilters ? `Filtered Exercises (${exercises.length})` : 'All Exercises'}
              </Text>
              {allExercises.map((exercise) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  isSelected={selectedExercises.includes(exercise.id)}
                  isAlreadyAdded={existingExerciseIds.includes(exercise.id)}
                  onToggle={() => toggleExercise(exercise.id)}
                  onInfoPress={() => router.push(`/exercise/${exercise.id}`)}
                />
              ))}
            </>
          )}

          {exercises.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `No exercises found for "${searchQuery}"`
                  : hasActiveFilters
                    ? 'No exercises match the selected filters'
                    : 'No exercises found'}
              </Text>
              {hasActiveFilters && (
                <Pressable
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSelectedEquipment('all');
                    setSelectedMuscles([]);
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

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

      {/* Equipment Filter Modal */}
      <FilterModal
        visible={showEquipmentModal}
        title="Select Equipment"
        options={EQUIPMENT_OPTIONS}
        selectedId={selectedEquipment}
        onSelect={setSelectedEquipment}
        onClose={() => setShowEquipmentModal(false)}
      />

      {/* Muscle Filter Modal (Multi-Select) */}
      <MultiSelectFilterModal
        visible={showMuscleModal}
        title="Select Muscles"
        options={MUSCLE_OPTIONS}
        selectedIds={selectedMuscles}
        onToggle={toggleMuscleFilter}
        onClear={clearMuscleFilters}
        onClose={() => setShowMuscleModal(false)}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    ...cardStyle,
  },
  filterButtonActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  filterButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    flexShrink: 1,
  },
  filterButtonTextActive: {
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  clearFiltersText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: '#FFFFFF',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  filterOptionsScroll: {
    paddingHorizontal: spacing.lg,
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  filterOptionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  filterOptionTextSelected: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  // Multi-select modal styles
  clearText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  selectedChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  selectedChipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  multiSelectCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiSelectCheckboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border + '30',
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
});
