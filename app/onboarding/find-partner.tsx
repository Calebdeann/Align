import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts, spacing } from '@/constants/theme';
import { OnboardingContinueButton } from '@/components';

const { width, height } = Dimensions.get('screen');

export default function FindPartnerScreen() {
  return (
    <View style={styles.container}>
      {/* Full-screen background */}
      <Image
        source={require('../../assets/Onboarding Assets/Onboarding P15/partner-bg.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* Top: progress bar only (no back button) */}
      <SafeAreaView edges={['top']} style={styles.topArea}>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        {/* Stat + body text */}
        <View style={styles.content}>
          <Text style={styles.stat}>82%</Text>
          <Text style={styles.body}>
            {'of '}
            <Text style={styles.bodyItalic}>women</Text>
            {' who achieve\ntheir '}
            <Text style={styles.bodyBold}>goals</Text>
            {' have someone\ndoing it with them!'}
          </Text>
        </View>
      </SafeAreaView>

      {/* Bottom: Find my Partner button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
        <View style={styles.buttonRow}>
          <OnboardingContinueButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/onboarding/gym-buddy');
            }}
            label="Find my Partner"
            widthRatio={0.46}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgImage: {
    position: 'absolute',
    width,
    height,
  },
  topArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  progressRow: {
    height: 52,
    paddingTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    width: 100,
    height: 4,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: 96,
    height: 4,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: 0,
  },
  stat: {
    fontFamily: fonts.frauncesBold,
    fontSize: 85,
    color: '#000000',
    lineHeight: 94,
    textAlign: 'center',
    marginBottom: -10,
  },
  body: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 27,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 36,
  },
  bodyItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 27,
    lineHeight: 36,
  },
  bodyBold: {
    fontFamily: fonts.frauncesBold,
    fontSize: 27,
    lineHeight: 36,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  buttonRow: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
});
