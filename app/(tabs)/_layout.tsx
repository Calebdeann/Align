import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import LiquidGlassTabBar, { LIQUID_TAB_BAR_HEIGHT } from '@/components/ui/LiquidGlassTabBar';
import ActiveWorkoutWidget from '@/components/workout/ActiveWorkoutWidget';
import { PaywallGate } from '@/components/PaywallGate';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useUISignals } from '@/stores/uiSignalsStore';

// PaywallGate is always mounted, but whether it actually presents Superwall
// is controlled at runtime by the `in_app_paywall_enabled` row in Supabase's
// `app_config` table (see useSubscriptionGate). Ships disabled — flip the
// row to TRUE in Supabase to re-enable globally without rebuilding.
export default function TabsLayout() {
  const isMinimized = useWorkoutStore((s) => s.activeWorkout?.isMinimized ?? false);

  return (
    <PaywallGate>
      <View style={styles.container}>
        <Tabs
          tabBar={(props) => <LiquidGlassTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            contentStyle: { paddingBottom: LIQUID_TAB_BAR_HEIGHT },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{ title: 'Friends' }}
            listeners={({ navigation }) => ({
              // Tap-while-focused on Friends → scroll Discover to top + silent reload.
              // No preventDefault — LiquidGlassTabBar already skips navigate() when active.
              tabPress: () => {
                if (navigation.isFocused()) {
                  useUISignals.getState().requestDiscoverReload();
                }
              },
            })}
          />
          <Tabs.Screen name="plan" options={{ title: 'Planner' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
        {isMinimized && (
          <View style={styles.widgetContainer}>
            <ActiveWorkoutWidget />
          </View>
        )}
      </View>
    </PaywallGate>
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
