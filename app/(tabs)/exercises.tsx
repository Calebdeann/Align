import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { filterExercises, Exercise } from '@/services/api/exercises';
import { ExerciseImage } from '@/components/ExerciseImage';

// Muscle options for filter
const MUSCLE_OPTIONS = [
  'abs',
  'biceps',
  'calves',
  'chest',
  'glutes',
  'hamstrings',
  'lats',
  'lower back',
  'quads',
  'shoulders',
  'traps',
  'triceps',
  'upper back',
];

export default function ExercisesScreen() {
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Filters
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Detail modal
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  // Load exercises from Supabase
  const loadExercises = async (query?: string, muscle?: string | null) => {
    setLoading(true);
    try {
      const data = await filterExercises({
        query: query || undefined,
        muscles: muscle ? [muscle] : undefined,
      });

      console.log(`Loaded ${data.length} exercises from Supabase`);
      setExercises(data);
      setTotalCount(data.length);
    } catch (err) {
      console.error('Load error:', err);
      setExercises([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadExercises();
      return;
    }

    setIsSearching(true);
    setSelectedMuscle(null);
    await loadExercises(searchQuery.trim(), null);
    setIsSearching(false);
  };

  const handleFilterByMuscle = async (muscle: string | null) => {
    setSelectedMuscle(muscle);
    setShowFilters(false);
    setSearchQuery('');
    await loadExercises(undefined, muscle);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedMuscle(null);
    loadExercises();
  };

  const renderExerciseCard = ({ item }: { item: Exercise }) => (
    <Pressable style={styles.exerciseCard} onPress={() => setSelectedExercise(item)}>
      <ExerciseImage
        gifUrl={item.image_url}
        thumbnailUrl={item.thumbnail_url}
        size={60}
        borderRadius={8}
        animated={false}
      />
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.exerciseMuscle} numberOfLines={1}>
          {item.muscle_group}
        </Text>
        <View style={styles.equipmentBadge}>
          <Text style={styles.equipmentText}>{item.equipment?.[0] || 'bodyweight'}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </Pressable>
  );

  if (loading && exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exercises</Text>
        <Text style={styles.headerSubtitle}>{totalCount.toLocaleString()} exercises available</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {(searchQuery || selectedMuscle) && (
            <Pressable onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.filterButton, selectedMuscle && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={selectedMuscle ? colors.textInverse : colors.text}
          />
        </Pressable>
      </View>

      {/* Active Filter */}
      {selectedMuscle && (
        <View style={styles.activeFilter}>
          <Text style={styles.activeFilterLabel}>Filtered by:</Text>
          <View style={styles.activeFilterChip}>
            <Text style={styles.activeFilterText}>{selectedMuscle}</Text>
            <Pressable onPress={() => handleFilterByMuscle(null)}>
              <Ionicons name="close" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Exercise List */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No exercises found</Text>
              <Pressable onPress={clearSearch}>
                <Text style={styles.emptyAction}>Clear filters</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Muscle</Text>
            <Pressable onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.muscleList}>
            <Pressable
              style={[styles.muscleItem, !selectedMuscle && styles.muscleItemActive]}
              onPress={() => handleFilterByMuscle(null)}
            >
              <Text style={[styles.muscleText, !selectedMuscle && styles.muscleTextActive]}>
                All Muscles
              </Text>
              {!selectedMuscle && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </Pressable>
            {MUSCLE_OPTIONS.map((muscle) => (
              <Pressable
                key={muscle}
                style={[styles.muscleItem, selectedMuscle === muscle && styles.muscleItemActive]}
                onPress={() => handleFilterByMuscle(muscle)}
              >
                <Text
                  style={[styles.muscleText, selectedMuscle === muscle && styles.muscleTextActive]}
                >
                  {muscle}
                </Text>
                {selectedMuscle === muscle && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Exercise Detail Modal */}
      <Modal
        visible={!!selectedExercise}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedExercise(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedExercise && (
            <>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setSelectedExercise(null)}>
                  <Ionicons name="close" size={28} color={colors.text} />
                </Pressable>
                <Text style={styles.modalTitleSmall} numberOfLines={1}>
                  {selectedExercise.name}
                </Text>
                <View style={{ width: 28 }} />
              </View>

              <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
                {/* GIF - animated in detail view */}
                <View style={styles.detailGifContainer}>
                  <ExerciseImage
                    gifUrl={selectedExercise.image_url}
                    size={280}
                    borderRadius={12}
                    animated={true}
                  />
                </View>

                {/* Exercise Name */}
                <Text style={styles.detailName}>{selectedExercise.name}</Text>

                {/* Tags */}
                <View style={styles.tagSection}>
                  {selectedExercise.muscle_group && (
                    <View style={[styles.tag, styles.tagMuscle]}>
                      <Text style={styles.tagTextGreen}>{selectedExercise.muscle_group}</Text>
                    </View>
                  )}
                  {selectedExercise.equipment?.map((eq, i) => (
                    <View key={`e-${i}`} style={[styles.tag, styles.tagEquip]}>
                      <Text style={styles.tagTextOrange}>{eq}</Text>
                    </View>
                  ))}
                </View>

                {/* Instructions */}
                {selectedExercise.instructions && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Instructions</Text>
                    <Text style={styles.instructionText}>{selectedExercise.instructions}</Text>
                  </View>
                )}

                {/* Add to Workout Button */}
                <Pressable style={styles.addButton}>
                  <Ionicons name="add" size={24} color={colors.textInverse} />
                  <Text style={styles.addButtonText}>Add to Workout</Text>
                </Pressable>

                <View style={{ height: 40 }} />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Search
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },

  // Active Filter
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  activeFilterLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  activeFilterText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    textTransform: 'capitalize',
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  exerciseImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  exerciseName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  equipmentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  equipmentText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primary,
    textTransform: 'capitalize',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  emptyAction: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
    marginTop: spacing.sm,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  modalTitleSmall: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    textTransform: 'capitalize',
  },

  // Muscle List
  muscleList: {
    flex: 1,
  },
  muscleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  muscleItemActive: {
    backgroundColor: colors.primary + '10',
  },
  muscleText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    textTransform: 'capitalize',
  },
  muscleTextActive: {
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },

  // Detail Modal
  detailContent: {
    flex: 1,
  },
  detailGifContainer: {
    backgroundColor: '#FFFFFF',
    height: 280,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailGif: {
    width: '100%',
    height: '100%',
  },
  detailName: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    textTransform: 'capitalize',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  tagSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagMuscle: {
    backgroundColor: '#E8F5E9',
  },
  tagBody: {
    backgroundColor: '#E3F2FD',
  },
  tagEquip: {
    backgroundColor: '#FFF3E0',
  },
  tagTextGreen: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: '#2E7D32',
    textTransform: 'capitalize',
  },
  tagTextBlue: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: '#1976D2',
    textTransform: 'capitalize',
  },
  tagTextOrange: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: '#E65100',
    textTransform: 'capitalize',
  },
  detailSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  detailSectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailSectionText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  instructionNumberText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textInverse,
  },
  instructionText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 16,
    gap: spacing.xs,
  },
  addButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.textInverse,
  },
});
