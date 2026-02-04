import { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ActiveWorkoutWidget() {
  const { t } = useTranslation();
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isMinimized = activeWorkout?.isMinimized ?? false;

  // Use local display time to avoid reading from store each tick.
  // This prevents compounding if any other timer also writes to the store.
  const [displaySeconds, setDisplaySeconds] = useState(activeWorkout?.elapsedSeconds ?? 0);

  const exercises = activeWorkout?.exercises ?? [];
  const exerciseCount = exercises.length;
  const completedSets = useMemo(
    () => exercises.reduce((total, ex) => total + ex.sets.filter((s) => s.completed).length, 0),
    [exercises]
  );

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

  const handlePress = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    router.push('/active-workout');
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.7 }]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="barbell" size={20} color="#FFFFFF" />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{t('workout.activeWorkout')}</Text>
        <Text style={styles.subtitle}>
          {t('workout.exerciseCount', { count: exerciseCount })} •{' '}
          {t('workout.setCount', { count: completedSets })}
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
