import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CalendarIcon, WorkoutIcon, ProfileIcon } from '@/components/icons';
import { colors } from '@/constants/theme';
import ActiveWorkoutWidget from '@/components/workout/ActiveWorkoutWidget';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useExerciseStore } from '@/stores/exerciseStore';

// Custom tab bar button with haptic feedback
function HapticTabButton(props: any) {
  const { onPress, children, style, accessibilityState, ...rest } = props;

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[style, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const isMinimized = activeWorkout?.isMinimized ?? false;
  const loadExercises = useExerciseStore((state) => state.loadExercises);

  // Prefetch exercises when tabs load so they're ready when user needs them
  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textTertiary,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Planner',
            tabBarIcon: ({ color }) => <CalendarIcon color={color} />,
            tabBarButton: (props) => <HapticTabButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => <WorkoutIcon color={color} />,
            tabBarButton: (props) => <HapticTabButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
            tabBarButton: (props) => <HapticTabButton {...props} />,
          }}
        />
      </Tabs>
      {isMinimized && (
        <View style={styles.widgetContainer}>
          <ActiveWorkoutWidget />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.background,
    borderTopWidth: 0,
    elevation: 0,
    height: 80,
    paddingTop: 8,
  },
  widgetContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
});
