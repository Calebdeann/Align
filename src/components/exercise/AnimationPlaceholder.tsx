import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';

interface AnimationPlaceholderProps {
  height?: number;
}

export default function AnimationPlaceholder({ height = 200 }: AnimationPlaceholderProps) {
  return (
    <View style={[styles.container, { height }]}>
      <Ionicons name="barbell-outline" size={48} color={colors.textTertiary} />
      <Text style={styles.text}>Animation Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...cardStyle,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
});
