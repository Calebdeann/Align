import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { getSimplifiedMuscleI18nKey } from '@/constants/muscleGroups';
import type { BodyGraphMuscleData } from '@/services/api/recovery';

interface MuscleBarListProps {
  muscleData: BodyGraphMuscleData[];
  maxItems?: number;
  isLoading?: boolean;
}

export default function MuscleBarList({
  muscleData,
  maxItems = 9,
  isLoading = false,
}: MuscleBarListProps) {
  const { t } = useTranslation();

  const sorted = [...muscleData]
    .sort((a, b) => b.effectiveSets - a.effectiveSets)
    .slice(0, maxItems);
  const maxSets = sorted[0]?.effectiveSets ?? 1;

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>{t('recovery.mainMuscleGroups')}</Text>
          <Text style={styles.setsHeading}>{t('recovery.sets')}</Text>
        </View>
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (sorted.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>{t('recovery.mainMuscleGroups')}</Text>
          <Text style={styles.setsHeading}>{t('recovery.sets')}</Text>
        </View>
        <Text style={styles.emptyText}>{t('recovery.noData')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{t('recovery.mainMuscleGroups')}</Text>
        <Text style={styles.setsHeading}>{t('recovery.sets')}</Text>
      </View>

      {sorted.map((item) => {
        const barWidth = maxSets > 0 ? item.effectiveSets / maxSets : 0;
        const muscleName = t(getSimplifiedMuscleI18nKey(item.groupId));

        return (
          <View key={item.groupId} style={styles.row}>
            <Text style={styles.muscleName}>{muscleName}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { flex: barWidth, backgroundColor: item.color }]} />
              <View style={{ flex: 1 - barWidth }} />
            </View>
            <Text style={styles.setCount}>{Math.round(item.effectiveSets)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 20,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000000',
    letterSpacing: -0.4,
  },
  setsHeading: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#888888',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  muscleName: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: '#000000',
    width: 88,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EBEBEB',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  setCount: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: '#000000',
    width: 28,
    textAlign: 'right',
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  loader: {
    paddingVertical: spacing.md,
  },
});
