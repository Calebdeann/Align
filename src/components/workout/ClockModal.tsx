import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Dimensions, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { playTimerSound } from '@/utils/sounds';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CIRCLE_SIZE = 220;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Fixed height for content area to prevent jumping
const CONTENT_HEIGHT = 420;

type ClockTab = 'timer' | 'stopwatch';

interface ClockModalProps {
  visible: boolean;
  onClose: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ClockModal({ visible, onClose }: ClockModalProps) {
  const [activeTab, setActiveTab] = useState<ClockTab>('timer');

  // Timer state (countdown)
  const [timerSeconds, setTimerSeconds] = useState(120); // Default 2:00
  const [timerRunning, setTimerRunning] = useState(false);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(120);

  // Stopwatch state (count up)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation value for circle progress
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            const { vibrationEnabled, timerSoundId } = useUserPreferencesStore.getState();
            if (vibrationEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            playTimerSound(timerSoundId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerRunning]);

  // Stopwatch logic
  useEffect(() => {
    if (stopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    }

    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, [stopwatchRunning]);

  // Update progress animation for timer
  useEffect(() => {
    if (activeTab === 'timer' && initialTimerSeconds > 0) {
      const progress = (initialTimerSeconds - timerSeconds) / initialTimerSeconds;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [timerSeconds, initialTimerSeconds, activeTab]);

  // Update progress animation for stopwatch (cycles every 60 seconds)
  useEffect(() => {
    if (activeTab === 'stopwatch') {
      const progress = (stopwatchSeconds % 60) / 60;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [stopwatchSeconds, activeTab]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerAdjust = (delta: number) => {
    if (!timerRunning) {
      const newValue = Math.max(0, timerSeconds + delta);
      setTimerSeconds(newValue);
      setInitialTimerSeconds(newValue);
    } else {
      const newValue = Math.max(0, timerSeconds + delta);
      setTimerSeconds(newValue);
    }
  };

  const handleStopwatchAdjust = (delta: number) => {
    const newValue = Math.max(0, stopwatchSeconds + delta);
    setStopwatchSeconds(newValue);
  };

  const handleTimerStartStop = () => {
    if (timerRunning) {
      setTimerRunning(false);
    } else {
      if (timerSeconds === 0) {
        setTimerSeconds(initialTimerSeconds);
      }
      setTimerRunning(true);
    }
  };

  const handleStopwatchStartStop = () => {
    if (stopwatchRunning) {
      setStopwatchRunning(false);
    } else {
      setStopwatchRunning(true);
    }
  };

  const handleTabChange = (tab: ClockTab) => {
    setActiveTab(tab);
    if (tab === 'timer') {
      const progress =
        initialTimerSeconds > 0 ? (initialTimerSeconds - timerSeconds) / initialTimerSeconds : 0;
      progressAnim.setValue(progress);
    } else {
      const progress = (stopwatchSeconds % 60) / 60;
      progressAnim.setValue(progress);
    }
  };

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const handleClose = () => {
    onClose();
  };

  const isRunning = activeTab === 'timer' ? timerRunning : stopwatchRunning;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Title */}
          <Text style={styles.title}>Clock</Text>

          {/* Tab Toggle */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'timer' && styles.tabActive]}
              onPress={() => handleTabChange('timer')}
            >
              <Text style={[styles.tabText, activeTab === 'timer' && styles.tabTextActive]}>
                Timer
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'stopwatch' && styles.tabActive]}
              onPress={() => handleTabChange('stopwatch')}
            >
              <Text style={[styles.tabText, activeTab === 'stopwatch' && styles.tabTextActive]}>
                Stop Watch
              </Text>
            </Pressable>
          </View>

          {/* Fixed height content area to prevent jumping */}
          <View style={styles.contentArea}>
            {/* Circle Display */}
            <View style={styles.circleContainer}>
              <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.progressRing}>
                {/* Background circle - grey */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke="#E5E5E5"
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                />
                {/* Progress circle - purple */}
                <AnimatedCircle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke={colors.primary}
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  rotation="-90"
                  origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
                />
              </Svg>

              <View style={styles.timeDisplay}>
                <Text style={styles.timeText}>
                  {activeTab === 'timer' ? formatTime(timerSeconds) : formatTime(stopwatchSeconds)}
                </Text>
              </View>
            </View>

            {/* Adjust buttons - always visible for both tabs */}
            <View style={styles.adjustButtons}>
              <Pressable
                style={styles.adjustButton}
                onPress={() =>
                  activeTab === 'timer' ? handleTimerAdjust(-15) : handleStopwatchAdjust(-15)
                }
              >
                <Text style={styles.adjustText}>-15s</Text>
              </Pressable>
              <Pressable
                style={styles.adjustButton}
                onPress={() =>
                  activeTab === 'timer' ? handleTimerAdjust(15) : handleStopwatchAdjust(15)
                }
              >
                <Text style={styles.adjustText}>+15s</Text>
              </Pressable>
            </View>

            {/* Start/Stop Button */}
            <Pressable
              style={[styles.actionButton, isRunning && styles.actionButtonRunning]}
              onPress={activeTab === 'timer' ? handleTimerStartStop : handleStopwatchStartStop}
            >
              <Text style={[styles.actionButtonText, isRunning && styles.actionButtonTextRunning]}>
                {isRunning ? 'Stop' : 'Start'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.xl,
    width: SCREEN_WIDTH - 48,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  contentArea: {
    width: '100%',
    alignItems: 'center',
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressRing: {
    position: 'absolute',
  },
  timeDisplay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: fonts.bold,
    fontSize: 56,
    color: colors.text,
  },
  adjustButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  adjustButton: {
    padding: spacing.md,
  },
  adjustText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonRunning: {
    backgroundColor: '#E8E8E8',
  },
  actionButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
  actionButtonTextRunning: {
    color: colors.text,
  },
});
