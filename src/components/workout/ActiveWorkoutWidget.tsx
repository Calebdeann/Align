import { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, AppState, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fonts, fontSize, spacing } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ActiveWorkoutWidget() {
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const discardActiveWorkout = useWorkoutStore((state) => state.discardActiveWorkout);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isMinimized = activeWorkout?.isMinimized ?? false;

  const [displaySeconds, setDisplaySeconds] = useState(0);

  const exercises = activeWorkout?.exercises ?? [];
  const exerciseCount = exercises.length;
  const completedSets = useMemo(
    () => exercises.reduce((total, ex) => total + ex.sets.filter((s) => s.completed).length, 0),
    [exercises]
  );

  useEffect(() => {
    if (isMinimized) {
      const startedAt = useWorkoutStore.getState().activeWorkout?.startedAt;
      if (!startedAt) return;
      const startedAtMs = new Date(startedAt).getTime();
      const calcElapsed = () => Math.floor((Date.now() - startedAtMs) / 1000);

      setDisplaySeconds(calcElapsed());
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => setDisplaySeconds(calcElapsed()), 1000);

      const appStateSub = AppState.addEventListener('change', (state) => {
        if (state === 'active') setDisplaySeconds(calcElapsed());
      });

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        appStateSub.remove();
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isMinimized]);

  if (!activeWorkout || !activeWorkout.isMinimized) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    router.push('/active-workout');
  };

  const handleDiscard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Discard Workout',
      'Are you sure you want to discard the workout in progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            discardActiveWorkout();
          },
        },
      ]
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.85 }]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="chevron-up" size={20} color="#000" />
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>Workout in Progress</Text>
        <Text style={styles.subtitle}>
          {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'} • {completedSets}{' '}
          {completedSets === 1 ? 'set' : 'sets'} completed
        </Text>
      </View>

      <Text style={styles.timer}>{formatTime(displaySeconds)}</Text>

      <Pressable
        style={({ pressed }) => [styles.discardBtn, pressed && { opacity: 0.6 }]}
        onPress={(e) => {
          e.stopPropagation();
          handleDiscard();
        }}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    gap: 10,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: '#000',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: 'rgba(0,0,0,0.45)',
    marginTop: 1,
  },
  timer: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: '#000',
    letterSpacing: -0.3,
  },
  discardBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
