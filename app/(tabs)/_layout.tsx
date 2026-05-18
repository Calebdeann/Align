import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import LiquidGlassTabBar, { LIQUID_TAB_BAR_HEIGHT } from '@/components/ui/LiquidGlassTabBar';
import ActiveWorkoutWidget from '@/components/workout/ActiveWorkoutWidget';
import { useWorkoutStore } from '@/stores/workoutStore';

export default function TabsLayout() {
  const isMinimized = useWorkoutStore((s) => s.activeWorkout?.isMinimized ?? false);

  return (
    <View style={styles.container}>
      <Tabs
        tabBar={(props) => <LiquidGlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          contentStyle: { paddingBottom: LIQUID_TAB_BAR_HEIGHT },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Friends' }} />
        <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
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
  container: { flex: 1 },
  widgetContainer: {
    position: 'absolute',
    bottom: LIQUID_TAB_BAR_HEIGHT,
    left: 0,
    right: 0,
  },
});
