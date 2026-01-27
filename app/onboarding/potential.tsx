import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import QuestionLayout from '@/components/QuestionLayout';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - 40; // Account for padding and Y-axis
const CHART_HEIGHT = 200;

// Chart colors - purple brand gradient flowing to warm coral
// Colors chosen to blend smoothly along the curve
const COLOR_START = '#947AFF'; // Our brand purple (0%)
const COLOR_3DAYS = '#A855F7'; // Violet purple (~22%)
const COLOR_7DAYS = '#D946EF'; // Magenta/fuchsia (~42%)
const COLOR_END = '#F472B6'; // Warm pink/coral (100%)

const goalMotivationalText: Record<string, string> = {
  lose: 'Women like you see real results within weeks, not months',
  tone: "You're not starting from scratch, you're building on what's already there",
  health: 'Strong women move better, feel better, and live longer',
  love: "This isn't about fixing yourself, it's about finding out what you're capable of",
};

export default function PotentialScreen() {
  const { mainGoal } = useOnboardingStore();

  const dynamicText =
    (mainGoal && goalMotivationalText[mainGoal]) || "Stay focused, and you'll reach your goal!";

  // Define the curve points
  const startX = 0;
  const startY = CHART_HEIGHT - 30; // Start near bottom

  const point3Days = { x: CHART_WIDTH * 0.22, y: CHART_HEIGHT - 70 };
  const point7Days = { x: CHART_WIDTH * 0.42, y: CHART_HEIGHT - 95 };
  const point30Days = { x: CHART_WIDTH * 0.85, y: CHART_HEIGHT - 170 };

  // Create smooth curve path
  const curvePath = `
    M ${startX} ${startY}
    Q ${point3Days.x * 0.5} ${startY - 10}, ${point3Days.x} ${point3Days.y}
    Q ${(point3Days.x + point7Days.x) / 2} ${point3Days.y - 15}, ${point7Days.x} ${point7Days.y}
    Q ${(point7Days.x + point30Days.x) / 2} ${point7Days.y - 20}, ${point30Days.x} ${point30Days.y}
  `;

  // Create fill path (closes the curve to bottom)
  const fillPath = `
    ${curvePath}
    L ${point30Days.x} ${CHART_HEIGHT}
    L ${startX} ${CHART_HEIGHT}
    Z
  `;

  return (
    <QuestionLayout
      question="You have great potential to crush your goals"
      progress={16}
      showContinue
      onContinue={() => router.push('/onboarding/referral')}
      onSkip={() => router.push('/onboarding/referral')}
    >
      <View style={styles.content}>
        {/* Chart Container */}
        <View style={styles.chartContainer}>
          {/* Y-Axis Label */}
          <View style={styles.yAxisContainer}>
            <Text style={styles.yAxisLabel}>Goal Reacher</Text>
          </View>

          {/* Chart Area */}
          <View style={styles.chartArea}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 40}>
              <Defs>
                {/* Gradient for the fill - smooth 4-stop gradient */}
                <LinearGradient id="fillGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor={COLOR_START} stopOpacity="0.12" />
                  <Stop offset="22%" stopColor={COLOR_3DAYS} stopOpacity="0.15" />
                  <Stop offset="42%" stopColor={COLOR_7DAYS} stopOpacity="0.18" />
                  <Stop offset="100%" stopColor={COLOR_END} stopOpacity="0.22" />
                </LinearGradient>

                {/* Gradient for the line - matches circle positions */}
                <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor={COLOR_START} />
                  <Stop offset="22%" stopColor={COLOR_3DAYS} />
                  <Stop offset="42%" stopColor={COLOR_7DAYS} />
                  <Stop offset="100%" stopColor={COLOR_END} />
                </LinearGradient>
              </Defs>

              {/* Y-axis line */}
              <Line x1={0} y1={0} x2={0} y2={CHART_HEIGHT} stroke="#333" strokeWidth={2.5} />

              {/* X-axis line */}
              <Line
                x1={0}
                y1={CHART_HEIGHT}
                x2={CHART_WIDTH}
                y2={CHART_HEIGHT}
                stroke="#333"
                strokeWidth={2.5}
              />

              {/* Gradient fill under curve */}
              <Path d={fillPath} fill="url(#fillGradient)" />

              {/* Main curve line */}
              <Path
                d={curvePath}
                stroke="url(#lineGradient)"
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
              />

              {/* Dashed vertical lines - matching gradient colors */}
              <Line
                x1={point3Days.x}
                y1={point3Days.y}
                x2={point3Days.x}
                y2={CHART_HEIGHT}
                stroke={COLOR_3DAYS}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />
              <Line
                x1={point7Days.x}
                y1={point7Days.y}
                x2={point7Days.x}
                y2={CHART_HEIGHT}
                stroke={COLOR_7DAYS}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />
              <Line
                x1={point30Days.x}
                y1={point30Days.y}
                x2={point30Days.x}
                y2={CHART_HEIGHT}
                stroke={COLOR_END}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {/* Milestone circles - colors match gradient at their position */}
              {/* 3 Days */}
              <Circle
                cx={point3Days.x}
                cy={point3Days.y}
                r={10}
                fill="white"
                stroke={COLOR_3DAYS}
                strokeWidth={3}
              />

              {/* 7 Days */}
              <Circle
                cx={point7Days.x}
                cy={point7Days.y}
                r={10}
                fill="white"
                stroke={COLOR_7DAYS}
                strokeWidth={3}
              />

              {/* 30 Days / Goal */}
              <Circle
                cx={point30Days.x}
                cy={point30Days.y}
                r={10}
                fill="white"
                stroke={COLOR_END}
                strokeWidth={3}
              />
            </Svg>

            {/* X-axis labels */}
            <View style={styles.xAxisLabels}>
              <Text style={[styles.xLabel, { left: point3Days.x - 20 }]}>3 Days</Text>
              <Text style={[styles.xLabel, { left: point7Days.x - 20 }]}>7 Days</Text>
              <Text style={[styles.xLabel, styles.xLabel30Days, { left: point30Days.x - 25 }]}>
                30 Days
              </Text>
            </View>

            {/* Goal label */}
            <Text style={[styles.goalLabel, { left: point30Days.x - 15, top: point30Days.y - 30 }]}>
              Goal
            </Text>
          </View>
        </View>

        {/* Motivational text */}
        <View style={styles.textContainer}>
          <Text style={styles.motivationalText}>{dynamicText}</Text>
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
  chartContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  yAxisContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  yAxisLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#333',
    transform: [{ rotate: '-90deg' }],
    width: 100,
    textAlign: 'center',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  xLabel: {
    position: 'absolute',
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#333',
    bottom: 12,
  },
  xLabel30Days: {
    fontFamily: fonts.bold,
  },
  goalLabel: {
    position: 'absolute',
    fontFamily: fonts.bold,
    fontSize: 14,
    color: COLOR_END,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  motivationalText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
