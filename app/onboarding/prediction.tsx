import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRAPH_WIDTH = SCREEN_WIDTH - spacing.lg * 4;
const GRAPH_HEIGHT = 200;

export default function PredictionScreen() {
  const { currentWeight, targetWeight, weeklyGoal } = useOnboardingStore();

  const isLosing = targetWeight < currentWeight;
  const weightDiff = Math.abs(targetWeight - currentWeight);
  const weeksToGoal = Math.ceil(weightDiff / (weeklyGoal || 0.5));

  // Calculate target date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksToGoal * 7);
  const targetDateString = targetDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const graphProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(graphProgress, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  // Generate curved path for the graph
  const generatePath = () => {
    const startY = isLosing ? 30 : GRAPH_HEIGHT - 50;
    const endY = isLosing ? GRAPH_HEIGHT - 50 : 30;
    const midY = (startY + endY) / 2;

    // Create a smooth curve using quadratic bezier
    const startX = 20;
    const endX = GRAPH_WIDTH - 20;
    const midX = (startX + endX) / 2;

    return `M ${startX} ${startY} Q ${midX} ${midY + (isLosing ? 40 : -40)} ${endX} ${endY}`;
  };

  // Generate gradient fill path
  const generateFillPath = () => {
    const startY = isLosing ? 30 : GRAPH_HEIGHT - 50;
    const endY = isLosing ? GRAPH_HEIGHT - 50 : 30;
    const midY = (startY + endY) / 2;

    const startX = 20;
    const endX = GRAPH_WIDTH - 20;
    const midX = (startX + endX) / 2;

    return `M ${startX} ${startY} Q ${midX} ${midY + (isLosing ? 40 : -40)} ${endX} ${endY} L ${endX} ${GRAPH_HEIGHT} L ${startX} ${GRAPH_HEIGHT} Z`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '96%' }]} />
        </View>

        <Pressable onPress={() => router.push('/onboarding/training-location')}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, { opacity: fadeIn }]}>
        <Text style={styles.titleText}>We predict you'll be</Text>
        <Text style={styles.weightText}>{Math.round(targetWeight)} kg</Text>
        <Text style={styles.titleText}>by {targetDateString}</Text>
      </Animated.View>

      {/* Graph Card */}
      <Animated.View style={[styles.graphCard, { opacity: fadeIn }]}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          <Defs>
            <LinearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity={isLosing ? '0.3' : '0.1'} />
              <Stop offset="1" stopColor={colors.primary} stopOpacity={isLosing ? '0.05' : '0.3'} />
            </LinearGradient>
          </Defs>

          {/* Gradient fill under curve */}
          <Path d={generateFillPath()} fill="url(#graphGradient)" />

          {/* Main curve line */}
          <Path
            d={generatePath()}
            stroke={colors.primary}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />

          {/* Start point */}
          <Circle
            cx={20}
            cy={isLosing ? 30 : GRAPH_HEIGHT - 50}
            r={8}
            fill={colors.background}
            stroke={colors.textSecondary}
            strokeWidth={3}
          />

          {/* End point (goal) */}
          <Circle
            cx={GRAPH_WIDTH - 20}
            cy={isLosing ? GRAPH_HEIGHT - 50 : 30}
            r={10}
            fill={colors.primary}
            stroke={colors.background}
            strokeWidth={3}
          />
        </Svg>

        {/* Labels */}
        <View style={styles.graphLabels}>
          <View style={styles.labelLeft}>
            <Text style={styles.labelWeight}>{Math.round(currentWeight)} kg</Text>
            <Text style={styles.labelDate}>Today</Text>
          </View>
          <View style={styles.labelRight}>
            <Text style={[styles.labelWeight, { color: colors.primary }]}>
              {Math.round(targetWeight)} kg
            </Text>
            <Text style={styles.labelDate}>Goal</Text>
          </View>
        </View>
      </Animated.View>

      {/* Potential text */}
      <Animated.View style={[styles.potentialContainer, { opacity: fadeIn }]}>
        <Text style={styles.potentialEmoji}>✨</Text>
        <Text style={styles.potentialText}>You have massive potential</Text>
      </Animated.View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => router.push('/onboarding/training-location')}
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressBarFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  titleContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: fonts.medium,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  weightText: {
    fontFamily: fonts.bold,
    fontSize: 42,
    color: colors.primary,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  graphCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
  },
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  labelLeft: {
    alignItems: 'flex-start',
  },
  labelRight: {
    alignItems: 'flex-end',
  },
  labelWeight: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  labelDate: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  potentialContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  potentialEmoji: {
    fontSize: 24,
  },
  potentialText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
});
