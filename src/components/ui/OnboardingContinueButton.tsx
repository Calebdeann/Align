import { Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { strongHaptic } from '@/utils/haptics';
import { fonts } from '@/constants/theme';
import { useEffect, useState } from 'react';

interface OnboardingContinueButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  widthRatio?: number;
  autoSize?: boolean;
  labelFontSize?: number;
}

export default function OnboardingContinueButton({
  onPress,
  disabled = false,
  label = 'Continue',
  widthRatio = 0.338,
  autoSize = false,
  labelFontSize,
}: OnboardingContinueButtonProps) {
  const { width } = useWindowDimensions();
  const buttonWidth = Math.round(width * widthRatio);
  const scale = useSharedValue(1);
  const [ready, setReady] = useState(false);
  // Once the user has successfully pressed, we never want the gradient to flip
  // back to grey during the navigation handoff (parent flips `disabled` true→false).
  const [wasPressed, setWasPressed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    if (disabled || !ready) return;
    strongHaptic();
    setWasPressed(true);
    onPress();
  }

  function handlePressIn() {
    if (disabled || !ready) return;
    scale.value = withSpring(0.96, { damping: 22, stiffness: 320 });
  }

  function handlePressOut() {
    if (disabled || !ready) return;
    scale.value = withSpring(1, { damping: 22, stiffness: 320 });
  }

  const showAsDisabled = disabled && !wasPressed;

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={showAsDisabled ? ['#f3f4f4', '#efefef'] : ['#2a2a2a', '#000000']}
          style={[styles.button, autoSize ? { paddingHorizontal: 28 } : { width: buttonWidth }]}
        >
          <Text
            style={[
              styles.label,
              labelFontSize !== undefined && { fontSize: labelFontSize },
              showAsDisabled && styles.labelDisabled,
            ]}
          >
            {label}
          </Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  labelDisabled: {
    color: '#bebebe',
  },
});
