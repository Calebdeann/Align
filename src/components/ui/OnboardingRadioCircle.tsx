import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingRadioCircleProps {
  selected: boolean;
}

export default function OnboardingRadioCircle({ selected }: OnboardingRadioCircleProps) {
  return (
    <View style={[styles.circle, selected && styles.circleSelected]}>
      {selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circleSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
});
