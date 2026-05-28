import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import CircleBackButton from '@/components/ui/CircleBackButton';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { fonts } from '@/constants/theme';

export default function DiscoverSettingsScreen() {
  const visibility = useUserPreferencesStore((s) => s.discoverFeedVisibility);
  const visibilitySubtitle = visibility === 'friends' ? 'Friends Only' : 'Public';

  const openVisibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/discover-feed-visibility');
  };

  const openInvite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/friends-invite');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <CircleBackButton />
        <Text style={styles.headerTitle}>Discover Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <Pressable
          onPress={openVisibility}
          style={({ pressed }) => [styles.card, styles.cardRow, pressed && styles.cardPressed]}
        >
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Feed Visibility</Text>
            <Text style={styles.cardSubtitle}>{visibilitySubtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999999" />
        </Pressable>

        <Pressable
          onPress={openInvite}
          style={({ pressed }) => [styles.card, styles.cardRow, pressed && styles.cardPressed]}
        >
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Invite Friends</Text>
            <Text style={styles.cardSubtitle}>Send your referral code</Text>
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
