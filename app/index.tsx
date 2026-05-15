import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import MixedHeading from '@/components/MixedHeading';

const FULL_IMAGE = require('../assets/programs/full-programs.png');

// Natural aspect ratio of full-programs.png (1284×2778)
const IMAGE_HEIGHT_RATIO = 2778 / 1284;

export default function WelcomeScreen() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { width } = useWindowDimensions();
  const { bottom: bottomInset } = useSafeAreaInsets();

  useEffect(() => {
    async function checkExistingSession() {
      SplashScreen.hideAsync().catch(() => {});
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();
          if (profile) {
            router.replace('/(tabs)');
            return;
          }
          await supabase.auth.signOut();
        }
      } catch {
        // Session check failed, show welcome screen
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkExistingSession();
  }, []);

  if (isCheckingAuth) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashText}>It Girl</Text>
      </View>
    );
  }

  const buttonWidth = Math.round(width * 0.338);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageSection}>
        <Image
          source={FULL_IMAGE}
          style={{ width, height: width * IMAGE_HEIGHT_RATIO, position: 'absolute', top: 0 }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#ffffff']}
          style={styles.imageGradient}
          pointerEvents="none"
        />
      </View>

      <View style={styles.headingArea}>
        {/* DEV SHORTCUT: tap heading to skip to signin */}
        <Pressable onPress={() => router.push('/onboarding/signin')}>
          <MixedHeading boldLine="Choose" italicPhrase="your program" size={44} />
        </Pressable>
      </View>

      <View style={styles.headingButtonSpacer} />

      <View style={styles.bottomSection}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push('/onboarding/intro');
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
        >
          <LinearGradient
            colors={['#2a2a2a', '#000000']}
            style={[styles.getStartedButton, { width: buttonWidth }]}
          >
            <Text style={styles.getStartedText}>Begin</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={[styles.signInContainer, { bottom: Math.max(bottomInset - 14, 4) }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/onboarding/signin');
          }}
          style={styles.signInPressable}
        >
          <Text style={styles.signInText}>Already have an account?</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 90,
    color: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageSection: {
    flex: 1,
    overflow: 'hidden',
    marginTop: -35,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 205,
  },
  headingArea: {
    height: 100,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  headingButtonSpacer: {
    height: 20,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
  getStartedButton: {
    height: 48,
    borderRadius: 500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  signInContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  signInPressable: {
    paddingVertical: 4,
  },
  signInText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#b9b9b9',
    textDecorationLine: 'underline',
  },
});
