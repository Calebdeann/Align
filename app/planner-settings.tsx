import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import CircleBackButton from '@/components/ui/CircleBackButton';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { fonts } from '@/constants/theme';

const DAY_SHORT: Record<string, string> = {
  Sunday: 'Sun',
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
};
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function PlannerSettingsScreen() {
  const useSuggested = useUserPreferencesStore((s) => s.useSuggestedWorkoutPlan);
  const setUseSuggested = useUserPreferencesStore((s) => s.setUseSuggestedWorkoutPlan);
  const rawWorkoutDays = useUserProfileStore((s) => s.profile?.workout_days);
  const onToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setUseSuggested(value);
  };

  // Display the user's current workout days in week order, short form
  const sortedDays = (rawWorkoutDays ?? [])
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  const daysSubtitle =
    sortedDays.length > 0 ? sortedDays.map((d) => DAY_SHORT[d] ?? d).join(', ') : 'Not set';

  const openEditDays = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/workout-schedule');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <CircleBackButton />
        <Text style={styles.headerTitle}>Calendar Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Follow Workout Plan</Text>
            <Text style={styles.cardSubtitle}>Follow an It Girl Personalised Plan</Text>
          </View>
          <Switch
            value={useSuggested}
            onValueChange={onToggle}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            ios_backgroundColor="#E5E5EA"
          />
        </View>

        <Pressable
          onPress={openEditDays}
          style={({ pressed }) => [styles.card, styles.cardRow, pressed && styles.cardPressed]}
        >
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Edit Workout Days</Text>
            <Text style={styles.cardSubtitle}>{daysSubtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999999" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000000',
  },
  headerSpacer: { width: 46 },
  body: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardRow: { paddingRight: 12 },
  cardPressed: { opacity: 0.7 },
  cardText: { flex: 1, paddingRight: 12 },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
});
