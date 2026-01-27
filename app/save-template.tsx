import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useTemplateStore, TemplateExercise } from '@/stores/templateStore';
import { WorkoutImage } from '@/stores/workoutStore';
import { getCurrentUser } from '@/services/api/user';
import { ExerciseImage } from '@/components/ExerciseImage';
import {
  ImagePickerSheet,
  ImagePlaceholderIcon,
  SelectedImageData,
} from '@/components/ImagePickerSheet';
import { consumePendingTemplateImage } from '@/lib/imagePickerState';
import { formatExerciseNameString } from '@/utils/textFormatters';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { getWeightUnit, fromKgForDisplay } from '@/utils/units';
import { getTemplateImageById } from '@/constants/templateImages';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Colour options (matching schedule-workout)
const WORKOUT_COLOURS = [
  { id: 'purple', color: colors.primary },
  { id: 'green', color: colors.workout.back },
  { id: 'blue', color: colors.workout.chest },
  { id: 'orange', color: colors.workout.arms },
  { id: 'pink', color: colors.workout.legs },
  { id: 'teal', color: colors.workout.cardio },
  { id: 'yellow', color: colors.workout.shoulders },
  { id: 'red', color: colors.workout.core },
];

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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

function Divider() {
  return <View style={styles.divider} />;
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SaveTemplateScreen() {
  const params = useLocalSearchParams<{
    exercises?: string;
    templateId?: string;
    folderId?: string;
  }>();

  const isEditMode = !!params.templateId;

  const units = useUserPreferencesStore((s) => s.getUnitSystem());
  const weightLabel = getWeightUnit(units).toLowerCase();

  const getTemplateById = useTemplateStore((state) => state.getTemplateById);
  const createTemplate = useTemplateStore((state) => state.createTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);

  // Parse exercises from params
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColourId, setSelectedColourId] = useState('purple');
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

  // Image state
  const [selectedImage, setSelectedImage] = useState<SelectedImageData | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Colour modal state
  const [showColourModal, setShowColourModal] = useState(false);
  const colourSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Load exercise data and existing template data
  useEffect(() => {
    // Parse exercises from route params
    if (params.exercises) {
      try {
        const parsed = JSON.parse(params.exercises);
        setExercises(parsed);
      } catch {
        console.warn('Failed to parse exercises from params');
      }
    }

    // If editing, load existing template data
    if (params.templateId) {
      const existing = getTemplateById(params.templateId);
      if (existing) {
        setName(existing.name);
        setDescription(existing.description || '');

        // Find matching colour from tagColor
        const matchingColour = WORKOUT_COLOURS.find((c) => c.color === existing.tagColor);
        if (matchingColour) {
          setSelectedColourId(matchingColour.id);
        }

        // Use exercises from params (may have been edited) or fall back to template exercises
        if (!params.exercises) {
          setExercises(existing.exercises);
        }

        // Load existing image
        if (existing.image) {
          const localSource =
            existing.image.type === 'template' && existing.image.templateId
              ? (getTemplateImageById(existing.image.templateId) ?? undefined)
              : undefined;
          setSelectedImage({
            type: existing.image.type,
            uri: existing.image.uri,
            localSource,
            templateImageId: existing.image.templateId,
          });
        } else if (existing.localImage) {
          setSelectedImage({
            type: 'template',
            uri: '',
            localSource: existing.localImage,
          });
        }
      }
    }
  }, [params.templateId, params.exercises]);

  // Pick up template image selection when returning from template-images screen
  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingTemplateImage();
      if (pending) {
        setSelectedImage({
          type: 'template',
          uri: '',
          localSource: pending.source,
          templateImageId: pending.id,
        });
      }
    }, [])
  );

  // Colour modal functions
  const openColourModal = () => {
    setShowColourModal(true);
    Animated.spring(colourSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeColourModal = () => {
    Animated.timing(colourSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowColourModal(false));
  };

  const selectColour = (colourId: string) => {
    setSelectedColourId(colourId);
    closeColourModal();
  };

  const getSelectedColour = () => {
    const colour = WORKOUT_COLOURS.find((c) => c.id === selectedColourId);
    return colour?.color || colors.primary;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a template name');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise');
      return;
    }

    const user = await getCurrentUser();

    const tagColor = getSelectedColour();

    // Build image data for save
    const imageData: { image?: WorkoutImage; localImage?: ImageSourcePropType } = {};
    if (selectedImage) {
      if (selectedImage.type === 'template' && selectedImage.localSource) {
        imageData.localImage = selectedImage.localSource;
        imageData.image = {
          type: 'template',
          uri: '',
          templateId: selectedImage.templateImageId,
        };
      } else {
        imageData.image = {
          type: selectedImage.type,
          uri: selectedImage.uri,
        };
      }
    }

    const templateData = {
      name: name.trim(),
      description: description.trim() || undefined,
      tagIds: [] as string[],
      tagColor,
      estimatedDuration: 60,
      difficulty: 'Beginner' as const,
      equipment: 'Gym',
      exercises,
      userId: user?.id,
      folderId: params.folderId || undefined,
      ...imageData,
    };

    if (isEditMode && params.templateId) {
      updateTemplate(params.templateId, templateData);
    } else {
      createTemplate(templateData);
    }

    // Go back past both save-template and create-template screens
    if (router.canGoBack()) {
      router.dismiss(2);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Save Template</Text>
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>SAVE</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Template Info Card */}
        <View style={styles.card}>
          {/* Photo + Name + Description row */}
          <View style={styles.infoRow}>
            <Pressable
              style={[styles.imagePlaceholder, selectedImage && styles.imagePlaceholderFilled]}
              onPress={() => setShowImagePicker(true)}
            >
              {selectedImage ? (
                selectedImage.localSource ? (
                  <Image source={selectedImage.localSource} style={styles.selectedImage} />
                ) : (
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                )
              ) : (
                <ImagePlaceholderIcon />
              )}
            </Pressable>
            <View style={styles.textInputs}>
              <TextInput
                style={styles.nameInput}
                placeholder="Template Name"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.descriptionInput}
                placeholder="Description (Optional)"
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          <Divider />

          {/* Colour */}
          <Pressable style={styles.menuRow} onPress={openColourModal}>
            <Text style={styles.menuLabel}>Colour</Text>
            <View style={styles.menuRight}>
              <View style={[styles.colourCircle, { backgroundColor: getSelectedColour() }]} />
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </Pressable>
        </View>

        {/* Exercises */}
        <Text style={styles.sectionHeader}>Exercises</Text>
        <View style={styles.card}>
          {exercises.map((exercise, index) => {
            const isExpanded = expandedExercises.has(exercise.id);
            return (
              <View key={exercise.id}>
                <Pressable style={styles.exerciseRow} onPress={() => toggleExercise(exercise.id)}>
                  <ExerciseImage
                    gifUrl={exercise.gifUrl}
                    thumbnailUrl={exercise.thumbnailUrl}
                    size={40}
                    borderRadius={8}
                  />
                  <Text style={styles.exerciseName}>
                    {formatExerciseNameString(exercise.exerciseName)}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {isExpanded && (
                  <View style={styles.setsContainer}>
                    <View style={styles.setsHeader}>
                      <Text style={[styles.setHeaderText, styles.setColumn]}>SET</Text>
                      <Text style={[styles.setHeaderText, styles.weightRepsColumn]}>
                        WEIGHT & REPS
                      </Text>
                    </View>
                    {exercise.sets.map((set) => (
                      <View key={set.setNumber} style={styles.setRow}>
                        <Text style={[styles.setText, styles.setColumn]}>{set.setNumber}</Text>
                        <Text style={[styles.setText, styles.weightRepsColumn]}>
                          {set.targetWeight && set.targetReps
                            ? `${fromKgForDisplay(set.targetWeight, units)} ${weightLabel} × ${set.targetReps} reps`
                            : set.targetWeight
                              ? `${fromKgForDisplay(set.targetWeight, units)} ${weightLabel} × - reps`
                              : set.targetReps
                                ? `- × ${set.targetReps} reps`
                                : '- × -'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {index < exercises.length - 1 && <Divider />}
              </View>
            );
          })}

          {exercises.length === 0 && (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyText}>No exercises added</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Image Picker Bottom Sheet */}
      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={(image) => setSelectedImage(image)}
      />

      {/* Colour Bottom Sheet Modal */}
      <Modal
        visible={showColourModal}
        transparent
        animationType="none"
        onRequestClose={closeColourModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeColourModal}>
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY: colourSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Pressable style={styles.modalCloseButton} onPress={closeColourModal}>
                  <CloseIcon />
                </Pressable>
                <Text style={styles.modalTitle}>Colour</Text>
                <View style={styles.modalCloseButton} />
              </View>

              <View style={styles.colourContainer}>
                <View style={styles.colourGrid}>
                  {WORKOUT_COLOURS.map((colour) => (
                    <Pressable
                      key={colour.id}
                      style={[
                        styles.colourOption,
                        selectedColourId === colour.id && styles.colourOptionSelected,
                      ]}
                      onPress={() => selectColour(colour.id)}
                    >
                      <View style={[styles.colourCircleLarge, { backgroundColor: colour.color }]}>
                        {selectedColourId === colour.id && (
                          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
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
  saveButton: {
    padding: spacing.xs,
  },
  saveText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    ...cardStyle,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePlaceholderFilled: {
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderWidth: 0,
  },
  selectedImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  textInputs: {
    flex: 1,
    justifyContent: 'center',
  },
  nameInput: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  descriptionInput: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingVertical: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
    marginHorizontal: spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  menuLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  colourCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sectionHeader: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  exerciseName: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
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
  weightRepsColumn: {
    flex: 3,
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
  emptyExercises: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: 40,
  },

  // Colour modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  colourContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  colourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  colourOption: {
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colourOptionSelected: {
    borderColor: colors.text,
  },
  colourCircleLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
