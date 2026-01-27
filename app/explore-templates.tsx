import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useTemplateStore, WorkoutTemplate, getTemplateTotalSets } from '@/stores/templateStore';
import { CATEGORY_HERO_IMAGES } from '@/stores/presetTemplates';
import { useUserProfileStore } from '@/stores/userProfileStore';

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_GAP = spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

// All category cards displayed as image grid
const ALL_CATEGORIES = [
  { id: 'core' as const, label: 'Abs' },
  { id: 'glutes' as const, label: 'Glutes' },
  { id: 'lower-body' as const, label: 'Lower Body' },
  { id: 'pull' as const, label: 'Pull' },
  { id: 'push' as const, label: 'Push' },
  { id: 'upper-body' as const, label: 'Upper Body' },
  { id: 'at-home' as const, label: 'At Home' },
  { id: 'travel' as const, label: 'Travel' },
  { id: 'cardio' as const, label: 'Cardio' },
  { id: 'rehab' as const, label: 'No Equipment' },
];

type CategoryId =
  | 'core'
  | 'glutes'
  | 'lower-body'
  | 'pull'
  | 'push'
  | 'upper-body'
  | 'at-home'
  | 'travel'
  | 'cardio'
  | 'rehab';

interface TemplateRowProps {
  template: WorkoutTemplate;
  onPress: () => void;
  onAdd: () => void;
  isAdded: boolean;
}

