import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  Modal,
  Animated,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useTemplateStore, TemplateExercise } from '@/stores/templateStore';
import { getWeightUnit, fromKgForDisplay } from '@/utils/units';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { WorkoutImage } from '@/stores/workoutStore';
import { ExerciseImage } from '@/components/ExerciseImage';
import { toTitleCase } from '@/utils/textFormatters';
import { getCurrentUser } from '@/services/api/user';
import { getTemplateImageById } from '@/constants/templateImages';
import { consumePendingTemplateImage } from '@/lib/imagePickerState';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Colour options (matching save-template)
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

// Icons
function ImagePlaceholderIcon() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect
          x={3}
          y={3}
          width={18}
          height={18}
          rx={2}
          stroke={colors.textTertiary}
          strokeWidth={1.5}
        />
        <Path
          d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
          stroke={colors.textTertiary}
          strokeWidth={1.5}
        />
        <Path
          d="M21 15l-5-5L5 21"
          stroke={colors.textTertiary}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          bottom: -4,
          right: -4,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </View>
    </View>
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

// Exercise row component with expandable sets
function ExerciseRow({
  exercise,
  isExpanded,
  onToggle,
  weightLabel,
  units,
}: {
  exercise: TemplateExercise;
  isExpanded: boolean;
  onToggle: () => void;
  weightLabel: string;
  units: string;
}) {
  const formatWeight = (weightKg?: number) => {
    if (weightKg == null) return '-';
    const display = units === 'imperial' ? fromKgForDisplay(weightKg, 'imperial') : weightKg;
    return `${Math.round(display)}`;
  };

  return (
    <View>
      <Pressable style={styles.exerciseRow} onPress={onToggle}>
        <ExerciseImage
          gifUrl={exercise.gifUrl}
          thumbnailUrl={exercise.thumbnailUrl}
          size={40}
          borderRadius={8}
        />
        <Text style={styles.exerciseName}>{toTitleCase(exercise.exerciseName)}</Text>
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
            <Text style={[styles.setHeaderText, styles.weightRepsColumn]}>WEIGHT & REPS</Text>
          </View>

          {/* Sets Rows */}
          {exercise.sets.map((set) => (
            <View key={set.setNumber} style={styles.setRow}>
              <Text style={[styles.setText, styles.setColumn]}>{set.setNumber}</Text>
              <Text style={[styles.setText, styles.weightRepsColumn]}>
                {set.targetWeight && set.targetReps
                  ? `${formatWeight(set.targetWeight)} ${weightLabel} × ${set.targetReps} reps`
                  : set.targetWeight
                    ? `${formatWeight(set.targetWeight)} ${weightLabel} × - reps`
                    : set.targetReps
                      ? `- × ${set.targetReps} reps`
                      : '- × -'}
              </Text>
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
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const isTemplateSaved = useTemplateStore((state) => state.isTemplateSaved);

  const units = useUserPreferencesStore((s) => s.getUnitSystem());
  const weightLabel = getWeightUnit(units).toLowerCase();

  const template = templateId ? getTemplateById(templateId) : null;
  const isSaved = templateId ? isTemplateSaved(templateId, userId) : false;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColourId, setEditColourId] = useState('purple');
  const [editImage, setEditImage] = useState<{
    type: 'template' | 'camera' | 'gallery';
    uri: string;
    localSource?: ImageSourcePropType;
    templateImageId?: string;
  } | null>(null);

  // Track which exercises are expanded
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  // Colour modal state
  const [showColourModal, setShowColourModal] = useState(false);
  const colourSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Image picker modal state
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const imageSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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

  // Pick up template image selection when returning from template-images screen
  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingTemplateImage();
      if (pending) {
        setEditImage({
          type: 'template',
          uri: '',
          localSource: pending.source,
          templateImageId: pending.id,
        });
      }
    }, [])
  );

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

  const enterEditMode = () => {
    setEditName(template.name);
    setEditDescription(template.description || '');

    // Find matching colour
    const matchingColour = WORKOUT_COLOURS.find((c) => c.color === template.tagColor);
    setEditColourId(matchingColour?.id || 'purple');

    // Load existing image
    if (template.image) {
      const localSource =
        template.image.type === 'template' && template.image.templateId
          ? (getTemplateImageById(template.image.templateId) ?? undefined)
          : undefined;
      setEditImage({
        type: template.image.type,
        uri: template.image.uri,
        localSource,
        templateImageId: template.image.templateId,
      });
    } else if (template.localImage) {
      setEditImage({
        type: 'template',
        uri: '',
        localSource: template.localImage,
      });
    } else {
      setEditImage(null);
    }

    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Missing Name', 'Please enter a template name');
      return;
    }

    const tagColor = getSelectedColour();

    // Build image data
    const imageData: { image?: WorkoutImage; localImage?: ImageSourcePropType } = {};
    if (editImage) {
      if (editImage.type === 'template' && editImage.localSource) {
        imageData.localImage = editImage.localSource;
        imageData.image = {
          type: 'template',
          uri: '',
          templateId: editImage.templateImageId,
        };
      } else {
        imageData.image = {
          type: editImage.type,
          uri: editImage.uri,
        };
      }
    }

    updateTemplate(template.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      tagColor,
      ...imageData,
    });

    setIsEditing(false);
  };

  const handleEditExercises = () => {
    router.push({
      pathname: '/create-template',
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

  // Colour helpers
  const getSelectedColour = () => {
    const colour = WORKOUT_COLOURS.find((c) => c.id === editColourId);
    return colour?.color || colors.primary;
  };

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
    setEditColourId(colourId);
    closeColourModal();
  };

  // Image picker helpers
  const openImagePickerModal = () => {
    setShowImagePickerModal(true);
    Animated.spring(imageSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeImagePickerModal = () => {
    Animated.timing(imageSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowImagePickerModal(false));
  };

  const handleTakePhoto = async () => {
    closeImagePickerModal();
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setEditImage({
        type: 'camera',
        uri: result.assets[0].uri,
      });
    }
  };

  const handleChooseFromLibrary = async () => {
    closeImagePickerModal();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow photo library access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setEditImage({
        type: 'gallery',
        uri: result.assets[0].uri,
      });
    }
  };

  const handleOpenTemplates = () => {
    closeImagePickerModal();
    router.push('/template-images');
  };

  // Rendering helpers
  const renderTemplateImage = () => {
    if (isEditing) {
      // Edit mode — show editable image with picker
      return (
        <Pressable
          style={[styles.imagePlaceholder, editImage && styles.imagePlaceholderFilled]}
          onPress={openImagePickerModal}
        >
          {editImage ? (
            editImage.localSource ? (
              <Image source={editImage.localSource} style={styles.selectedImage} />
            ) : (
              <Image source={{ uri: editImage.uri }} style={styles.selectedImage} />
            )
          ) : (
            <ImagePlaceholderIcon />
          )}
        </Pressable>
      );
    }

    // View mode
    if (template.localImage) {
      return <Image source={template.localImage} style={styles.templateImage} />;
    }
    if (template.image?.uri) {
      return <Image source={{ uri: template.image.uri }} style={styles.templateImage} />;
    }
    return (
      <View style={[styles.templateImage, styles.templateImagePlaceholder]}>
        <Ionicons name="barbell-outline" size={32} color={colors.textSecondary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {isEditing ? (
          <>
            <Pressable onPress={handleCancelEdit} style={styles.backButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Edit Template</Text>
            <Pressable onPress={handleSaveEdit} style={styles.backButton}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Workout</Text>
            {!template.isPreset ? (
              <Pressable onPress={enterEditMode} style={styles.backButton}>
                <Ionicons name="pencil-outline" size={22} color={colors.text} />
              </Pressable>
            ) : (
              <View style={styles.backButton} />
            )}
          </>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Template Card */}
        {isEditing ? (
          <View style={styles.editCard}>
            {/* Photo + Name + Description row */}
            <View style={styles.editInfoRow}>
              <View style={styles.templateImageContainer}>{renderTemplateImage()}</View>
              <View style={styles.editTextInputs}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Template Name"
                  placeholderTextColor={colors.textTertiary}
                  value={editName}
                  onChangeText={setEditName}
                />
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Description (Optional)"
                  placeholderTextColor={colors.textTertiary}
                  value={editDescription}
                  onChangeText={setEditDescription}
                />
              </View>
            </View>

            <View style={styles.editDivider} />

            {/* Colour */}
            <Pressable style={styles.colourRow} onPress={openColourModal}>
              <Text style={styles.colourLabel}>Colour</Text>
              <View style={styles.colourRight}>
                <View style={[styles.colourCircle, { backgroundColor: getSelectedColour() }]} />
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={styles.templateCard}>
            <View style={styles.templateImageContainer}>{renderTemplateImage()}</View>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{template.name}</Text>
              {template.description && (
                <Text style={styles.templateDescription}>{template.description}</Text>
              )}
            </View>
          </View>
        )}

        {/* Add to Library Button (presets only) */}
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

        {/* Start Workout Button (user templates, view mode only) */}
        {!template.isPreset && !isEditing && (
          <Pressable style={styles.startWorkoutButton} onPress={handleStartWorkout}>
            <Text style={styles.startWorkoutText}>Start Workout</Text>
          </Pressable>
        )}

        {/* Edit Exercises Button (edit mode only) */}
        {isEditing && (
          <Pressable style={styles.editExercisesButton} onPress={handleEditExercises}>
            <Ionicons name="barbell-outline" size={20} color="#FFFFFF" />
            <Text style={styles.editExercisesText}>Edit Exercises</Text>
          </Pressable>
        )}

        {/* Exercises Section */}
        <Text style={styles.sectionTitle}>Exercises</Text>
        <View style={styles.exercisesCard}>
          {template.exercises.map((exercise, index) => (
            <View key={exercise.id}>
              <ExerciseRow
                exercise={exercise}
                isExpanded={expandedExercises.has(exercise.id)}
                onToggle={() => toggleExercise(exercise.id)}
                weightLabel={weightLabel}
                units={units}
              />
              {index < template.exercises.length - 1 && <View style={styles.exerciseDivider} />}
            </View>
          ))}
        </View>

        {/* Delete Template (user templates only) */}
        {!template.isPreset && (
          <Pressable onPress={handleDeleteTemplate} style={styles.deleteTextButton}>
            <Text style={styles.deleteText}>Delete Template</Text>
          </Pressable>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
                        editColourId === colour.id && styles.colourOptionSelected,
                      ]}
                      onPress={() => selectColour(colour.id)}
                    >
                      <View style={[styles.colourCircleLarge, { backgroundColor: colour.color }]}>
                        {editColourId === colour.id && (
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

      {/* Image Picker Bottom Sheet Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent
        animationType="none"
        onRequestClose={closeImagePickerModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeImagePickerModal}>
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY: imageSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Pressable style={styles.modalCloseButton} onPress={closeImagePickerModal}>
                  <CloseIcon />
                </Pressable>
                <Text style={styles.modalTitle}>Add Photo</Text>
                <View style={styles.modalCloseButton} />
              </View>

              <View style={styles.imagePickerOptions}>
                <Pressable style={styles.imagePickerRow} onPress={handleChooseFromLibrary}>
                  <Ionicons name="image-outline" size={22} color={colors.text} />
                  <Text style={styles.imagePickerLabel}>Choose from Library</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>

                <View style={styles.editDivider} />

                <Pressable style={styles.imagePickerRow} onPress={handleTakePhoto}>
                  <Ionicons name="camera-outline" size={22} color={colors.text} />
                  <Text style={styles.imagePickerLabel}>Take Photo</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>

                <View style={styles.editDivider} />

                <Pressable style={styles.imagePickerRow} onPress={handleOpenTemplates}>
                  <Ionicons name="grid-outline" size={22} color={colors.text} />
                  <Text style={styles.imagePickerLabel}>Templates</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
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
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  saveText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
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
  // View mode template card
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
  // Edit mode card
  editCard: {
    ...cardStyle,
    marginBottom: spacing.md,
  },
  editInfoRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  editTextInputs: {
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
  editDivider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
    marginHorizontal: spacing.sm,
  },
  colourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  colourLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  colourRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  colourCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  // Buttons
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
  editExercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  editExercisesText: {
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
  exercisesCard: {
    ...cardStyle,
    marginBottom: spacing.md,
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
  deleteTextButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  deleteText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.error,
  },
  bottomSpacer: {
    height: 40,
  },
  // Modal styles
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
  imagePickerOptions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  imagePickerLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
