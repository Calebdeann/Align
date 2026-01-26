import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import {
  useTemplateStore,
  formatTemplateDuration,
  getTemplateTotalSets,
  TemplateExercise,
} from '@/stores/templateStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { ExerciseImage } from '@/components/ExerciseImage';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Tag component
function TagPill({ label }: { label: string }) {
  return (
    <View style={styles.tagPill}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

// Information row component
function InfoRow({
  icon,
  label,
  value,
  showChevron = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  showChevron?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        {icon}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={styles.infoRight}>
        <Text style={styles.infoValue}>{value}</Text>
        {showChevron && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
      </View>
    </View>
  );
}

// Exercise row component with expandable sets
function ExerciseRow({
  exercise,
  isExpanded,
  onToggle,
}: {
  exercise: TemplateExercise;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View>
      <Pressable style={styles.exerciseRow} onPress={onToggle}>
        <ExerciseImage
          gifUrl={exercise.gifUrl}
          thumbnailUrl={exercise.thumbnailUrl}
          size={40}
          borderRadius={8}
        />
        <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-down' : 'chevron-forward'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {/* Expanded Sets Details */}
      {isExpanded && (
        <View style={styles.setsContainer}>
          {/* Sets Header */}
          <View style={styles.setsHeader}>
            <Text style={[styles.setHeaderText, styles.setColumn]}>SET</Text>
            <Text style={[styles.setHeaderText, styles.weightColumn]}>KG</Text>
            <Text style={[styles.setHeaderText, styles.repsColumn]}>REPS</Text>
          </View>

          {/* Sets Rows */}
          {exercise.sets.map((set) => (
            <View key={set.setNumber} style={styles.setRow}>
              <Text style={[styles.setText, styles.setColumn]}>{set.setNumber}</Text>
              <Text style={[styles.setText, styles.weightColumn]}>{set.targetWeight ?? '-'}</Text>
              <Text style={[styles.setText, styles.repsColumn]}>{set.targetReps ?? '-'}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function TemplateDetailScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();

  const userId = useUserProfileStore((state) => state.userId);
  const getTemplateById = useTemplateStore((state) => state.getTemplateById);
  const addTemplate = useTemplateStore((state) => state.addTemplate);
  const removeTemplate = useTemplateStore((state) => state.removeTemplate);
  const isTemplateSaved = useTemplateStore((state) => state.isTemplateSaved);

  const template = templateId ? getTemplateById(templateId) : null;
  const isSaved = templateId ? isTemplateSaved(templateId, userId) : false;

  // Track which exercises are expanded
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  const toggleExercise = (exerciseId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  if (!template) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Workout</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Template not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToLibrary = () => {
    if (!isSaved && template) {
      addTemplate(template);
    }
  };

  const handleStartWorkout = () => {
    router.push({
      pathname: '/active-workout',
      params: { templateId: template.id },
    });
  };

  const handleDeleteTemplate = () => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeTemplate(template.id);
            router.back();
          },
        },
      ]
    );
  };

  const totalSets = getTemplateTotalSets(template);
  const formattedDuration = formatTemplateDuration(template.estimatedDuration);

  // Map tag IDs to display names
  const getTagDisplayName = (tagId: string): string => {
    const tagMap: Record<string, string> = {
      legs: 'Legs',
      arms: 'Arms',
      back: 'Back',
      chest: 'Chest',
      shoulders: 'Shoulders',
      core: 'Core',
      cardio: 'Cardio',
      fullBody: 'Full Body',
      glutes: 'Glutes',
    };
    return tagMap[tagId] || tagId.charAt(0).toUpperCase() + tagId.slice(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Workout</Text>
        {!template.isPreset ? (
          <Pressable onPress={handleDeleteTemplate} style={styles.backButton}>
            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Template Card */}
        <View style={styles.templateCard}>
          <View style={styles.templateImageContainer}>
            {template.localImage ? (
              <Image source={template.localImage} style={styles.templateImage} />
            ) : template.image?.uri ? (
              <Image source={{ uri: template.image.uri }} style={styles.templateImage} />
            ) : (
              <View style={[styles.templateImage, styles.templateImagePlaceholder]}>
                <Ionicons name="barbell-outline" size={32} color={colors.textSecondary} />
              </View>
            )}
          </View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{template.name}</Text>
            {template.description && (
              <Text style={styles.templateDescription}>{template.description}</Text>
            )}
          </View>
        </View>

        {/* Tags Row */}
        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>Tags</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScroll}
            contentContainerStyle={styles.tagsContainer}
          >
            {template.tagIds.map((tagId) => (
              <TagPill key={tagId} label={getTagDisplayName(tagId)} />
            ))}
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </ScrollView>
        </View>

        {/* Add to Library Button */}
        {template.isPreset && (
          <Pressable
            style={[styles.addToLibraryButton, isSaved && styles.addToLibraryButtonSaved]}
            onPress={handleAddToLibrary}
            disabled={isSaved}
          >
            <Text style={[styles.addToLibraryText, isSaved && styles.addToLibraryTextSaved]}>
              {isSaved ? 'Saved to your Library' : 'Add to your Library'}
            </Text>
          </Pressable>
        )}

        {/* Start Workout Button (for user templates) */}
        {!template.isPreset && (
          <Pressable style={styles.startWorkoutButton} onPress={handleStartWorkout}>
            <Text style={styles.startWorkoutText}>Start Workout</Text>
          </Pressable>
        )}

        {/* Information Section */}
        <Text style={styles.sectionTitle}>Information</Text>
        <View style={styles.infoCard}>
          <InfoRow
            icon={<Ionicons name="time-outline" size={20} color={colors.text} />}
            label="Estimate Duration"
            value={formattedDuration}
            showChevron
          />
          <View style={styles.infoDivider} />
          <InfoRow
            icon={<Ionicons name="fitness-outline" size={20} color={colors.text} />}
            label="Difficulty"
            value={template.difficulty}
          />
          <View style={styles.infoDivider} />
          <InfoRow
            icon={<Ionicons name="barbell-outline" size={20} color={colors.text} />}
            label="Equipment"
            value={template.equipment}
          />
          <View style={styles.infoDivider} />
          <InfoRow
            icon={<Ionicons name="grid-outline" size={20} color={colors.text} />}
            label="Exercises"
            value={template.exercises.length.toString()}
          />
        </View>

        {/* Exercises Section */}
        <Text style={styles.sectionTitle}>Exercises</Text>
        <View style={styles.exercisesCard}>
          {template.exercises.map((exercise, index) => (
            <View key={exercise.id}>
              <ExerciseRow
                exercise={exercise}
                isExpanded={expandedExercises.has(exercise.id)}
                onToggle={() => toggleExercise(exercise.id)}
              />
              {index < template.exercises.length - 1 && <View style={styles.exerciseDivider} />}
            </View>
          ))}
        </View>

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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    ...cardStyle,
    marginBottom: spacing.md,
  },
  templateImageContainer: {
    marginRight: spacing.md,
  },
  templateImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  templateImagePlaceholder: {
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tagsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tagsLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    marginRight: spacing.md,
  },
  tagsScroll: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tagPill: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  addToLibraryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addToLibraryButtonSaved: {
    backgroundColor: colors.card,
  },
  addToLibraryText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
  addToLibraryTextSaved: {
    color: colors.textSecondary,
  },
  startWorkoutButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  startWorkoutText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  infoCard: {
    ...cardStyle,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  infoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoValue: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
    marginHorizontal: spacing.md,
  },
  exercisesCard: {
    ...cardStyle,
    marginBottom: spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  exerciseImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  exerciseDivider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
    marginHorizontal: spacing.md,
  },
  // Sets display styles
  setsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 217, 217, 0.25)',
  },
  setHeaderText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  setColumn: {
    flex: 1,
    textAlign: 'center',
  },
  weightColumn: {
    flex: 1,
    textAlign: 'center',
  },
  repsColumn: {
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  setText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});