function TemplateRow({ template, onPress, onAdd, isAdded }: TemplateRowProps) {
  const totalSets = getTemplateTotalSets(template);

  return (
    <Pressable style={styles.templateRow} onPress={onPress}>
      <View style={styles.templateImageContainer}>
        {template.localImage ? (
          <Image source={template.localImage} style={styles.templateImage} />
        ) : template.image?.uri ? (
          <Image source={{ uri: template.image.uri }} style={styles.templateImage} />
        ) : (
          <View style={[styles.templateImage, styles.templateImagePlaceholder]}>
            <Ionicons name="barbell-outline" size={24} color={colors.textSecondary} />
          </View>
        )}
      </View>

      <View style={styles.templateInfo}>
        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.templateMeta}>
          {totalSets} Sets • {template.equipment}
        </Text>
      </View>

      <Pressable
        style={[styles.addButton, isAdded && styles.addButtonAdded]}
        onPress={isAdded ? undefined : onAdd}
        disabled={isAdded}
      >
        {!isAdded && <Text style={styles.addButtonPlus}>+</Text>}
        <Text style={[styles.addButtonText, isAdded && styles.addButtonTextAdded]}>
          {isAdded ? 'Added' : 'Add'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

interface CategoryModalProps {
  visible: boolean;
  categoryLabel: string;
  templates: WorkoutTemplate[];
  onClose: () => void;
  onAddTemplate: (template: WorkoutTemplate) => void;
  onTemplatePress: (template: WorkoutTemplate) => void;
  isTemplateSaved: (id: string) => boolean;
}

function CategoryModal({
  visible,
  categoryLabel,
  templates,
  onClose,
  onAddTemplate,
  onTemplatePress,
  isTemplateSaved,
}: CategoryModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Pressable style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.modalTitle}>{categoryLabel} Workouts</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.modalTemplateList}>
              {templates.map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  onPress={() => onTemplatePress(template)}
                  onAdd={() => onAddTemplate(template)}
                  isAdded={isTemplateSaved(template.id)}
                />
              ))}
            </View>

            {templates.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="fitness-outline" size={48} color={colors.border} />
                <Text style={styles.emptyStateText}>No workouts in this category yet</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ExploreTemplatesScreen() {
  const userId = useUserProfileStore((state) => state.userId);
  const presetTemplates = useTemplateStore((state) => state.presetTemplates);
  const addTemplate = useTemplateStore((state) => state.addTemplate);
  const isTemplateSavedFn = useTemplateStore((state) => state.isTemplateSaved);

  const isTemplateSaved = (id: string) => isTemplateSavedFn(id, userId);

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Reopen the category modal when returning from template-detail
  useFocusEffect(
    useCallback(() => {
      if (selectedCategory && !showCategoryModal) {
        setShowCategoryModal(true);
      }
    }, [selectedCategory, showCategoryModal])
  );

  // Colour picker state for quick-add
  const [pendingTemplate, setPendingTemplate] = useState<WorkoutTemplate | null>(null);
  const [showColourModal, setShowColourModal] = useState(false);
  const [addColourId, setAddColourId] = useState('purple');
  const colourSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const categoryTemplates = selectedCategory
    ? presetTemplates.filter((t) => t.category === selectedCategory)
    : [];

  const getCategoryCount = (categoryId: CategoryId): number =>
    presetTemplates.filter((t) => t.category === categoryId).length;

  const getCategoryLabel = (categoryId: CategoryId | null): string => {
    if (!categoryId) return '';
    const cat = ALL_CATEGORIES.find((c) => c.id === categoryId);
    return cat?.label || '';
  };

  const handleAddTemplate = (template: WorkoutTemplate) => {
    // Show colour picker before adding
    setPendingTemplate(template);
    setAddColourId('purple');
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
    }).start(() => {
      setShowColourModal(false);
      setPendingTemplate(null);
    });
  };

  const confirmAddWithColour = () => {
    if (!pendingTemplate) return;
    const colour = WORKOUT_COLOURS.find((c) => c.id === addColourId);
    const tagColor = colour?.color || colors.primary;
    const added = addTemplate(pendingTemplate, tagColor);
    closeColourModal();
    if (!added) return;
    setShowCategoryModal(false);
    setSelectedCategory(null);
    router.navigate('/(tabs)/workout');
  };

  const handleTemplatePress = (template: WorkoutTemplate) => {
    setShowCategoryModal(false);
    // Delay navigation so the modal slide-down animation finishes first
    setTimeout(() => {
      router.push({
        pathname: '/template-detail',
        params: { templateId: template.id },
      });
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Workouts</Text>

        <View style={styles.cardGrid}>
          {ALL_CATEGORIES.map((category) => {
            const count = getCategoryCount(category.id);
            const heroImage = CATEGORY_HERO_IMAGES[category.id];
            return (
              <Pressable
                key={category.id}
                style={styles.categoryCard}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setShowCategoryModal(true);
                }}
              >
                {heroImage ? (
                  <Image source={heroImage} style={styles.categoryCardImage} />
                ) : (
                  <View style={[styles.categoryCardImage, styles.categoryCardPlaceholder]}>
                    <Ionicons name="barbell-outline" size={32} color={colors.textSecondary} />
                  </View>
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.65)']}
                  style={styles.categoryCardGradient}
                >
                  <Text style={styles.categoryCardLabel}>{category.label}</Text>
                  <Text style={styles.categoryCardCount}>{count} workouts</Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CategoryModal
        visible={showCategoryModal}
        categoryLabel={getCategoryLabel(selectedCategory)}
        templates={categoryTemplates}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategory(null);
        }}
        onAddTemplate={handleAddTemplate}
        onTemplatePress={handleTemplatePress}
        isTemplateSaved={isTemplateSaved}
      />

      {/* Colour Picker Modal for Add */}
      <Modal
        visible={showColourModal}
        transparent
        animationType="none"
        onRequestClose={closeColourModal}
      >
        <Pressable style={styles.colourModalOverlay} onPress={closeColourModal}>
          <Animated.View
            style={[styles.colourModalContent, { transform: [{ translateY: colourSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.colourModalHandle} />

              <View style={styles.colourModalHeader}>
                <Pressable style={styles.colourModalCloseButton} onPress={closeColourModal}>
                  <CloseIcon />
                </Pressable>
                <Text style={styles.colourModalTitle}>Choose Colour</Text>
                <View style={styles.colourModalCloseButton} />
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
                      onPress={() => setAddColourId(colour.id)}
                    >
                      <View style={[styles.colourCircleLarge, { backgroundColor: colour.color }]}>
                        {addColourId === colour.id && (
                          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>

                <Pressable style={styles.addColourConfirmButton} onPress={confirmAddWithColour}>
                  <Text style={styles.addColourConfirmText}>Add to Library</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
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
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  // 2-column category card grid
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryCardPlaceholder: {
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 40,
  },
  categoryCardLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
  categoryCardCount: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  bottomSpacer: {
    height: 40,
  },

  // Template row (used inside modal)
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  templateImageContainer: {
    marginRight: spacing.md,
  },
  templateImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  templateImagePlaceholder: {
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: 4,
  },
  templateMeta: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonAdded: {
    backgroundColor: 'rgba(148, 122, 255, 0.15)',
  },
  addButtonPlus: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text,
  },
  addButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  addButtonTextAdded: {
    color: colors.primary,
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
    maxHeight: SCREEN_HEIGHT * 0.75,
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
  modalScrollView: {
    paddingHorizontal: spacing.lg,
  },
  modalTemplateList: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  // Colour picker modal styles
  colourModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  colourModalContent: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  colourModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  colourModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  colourModalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colourModalTitle: {
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
    color: '#FFFFFF',
  },
});
