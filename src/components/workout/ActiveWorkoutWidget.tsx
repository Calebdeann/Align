import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ActiveWorkoutWidget() {
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isMinimized = activeWorkout?.isMinimized ?? false;

  // Use local display time to avoid reading from store each tick.
  // This prevents compounding if any other timer also writes to the store.
  const [displaySeconds, setDisplaySeconds] = useState(activeWorkout?.elapsedSeconds ?? 0);

  useEffect(() => {
    if (isMinimized) {
      // Sync local display time with store value when we start
      const storeSeconds = useWorkoutStore.getState().activeWorkout?.elapsedSeconds ?? 0;
      setDisplaySeconds(storeSeconds);
      let localTime = storeSeconds;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        localTime += 1;
        setDisplaySeconds(localTime);
        // Sync to store so it persists if the app closes
        useWorkoutStore.getState().updateActiveWorkoutTime(localTime);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMinimized]);

  if (!activeWorkout || !activeWorkout.isMinimized) {
    return null;
  }

  const exerciseCount = activeWorkout.exercises.length;
  const completedSets = activeWorkout.exercises.reduce(
    (total, ex) => total + ex.sets.filter((s) => s.completed).length,
    0
  );

  const handlePress = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    router.push('/active-workout');
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.iconContainer}>
        <Ionicons name="barbell" size={20} color="#FFFFFF" />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>Workout in Progress</Text>
        <Text style={styles.subtitle}>
          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} • {completedSets} set
          {completedSets !== 1 ? 's' : ''} completed
        </Text>
      </View>
      <Text style={styles.timer}>{formatTime(displaySeconds)}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timer: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
});
