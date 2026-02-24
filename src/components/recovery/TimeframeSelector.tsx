import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize } from '@/constants/theme';
import type { MuscleTimeframe } from '@/services/api/recovery';

interface TimeframeSelectorProps {
  selected: MuscleTimeframe;
  onSelect: (timeframe: MuscleTimeframe) => void;
}

const TIMEFRAME_OPTIONS: { value: MuscleTimeframe; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'total', label: 'Total' },
];

export default function TimeframeSelector({ selected, onSelect }: TimeframeSelectorProps) {
  return (
    <View style={styles.container}>
      {TIMEFRAME_OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <Pressable
            key={option.value}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option.value);
            }}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  pillTextSelected: {
    color: colors.textInverse,
  },
});
