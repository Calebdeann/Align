import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import {
  useTemplateStore,
  TemplateExercise,
  estimateTemplateDuration,
} from '@/stores/templateStore';
import { WorkoutImage } from '@/stores/workoutStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { kgToLbs } from '@/utils/units';
import { getCurrentUser } from '@/services/api/user';
import { prefetchExerciseGif } from '@/stores/exerciseStore';
import { ImagePickerSheet, SelectedImageData } from '@/components/ImagePickerSheet';
import { consumePendingTemplateImage } from '@/lib/imagePickerState';
import { resolveExerciseDisplayName } from '@/stores/exerciseStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { getTemplateImageById } from '@/constants/templateImages';

// Templates no longer carry a user-selectable color in the new It Girl style.
// We persist a neutral default so existing schemas / list code that still
// reads `tagColor` keeps working unchanged.
const NEUTRAL_TAG_COLOR = '#000000';

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

// Exercise row — mirrors ExerciseBlock in app/workout-summary.tsx (the detailed
// workout view): 70x70 thumbnail, bold name, tap-to-expand per-set table.
// Template sets carry targetWeight/targetReps (kg) and no RPE, so the WEIGHT &
// REPS column uses the targets and the RPE column shows "-".
function TemplateExerciseBlock({
  exercise,
  unit,
  isNavigating,
  withLock,
}: {
  exercise: TemplateExercise;
  unit: string;
  isNavigating: boolean;
  withLock: (fn: () => void) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setExpanded((prev) => !prev);
  };

  const navigateToDetail = isNavigating
    ? undefined
    : () => {
        withLock(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          prefetchExerciseGif(exercise.exerciseId);
          router.push(`/exercise/${exercise.exerciseId}`);
        });
      };

  const thumbUri = exercise.thumbnailUrl ?? exercise.gifUrl;
  const thumbnailContent = thumbUri ? (
    <Image source={{ uri: thumbUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
  ) : (
    <View style={[StyleSheet.absoluteFill, styles.exerciseThumbnailPlaceholder]} />
  );

  return (
    <View style={styles.exerciseBlock}>
      {/* Header: thumbnail + name/chevron */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={navigateToDetail} style={styles.exerciseThumbnail}>
          {thumbnailContent}
        </Pressable>
        <View style={{ width: 12 }} />
        <Pressable
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 70 }}
          onPress={toggle}
        >
          <View style={{ flex: 1, justifyContent: 'center' }} pointerEvents="box-none">
            <Text
              style={[styles.exerciseName, { alignSelf: 'flex-start' }]}
              numberOfLines={2}
              onPress={navigateToDetail}
            >
              {resolveExerciseDisplayName(exercise.exerciseId, exercise.exerciseName)}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={22}
            color="#000000"
          />
        </Pressable>
      </View>

      {/* Sets table — sibling of header, spans full card width. */}
      {expanded && (
        <View style={styles.setsContainer}>
          <View style={styles.setHeaderRow}>
            <Text style={[styles.setHeaderCell, styles.setIndexCell]}>SET</Text>
            <Text style={[styles.setHeaderCell, styles.setWeightRepsCell]}>WEIGHT & REPS</Text>
            <Text style={[styles.setHeaderCell, styles.setRpeCell]}>RPE</Text>
          </View>
          {exercise.sets.map((set) => {
            const weightKg = set.targetWeight ?? 0;
            const displayWeight = unit === 'lbs' ? kgToLbs(weightKg) : weightKg;
            return (
              <View key={set.setNumber} style={styles.setRow}>
                <Text style={[styles.setNumber, styles.setIndexCell]}>{set.setNumber}</Text>
                <Text style={[styles.setDetails, styles.setWeightRepsCell]}>
                  {displayWeight} {unit} × {set.targetReps ?? 0} reps
                </Text>
                <Text style={[styles.setDetails, styles.setRpeCell]}>-</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function SaveTemplateScreen() {
  const params = useLocalSearchParams<{
    exercises?: string;
    templateId?: string;
    folderId?: string;
    name?: string;
  }>();

  const isEditMode = !!params.templateId;
  const { t } = useTranslation();
  const { isNavigating, withLock } = useNavigationLock();

  const getTemplateById = useTemplateStore((state) => state.getTemplateById);
  const createTemplate = useTemplateStore((state) => state.createTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);

  const { getUnitSystem } = useUserPreferencesStore();
  const unit = getUnitSystem() === 'imperial' ? 'lbs' : 'kg';

  // Parse exercises from params
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Image state
  const [selectedImage, setSelectedImage] = useState<SelectedImageData | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

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

    // Pre-fill name from params (e.g. from TikTok import)
    if (params.name && !params.templateId) {
      setName(params.name);
    }

    // If editing, load existing template data
    if (params.templateId) {
      const existing = getTemplateById(params.templateId);
      if (existing) {
        setName(existing.name);
        setDescription(existing.description || '');

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

  const handleSave = async () => {
    if (isSaving) return;

    if (!name.trim()) {
      Alert.alert(i18n.t('template.missingName'), i18n.t('template.pleaseEnterName'));
      return;
    }

    if (exercises.length === 0) {
      Alert.alert(i18n.t('template.noExercises'), i18n.t('template.pleaseAddExercise'));
      return;
    }

    setIsSaving(true);

    const user = await getCurrentUser();

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
      tagColor: NEUTRAL_TAG_COLOR,
      estimatedDuration: estimateTemplateDuration({ exercises }),
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

    // Return to the templates screen (start-workout-sheet → "My Templates"),
    // which reactively shows the newly saved template. dismissTo pops the
    // create-template + save-template screens back to it rather than resetting
    // all the way to a tab.
    router.dismissTo('/start-workout-sheet');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          style={styles.backButton}
        >
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>{t('template.saveTemplate')}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            handleSave();
          }}
          style={styles.saveButton}
        >
          <Text style={styles.saveText}>{t('saveWorkout.save')}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Template Info Row — matches the "Choose Template" row layout in
            schedule-workout (photo + name + subtitle). The "Choose Template"
            label is replaced by the editable template name; the meta line is
            replaced by the editable description. */}
        <View style={styles.infoRow}>
          <Pressable
            style={styles.imageContainer}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setShowImagePicker(true);
            }}
          >
            {selectedImage ? (
              selectedImage.localSource ? (
                <Image
                  source={selectedImage.localSource}
                  style={styles.selectedImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.selectedImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              )
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="barbell-outline" size={31} color="rgba(0,0,0,0.4)" />
              </View>
            )}
          </Pressable>
          <View style={styles.textInputs}>
            <TextInput
              autoCorrect={false}
              style={styles.nameInput}
              placeholder={t('template.templateName')}
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              autoCorrect
              style={styles.descriptionInput}
              placeholder={t('template.descriptionOptional')}
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Exercises — replicates ExerciseBlock from the detailed workout view
            (app/workout-summary.tsx): 70x70 thumbnail, bold name, tap-to-expand
            per-set table. Blocks render directly on the background (no card). */}
        <Text style={styles.sectionHeading}>{t('saveWorkout.exercises')}</Text>
        {exercises.map((exercise) => (
          <TemplateExerciseBlock
            key={exercise.id}
            exercise={exercise}
            unit={unit}
            isNavigating={isNavigating}
            withLock={withLock}
          />
        ))}

        {exercises.length === 0 && (
          <View style={styles.emptyExercises}>
            <Text style={styles.emptyText}>{t('template.noExercisesAdded')}</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Image Picker Bottom Sheet — templates don't expose the pre-made
          template-image library; just Camera + Photo Library. */}
      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={(image) => setSelectedImage(image)}
        hideTemplateLibrary
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
  // Info row — mirrors schedule-workout's chooseCard/chooseRow: roomy #f5f5f5
  // card with a large, slightly-rotated photo thumbnail beside the inputs.
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: spacing.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    marginBottom: spacing.md,
  },
  imageContainer: {},
  imagePlaceholder: {
    width: 96,
    height: 116,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transform: [{ rotate: '-2.5deg' }],
  },
  selectedImage: {
    width: 96,
    height: 116,
    borderRadius: 14,
    overflow: 'hidden',
    transform: [{ rotate: '-2.5deg' }],
  },
  textInputs: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  nameInput: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: 0,
  },
  descriptionInput: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    paddingVertical: 0,
  },
  // "Exercises" heading — matches the detailed workout view's sectionHeading.
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#000000',
    letterSpacing: -0.4,
    marginBottom: 8,
    marginTop: 4,
  },
  // Exercise rows — copied verbatim from app/workout-summary.tsx's ExerciseBlock.
  exerciseBlock: {
    marginBottom: 28,
  },
  exerciseThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 4,
  },
  exerciseThumbnailPlaceholder: {
    backgroundColor: '#E0E0E0',
  },
  exerciseName: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#000000',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  setsContainer: {
    marginTop: 14,
  },
  setIndexCell: {
    width: 82,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  setHeaderCell: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: 0.2,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  setNumber: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.2,
  },
  setDetails: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.2,
  },
  setWeightRepsCell: {
    minWidth: 150,
  },
  setRpeCell: {
    minWidth: 40,
    marginLeft: 12,
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
});
