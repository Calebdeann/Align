import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { linkOnboardingToUser } from '@/services/api/onboarding';
import { clearAnonymousSession } from '@/services/anonymousSession';

// Required for web browser auth to close properly
WebBrowser.maybeCompleteAuthSession();

// White signup screen - for NEW account creation after paywall
export default function SignUpScreen() {
  const { t } = useTranslation();
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, [])
  );

  const handleBack = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleAppleSignUp = async () => {
    try {
      setIsAppleLoading(true);
      console.log('[Auth:SignUp] Starting Apple sign-up...');

      // Sign out any existing session to prevent stale data
      await supabase.auth.signOut();

      // Get Apple credential
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        console.warn('[Auth:SignUp] Apple credential missing identityToken');
        Alert.alert(t('auth.signInFailed'), t('auth.appleTokenError'));
        return;
      }

      console.log('[Auth:SignUp] Apple credential received, signing into Supabase...');

      // Sign in with Supabase using the Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        console.warn('[Auth:SignUp] Supabase returned no user after Apple sign-in');
        Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
        return;
      }

      console.log(`[Auth:SignUp] Supabase auth success, userId: ${data.user.id.slice(0, 8)}...`);

      // Check if user already has an account (prevent overwriting existing profile)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (existingProfile) {
        console.log('[Auth:SignUp] Profile already exists, redirecting to app');
        router.replace('/(tabs)');
        return;
      }

      // New user - link onboarding data to the authenticated user
      console.log('[Auth:SignUp] Linking onboarding data...');
      const linked = await linkOnboardingToUser(data.user.id);
      if (!linked) {
        console.warn('[Auth:SignUp] linkOnboardingToUser returned false, continuing anyway');
      }
      await clearAnonymousSession();

      // Navigate to main app
      console.log('[Auth:SignUp] Navigating to main app...');
      router.replace('/(tabs)');
    } catch (error: any) {
      // Don't show error if user cancelled
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('[Auth:SignUp] Apple sign-up cancelled by user');
        return;
      }
      console.error('[Auth:SignUp] Apple sign-up error:', error);
      Alert.alert(t('auth.signInFailed'), t('auth.appleSignInError'));
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('[Auth:SignUp] Starting Google sign-up...');

      // Sign out any existing session to prevent stale data
      await supabase.auth.signOut();

      const redirectTo = 'align://auth/callback';

      // Start OAuth flow with Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (!data.url) {
        console.warn('[Auth:SignUp] Supabase did not return an OAuth URL');
        Alert.alert(t('auth.signInFailed'), t('auth.googleStartError'));
        return;
      }

      console.log('[Auth:SignUp] Opening Google OAuth browser...');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log(`[Auth:SignUp] Browser result type: ${result.type}`);

      if (result.type !== 'success') {
        // User dismissed/cancelled the browser, or redirect failed
        if (result.type === 'dismiss' || result.type === 'cancel') {
          console.log('[Auth:SignUp] Google sign-up cancelled by user');
        } else {
          console.warn(`[Auth:SignUp] Unexpected browser result type: ${result.type}`);
          Alert.alert(t('auth.signInFailed'), t('auth.googleInterruptedError'));
        }
        return;
      }

      if (!result.url) {
        console.warn('[Auth:SignUp] Browser success but no URL returned');
        Alert.alert(t('auth.signInFailed'), t('auth.googleNoResponse'));
        return;
      }

      // Extract the tokens from the redirect URL
      console.log(`[Auth:SignUp] Extracting tokens from callback URL...`);
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken) {
        // Check if there's an error in the URL params
        const errorParam = params.get('error') || url.searchParams.get('error');
        const errorDesc =
          params.get('error_description') || url.searchParams.get('error_description');
        console.error(
          `[Auth:SignUp] No access_token in callback URL. error=${errorParam}, desc=${errorDesc}, url=${result.url}`
        );
        Alert.alert(t('auth.signInFailed'), errorDesc || t('auth.googleSignInError'));
        return;
      }

      console.log('[Auth:SignUp] Tokens extracted, setting Supabase session...');

      // Set the session in Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (sessionError) throw sessionError;

      if (!sessionData.user) {
        console.warn('[Auth:SignUp] Supabase setSession returned no user');
        Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
        return;
      }

      console.log(`[Auth:SignUp] Session set, userId: ${sessionData.user.id.slice(0, 8)}...`);

      // Check if user already has an account (prevent overwriting existing profile)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', sessionData.user.id)
        .single();

      if (existingProfile) {
        console.log('[Auth:SignUp] Profile already exists, redirecting to app');
        router.replace('/(tabs)');
        return;
      }

      // New user - link onboarding data to the authenticated user
      console.log('[Auth:SignUp] Linking onboarding data...');
      const linked = await linkOnboardingToUser(sessionData.user.id);
      if (!linked) {
        console.warn('[Auth:SignUp] linkOnboardingToUser returned false, continuing anyway');
      }
      await clearAnonymousSession();

      // Navigate to main app
      console.log('[Auth:SignUp] Navigating to main app...');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('[Auth:SignUp] Google sign-up error:', error);
      Alert.alert(t('auth.signInFailed'), t('auth.googleSignInError'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button + progress bar */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} disabled={isNavigating}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '95%' }]} />
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* Title */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{t('auth.saveYourProgress')}</Text>
      </View>

      {/* Sign up buttons centered in middle */}
      <View style={styles.content}>
        <View style={styles.buttonsContainer}>
          {/* Apple Sign-Up Button */}
          <Pressable
            style={styles.appleButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleAppleSignUp();
            }}
            disabled={isAppleLoading}
          >
            {isAppleLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                <Text style={styles.appleButtonText}>{t('auth.signUpWithApple')}</Text>
              </View>
            )}
          </Pressable>

          {/* Google Sign-Up Button */}
          <Pressable
            style={styles.googleButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleGoogleSignUp();
            }}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <View style={styles.buttonContent}>
                <Image
                  source={require('../../assets/images/google-logo.png')}
                  style={styles.googleLogo}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>{t('auth.signUpWithGoogle')}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundOnboarding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressBarFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  questionContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  questionText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    lineHeight: 36,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonsContainer: {
    gap: spacing.md,
  },
  appleButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  appleButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#000000',
  },
});
