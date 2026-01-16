import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingWelcome() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Star decorations - positioned to match Figma */}
        <Image source={require('../assets/images/Top Right.png')} style={styles.starsTopRight} />
        <Image source={require('../assets/images/Middle.png')} style={styles.starsLeft} />
        <Image
          source={require('../assets/images/Bottom Right.png')}
          style={styles.starsBottomRight}
        />

        {/* Main content - positioned slightly above center */}
        <View style={styles.content}>
          <Text style={styles.logo}>ALIGN</Text>
          <Pressable onPress={() => router.replace('/home')}>
            <Text style={styles.tagline}>BUILT FOR THE GIRLS</Text>
          </Pressable>
        </View>

        {/* Bottom buttons */}
        <View style={styles.bottomSection}>
          <Pressable
            style={styles.getStartedButton}
            onPress={() => router.push('/onboarding/welcome')}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/onboarding/signin')}>
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInBold}>Sign in</Text>
            </Text>
          </Pressable>
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
    resizeMode: 'contain',
  },
  starsLeft: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.32,
    left: 24,
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  starsBottomRight: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.58,
    right: 40,
    width: 110,
    height: 110,
    resizeMode: 'contain',
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
    fontFamily: fonts.semiBold,
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
