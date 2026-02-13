import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, WorkoutIcon, ProfileIcon } from '@/components/icons';
import { colors } from '@/constants/theme';
import ActiveWorkoutWidget from '@/components/workout/ActiveWorkoutWidget';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useExerciseStore } from '@/stores/exerciseStore';

// Custom tab bar button with haptic feedback
function HapticTabButton(props: any) {
  const { onPress, children, style, accessibilityState, ...rest } = props;

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

function TabsContent() {
  const { t } = useTranslation();
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const isMinimized = activeWorkout?.isMinimized ?? false;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.schedule'),
            tabBarIcon: ({ color }) => <CalendarIcon color={color} />,
            tabBarLabel: ({ color }) => (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[styles.tabLabel, { color }]}
              >
                {t('tabs.schedule')}
              </Text>
            ),
            tabBarButton: (props) => <HapticTabButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{
            title: t('tabs.workout'),
            tabBarIcon: ({ color }) => <WorkoutIcon color={color} />,
            tabBarLabel: ({ color }) => (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[styles.tabLabel, { color }]}
              >
                {t('tabs.workout')}
              </Text>
            ),
            tabBarButton: (props) => <HapticTabButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
            tabBarLabel: ({ color }) => (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[styles.tabLabel, { color }]}
              >
                {t('tabs.profile')}
              </Text>
            ),
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

export default function TabsLayout() {
  const loadExercises = useExerciseStore((state) => state.loadExercises);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  return <TabsContent />;
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
  tabLabel: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 11,
    marginTop: 2,
  },
  widgetContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
});
