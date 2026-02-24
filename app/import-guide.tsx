import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

const GUIDE_CONTENT = {
  tiktok: {
    title: 'Import from TikTok',
    step1: 'On any TikTok workout, tap on the \u201CShare\u201D button',
    step2Prefix:
      "Scroll to the right, and tap on the \u201CMore\u201D button. If you don't see Align, follow ",
    step2Link: 'these instructions',
    step3:
      'Choose \u201CAlign\u201D from the provided options. Align will import the workout and notify you when done!',
    step1Image: require('../assets/images/TikTok_Step1.png'),
    step2Image: require('../assets/images/TikTok_Step2.png'),
    step3Image: require('../assets/images/TikTok_Step3.png'),
  },
  instagram: {
    title: 'Import from\nInstagram',
    step1: 'On any Instagram workout, tap on the \u201CShare\u201D button',
    step2Prefix:
      "Scroll to the right, and tap on the \u201CMore\u201D button. If you don't see Align, follow ",
    step2Link: 'these instructions',
    step3:
      'Choose \u201CAlign\u201D from the provided options. Align will import the workout and notify you when done!',
    step1Image: require('../assets/images/Instagram_Step1.png'),
    step2Image: require('../assets/images/Instagram_Step2.png'),
    step3Image: require('../assets/images/Instagram_Step3.png'),
  },
};

export default function ImportGuideScreen() {
  const { platform } = useLocalSearchParams<{ platform: string }>();
  const content = GUIDE_CONTENT[platform as keyof typeof GUIDE_CONTENT] || GUIDE_CONTENT.tiktok;

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
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{content.title}</Text>

        {/* Step 1 */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepLabel}>Step 1</Text>
          <Text style={styles.stepDescription}>{content.step1}</Text>
          <Image source={content.step1Image} style={styles.stepImage} contentFit="contain" />
        </View>

        {/* Step 2 */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepLabel}>Step 2</Text>
          <Text style={styles.stepDescription}>
            {content.step2Prefix}
            <Text
              style={styles.linkText}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/shortcut-guide');
              }}
            >
              {content.step2Link}
            </Text>
          </Text>
          <Image source={content.step2Image} style={styles.stepImage} contentFit="contain" />
        </View>

        {/* Step 3 */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepLabel}>Step 3</Text>
          <Text style={styles.stepDescription}>{content.step3}</Text>
          <Image source={content.step3Image} style={styles.stepImage} contentFit="contain" />
        </View>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xxxl,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  stepContainer: {
    marginBottom: spacing.xl,
  },
  stepLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  linkText: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  stepImage: {
    width: '100%',
    aspectRatio: 1380 / 747,
    borderRadius: 16,
  },
});
