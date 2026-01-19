import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { ExerciseHistoryEntry } from '@/services/api/exercises';
import { UnitSystem, kgToLbs, getWeightUnit } from '@/utils/units';

interface HistoryItemProps {
  entry: ExerciseHistoryEntry;
  units: UnitSystem;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatSets(
  sets: { setNumber: number; weightKg: number | null; reps: number | null }[],
  units: UnitSystem
): string {
  return sets
    .filter((s) => s.weightKg !== null && s.reps !== null)
    .map((s) => {
      const weight = units === 'imperial' ? Math.round(kgToLbs(s.weightKg!)) : s.weightKg;
      return `${weight} x ${s.reps}`;
    })
    .join(', ');
}

function formatVolume(volumeKg: number, units: UnitSystem): string {
  const volume = units === 'imperial' ? Math.round(kgToLbs(volumeKg)) : volumeKg;
  return volume.toLocaleString();
}

export default function HistoryItem({ entry, units }: HistoryItemProps) {
  const weightUnit = getWeightUnit(units);
  const setsDisplay = formatSets(entry.sets, units);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(entry.completedAt)}</Text>
        {entry.workoutName && <Text style={styles.workoutName}>{entry.workoutName}</Text>}
      </View>
      {setsDisplay ? (
        <Text style={styles.sets}>
          {setsDisplay} {weightUnit}
        </Text>
      ) : (
        <Text style={styles.noSets}>No completed sets</Text>
      )}
      <Text style={styles.volume}>
        Volume: {formatVolume(entry.sessionVolume, units)} {weightUnit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...cardStyle,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  date: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  workoutName: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sets: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  noSets: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  volume: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});
