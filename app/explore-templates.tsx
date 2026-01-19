import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useTemplateStore, WorkoutTemplate, getTemplateTotalSets } from '@/stores/templateStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Filter categories with icons
const FILTER_CATEGORIES = [
  { id: 'at-home', label: 'At Home', icon: 'home-outline' },
  { id: 'travel', label: 'Travel', icon: 'airplane-outline' },
  { id: 'cardio', label: 'Cardio', icon: 'heart-outline' },
  { id: 'rehab', label: 'Rehab', icon: 'fitness-outline' },
] as const;

type CategoryId = (typeof FILTER_CATEGORIES)[number]['id'];

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
      {/* Template Image */}
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

      {/* Template Info */}
      <View style={styles.templateInfo}>
        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.templateMeta}>
          {totalSets} Sets • {template.equipment}
        </Text>
      </View>

      {/* Add Button */}
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
                  onPress={() => {
                    onClose();
                    onTemplatePress(template);
                  }}
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
  const presetTemplates = useTemplateStore((state) => state.presetTemplates);
  const addTemplate = useTemplateStore((state) => state.addTemplate);
  const isTemplateSaved = useTemplateStore((state) => state.isTemplateSaved);

  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);

  // Filter templates: main templates have no category
  const mainTemplates = presetTemplates.filter((t) => !t.category);

  // Number of templates to show
  const INITIAL_SHOW_COUNT = 3;
  const EXPANDED_SHOW_COUNT = 13; // 3 initial + 10 more

  // Templates to display (first 3, then expand to show 10 more = 13 total)
  const displayedTemplates = showAll
    ? mainTemplates.slice(0, EXPANDED_SHOW_COUNT)
    : mainTemplates.slice(0, INITIAL_SHOW_COUNT);

  const remainingCount = Math.min(10, mainTemplates.length - INITIAL_SHOW_COUNT);

  // Get templates for selected category
  const categoryTemplates = selectedCategory
    ? presetTemplates.filter((t) => t.category === selectedCategory)
    : [];

  const getCategoryLabel = (categoryId: CategoryId | null): string => {
    if (!categoryId) return '';
    const category = FILTER_CATEGORIES.find((c) => c.id === categoryId);
    return category?.label || '';
  };

  const handleAddTemplate = (template: WorkoutTemplate) => {
    addTemplate(template);
  };

  const handleTemplatePress = (template: WorkoutTemplate) => {
    router.push({
      pathname: '/template-detail',
      params: { templateId: template.id },
    });
  };

  const handleCategoryPress = (categoryId: CategoryId) => {
    setSelectedCategory(categoryId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Workouts Section */}
        <Text style={styles.sectionTitle}>Workouts</Text>

        <View style={styles.templateList}>
          {displayedTemplates.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              onPress={() => handleTemplatePress(template)}
              onAdd={() => handleAddTemplate(template)}
              isAdded={isTemplateSaved(template.id)}
            />
          ))}
        </View>

        {/* Show More Button - Only show if there are more templates and not expanded yet */}
        {!showAll && remainingCount > 0 && (
          <Pressable style={styles.showMoreButton} onPress={() => setShowAll(true)}>
            <Text style={styles.showMoreText}>Show {remainingCount} Workouts</Text>
          </Pressable>
        )}

        {/* Show Less Button - Only show if expanded */}
        {showAll && (
          <Pressable style={styles.showAllButton} onPress={() => setShowAll(false)}>
            <Text style={styles.showAllText}>Show less</Text>
          </Pressable>
        )}

        {/* Filter Categories Section */}
        <Text style={styles.sectionTitle}>Categories</Text>

        <View style={styles.filterGrid}>
          {FILTER_CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              style={styles.filterCard}
              onPress={() => handleCategoryPress(category.id)}
            >
              <View style={styles.filterIconCircle}>
                <Ionicons name={category.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={styles.filterLabel}>{category.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Category Modal */}
      <CategoryModal
        visible={selectedCategory !== null}
        categoryLabel={getCategoryLabel(selectedCategory)}
        templates={categoryTemplates}
        onClose={() => setSelectedCategory(null)}
        onAddTemplate={handleAddTemplate}
        onTemplatePress={handleTemplatePress}
        isTemplateSaved={isTemplateSaved}
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
  templateList: {
    gap: spacing.sm,
  },
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
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  showMoreText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  showAllButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  showAllText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  filterGrid: {
    gap: spacing.sm,
  },
  filterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: spacing.md,
  },
  filterIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(148, 122, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLabel: {
    flex: 1,
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
});
