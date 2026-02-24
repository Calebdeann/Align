import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fonts, fontSize, cardStyle } from '@/constants/theme';
import { BODY_GRAPH_COLORS } from '@/constants/muscleGroups';
import {
  getMuscleDataByTimeframe,
  type MuscleTimeframe,
  type BodyGraphMuscleData,
} from '@/services/api/recovery';
import BodyGraphFront from './BodyGraphFront';
import BodyGraphBack from './BodyGraphBack';
import TimeframeSelector from './TimeframeSelector';

interface BodyGraphProps {
  userId: string;
}

export default function BodyGraph({ userId }: BodyGraphProps) {
  const [timeframe, setTimeframe] = useState<MuscleTimeframe>('week');
  const [muscleData, setMuscleData] = useState<BodyGraphMuscleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const data = await getMuscleDataByTimeframe(userId, timeframe);
    setMuscleData(data);
    setIsLoading(false);
  }, [userId, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Convert muscle data array to color map for SVG components
  const colorMap: Record<string, string> = {};
  muscleData.forEach((m) => {
    colorMap[m.groupId] = m.color;
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Muscle Worked</Text>

      <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />

      <View style={styles.bodyContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.graphRow}>
            <View style={styles.graphView}>
              <BodyGraphFront colorMap={colorMap} />
              <Text style={styles.viewLabel}>Front</Text>
            </View>
            <View style={styles.graphView}>
              <BodyGraphBack colorMap={colorMap} />
              <Text style={styles.viewLabel}>Back</Text>
            </View>
          </View>
        )}
      </View>

      {/* Intensity legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BODY_GRAPH_COLORS[1] }]} />
          <Text style={styles.legendText}>Light</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BODY_GRAPH_COLORS[2] }]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BODY_GRAPH_COLORS[3] }]} />
          <Text style={styles.legendText}>Heavy</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardStyle,
    padding: 20,
    gap: 16,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  bodyContainer: {
    minHeight: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
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
    gap: 20,
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
