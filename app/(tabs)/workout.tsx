import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';

function SettingsIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={colors.text} strokeWidth={1.5} />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.08a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.08a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClipboardIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={6} y={4} width={12} height={16} rx={2} stroke={colors.text} strokeWidth={1.5} />
      <Path d="M9 2h6v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V2z" stroke={colors.text} strokeWidth={1.5} />
      <Path d="M9 10h6M9 14h4" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={colors.text} strokeWidth={1.5} />
      <Path d="M16 16l4 4" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export default function WorkoutScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout</Text>
        <Pressable style={styles.iconButton}>
          <SettingsIcon />
        </Pressable>
      </View>

      {/* Start Empty Workout Button */}
      <Pressable style={styles.startEmptyButton} onPress={() => router.push('/active-workout')}>
        <Text style={styles.plusIcon}>+</Text>
        <Text style={styles.startEmptyText}>Start Empty Workout</Text>
      </Pressable>

      {/* Saved Workouts Section */}
      <Text style={styles.sectionTitle}>Saved Workouts</Text>

      <View style={styles.cardsRow}>
        {/* New Workout Card */}
        <Pressable style={styles.card}>
          <ClipboardIcon />
          <Text style={styles.cardText}>New Workout</Text>
        </Pressable>

        {/* Explore Workouts Card */}
        <Pressable style={styles.card}>
          <SearchIcon />
          <Text style={styles.cardText}>Explore Workouts</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
  },
  iconButton: {
    padding: spacing.xs,
  },
  startEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    ...cardStyle,
  },
  plusIcon: {
    fontFamily: fonts.medium,
    fontSize: 20,
    color: colors.text,
    marginRight: spacing.sm,
  },
  startEmptyText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    ...cardStyle,
  },
  cardText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
