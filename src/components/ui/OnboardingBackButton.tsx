import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { strongHaptic } from '@/utils/haptics';
import { router } from 'expo-router';

interface OnboardingBackButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

export default function OnboardingBackButton({ onPress, disabled }: OnboardingBackButtonProps) {
  function handlePress() {
    if (disabled) return;
    strongHaptic();
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={disabled ? styles.disabled : undefined}
    >
      <View style={styles.button}>
        <Ionicons name="chevron-back" size={22} color="#000000" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
