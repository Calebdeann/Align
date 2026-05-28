import { useEffect } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CalendarIcon, WorkoutIcon, RecoveryIcon, ProfileIcon } from '@/components/icons';

const TAB_HEIGHT = 62;
const INDICATOR_INSET = 5;
const SIDE_MARGIN = 28;
const BOTTOM_MARGIN = 16;

const ICONS = [CalendarIcon, WorkoutIcon, RecoveryIcon, ProfileIcon] as const;

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const barWidth = screenWidth - SIDE_MARGIN * 2;
  const tabWidth = barWidth / state.routes.length;

  const indicatorX = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, {
      damping: 22,
      stiffness: 280,
      mass: 0.9,
    });
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    // Wrapper carries the outer pill glow shadow — 0 0 20px rgba(0,0,0,0.15)
    <View
      style={[styles.wrapper, { bottom: insets.bottom + BOTTOM_MARGIN }]}
      pointerEvents="box-none"
    >
      <BlurView intensity={70} tint="light" style={styles.blur}>
        {/* Glass tint */}
        <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />

        {/* Indicator sits below the icons in render order */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { width: tabWidth - INDICATOR_INSET * 2, left: INDICATOR_INSET },
            indicatorStyle,
          ]}
        />

        {/* Icons render on top of indicator */}
        <View style={[StyleSheet.absoluteFill, styles.tabs]}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const Icon = ICONS[index];

            return (
              <Pressable
                key={route.key}
                style={styles.tab}
                onPress={() => {
                  if (!isFocused) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    navigation.navigate(route.name);
                  }
                }}
              >
                <Icon color={isFocused ? '#000000' : 'rgba(0,0,0,0.28)'} />
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export const FLOATING_TAB_BAR_HEIGHT = TAB_HEIGHT + BOTTOM_MARGIN;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
    height: TAB_HEIGHT,
    // Outer pill glow — Figma: 0 0 20px rgba(0,0,0,0.15)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 500,
    overflow: 'hidden',
  },
  glassOverlay: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 0.75,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_INSET,
    bottom: INDICATOR_INSET,
    borderRadius: 500,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,1)',
    // Inner pill glow — Figma: 0 0 8px rgba(0,0,0,0.25)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
