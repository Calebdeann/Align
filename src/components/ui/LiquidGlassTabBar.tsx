import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  LiquidGlassView,
  LiquidGlassContainerView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';
import { fonts } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// Approximate height of ActiveWorkoutWidget (paddingVertical 20 + content 34 + marginBottom 8)
const WIDGET_HEIGHT = 70;

// Critically-damped slide — matches Apple's UITabBar feel. No visible overshoot.
const TAB_SPRING = {
  mass: 1,
  damping: 26,
  stiffness: 280,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const TABS = [
  {
    name: 'index',
    label: 'Friends',
    icon: 'people' as const,
    iconOutline: 'people-outline' as const,
  },
  {
    name: 'plan',
    label: 'Planner',
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

// Height of the pill area + spacing above — consumed by screens for bottom padding
export const LIQUID_TAB_BAR_HEIGHT = 100;

export default function LiquidGlassTabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const pillWidth = Math.round(width * 0.52);
  const slotWidth = Math.round(pillWidth / 3);
  const PILL_H = 62;
  const IND_H = 50;
  const IND_W = slotWidth - 6;

  const indicatorX = useSharedValue(state.index * slotWidth);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * slotWidth, TAB_SPRING);
  }, [state.index, slotWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const isPlanTab = state.index === 1;
  const hasActiveWorkout = useWorkoutStore((s) => s.activeWorkout?.isMinimized ?? false);

  const fabBottom = useSharedValue(LIQUID_TAB_BAR_HEIGHT);
  useEffect(() => {
    fabBottom.value = withSpring(
      hasActiveWorkout ? LIQUID_TAB_BAR_HEIGHT + WIDGET_HEIGHT : LIQUID_TAB_BAR_HEIGHT,
      TAB_SPRING
    );
  }, [hasActiveWorkout]);

  const fabAnimStyle = useAnimatedStyle(() => ({ bottom: fabBottom.value }));

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {/* Shadow wrapper — solid white container, no glass on the outer shell */}
      <View
        style={[styles.pillShadow, { width: pillWidth, height: PILL_H, borderRadius: PILL_H / 2 }]}
      >
        <View
          style={[
            styles.pillSurface,
            { width: pillWidth, height: PILL_H, borderRadius: PILL_H / 2 },
          ]}
        >
          {isLiquidGlassSupported ? (
            <LiquidGlassContainerView spacing={0} style={StyleSheet.absoluteFill}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.indicatorAbs,
                  { width: IND_W, height: IND_H, top: (PILL_H - IND_H) / 2, left: 3 },
                  indicatorStyle,
                ]}
              >
                <LiquidGlassView
                  effect="regular"
                  tintColor="rgba(255,255,255,0.10)"
                  style={[styles.indicatorGlass, { width: IND_W, height: IND_H }]}
                />
              </Animated.View>
            </LiquidGlassContainerView>
          ) : (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicatorFallback,
                { width: IND_W, height: IND_H, top: (PILL_H - IND_H) / 2, left: 3 },
                indicatorStyle,
              ]}
            />
          )}

          {TABS.map((tab, i) => {
            const route = state.routes[i];
            const isActive = state.index === i;
            return (
              <Pressable
                key={tab.name}
                style={[styles.tabItem, { width: slotWidth, height: PILL_H }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
                  color={isActive ? '#000000' : 'rgba(0,0,0,0.45)'}
                />
                <Text style={[styles.label, { color: isActive ? '#000000' : 'rgba(0,0,0,0.45)' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Plan tab FAB — floats above the live workout widget when one is active */}
      {isPlanTab && (
        <Animated.View style={[styles.fabShadow, fabAnimStyle]}>
          {isLiquidGlassSupported ? (
            <LiquidGlassView
              effect="regular"
              interactive
              tintColor="rgba(255,255,255,0.75)"
              style={styles.fabSurface}
            >
              <Pressable
                style={styles.fabPressable}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  router.push('/start-workout-sheet');
                }}
              >
                <Ionicons name="add" size={34} color="#000000" />
              </Pressable>
            </LiquidGlassView>
          ) : (
            <View style={[styles.fabSurface, styles.fabFallback]}>
              <Pressable
                style={styles.fabPressable}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  router.push('/start-workout-sheet');
                }}
              >
                <Ionicons name="add" size={34} color="#000000" />
              </Pressable>
            </View>
          )}
        </Animated.View>
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
    zIndex: 100,
  },
  pillShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  pillSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  indicatorAbs: {
    position: 'absolute',
    zIndex: 0,
  },
  indicatorGlass: {
    borderRadius: 25,
  },
  indicatorFallback: {
    position: 'absolute',
    zIndex: 0,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.08)',
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
  fabShadow: {
    position: 'absolute',
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  fabSurface: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  fabFallback: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  fabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
