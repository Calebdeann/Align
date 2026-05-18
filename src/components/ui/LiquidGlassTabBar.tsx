import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { fonts } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TABS = [
  {
    name: 'index',
    label: 'Friends',
    icon: 'people' as const,
    iconOutline: 'people-outline' as const,
  },
  {
    name: 'plan',
    label: 'Plan',
    icon: 'calendar' as const,
    iconOutline: 'calendar-outline' as const,
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person' as const,
    iconOutline: 'person-outline' as const,
  },
];

// Height of the pill + spacing above it — use for screen bottom padding
export const LIQUID_TAB_BAR_HEIGHT = 100;

export default function LiquidGlassTabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const pillWidth = Math.round(width * 0.52);
  const slotWidth = Math.round(pillWidth / 3);
  const PILL_H = 68;
  const IND_H = 54;
  const IND_W = slotWidth - 6;

  const indicatorX = useSharedValue(state.index * slotWidth);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * slotWidth, {
      damping: 22,
      stiffness: 210,
    });
  }, [state.index, slotWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const isPlanTab = state.index === 1;
  const hasActiveWorkout = useWorkoutStore((s) => s.activeWorkout?.isMinimized ?? false);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {/* Shadow wrapper — needed so shadow isn't clipped by overflow:hidden on pill */}
      <View style={[styles.pillShadow, { width: pillWidth, height: PILL_H }]}>
        <View style={[styles.pill, { width: pillWidth, height: PILL_H }]}>
          {/* Sliding active indicator */}
          <Animated.View
            style={[
              styles.indicator,
              { width: IND_W, height: IND_H, top: (PILL_H - IND_H) / 2, left: 3 },
              indicatorStyle,
            ]}
          />

          {/* Tab buttons — rendered above indicator via z-index */}
          {TABS.map((tab, i) => {
            const route = state.routes[i];
            const isActive = state.index === i;
            return (
              <Pressable
                key={tab.name}
                style={[styles.tabItem, { width: slotWidth, height: PILL_H }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route?.key,
                    canPreventDefault: true,
                  });
                  if (!isActive && !event.defaultPrevented) {
                    navigation.navigate(tab.name);
                  }
                }}
              >
                <Ionicons
                  name={isActive ? tab.icon : tab.iconOutline}
                  size={22}
                  color={isActive ? '#000000' : 'rgba(0,0,0,0.35)'}
                />
                <Text style={[styles.label, { color: isActive ? '#000000' : 'rgba(0,0,0,0.35)' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Plan tab FAB — hidden when a workout is in progress (widget takes over) */}
      {isPlanTab && !hasActiveWorkout && (
        <Pressable
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/start-workout-sheet');
          }}
        >
          <Ionicons name="add" size={34} color="#000000" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 8,
  },
  pillShadow: {
    borderRadius: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 8,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#fdfdfd',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.06)',
    zIndex: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    zIndex: 1,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: -0.2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: LIQUID_TAB_BAR_HEIGHT,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 12,
  },
});
