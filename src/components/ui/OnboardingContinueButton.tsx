import { Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/constants/theme';

interface OnboardingContinueButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  widthRatio?: number;
}

export default function OnboardingContinueButton({
  onPress,
  disabled = false,
  label = 'Continue',
  widthRatio = 0.338,
}: OnboardingContinueButtonProps) {
  const { width } = useWindowDimensions();
  // 33.8% of screen width matches Figma (217px in 642px frame)
  const buttonWidth = Math.round(width * widthRatio);

  function handlePress() {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  }

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <LinearGradient
        colors={disabled ? ['#f3f4f4', '#efefef'] : ['#2a2a2a', '#000000']}
        style={[styles.button, { width: buttonWidth }]}
      >
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      </LinearGradient>
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
