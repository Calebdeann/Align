import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ActiveWorkoutWidget from '@/components/workout/ActiveWorkoutWidget';
import { FloatingTabBar, FLOATING_TAB_BAR_HEIGHT } from '@/components';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useExerciseStore } from '@/stores/exerciseStore';

function LegacyTabsContent() {
  const { t } = useTranslation();
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const isMinimized = activeWorkout?.isMinimized ?? false;

  return (
    <View style={styles.container}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          contentStyle: { paddingBottom: FLOATING_TAB_BAR_HEIGHT },
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('tabs.schedule') }} />
        <Tabs.Screen name="workout" options={{ title: t('tabs.workout') }} />
        <Tabs.Screen name="recovery" options={{ title: t('tabs.recovery') }} />
        <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
      </Tabs>
      {isMinimized && (
        <View style={styles.widgetContainer}>
          <ActiveWorkoutWidget />
        </View>
      )}
    </View>
  );
}

export default function LegacyLayout() {
  const loadExercises = useExerciseStore((state) => state.loadExercises);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  return <LegacyTabsContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  widgetContainer: {
    position: 'absolute',
    bottom: FLOATING_TAB_BAR_HEIGHT,
    left: 0,
    right: 0,
  },
});
