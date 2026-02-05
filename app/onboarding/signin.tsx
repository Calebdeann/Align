import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';

// Required for web browser auth to close properly
WebBrowser.maybeCompleteAuthSession();

// Purple login screen - for EXISTING users only (accessed from intro screen)
// New users must create accounts after completing onboarding + paywall
export default function SignInScreen() {
  const { t } = useTranslation();
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);
      console.log('[Auth:SignIn] Starting Apple sign-in...');

      // Get Apple credential
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        console.warn('[Auth:SignIn] Apple credential missing identityToken');
        Alert.alert(t('auth.signInFailed'), t('auth.appleTokenError'));
        return;
      }

      console.log('[Auth:SignIn] Apple credential received, signing into Supabase...');

      // Sign in with Supabase using the Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        console.warn('[Auth:SignIn] Supabase returned no user after Apple sign-in');
        Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
        return;
      }

      console.log(`[Auth:SignIn] Supabase auth success, userId: ${data.user.id.slice(0, 8)}...`);

      // Check if user has completed onboarding (existing user check)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        // No profile = new user, they need to go through onboarding first
        console.log('[Auth:SignIn] No profile found, rejecting sign-in');
        await supabase.auth.signOut();
        Alert.alert(t('auth.noAccountFound'), t('auth.noAccountMessage'), [
          { text: t('common.ok') },
        ]);
        return;
      }

      // Existing user - go to main app
      console.log('[Auth:SignIn] Profile found, navigating to main app...');
      router.replace('/(tabs)');
    } catch (error: any) {
      // Don't show error if user cancelled
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('[Auth:SignIn] Apple sign-in cancelled by user');
        return;
      }
      console.error('[Auth:SignIn] Apple sign-in error:', error);
      Alert.alert(t('auth.signInFailed'), t('auth.appleSignInError'));
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('[Auth:SignIn] Starting Google sign-in...');

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
        console.warn('[Auth:SignIn] Supabase did not return an OAuth URL');
        Alert.alert(t('auth.signInFailed'), t('auth.googleStartError'));
        return;
      }

      console.log('[Auth:SignIn] Opening Google OAuth browser...');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log(`[Auth:SignIn] Browser result type: ${result.type}`);

      if (result.type !== 'success') {
        if (result.type === 'dismiss' || result.type === 'cancel') {
          console.log('[Auth:SignIn] Google sign-in cancelled by user');
        } else {
          console.warn(`[Auth:SignIn] Unexpected browser result type: ${result.type}`);
          Alert.alert(t('auth.signInFailed'), t('auth.googleInterruptedError'));
        }
        return;
      }

      if (!result.url) {
        console.warn('[Auth:SignIn] Browser success but no URL returned');
        Alert.alert(t('auth.signInFailed'), t('auth.googleNoResponse'));
        return;
      }

      // Extract the tokens from the redirect URL
      console.log('[Auth:SignIn] Extracting tokens from callback URL...');
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken) {
        const errorParam = params.get('error') || url.searchParams.get('error');
        const errorDesc =
          params.get('error_description') || url.searchParams.get('error_description');
        console.error(
          `[Auth:SignIn] No access_token in callback URL. error=${errorParam}, desc=${errorDesc}, url=${result.url}`
        );
        Alert.alert(t('auth.signInFailed'), errorDesc || t('auth.googleSignInError'));
        return;
      }

      console.log('[Auth:SignIn] Tokens extracted, setting Supabase session...');

      // Set the session in Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (sessionError) throw sessionError;

      if (!sessionData.user) {
        console.warn('[Auth:SignIn] Supabase setSession returned no user');
        Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
        return;
      }

      console.log(`[Auth:SignIn] Session set, userId: ${sessionData.user.id.slice(0, 8)}...`);

      // Check if user has completed onboarding (existing user check)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', sessionData.user.id)
        .single();

      if (!profile) {
        console.log('[Auth:SignIn] No profile found, rejecting sign-in');
        await supabase.auth.signOut();
        Alert.alert(t('auth.noAccountFound'), t('auth.noAccountMessage'), [
          { text: t('common.ok') },
        ]);
        return;
      }

      // Existing user - go to main app
      console.log('[Auth:SignIn] Profile found, navigating to main app...');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('[Auth:SignIn] Google sign-in error:', error);
      Alert.alert(t('auth.signInFailed'), t('auth.googleSignInError'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Back button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.welcomeText}>{t('auth.welcomeBack')}</Text>
        </View>

        {/* Sign in buttons */}
        <View style={styles.bottomSection}>
          {/* Apple Sign-In Button */}
          <Pressable
            style={styles.appleButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleAppleSignIn();
            }}
            disabled={isAppleLoading}
          >
            {isAppleLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                <Text style={styles.appleButtonText}>{t('auth.continueWithApple')}</Text>
              </View>
            )}
          </Pressable>

          {/* Google Sign-In Button */}
          <Pressable
            style={styles.googleButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleGoogleSignIn();
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
                <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
              </View>
            )}
          </Pressable>

          {/* Email sign-in link */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/onboarding/email-signin');
            }}
          >
            <Text style={styles.emailLinkText}>{t('auth.signInWithEmail')}</Text>
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
  backButton: {
    padding: spacing.lg,
  },
  backArrow: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  welcomeText: {
    fontFamily: fonts.bold,
    fontSize: 48,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 56,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
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
  emailLinkText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
