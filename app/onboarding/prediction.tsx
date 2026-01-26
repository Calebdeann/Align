import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Line,
  ClipPath,
  Rect,
} from 'react-native-svg';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRAPH_WIDTH = SCREEN_WIDTH;
const GRAPH_HEIGHT = 350;

export default function PredictionScreen() {
  const { currentWeight, targetWeight } = useOnboardingStore();

  const isLosing = targetWeight < currentWeight;

  // Calculate target date - 1 month from now
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + 1);
  const targetDateString = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const graphReveal = useRef(new Animated.Value(0)).current;
  const endCircleScale = useRef(new Animated.Value(0)).current;
  const startCircleScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: fade in title -> reveal graph left to right -> pop circles
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(startCircleScale, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
      Animated.timing(graphReveal, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(endCircleScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(3)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Light purple color for gradient
  const lightPurple = '#DEB8FF';

  // Graph positioning
  const circleStartX = 65; // Where the start circle sits
  const circleEndX = GRAPH_WIDTH - 65; // Where the end circle sits

  // Y positions for the circles (on the curve)
  const topY = 50; // Top of curve
  const bottomY = GRAPH_HEIGHT - 80; // Bottom of curve

  // For weight loss: start high, end low
  // For weight gain: start low, end high
  const circleStartY = isLosing ? topY : bottomY;
  const circleEndY = isLosing ? bottomY : topY;

  // Generate S-curve path with proper bezier control points
  // The curve should be flat at start, steep in middle, flat at end
  const generatePath = () => {
    // Extend curve beyond circles to screen edges
    const extendLeft = 60;
    const extendRight = 60;

    const startX = -extendLeft;
    const endX = GRAPH_WIDTH + extendRight;

    // Y values stay flat at the edges
    const startY = circleStartY;
    const endY = circleEndY;

    // Control points for S-curve
    // First control point: keeps start flat, then pulls toward middle
    const cp1x = circleStartX + (circleEndX - circleStartX) * 0.4;
    const cp1y = startY;

    // Second control point: pulls from middle toward end, keeps end flat
    const cp2x = circleStartX + (circleEndX - circleStartX) * 0.6;
    const cp2y = endY;

    return `M ${startX} ${startY} L ${circleStartX} ${circleStartY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${circleEndX} ${circleEndY} L ${endX} ${endY}`;
  };

  // Generate gradient fill path
  const generateFillPath = () => {
    const extendLeft = 60;
    const extendRight = 60;

    const startX = -extendLeft;
    const endX = GRAPH_WIDTH + extendRight;

    const startY = circleStartY;
    const endY = circleEndY;

    const cp1x = circleStartX + (circleEndX - circleStartX) * 0.4;
    const cp1y = startY;
    const cp2x = circleStartX + (circleEndX - circleStartX) * 0.6;
    const cp2y = endY;

    return `M ${startX} ${startY} L ${circleStartX} ${circleStartY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${circleEndX} ${circleEndY} L ${endX} ${endY} L ${endX} ${GRAPH_HEIGHT} L ${startX} ${GRAPH_HEIGHT} Z`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '56%' }]} />
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, { opacity: fadeIn }]}>
        <Text style={styles.titleText}>We predict that you'll be</Text>
        <Text style={styles.weightDateText}>
          <Text style={styles.weightText}>{Math.round(targetWeight)}kg</Text>
          <Text style={styles.byText}> by </Text>
          <Text style={styles.dateText}>{targetDateString}</Text>
        </Text>
      </Animated.View>

      {/* Graph - Full Width */}
      <Animated.View style={[styles.graphContainer, { opacity: fadeIn }]}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          <Defs>
            <LinearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lightPurple} stopOpacity="0.6" />
              <Stop offset="1" stopColor={lightPurple} stopOpacity="0.1" />
            </LinearGradient>
            <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={lightPurple} />
              <Stop offset="1" stopColor={colors.primary} />
            </LinearGradient>
            <ClipPath id="graphClip">
              <AnimatedRect
                x="0"
                y="0"
                height={GRAPH_HEIGHT}
                width={graphReveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [circleStartX, GRAPH_WIDTH + 60],
                })}
              />
            </ClipPath>
          </Defs>

          {/* Gradient fill under curve - clipped for reveal animation */}
          <Path d={generateFillPath()} fill="url(#graphGradient)" clipPath="url(#graphClip)" />

          {/* Vertical dashed line at start */}
          <Line
            x1={circleStartX}
            y1={circleStartY}
            x2={circleStartX}
            y2={GRAPH_HEIGHT}
            stroke={lightPurple}
            strokeWidth={1.5}
            strokeDasharray="6,6"
            opacity={0.7}
          />

          {/* Vertical dashed line at end - clipped for reveal */}
          <Line
            x1={circleEndX}
            y1={circleEndY}
            x2={circleEndX}
            y2={GRAPH_HEIGHT}
            stroke={colors.primary}
            strokeWidth={1.5}
            strokeDasharray="6,6"
            opacity={0.7}
            clipPath="url(#graphClip)"
          />

          {/* Main curve line - clipped for reveal animation */}
          <Path
            d={generatePath()}
            stroke="url(#lineGradient)"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            clipPath="url(#graphClip)"
          />

          {/* Start point - animated scale */}
          <AnimatedCircle
            cx={circleStartX}
            cy={circleStartY}
            r={startCircleScale.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 8],
            })}
            fill={lightPurple}
          />

          {/* End point (goal) - animated scale */}
          <AnimatedCircle
            cx={circleEndX}
            cy={circleEndY}
            r={endCircleScale.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 8],
            })}
            fill={colors.primary}
          />
        </Svg>

        {/* Labels below graph */}
        <View style={styles.graphLabels}>
          <Text style={styles.labelText}>Today</Text>
          <Text style={styles.labelText}>{targetDateString}</Text>
        </View>
      </Animated.View>

      {/* Potential text */}
      <Animated.View style={[styles.potentialContainer, { opacity: fadeIn }]}>
        <Text style={styles.potentialTitle}>You have massive potential</Text>
        <Text style={styles.potentialSubtitle}>
          We are starting to get a clear picture of you and your body.
        </Text>
      </Animated.View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push('/onboarding/training-location');
          }}
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
    backgroundColor: colors.backgroundOnboarding,
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
  titleContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  weightDateText: {
    textAlign: 'center',
  },
  weightText: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.primary,
  },
  byText: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.text,
  },
  dateText: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.primary,
  },
  graphContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  labelText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  potentialContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  potentialTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  potentialSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
