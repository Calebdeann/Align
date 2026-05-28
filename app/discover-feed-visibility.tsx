import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import CircleBackButton from '@/components/ui/CircleBackButton';
import {
  useUserPreferencesStore,
  type DiscoverFeedVisibility,
} from '@/stores/userPreferencesStore';
import { fonts } from '@/constants/theme';

type Option = {
  value: DiscoverFeedVisibility;
  title: string;
  subtitle: string;
};

const OPTIONS: Option[] = [
  {
    value: 'public',
    title: 'Public',
    subtitle: 'See workouts from everyone on It Girl',
  },
  {
    value: 'friends',
    title: 'Friends Only',
    subtitle: 'Only show workouts from your friends',
  },
];

export default function DiscoverFeedVisibilityScreen() {
  const visibility = useUserPreferencesStore((s) => s.discoverFeedVisibility);
  const setVisibility = useUserPreferencesStore((s) => s.setDiscoverFeedVisibility);

  const onSelect = (value: DiscoverFeedVisibility) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setVisibility(value);
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <CircleBackButton />
        <Text style={styles.headerTitle}>Feed Visibility</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        {OPTIONS.map((opt) => {
          const selected = visibility === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={({ pressed }) => [styles.card, styles.cardRow, pressed && styles.cardPressed]}
            >
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{opt.title}</Text>
                <Text style={styles.cardSubtitle}>{opt.subtitle}</Text>
              </View>
              {selected && <Ionicons name="checkmark" size={22} color="#000000" />}
            </Pressable>
          );
        })}
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
