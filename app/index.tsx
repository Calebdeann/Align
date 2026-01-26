import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingWelcome() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Star decorations - positioned to match Figma */}
        <Image
          source={require('../assets/images/stars1.png')}
          style={styles.starsTopRight}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/stars2.png')}
          style={styles.starsLeft}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/stars3.png')}
          style={styles.starsBottomRight}
          resizeMode="contain"
        />

        {/* Main content - positioned slightly above center */}
        <View style={styles.content}>
          <Text style={styles.logo}>ALIGN</Text>
          <Pressable onPress={() => router.replace('/home')}>
            <Text style={styles.tagline}>FOR THE GIRLS</Text>
          </Pressable>
        </View>

        {/* Bottom buttons */}
        <View style={styles.bottomSection}>
          <Link href="/onboarding/intro" asChild>
            <Pressable
              style={styles.getStartedButton}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </Pressable>
          </Link>

          <Link href="/onboarding/signin" asChild>
            <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}>
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInBold}>Sign in</Text>
              </Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  safeArea: {
    flex: 1,
  },
  starsTopRight: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.12,
    right: 60,
    width: 90,
    height: 90,
  },
  starsLeft: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.32,
    left: 24,
    width: 70,
    height: 70,
  },
  starsBottomRight: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.58,
    right: 40,
    width: 110,
    height: 110,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: 80,
  },
  logo: {
    fontFamily: fonts.canela,
    fontSize: 96,
    color: colors.textInverse,
    letterSpacing: 4,
    fontStyle: 'italic',
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xl,
    color: colors.textInverse,
    marginTop: spacing.sm,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: colors.textInverse,
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  getStartedText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  signInText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textInverse,
  },
  signInBold: {
    fontFamily: fonts.bold,
  },
});
