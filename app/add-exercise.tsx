import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  SectionList,
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
import { useUserProfileStore } from '@/stores/userProfileStore';
import { ExerciseImage } from '@/components/ExerciseImage';
import { FilterModal } from '@/components/FilterModal';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import {
  SIMPLIFIED_MUSCLE_GROUPS,
  getSimplifiedMuscleI18nKey,
  expandMuscleFilter,
} from '@/constants/muscleGroups';

const MUSCLE_GROUP_ICONS: Record<string, any> = {
  all: require('../assets/Body Graph Icons/AllMuscles_BodyGraph.png'),
  back: require('../assets/Body Graph Icons/Back_BodyGraph.png'),
  biceps: require('../assets/Body Graph Icons/Biceps_BodyGraph.png'),
  calves: require('../assets/Body Graph Icons/Calves_BodyGraph.png'),
  chest: require('../assets/Body Graph Icons/Chest_BodyGraph.png'),
  core: require('../assets/Body Graph Icons/Core_BodyGraph.png'),
  glutes: require('../assets/Body Graph Icons/Glutes_BodyGraph.png'),
  legs: require('../assets/Body Graph Icons/Legs_BodyGraph.png'),
  other: require('../assets/Body Graph Icons/Other_BodyGraph.png'),
  shoulders: require('../assets/Body Graph Icons/Shoulders_BodyGraph.png'),
  triceps: require('../assets/Body Graph Icons/Triceps_BodyGraph.png'),
};

const EQUIPMENT_ICONS: Record<string, any> = {
  all: require('../assets/Body Graph Icons/AllMuscles_BodyGraph.png'),
  none: require('../assets/Equipment/None.png'),
  barbell: require('../assets/Equipment/Barbell.png'),
  dumbbell: require('../assets/Equipment/Dumbell.png'),
  kettlebell: require('../assets/Equipment/Kettlebell.png'),
  machine: require('../assets/Equipment/Machine.png'),
  'weighted plate': require('../assets/Equipment/Plate.png'),
  band: require('../assets/Equipment/ResistanceBand.png'),
  other: require('../assets/Body Graph Icons/Other_BodyGraph.png'),
};

