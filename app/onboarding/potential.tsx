import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import QuestionLayout from '@/components/QuestionLayout';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

export default function PotentialScreen() {
  return (
    <QuestionLayout
      question="You have great potential to crush your goals"
      progress={40}
      showContinue
      onContinue={() => router.push('/onboarding/referral')}
      onSkip={() => router.push('/onboarding/referral')}
    >
      <View style={styles.content}>
        {/* Graph placeholder */}
        <View style={styles.graphContainer}>
          <View style={styles.graphYAxis}>
            <Text style={styles.axisLabel}>H</Text>
            <Text style={styles.axisLabel}>A</Text>
            <Text style={styles.axisLabel}>P</Text>
            <Text style={styles.axisLabel}>P</Text>
            <Text style={styles.axisLabel}>I</Text>
            <Text style={styles.axisLabel}>N</Text>
            <Text style={styles.axisLabel}>E</Text>
            <Text style={styles.axisLabel}>S</Text>
            <Text style={styles.axisLabel}>S</Text>
          </View>
          <View style={styles.graphArea}>
            {/* Simplified graph representation */}
            <View style={styles.graphLine}>
              <View style={[styles.milestone, { left: '15%', bottom: '20%' }]}>
                <View style={[styles.milestoneDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.milestoneText}>7d</Text>
              </View>
              <View style={[styles.milestone, { left: '45%', bottom: '45%' }]}>
                <View style={[styles.milestoneDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.milestoneText}>14d</Text>
              </View>
              <View style={[styles.milestone, { left: '75%', bottom: '70%' }]}>
                <View style={[styles.milestoneDot, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.milestoneText}>30d</Text>
              </View>
            </View>
            <Text style={styles.axisLabelX}>TIME</Text>
          </View>
        </View>

        {/* Motivational text */}
        <View style={styles.textContainer}>
          <Text style={styles.motivationalText}>
            You're on an amazing journey! Stay focused, and{' '}
            <Text style={styles.boldText}>you'll reach your goal!</Text>
          </Text>
          <Text style={styles.subText}>
            Your dedication will pay off—every step forward brings you closer to your best self!
            Let's do it!
          </Text>
        </View>
      </View>
    </QuestionLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  graphContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: spacing.xl,
  },
  graphYAxis: {
    width: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  axisLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textTertiary,
  },
  graphArea: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.sm,
  },
  graphLine: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  milestone: {
    position: 'absolute',
    alignItems: 'center',
  },
  milestoneDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  milestoneText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: 4,
  },
  axisLabelX: {
    position: 'absolute',
    bottom: -20,
    right: 0,
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textTertiary,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  motivationalText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  boldText: {
    fontFamily: fonts.bold,
  },
  subText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
