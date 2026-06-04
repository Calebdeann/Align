import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import MixedHeading from '@/components/MixedHeading';

const PROGRAM_IMAGES = [
  require('../assets/Onboarding Assets/Onboarding P10/Summer.png'),
  require('../assets/Onboarding Assets/Onboarding P10/Pilates.png'),
  require('../assets/Onboarding Assets/Onboarding P10/Botty.png'),
  require('../assets/Onboarding Assets/Onboarding P10/HourGlass.png'),
  require('../assets/Onboarding Assets/Onboarding P10/ITGirl.png'),
  require('../assets/Onboarding Assets/Onboarding P10/BusyGirl.png'),
  require('../assets/Onboarding Assets/Onboarding P10/Muscle.png'),
  require('../assets/Onboarding Assets/Onboarding P10/Home.png'),
];

// 3 copies so the loop reset is never visible
const LOOP_IMAGES = [...PROGRAM_IMAGES, ...PROGRAM_IMAGES, ...PROGRAM_IMAGES];

export default function WelcomeScreen() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { width } = useWindowDimensions();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const imageWidth = width - 32;
  // Exact aspect ratio of the P10 program images (1848×879)
  const imageHeight = Math.round(imageWidth * (879 / 1848));
  const singleSetHeight = imageHeight * PROGRAM_IMAGES.length;

  useEffect(() => {
    scrollAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: singleSetHeight,
          duration: 75000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, [singleSetHeight]);

  useEffect(() => {
    async function checkExistingSession() {
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
        SplashScreen.hideAsync().catch(() => {});
      }
    }
    checkExistingSession();
  }, []);

  if (isCheckingAuth) {
    return null;
  }

  const buttonWidth = Math.round(width * 0.338);
  const translateY = scrollAnim.interpolate({
    inputRange: [0, singleSetHeight],
    outputRange: [0, -singleSetHeight],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageSection}>
        {__DEV__ ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.replace('/(tabs)');
            }}
            style={{ flex: 1 }}
          >
            <Animated.View style={{ transform: [{ translateY }], opacity: fadeAnim }}>
              {LOOP_IMAGES.map((src, i) => (
                <Image
                  key={i}
                  source={src}
                  style={{ width: imageWidth, height: imageHeight, marginHorizontal: 16 }}
                  resizeMode="cover"
                />
              ))}
            </Animated.View>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }}>
            <Animated.View style={{ transform: [{ translateY }], opacity: fadeAnim }}>
              {LOOP_IMAGES.map((src, i) => (
                <Image
                  key={i}
                  source={src}
                  style={{ width: imageWidth, height: imageHeight, marginHorizontal: 16 }}
                  resizeMode="cover"
                />
              ))}
            </Animated.View>
          </View>
        )}
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#ffffff']}
          style={styles.imageGradient}
          pointerEvents="none"
        />
      </View>

      <View style={styles.headingArea}>
        <MixedHeading boldLine="Choose" italicPhrase="your program" size={44} />
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push('/sign-in');
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
