import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

export default function StatCard({ icon, label, value, subValue }: StatCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {subValue && <Text style={styles.subValue}>{subValue}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...cardStyle,
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  subValue: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
