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
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useTemplateStore, TemplateExercise } from '@/stores/templateStore';
import { getWeightUnit, fromKgForDisplay } from '@/utils/units';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useWorkoutStore, WorkoutImage } from '@/stores/workoutStore';
import { ExerciseImage } from '@/components/ExerciseImage';
import { prefetchExerciseGif } from '@/stores/exerciseStore';
import { formatExerciseNameString } from '@/utils/textFormatters';
import { getTemplateImageById } from '@/constants/templateImages';
import { consumePendingTemplateImage } from '@/lib/imagePickerState';
import {
  ImagePickerSheet,
  ImagePlaceholderIcon,
  SelectedImageData,
} from '@/components/ImagePickerSheet';
import { useNavigationLock } from '@/hooks/useNavigationLock';

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
  withLock,
}: {
  exercise: TemplateExercise;
  isExpanded: boolean;
  onToggle: () => void;
  weightLabel: string;
  units: string;
  withLock: (callback: () => void) => void;
}) {
  const { t } = useTranslation();
  const formatWeight = (weightKg?: number) => {
    if (weightKg == null) return '-';
    const display = units === 'imperial' ? fromKgForDisplay(weightKg, 'imperial') : weightKg;
    return `${Math.round(display)}`;
  };

  return (
    <View>
      <Pressable
        style={styles.exerciseRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
      >
        <Pressable
          onPress={() => {
            withLock(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              prefetchExerciseGif(exercise.exerciseId);
              router.push(`/exercise/${exercise.exerciseId}`);
            });
          }}
        >
          <ExerciseImage
            gifUrl={exercise.gifUrl}
            thumbnailUrl={exercise.thumbnailUrl}
            size={40}
            borderRadius={8}
          />
        </Pressable>
        <View style={{ flex: 1, justifyContent: 'center' }} pointerEvents="box-none">
          <Text
            style={[styles.exerciseName, { alignSelf: 'flex-start' }]}
            onPress={() => {
              withLock(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                prefetchExerciseGif(exercise.exerciseId);
                router.push(`/exercise/${exercise.exerciseId}`);
              });
            }}
          >
            {formatExerciseNameString(exercise.exerciseName)}
          </Text>
        </View>
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
            <Text style={[styles.setHeaderText, styles.setColumn]}>{t('template.set')}</Text>
            <Text style={styles.setHeaderText}>{t('template.weightAndReps')}</Text>
          </View>

          {/* Sets Rows */}
          {exercise.sets.map((set) => (
            <View key={set.setNumber} style={styles.setRow}>
              <Text style={[styles.setNumber, styles.setColumn]}>{set.setNumber}</Text>
              <Text style={styles.setText}>
                {set.targetWeight && set.targetReps
                  ? `${formatWeight(set.targetWeight)} ${weightLabel} x ${set.targetReps} reps`
                  : set.targetWeight
                    ? `${formatWeight(set.targetWeight)} ${weightLabel} x - reps`
                    : set.targetReps
                      ? `- x ${set.targetReps} reps`
                      : '- x -'}
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
  const { t } = useTranslation();

  const { isNavigating, withLock } = useNavigationLock();
  const userId = useUserProfileStore((state) => state.userId);
  const getTemplateById = useTemplateStore((state) => state.getTemplateById);
  const addTemplate = useTemplateStore((state) => state.addTemplate);
  const removeTemplate = useTemplateStore((state) => state.removeTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const isTemplateSaved = useTemplateStore((state) => state.isTemplateSaved);
  const getScheduledWorkoutsForTemplate = useWorkoutStore(
    (state) => state.getScheduledWorkoutsForTemplate
  );
  const detachScheduledWorkoutsFromTemplate = useWorkoutStore(
    (state) => state.detachScheduledWorkoutsFromTemplate
  );
  const removeScheduledWorkoutsForTemplate = useWorkoutStore(
    (state) => state.removeScheduledWorkoutsForTemplate
  );

  const units = useUserPreferencesStore((s) => s.getUnitSystem());
  const weightLabel = getWeightUnit(units).toLowerCase();

  const template = templateId ? getTemplateById(templateId) : null;
  const isSaved = templateId ? isTemplateSaved(templateId, userId) : false;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColourId, setEditColourId] = useState('purple');
  const [editImage, setEditImage] = useState<SelectedImageData | null>(null);

  // Track which exercises are expanded
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  // Colour modal state (edit mode)
  const [showColourModal, setShowColourModal] = useState(false);
  const colourSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Colour picker for "Add to Library" flow
  const [showAddColourModal, setShowAddColourModal] = useState(false);
  const [addColourId, setAddColourId] = useState('purple');
  const addColourSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Image picker state
  const [showImagePicker, setShowImagePicker] = useState(false);

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
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('workout.title')}</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('template.templateNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToLibrary = () => {
    if (!isSaved && template) {
      // Show colour picker before adding
      setAddColourId('purple');
      setShowAddColourModal(true);
      Animated.spring(addColourSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  };

  const closeAddColourModal = () => {
    Animated.timing(addColourSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowAddColourModal(false));
  };

  const confirmAddWithColour = (colourId: string) => {
    const colour = WORKOUT_COLOURS.find((c) => c.id === colourId);
    const tagColor = colour?.color || colors.primary;
    const added = addTemplate({ ...template, userId: userId || undefined }, tagColor);

    // Navigate only after animation completes to avoid iOS freeze
    Animated.timing(addColourSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowAddColourModal(false);
      if (!added) return;
      router.navigate('/(tabs)/workout');
    });
  };

  const handleStartWorkout = () => {
    withLock(() => {
      router.push({
        pathname: '/active-workout',
        params: { templateId: template.id },
      });
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
      Alert.alert(t('template.missingName'), t('template.pleaseEnterName'));
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
    withLock(() => {
      router.push({
        pathname: '/create-template',
        params: { templateId: template.id },
      });
    });
  };

  const handleDeleteTemplate = () => {
    const linkedWorkouts = getScheduledWorkoutsForTemplate(template.id);

    if (linkedWorkouts.length > 0) {
      const count = linkedWorkouts.length;
      Alert.alert(
        t('template.deleteTemplate'),
        t('template.deleteWithWorkouts', { name: template.name, count }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('template.keepWorkouts'),
            onPress: () => {
              detachScheduledWorkoutsFromTemplate(template.id);
              removeTemplate(template.id);
              router.back();
            },
          },
          {
            text: t('template.deleteAll'),
            style: 'destructive',
            onPress: () => {
              removeScheduledWorkoutsForTemplate(template.id);
              removeTemplate(template.id);
              router.back();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        t('template.deleteTemplate'),
        t('template.deleteConfirm', { name: template.name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => {
              removeTemplate(template.id);
              router.back();
            },
          },
        ]
      );
    }
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

  // Rendering helpers
  const renderTemplateImage = () => {
    if (isEditing) {
      // Edit mode — show editable image with picker
      return (
        <Pressable
          style={[styles.imagePlaceholder, editImage && styles.imagePlaceholderFilled]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowImagePicker(true);
          }}
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
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleCancelEdit();
              }}
              style={styles.backButton}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{t('template.editTemplate')}</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleSaveEdit();
              }}
              style={styles.backButton}
            >
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>{t('workout.title')}</Text>
            {!template.isPreset ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  enterEditMode();
                }}
                style={styles.backButton}
              >
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
                  placeholder={t('template.templateName')}
                  placeholderTextColor={colors.textTertiary}
                  value={editName}
                  onChangeText={setEditName}
                />
                <TextInput
                  style={styles.descriptionInput}
                  placeholder={t('template.descriptionOptional')}
                  placeholderTextColor={colors.textTertiary}
                  value={editDescription}
                  onChangeText={setEditDescription}
                />
              </View>
            </View>

            <View style={styles.editDivider} />

            {/* Colour */}
            <Pressable
              style={styles.colourRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                openColourModal();
              }}
            >
              <Text style={styles.colourLabel}>{t('template.colour')}</Text>
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleAddToLibrary();
            }}
            disabled={isSaved}
          >
            <Text style={[styles.addToLibraryText, isSaved && styles.addToLibraryTextSaved]}>
              {isSaved ? t('template.savedToLibrary') : t('template.addToLibrary')}
            </Text>
          </Pressable>
        )}

        {/* Start Workout Button (user templates, view mode only) */}
        {!template.isPreset && !isEditing && (
          <Pressable
            style={styles.startWorkoutButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleStartWorkout();
            }}
          >
            <Text style={styles.startWorkoutText}>{t('template.startWorkout')}</Text>
          </Pressable>
        )}

        {/* Edit Exercises Button (edit mode only) */}
        {isEditing && (
          <Pressable
            style={styles.editExercisesButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleEditExercises();
            }}
          >
            <Ionicons name="barbell-outline" size={20} color={colors.textInverse} />
            <Text style={styles.editExercisesText}>{t('template.editExercises')}</Text>
          </Pressable>
        )}

        {/* Exercises Section */}
        <Text style={styles.sectionTitle}>{t('template.exercises')}</Text>
        <View style={styles.exercisesCard}>
          {template.exercises.map((exercise, index) => (
            <View key={exercise.id}>
              <ExerciseRow
                exercise={exercise}
                isExpanded={expandedExercises.has(exercise.id)}
                onToggle={() => toggleExercise(exercise.id)}
                weightLabel={weightLabel}
                units={units}
                withLock={withLock}
              />
              {index < template.exercises.length - 1 && <View style={styles.exerciseDivider} />}
            </View>
          ))}
        </View>

        {/* Delete Template (user templates only) */}
        {!template.isPreset && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleDeleteTemplate();
            }}
            style={styles.deleteTextButton}
          >
            <Text style={styles.deleteText}>{t('template.deleteTemplate')}</Text>
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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeColourModal();
          }}
        >
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY: colourSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    closeColourModal();
                  }}
                >
                  <CloseIcon />
                </Pressable>
                <Text style={styles.modalTitle}>{t('template.colour')}</Text>
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
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        selectColour(colour.id);
                      }}
                    >
                      <View style={[styles.colourCircleLarge, { backgroundColor: colour.color }]}>
                        {editColourId === colour.id && (
                          <Ionicons name="checkmark" size={20} color={colors.textInverse} />
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

      {/* Add to Library Colour Picker Modal */}
      <Modal
        visible={showAddColourModal}
        transparent
        animationType="none"
        onRequestClose={closeAddColourModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeAddColourModal();
          }}
        >
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY: addColourSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    closeAddColourModal();
                  }}
                >
                  <CloseIcon />
                </Pressable>
                <Text style={styles.modalTitle}>{t('template.chooseColour')}</Text>
                <View style={styles.modalCloseButton} />
              </View>

              <View style={styles.colourContainer}>
                <View style={styles.colourGrid}>
                  {WORKOUT_COLOURS.map((colour) => (
                    <Pressable
                      key={colour.id}
                      style={[
                        styles.colourOption,
                        addColourId === colour.id && styles.colourOptionSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAddColourId(colour.id);
                      }}
                    >
                      <View style={[styles.colourCircleLarge, { backgroundColor: colour.color }]}>
                        {addColourId === colour.id && (
                          <Ionicons name="checkmark" size={20} color={colors.textInverse} />
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  style={styles.addColourConfirmButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    confirmAddWithColour(addColourId);
                  }}
                >
                  <Text style={styles.addColourConfirmText}>{t('template.addToLibrary')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Image Picker */}
      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={(image) => setEditImage(image)}
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
    color: colors.textInverse,
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
    color: colors.textInverse,
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
    color: colors.textInverse,
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
    padding: 12,
    marginBottom: spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: spacing.sm,
  },
  exerciseName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  exerciseDivider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
  },
  // Sets display styles
  setsContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
  },
  setHeaderText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  setColumn: {
    width: 40,
    marginRight: spacing.md,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  setNumber: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
  setText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
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
  addColourConfirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  addColourConfirmText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});
