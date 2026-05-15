import { View, Text, StyleSheet, Pressable, useWindowDimensions, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts, spacing } from '@/constants/theme';
import { OnboardingContinueButton } from '@/components';
import { GYM_BUDDIES } from '@/data/gymBuddies';

const FIGMA_W = 642;

// Each tag has a fixed anchor edge (left or right) at a consistent % of screen width.
// Tags grow outward from that edge so the layout is predictable regardless of text length.
const TAG_SLOTS = [
  { field: 'goal', bg: '#d3e9c5', rot: '-6.67deg', side: 'left' as const, marginPct: 0.15 },
  { field: 'identity', bg: '#e3c5e9', rot: '3.74deg', side: 'right' as const, marginPct: 0.22 },
  { field: 'why', bg: '#f9e597', rot: '-1.56deg', side: 'left' as const, marginPct: 0.1 },
  { field: 'stat', bg: '#fcc4bd', rot: '1.32deg', side: 'right' as const, marginPct: 0.15 },
  { field: 'lifestyle', bg: '#97d5f9', rot: '-2.82deg', side: 'left' as const, marginPct: 0.18 },
];

const TAG_HEIGHT_FIGMA = 56;

export default function PartnerMatchScreen() {
  const params = useLocalSearchParams<{ profileIndex: string }>();
  const idx = Math.min(
    Math.max(parseInt(params.profileIndex ?? '0', 10), 0),
    GYM_BUDDIES.length - 1
  );
  const buddy = GYM_BUDDIES[idx];

  const { width } = useWindowDimensions();
  const s = width / FIGMA_W;

  const photoSize = Math.round(318 * s);
  const onlineBadgeLeft = Math.round(242 * s);
  const onlineBadgeTop = Math.round(10 * s);
  const tagH = Math.round(TAG_HEIGHT_FIGMA * s);

  const labelText = `Start with ${buddy.name}`;
  // ~11px per character at 17px Quicksand Bold + 60px horizontal padding
  const buttonWidthRatio = Math.min(Math.max((labelText.length * 11 + 60) / width, 0.45), 0.82);

  function handleStart() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/onboarding/signin');
  }

  function handleSolo() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/onboarding/signin');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text
          style={[styles.name, { fontSize: Math.round(60 * s), marginTop: Math.round(60 * s) }]}
        >
          {buddy.name}
        </Text>

        {/* Photo + online badge */}
        <View style={{ alignSelf: 'center', marginTop: Math.round(20 * s) }}>
          <View style={{ width: photoSize, height: photoSize }}>
            <View
              style={{
                width: photoSize,
                height: photoSize,
                borderRadius: photoSize / 2,
                overflow: 'hidden',
              }}
            >
              <Image source={buddy.image} style={{ flex: 1 }} contentFit="cover" />
            </View>
            <View style={[styles.floatingBadge, { left: onlineBadgeLeft, top: onlineBadgeTop }]}>
              <View style={styles.onlineDot} />
              <Text style={[styles.badgeLabel, { fontSize: Math.round(22 * s) }]}>online</Text>
            </View>
          </View>
        </View>

        {/* 83% match badge — slightly overlaps photo bottom */}
        <View style={[styles.matchWrapper, { marginTop: Math.round(-16 * s) }]}>
          <View style={styles.matchBadge}>
            <Text style={[styles.badgeLabel, { fontSize: Math.round(24 * s) }]}>83% match</Text>
          </View>
        </View>

        {/* Tags — flow layout with consistent left/right anchor edges */}
        <View style={{ width, marginTop: Math.round(20 * s), gap: Math.round(10 * s) }}>
          {TAG_SLOTS.map((slot) => (
            <View
              key={slot.field}
              style={{
                alignSelf: slot.side === 'left' ? 'flex-start' : 'flex-end',
                marginLeft: slot.side === 'left' ? Math.round(width * slot.marginPct) : 0,
                marginRight: slot.side === 'right' ? Math.round(width * slot.marginPct) : 0,
                height: tagH,
                backgroundColor: slot.bg,
                borderRadius: tagH / 2,
                transform: [{ rotate: slot.rot }],
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: Math.round(20 * s),
              }}
            >
              <Text style={[styles.tagText, { fontSize: Math.round(22 * s) }]} numberOfLines={1}>
                {buddy.tags[slot.field]}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed bottom — matches position of all other onboarding continue buttons */}
      <View style={styles.bottomSection}>
        <OnboardingContinueButton
          onPress={handleStart}
          label={labelText}
          widthRatio={buttonWidthRatio}
        />
        <Pressable onPress={handleSolo} style={styles.soloButton}>
          <Text style={styles.soloText}>
            {'Prefer solo? '}
            <Text style={styles.soloLink}>Continue without partner</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  name: {
    fontFamily: fonts.bold,
    color: '#000000',
    textAlign: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 555,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 555,
    paddingVertical: 7,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 4,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  badgeLabel: {
    fontFamily: fonts.bold,
    color: '#000000',
    letterSpacing: -0.44,
  },
  matchWrapper: {
    alignItems: 'center',
  },
  tagText: {
    fontFamily: fonts.bold,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.48,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
    gap: 10,
  },
  soloButton: {
    paddingVertical: 4,
  },
  soloText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#b9b9b9',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  soloLink: {
    textDecorationLine: 'underline',
  },
});
