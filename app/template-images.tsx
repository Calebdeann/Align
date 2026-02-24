import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { TEMPLATE_IMAGE_CATEGORIES, TemplateImageItem } from '@/constants/templateImages';
import { setPendingTemplateImage } from '@/lib/imagePickerState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = spacing.lg;
const GRID_GAP = 8;
const NUM_COLUMNS = 3;
// Each item has margin of GRID_GAP/2 on each side, so total per item = IMAGE_SIZE + GRID_GAP
// The grid has negative marginHorizontal of GRID_GAP/2 to offset the outer margins
// Available width = SCREEN_WIDTH - GRID_PADDING*2, so: NUM_COLUMNS * (IMAGE_SIZE + GRID_GAP) <= available + GRID_GAP
const IMAGE_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2) / NUM_COLUMNS - GRID_GAP);

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

export default function TemplateImagesScreen() {
  const handleSelectImage = (image: TemplateImageItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingTemplateImage({ id: image.id, source: image.source });
    router.back();
  };

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
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Choose Image</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {TEMPLATE_IMAGE_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <View style={styles.imageGrid}>
              {category.images.map((image) => (
                <Pressable
                  key={image.id}
                  style={styles.imageWrapper}
                  onPress={() => handleSelectImage(image)}
                >
                  <Image
                    source={image.source}
                    style={styles.image}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GRID_PADDING,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -(GRID_GAP / 2),
  },
  imageWrapper: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    margin: GRID_GAP / 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomSpacer: {
    height: 40,
  },
});
