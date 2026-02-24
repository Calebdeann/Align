import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

const STEPS = [
  {
    label: 'Step 1',
    description:
      'Go to TikTok or Instagram and tap on the \u201CShare\u201D button. This will open a bottom sheet',
  },
  {
    label: 'Step 2',
    description: 'Scroll to the right and tap \u201CMore\u201D',
  },
  {
    label: 'Step 3',
    description:
      'Find Align and tap the \u201C+\u201D button. If Align doesn\u2019t show up, try restarting your phone. This should refresh your options',
  },
  {
    label: 'Step 4',
    description: 'Drag Align to the top and tap \u201CDone\u201D \uD83C\uDF89',
  },
];

export default function ShortcutGuideScreen() {
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
        <Text style={styles.title}>Add Align to your shortcuts</Text>

        {STEPS.map((step) => (
          <View key={step.label} style={styles.stepContainer}>
            <Text style={styles.stepLabel}>{step.label}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        ))}
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
  },
});
