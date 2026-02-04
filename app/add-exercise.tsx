import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  SectionList,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatExerciseDisplayName } from '@/utils/textFormatters';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { filterExercisesClient, Exercise } from '@/services/api/exercises';
import { useWorkoutStore } from '@/stores/workoutStore';
import {
  useExerciseStore,
  prefetchExerciseGif,
  getExerciseDisplayName,
} from '@/stores/exerciseStore';
import { useRecentExercisesStore } from '@/stores/recentExercisesStore';
import { ExerciseImage } from '@/components/ExerciseImage';
import { useNavigationLock } from '@/hooks/useNavigationLock';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Equipment and muscle option IDs - labels are resolved via i18n inside the component

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
  onPressName: () => void;
  alreadyInWorkoutLabel: string;
}

function ExerciseItem({
  exercise,
  isSelected,
  isAlreadyAdded,
  onToggle,
  onPressName,
  alreadyInWorkoutLabel,
}: ExerciseItemProps) {
  const showSelected = isSelected || isAlreadyAdded;

  return (
    <Pressable
      style={[styles.exerciseItem, isAlreadyAdded && styles.exerciseItemDisabled]}
      onPress={
        isAlreadyAdded
          ? undefined
          : () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle();
            }
      }
      disabled={isAlreadyAdded}
    >
      <View style={[styles.exerciseIndicator, showSelected && styles.exerciseIndicatorSelected]} />
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressName();
        }}
        disabled={isAlreadyAdded}
      >
        <ExerciseImage
          gifUrl={exercise.image_url}
          thumbnailUrl={exercise.thumbnail_url}
          size={44}
          borderRadius={8}
          backgroundColor={colors.background}
        />
      </Pressable>
      <View style={styles.exerciseInfo} pointerEvents="box-none">
        <Text
          style={[
            styles.exerciseName,
            isAlreadyAdded && styles.exerciseNameDisabled,
            { alignSelf: 'flex-start' },
          ]}
          onPress={
            isAlreadyAdded
              ? undefined
              : () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPressName();
                }
          }
        >
          {getExerciseDisplayName(exercise)}
        </Text>
        <Text style={styles.exerciseMuscle}>
          {isAlreadyAdded ? alreadyInWorkoutLabel : exercise.muscle_group}
        </Text>
      </View>
      <View
        style={[
          styles.checkbox,
          showSelected && styles.checkboxSelected,
          isAlreadyAdded && styles.checkboxDisabled,
        ]}
      >
        {showSelected && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
      </View>
    </Pressable>
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
      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
        }}
      >
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
              >
                <CloseIcon />
              </Pressable>
              <Text style={styles.modalTitle}>{title}</Text>
              <View style={styles.modalCloseButton} />
            </View>

            <ScrollView style={styles.filterOptionsScroll} showsVerticalScrollIndicator={true}>
              {options.map((option) => (
                <Pressable
                  key={option.id}
                  style={styles.filterOptionItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(option.id);
                    onClose();
                  }}
                >
                  <View style={styles.filterOptionLeft}>
                    {option.id !== 'all' && <View style={styles.filterOptionCircle} />}
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedId === option.id && styles.filterOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {selectedId === option.id && <CheckIcon />}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// Section header component
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function AddExerciseScreen() {
  const { t } = useTranslation();
  const { isNavigating, withLock } = useNavigationLock();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const params = useLocalSearchParams();

  // Filter state
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [showMuscleModal, setShowMuscleModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  // Exercise store (cached exercises)
  const { allExercises, isLoaded, isLoading, error, loadExercises, getPopularExercises } =
    useExerciseStore();
  // Subscribe to translation changes so exercise names re-render in the selected language
  const translationsLanguage = useExerciseStore((state) => state.translationsLanguage);
  const { getRecentExercises, addRecentExercises } = useRecentExercisesStore();

  // Translatable filter options
  const EQUIPMENT_OPTIONS = useMemo(
    () => [
      { id: 'all', label: t('equipment.all') },
      { id: 'body weight', label: t('equipment.bodyWeight') },
      { id: 'barbell', label: t('equipment.barbell') },
      { id: 'dumbbell', label: t('equipment.dumbbell') },
      { id: 'kettlebell', label: t('equipment.kettlebell') },
      { id: 'cable', label: t('equipment.cable') },
      { id: 'band', label: t('equipment.band') },
      { id: 'machine', label: t('equipment.machine') },
      { id: 'other', label: t('equipment.other') },
    ],
    [t]
  );

  const MUSCLE_OPTIONS = useMemo(
    () => [
      { id: 'all', label: t('muscles.all') },
      { id: 'abs', label: t('muscles.abs') },
      { id: 'biceps', label: t('muscles.biceps') },
      { id: 'calves', label: t('muscles.calves') },
      { id: 'delts', label: t('muscles.delts') },
      { id: 'forearms', label: t('muscles.forearms') },
      { id: 'glutes', label: t('muscles.glutes') },
      { id: 'hamstrings', label: t('muscles.hamstrings') },
      { id: 'lats', label: t('muscles.lats') },
      { id: 'pectorals', label: t('muscles.pectorals') },
      { id: 'quads', label: t('muscles.quads') },
      { id: 'spine', label: t('muscles.spine') },
      { id: 'traps', label: t('muscles.traps') },
      { id: 'triceps', label: t('muscles.triceps') },
      { id: 'upper back', label: t('muscles.upperBack') },
    ],
    [t]
  );

  // Parse existing exercise IDs from params
  const existingExerciseIds: string[] = params.existingExerciseIds
    ? JSON.parse(params.existingExerciseIds as string)
    : [];

  // Load exercises on mount (will use cache if already loaded)
  useEffect(() => {
    loadExercises();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check if filters are active
  const hasActiveFilters = selectedMuscle !== 'all' || selectedEquipment !== 'all';

  // Get sections data: Recent at top, then Popular, then All Exercises
  const sections = useMemo(() => {
    // If searching, show search results with active filters applied
    if (debouncedQuery.trim()) {
      const searchResults = filterExercisesClient(allExercises, {
        query: debouncedQuery,
        muscles: selectedMuscle !== 'all' ? [selectedMuscle] : undefined,
        equipment: selectedEquipment !== 'all' ? selectedEquipment : undefined,
      });
      return [
        { title: t('addExercise.resultsFor', { query: debouncedQuery }), data: searchResults },
      ];
    }

    // Get recent and popular exercises
    const recent = getRecentExercises(allExercises);
    const popular = getPopularExercises();

    // Get all exercises with filters applied
    const allFiltered = filterExercisesClient(allExercises, {
      muscles: selectedMuscle !== 'all' ? [selectedMuscle] : undefined,
      equipment: selectedEquipment !== 'all' ? selectedEquipment : undefined,
    });

    // Deduplication: Recent > Popular > All
    const recentIds = new Set(recent.map((e) => e.id));
    const popularWithoutRecent = popular.filter((e) => !recentIds.has(e.id));
    const excludedIds = new Set([...recentIds, ...popular.map((e) => e.id)]);
    const allWithoutRecentAndPopular = allFiltered.filter((e) => !excludedIds.has(e.id));

    const result = [];

    // Only show Recent and Popular sections if no filters are active
    if (!hasActiveFilters) {
      if (recent.length > 0) {
        result.push({ title: t('addExercise.recent'), data: recent });
      }
      if (popularWithoutRecent.length > 0) {
        result.push({ title: t('addExercise.popular'), data: popularWithoutRecent });
      }
    }

    if (allWithoutRecentAndPopular.length > 0 || hasActiveFilters) {
      result.push({
        title: t('addExercise.allExercises'),
        data: hasActiveFilters ? allFiltered : allWithoutRecentAndPopular,
      });
    }

    return result;
  }, [
    allExercises,
    debouncedQuery,
    selectedMuscle,
    selectedEquipment,
    getPopularExercises,
    getRecentExercises,
    hasActiveFilters,
    t,
  ]);

  // Prefetch GIFs for Recent + Popular exercises so detail view loads instantly
  useEffect(() => {
    const gifUrls: string[] = [];
    for (const section of sections) {
      if (section.title === t('addExercise.recent') || section.title === t('addExercise.popular')) {
        for (const ex of section.data) {
          if (ex.image_url) gifUrls.push(ex.image_url);
        }
      }
    }
    if (gifUrls.length > 0) {
      Image.prefetch(gifUrls).catch(() => {});
    }
  }, [sections]);

  const toggleExercise = useCallback(
    (exerciseId: string) => {
      if (existingExerciseIds.includes(exerciseId)) return;

      setSelectedExercises((prev) =>
        prev.includes(exerciseId) ? prev.filter((e) => e !== exerciseId) : [...prev, exerciseId]
      );
    },
    [existingExerciseIds]
  );

  const setPendingExercises = useWorkoutStore((state) => state.setPendingExercises);

  const handleAddExercises = () => {
    const selected = allExercises.filter((e) => selectedExercises.includes(e.id));
    // Track as recent exercises for quick access next time
    addRecentExercises(selected.map((e) => e.id));
    setPendingExercises(
      selected.map((e) => ({
        id: e.id,
        name: e.display_name || formatExerciseDisplayName(e.name, e.equipment),
        muscle: e.muscle_group || 'Unknown',
        gifUrl: e.image_url || '',
        thumbnailUrl: e.thumbnail_url || '',
      }))
    );
    router.back();
  };

  // Navigate to exercise detail (prefetch GIF for instant animation)
  const handlePressExerciseName = (exerciseId: string) => {
    withLock(() => {
      prefetchExerciseGif(exerciseId);
      router.push(`/exercise/${exerciseId}`);
    });
  };

  // Get display labels for filters
  const muscleLabel =
    selectedMuscle === 'all'
      ? t('muscles.all')
      : MUSCLE_OPTIONS.find((o) => o.id === selectedMuscle)?.label || t('addExercise.muscle');

  const equipmentLabel =
    selectedEquipment === 'all'
      ? t('equipment.all')
      : EQUIPMENT_OPTIONS.find((o) => o.id === selectedEquipment)?.label || t('workout.equipment');

  // Clear all filters
  const clearFilters = () => {
    setSelectedMuscle('all');
    setSelectedEquipment('all');
    setSearchQuery('');
  };

  // Render item for SectionList
  const alreadyInWorkoutLabel = t('addExercise.alreadyInWorkout');
  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseItem
        exercise={item}
        isSelected={selectedExercises.includes(item.id)}
        isAlreadyAdded={existingExerciseIds.includes(item.id)}
        onToggle={() => toggleExercise(item.id)}
        onPressName={() => handlePressExerciseName(item.id)}
        alreadyInWorkoutLabel={alreadyInWorkoutLabel}
      />
    ),
    [selectedExercises, existingExerciseIds, toggleExercise, alreadyInWorkoutLabel]
  );

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => <SectionHeader title={section.title} />,
    []
  );

  // Check if list is empty
  const isEmpty = sections.length === 0 || sections.every((s) => s.data.length === 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('addExercise.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('addExercise.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSearchQuery('');
            }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Filter Buttons (always visible) */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterButton, selectedMuscle !== 'all' && styles.filterButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowMuscleModal(true);
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedMuscle !== 'all' && styles.filterButtonTextActive,
            ]}
            numberOfLines={1}
          >
            {muscleLabel}
          </Text>
          <ChevronDownIcon />
        </Pressable>

        <Pressable
          style={[styles.filterButton, selectedEquipment !== 'all' && styles.filterButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowEquipmentModal(true);
          }}
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
      </View>

      {/* Loading State */}
      {isLoading && !isLoaded && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              loadExercises();
            }}
          >
            <Text style={styles.retryText}>{t('addExercise.retry')}</Text>
          </Pressable>
        </View>
      )}

      {/* Exercise List */}
      {isLoaded && !error && (
        <View style={styles.listContainer}>
          {!isEmpty ? (
            <SectionList
              sections={sections}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={(item) => item.id}
              extraData={translationsLanguage}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              stickySectionHeadersEnabled={false}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {debouncedQuery
                  ? t('addExercise.noExercisesForQuery', { query: debouncedQuery })
                  : hasActiveFilters
                    ? t('addExercise.noExercisesMatchFilters')
                    : t('addExercise.noExercisesFound')}
              </Text>
              {(hasActiveFilters || debouncedQuery) && (
                <Pressable
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    clearFilters();
                  }}
                >
                  <Text style={styles.clearFiltersText}>{t('addExercise.clearFilters')}</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}

      {/* Add Button */}
      {selectedExercises.length > 0 && (
        <View style={styles.addButtonContainer}>
          <Pressable
            style={styles.addButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleAddExercises();
            }}
          >
            <Text style={styles.addButtonText}>
              {t('addExercise.addCount', { count: selectedExercises.length })}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Muscle Filter Modal */}
      <FilterModal
        visible={showMuscleModal}
        title={t('addExercise.selectMuscle')}
        options={MUSCLE_OPTIONS}
        selectedId={selectedMuscle}
        onSelect={setSelectedMuscle}
        onClose={() => setShowMuscleModal(false)}
      />

      {/* Equipment Filter Modal */}
      <FilterModal
        visible={showEquipmentModal}
        title={t('addExercise.selectEquipment')}
        options={EQUIPMENT_OPTIONS}
        selectedId={selectedEquipment}
        onSelect={setSelectedEquipment}
        onClose={() => setShowEquipmentModal(false)}
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
    color: colors.textInverse,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
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
    color: colors.textInverse,
  },
  listContainer: {
    flex: 1,
    marginTop: spacing.md,
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  exerciseIndicator: {
    width: 3,
    height: 40,
    backgroundColor: 'transparent',
    borderRadius: 2,
  },
  exerciseIndicatorSelected: {
    backgroundColor: colors.primary,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  exerciseMuscle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
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
    color: colors.textInverse,
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
    paddingBottom: 40,
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
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  filterOptionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
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
});
