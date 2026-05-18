import {
  Alert,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts, spacing } from '@/constants/theme';
import { CircleBackButton } from '@/components';

const PLANS = [
  {
    id: 'summer-body',
    image: require('../../assets/Onboarding Assets/Onboarding P10/Summer.png'),
  },
  {
    id: 'pilates-princess',
    image: require('../../assets/Onboarding Assets/Onboarding P10/Pilates.png'),
  },
  {
    id: 'booty',
    image: require('../../assets/Onboarding Assets/Onboarding P10/Botty.png'),
  },
  {
    id: 'hourglass',
    image: require('../../assets/Onboarding Assets/Onboarding P10/HourGlass.png'),
  },
  {
    id: 'it-girl',
    image: require('../../assets/Onboarding Assets/Onboarding P10/ITGirl.png'),
  },
  {
    id: 'glow-up',
    image: require('../../assets/Onboarding Assets/Onboarding P10/Glow.png'),
  },
  {
    id: 'muscle-mommy',
    image: require('../../assets/Onboarding Assets/Onboarding P10/Muscle.png'),
  },
  {
    id: 'home',
    image: require('../../assets/Onboarding Assets/Onboarding P10/Home.png'),
  },
] as const;

const IMG_RATIO = 1848 / 879;

export default function ChangePlanScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = width - spacing.lg * 2;
  const cardHeight = Math.round(cardWidth / IMG_RATIO);

  function handleCustomTab() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Coming Soon', 'Custom programs are on the way!');
  }

  function handleSelectPlan(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({ pathname: '/profile/plan-detail', params: { planId: id } });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <CircleBackButton />
        <Text style={styles.headerTitle}>Change Plan</Text>
        <View style={{ width: 46 }} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.titleWord}>{'Select a program\nthat suits you!'}</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <Pressable style={styles.tab}>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Popular</Text>
          <View style={styles.tabUnderline} />
        </Pressable>
        <Pressable onPress={handleCustomTab} style={styles.tab}>
          <Text style={[styles.tabLabel, styles.tabLabelInactive]}>Custom</Text>
        </Pressable>
      </View>

      {/* Scrollable plan list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {PLANS.map((plan, index) => (
          <View key={plan.id}>
            <Pressable
              onPress={() => handleSelectPlan(plan.id)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Image
                source={plan.image}
                style={{ width: cardWidth, height: cardHeight }}
                contentFit="cover"
              />
            </Pressable>
            {index < PLANS.length - 1 && (
              <View
                style={{ width: cardWidth, height: 0.5, backgroundColor: '#D7D8D8', marginTop: 10 }}
              />
            )}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: '#000000',
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titleWord: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 48,
    color: '#000000',
    lineHeight: 56,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: 32,
  },
  tab: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  tabLabel: {
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  tabLabelActive: {
    color: '#000000',
  },
  tabLabelInactive: {
    color: 'rgba(0,0,0,0.2)',
  },
  tabUnderline: {
    marginTop: 4,
    height: 3,
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 100,
  },
  scroll: {
    flex: 1,
    marginTop: 5,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
});
