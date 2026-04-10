import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize } from '@/constants/theme';
import { BODY_GRAPH_COLORS } from '@/constants/muscleGroups';
import type { BodyGraphMuscleData } from '@/services/api/recovery';
import BodyGraphFront from './BodyGraphFront';
import BodyGraphBack from './BodyGraphBack';

interface BodyGraphProps {
  muscleData: BodyGraphMuscleData[];
  isLoading?: boolean;
}

export default function BodyGraph({ muscleData, isLoading = false }: BodyGraphProps) {
  const { t } = useTranslation();

  // Build separate tiermaps for front and back views.
  //
  // Mapping rules:
  //   biceps  → front "arms"  (Front_Arms image shows bicep/forearm area)
  //   triceps → back "arms"   (Back_Arms image shows tricep/forearm area)
  //   core    → front "abs"   (image is named Abs, not Core)
  //   all others appear on both views under the same key
  const frontTierMap: Record<string, number> = {};
  const backTierMap: Record<string, number> = {};

  muscleData.forEach((m) => {
    const tier = m.intensityTier;
    switch (m.groupId) {
      case 'biceps':
        frontTierMap['arms'] = tier;
        break;
      case 'triceps':
        backTierMap['arms'] = tier;
        break;
      case 'core':
        frontTierMap['abs'] = tier;
        break;
      default:
        frontTierMap[m.groupId] = tier;
        backTierMap[m.groupId] = tier;
    }
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.graphRow}>
          <View style={styles.graphView}>
            <BodyGraphFront tierMap={frontTierMap} />
            <Text style={styles.viewLabel}>Front</Text>
          </View>
          <View style={styles.graphView}>
            <BodyGraphBack tierMap={backTierMap} />
            <Text style={styles.viewLabel}>Back</Text>
          </View>
        </View>
      )}

      {/* Intensity legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BODY_GRAPH_COLORS[1] }]} />
          <Text style={styles.legendText}>{t('recovery.intensity.light')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BODY_GRAPH_COLORS[2] }]} />
          <Text style={styles.legendText}>{t('recovery.intensity.moderate')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BODY_GRAPH_COLORS[3] }]} />
          <Text style={styles.legendText}>{t('recovery.intensity.heavy')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BODY_GRAPH_COLORS[4] }]} />
          <Text style={styles.legendText}>{t('recovery.intensity.overreached')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  loadingContainer: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
  },
  graphView: {
    alignItems: 'center',
    gap: 8,
  },
  viewLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
