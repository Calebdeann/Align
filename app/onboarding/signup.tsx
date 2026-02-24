import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
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

      // Generate nonce for Supabase token verification
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      // Get Apple credential with hashed nonce
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        Alert.alert(t('auth.signInFailed'), t('auth.appleTokenError'));
        return;
      }

      // Sign out any existing session now that we have a valid Apple credential
      await supabase.auth.signOut();

      // Sign in with Supabase using the Apple ID token + raw nonce
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) throw error;

      if (!data.user) {
        Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
        return;
      }

      // Check if user already has an account (prevent overwriting existing profile)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      // Link onboarding data to the user profile (creates or updates)
      const linked = await linkOnboardingToUser(data.user.id);
      if (!linked) {
        Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
        await supabase.auth.signOut();
        return;
      }
      await clearAnonymousSession();

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      // Don't show error if user cancelled
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert(t('auth.signInFailed'), error?.message || t('auth.appleSignInError'));
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);

      // Sign out any existing session to prevent stale data
      // (safe here because Google OAuth opens a browser - user won't cancel before this)
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
        Alert.alert(t('auth.signInFailed'), t('auth.googleStartError'));
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== 'success') {
        if (result.type !== 'dismiss' && result.type !== 'cancel') {
          Alert.alert(t('auth.signInFailed'), t('auth.googleInterruptedError'));
        }
        return;
      }

      if (!result.url) {
        Alert.alert(t('auth.signInFailed'), t('auth.googleNoResponse'));
        return;
      }

      // Extract the tokens from the redirect URL
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken) {
        const errorDesc =
          params.get('error_description') || url.searchParams.get('error_description');
        Alert.alert(t('auth.signInFailed'), errorDesc || t('auth.googleSignInError'));
        return;
      }

      // Set the session in Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (sessionError) throw sessionError;

      if (!sessionData.user) {
        Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
        return;
      }

      // Link onboarding data to the user profile (creates or updates)
      const linked = await linkOnboardingToUser(sessionData.user.id);
      if (!linked) {
        Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
        await supabase.auth.signOut();
        return;
      }
      await clearAnonymousSession();

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
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
            disabled={isAppleLoading || isGoogleLoading}
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
            disabled={isAppleLoading || isGoogleLoading}
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
