import { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useTemplateStore, TemplateExercise } from '@/stores/templateStore';
import { getCurrentUser } from '@/services/api/user';
import { filterNumericInput } from '@/utils/units';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Workout tags with their colors
const WORKOUT_TAGS = [
  { id: 'legs', label: 'Legs', color: colors.workout.legs },
  { id: 'glutes', label: 'Glutes', color: colors.workout.legs },
  { id: 'arms', label: 'Arms', color: colors.workout.arms },
  { id: 'back', label: 'Back', color: colors.workout.back },
  { id: 'chest', label: 'Chest', color: colors.workout.chest },
  { id: 'fullBody', label: 'Full Body', color: colors.workout.fullBody },
  { id: 'cardio', label: 'Cardio', color: colors.workout.cardio },
  { id: 'shoulders', label: 'Shoulders', color: colors.workout.shoulders },
  { id: 'core', label: 'Core', color: colors.workout.core },
];

// Difficulty options
const DIFFICULTY_OPTIONS: Array<'Beginner' | 'Intermediate' | 'Advanced'> = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

// Equipment options
const EQUIPMENT_OPTIONS = ['Gym', 'Home', 'No Equipment'];

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

// Icons
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

function Divider() {
  return <View style={styles.divider} />;
}

export default function SaveTemplateScreen() {
  const params = useLocalSearchParams<{
    exercises?: string;
    templateId?: string;
    folderId?: string;
  }>();

  const isEditMode = !!params.templateId;

  const getTemplateById = useTemplateStore((state) => state.getTemplateById);
  const createTemplate = useTemplateStore((state) => state.createTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);

  // Parse exercises from params
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColourId, setSelectedColourId] = useState('purple');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    'Beginner'
  );
  const [equipment, setEquipment] = useState('Gym');
  const [estimatedDuration, setEstimatedDuration] = useState('60');

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
        setSelectedTagIds(existing.tagIds);
        setDifficulty(existing.difficulty);
        setEquipment(existing.equipment);
        setEstimatedDuration(existing.estimatedDuration.toString());

        // Find matching colour from tagColor
        const matchingColour = WORKOUT_COLOURS.find((c) => c.color === existing.tagColor);
        if (matchingColour) {
          setSelectedColourId(matchingColour.id);
        }

        // Use exercises from params (may have been edited) or fall back to template exercises
        if (!params.exercises) {
          setExercises(existing.exercises);
        }
      }
    }
  }, [params.templateId, params.exercises]);

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

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
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

    const templateData = {
      name: name.trim(),
      description: description.trim() || undefined,
      tagIds: selectedTagIds,
      tagColor,
      estimatedDuration: parseInt(estimatedDuration) || 60,
      difficulty,
      equipment,
      exercises,
      userId: user?.id,
      folderId: params.folderId || undefined,
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
              style={styles.imagePlaceholder}
              onPress={() => {
                Alert.alert('Coming Soon', 'Image upload will be available soon.');
              }}
            >
              <ImagePlaceholderIcon />
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

        {/* Settings Card */}
        <Text style={styles.sectionHeader}>Settings</Text>
        <View style={styles.card}>
          {/* Tags */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsLabel}>Tags</Text>
            <View style={styles.tagsGrid}>
              {WORKOUT_TAGS.map((tag) => (
                <Pressable
                  key={tag.id}
                  style={[
                    styles.tagChip,
                    selectedTagIds.includes(tag.id) && {
                      backgroundColor: tag.color + '30',
                      borderColor: tag.color,
                    },
                  ]}
                  onPress={() => toggleTag(tag.id)}
                >
                  <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                  <Text style={styles.tagLabel}>{tag.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Divider />

          {/* Difficulty */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsLabel}>Difficulty</Text>
            <View style={styles.optionsRow}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.optionChip, difficulty === option && styles.optionChipSelected]}
                  onPress={() => setDifficulty(option)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      difficulty === option && styles.optionChipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Divider />

          {/* Equipment */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsLabel}>Equipment</Text>
            <View style={styles.optionsRow}>
              {EQUIPMENT_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.optionChip, equipment === option && styles.optionChipSelected]}
                  onPress={() => setEquipment(option)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      equipment === option && styles.optionChipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Divider />

          {/* Duration */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsLabel}>Estimated Duration (minutes)</Text>
            <TextInput
              style={styles.durationInput}
              value={estimatedDuration}
              onChangeText={(value) => setEstimatedDuration(filterNumericInput(value, false))}
              keyboardType="numeric"
              placeholder="60"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

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
  settingsSection: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingsLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipSelected: {
    backgroundColor: 'rgba(148, 122, 255, 0.15)',
    borderColor: colors.primary,
  },
  optionChipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  optionChipTextSelected: {
    color: colors.primary,
  },
  durationInput: {
    ...cardStyle,
    padding: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
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
});
