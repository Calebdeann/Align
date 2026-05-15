import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { spacing } from '@/constants/theme';
import MixedHeading from '@/components/MixedHeading';
import { OnboardingContinueButton } from '@/components';

const { width, height } = Dimensions.get('screen');

export default function BecomeScreen() {
  return (
    <View style={styles.container}>
      {/* Background image fills the true full screen */}
      <Image
        source={require('../../assets/Onboarding Assets/Onboarding P3/onboarding3-full.png')}
        style={{ position: 'absolute', width, height }}
        resizeMode="cover"
      />

      {/* Text pinned to the white-space zone of the image (~43% from top) */}
      <View style={[styles.headingArea, { top: height * 0.43 }]} pointerEvents="none">
        <MixedHeading boldLine="Become" italicPhrase={'an "It Girl"'} size={54} />
      </View>

      {/* Button anchored to the bottom safe area */}
      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.bottomSection}>
          <OnboardingContinueButton onPress={() => router.push('/onboarding/name')} />
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
  headingArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  safeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
});
