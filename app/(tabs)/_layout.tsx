import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { CalendarIcon, WorkoutIcon, ProfileIcon } from '@/components/icons';
import { colors } from '@/constants/theme';
import ActiveWorkoutWidget from '@/components/workout/ActiveWorkoutWidget';
import { useWorkoutStore } from '@/stores/workoutStore';

export default function TabsLayout() {
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const isMinimized = activeWorkout?.isMinimized ?? false;

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
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => <WorkoutIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
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
