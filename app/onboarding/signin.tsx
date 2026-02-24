import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { clearAnonymousSession } from '@/services/anonymousSession';

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

      // Check if user has completed onboarding (existing user check)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        // No profile = new user, they need to go through onboarding first
        await supabase.auth.signOut();
        Alert.alert(t('auth.noAccountFound'), t('auth.noAccountMessage'), [
          { text: t('common.ok') },
        ]);
        return;
      }

      // Existing user - clear any stale anonymous session and go to main app
      await clearAnonymousSession();
      router.replace('/(tabs)');
    } catch (error: any) {
      // Don't show error if user cancelled
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert(t('auth.signInFailed'), error?.message || t('auth.appleSignInError'));
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

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

      // Check if user has completed onboarding (existing user check)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', sessionData.user.id)
        .single();

      if (!profile) {
        await supabase.auth.signOut();
        Alert.alert(t('auth.noAccountFound'), t('auth.noAccountMessage'), [
          { text: t('common.ok') },
        ]);
        return;
      }

      // Existing user - clear any stale anonymous session and go to main app
      await clearAnonymousSession();
      router.replace('/(tabs)');
    } catch (error: any) {
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
            disabled={isAppleLoading || isGoogleLoading}
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