// SVG Icons
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
  const { t } = useTranslation();
  const showSelected = isSelected || isAlreadyAdded;
  const muscleLabel = exercise.muscle_group
    ? t(getSimplifiedMuscleI18nKey(exercise.muscle_group)) || exercise.muscle_group
    : '';

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
        onPress={
          exercise.image_url || exercise.thumbnail_url
            ? () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPressName();
              }
            : undefined
        }
        disabled={isAlreadyAdded || (!exercise.image_url && !exercise.thumbnail_url)}
      >
        <ExerciseImage
          gifUrl={exercise.image_url}
          thumbnailUrl={exercise.thumbnail_url}
          size={50}
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
            isAlreadyAdded || (!exercise.image_url && !exercise.thumbnail_url)
              ? undefined
              : () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPressName();
                }
          }
        >
          {getExerciseDisplayName(exercise)}
        </Text>
        <View style={styles.exerciseMuscleRow}>
          <Text style={styles.exerciseMuscle}>
            {isAlreadyAdded ? alreadyInWorkoutLabel : muscleLabel}
          </Text>
          {exercise.is_custom && (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>Custom</Text>
            </View>
          )}
        </View>
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
  const {
    allExercises,
    isLoaded,
    isLoading,
    error,
    loadExercises,
    customExercises,
    loadCustomExercises,
  } = useExerciseStore();
  const lastCreatedExerciseId = useExerciseStore((state) => state.lastCreatedExerciseId);
  const clearLastCreatedExerciseId = useExerciseStore((state) => state.clearLastCreatedExerciseId);
  // Subscribe to translation changes so exercise names re-render in the selected language
  const translationsLanguage = useExerciseStore((state) => state.translationsLanguage);
  const { getRecentExercises, addRecentExercises } = useRecentExercisesStore();
  const { userId } = useUserProfileStore();

  const sectionListRef = useRef<SectionList<any>>(null);

  // Translatable filter options
  const EQUIPMENT_OPTIONS = useMemo(
    () => [
      { id: 'all', label: t('equipment.all') },
      { id: 'none', label: t('equipment.none') },
      { id: 'barbell', label: t('equipment.barbell') },
      { id: 'dumbbell', label: t('equipment.dumbbell') },
      { id: 'kettlebell', label: t('equipment.kettlebell') },
      { id: 'machine', label: t('equipment.machine') },
      { id: 'weighted plate', label: t('equipment.plate') },
      { id: 'band', label: t('equipment.resistanceBand') },
      { id: 'other', label: t('equipment.other') },
    ],
    [t]
  );

  const MUSCLE_OPTIONS = useMemo(
    () => [
      { id: 'all', label: t('muscles.all') },
      ...SIMPLIFIED_MUSCLE_GROUPS.map((g) => ({ id: g.id, label: t(g.i18nKey) })),
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
    if (userId) loadCustomExercises(userId);
  }, [userId]);

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
        muscles: selectedMuscle !== 'all' ? expandMuscleFilter(selectedMuscle) : undefined,
        equipment: selectedEquipment !== 'all' ? selectedEquipment : undefined,
      });
      return [
        { title: t('addExercise.resultsFor', { query: debouncedQuery }), data: searchResults },
      ];
    }

    // Get recent exercises
    const recent = getRecentExercises(allExercises);

    // Get all exercises with filters applied
    const allFiltered = filterExercisesClient(allExercises, {
      muscles: selectedMuscle !== 'all' ? expandMuscleFilter(selectedMuscle) : undefined,
      equipment: selectedEquipment !== 'all' ? selectedEquipment : undefined,
    });

    // Deduplication: Recent > Custom > All
    const recentIds = new Set(recent.map((e) => e.id));
    const customFiltered = allFiltered.filter((e) => e.is_custom);
    const customIds = new Set(customFiltered.map((e) => e.id));
    const excludeIds = new Set([...recentIds, ...customIds]);
    const allWithoutRecentAndCustom = allFiltered.filter((e) => !excludeIds.has(e.id));

    const result = [];

    // Only show Recent section if no filters are active
    if (!hasActiveFilters) {
      if (recent.length > 0) {
        result.push({ title: t('addExercise.recent'), data: recent });
      }
    }

    // Show custom exercises section
    if (customFiltered.length > 0) {
      result.push({ title: t('addExercise.customExercises'), data: customFiltered });
    }

    if (allWithoutRecentAndCustom.length > 0 || hasActiveFilters) {
      result.push({
        title: t('addExercise.allExercises'),
        data: hasActiveFilters ? allWithoutRecentAndCustom : allWithoutRecentAndCustom,
      });
    }

    return result;
  }, [
    allExercises,
    debouncedQuery,
    selectedMuscle,
    selectedEquipment,
    getRecentExercises,
    hasActiveFilters,
    t,
  ]);

  // Auto-select and scroll to newly created custom exercise
  useEffect(() => {
    if (lastCreatedExerciseId && isLoaded) {
      setSelectedExercises((prev) =>
        prev.includes(lastCreatedExerciseId) ? prev : [...prev, lastCreatedExerciseId]
      );
      clearLastCreatedExerciseId();
      // Scroll to the custom exercises section after a short delay for layout
      setTimeout(() => {
        const customSectionIndex = sections.findIndex((s) =>
          s.data.some((e) => e.id === lastCreatedExerciseId)
        );
        if (customSectionIndex >= 0 && sectionListRef.current) {
          const itemIndex = sections[customSectionIndex].data.findIndex(
            (e) => e.id === lastCreatedExerciseId
          );
          sectionListRef.current.scrollToLocation({
            sectionIndex: customSectionIndex,
            itemIndex: Math.max(0, itemIndex),
            viewPosition: 0.5,
            animated: true,
          });
        }
      }, 300);
    }
  }, [lastCreatedExerciseId, isLoaded]);

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
    const selected = selectedExercises
      .map((id) => allExercises.find((e) => e.id === id))
      .filter(Boolean) as Exercise[];
    // Track as recent exercises for quick access next time
    addRecentExercises(selected.map((e) => e.id));
    setPendingExercises(
      selected.map((e) => ({
        id: e.id,
        name: e.display_name || formatExerciseDisplayName(e.name, e.equipment),
        muscle: e.muscle_group || 'Unknown',
        gifUrl: e.image_url || '',
        thumbnailUrl: e.thumbnail_url || '',
        is_custom: e.is_custom,
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
    ({ section }: any) => <SectionHeader title={section.title} />,
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
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/create-exercise');
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.createText}>{t('addExercise.create')}</Text>
        </Pressable>
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
              ref={sectionListRef}
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
        icons={MUSCLE_GROUP_ICONS}
        onSelect={setSelectedMuscle}
        onClose={() => setShowMuscleModal(false)}
      />

      {/* Equipment Filter Modal */}
      <FilterModal
        visible={showEquipmentModal}
        title={t('addExercise.selectEquipment')}
        options={EQUIPMENT_OPTIONS}
        selectedId={selectedEquipment}
        icons={EQUIPMENT_ICONS}
        iconSizes={{
          all: 52,
          none: 56,
          barbell: 52,
          dumbbell: 52,
          kettlebell: 52,
          machine: 52,
          'weighted plate': 52,
          band: 52,
          other: 52,
        }}
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
  exerciseMuscleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    marginTop: 2,
  },
  exerciseMuscle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  customBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.textInverse,
    letterSpacing: 0.2,
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
  createText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
});
