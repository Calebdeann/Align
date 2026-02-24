import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

export type ExerciseDetailTab = 'summary' | 'history' | 'howto';

interface ExerciseTabBarProps {
  activeTab: ExerciseDetailTab;
  onTabChange: (tab: ExerciseDetailTab) => void;
}

export default function ExerciseTabBar({ activeTab, onTabChange }: ExerciseTabBarProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('summary');
        }}
      >
        <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
          Summary
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, activeTab === 'history' && styles.tabActive]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('history');
        }}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
          History
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, activeTab === 'howto' && styles.tabActive]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('howto');
        }}
      >
        <Text style={[styles.tabText, activeTab === 'howto' && styles.tabTextActive]}>How-to</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
