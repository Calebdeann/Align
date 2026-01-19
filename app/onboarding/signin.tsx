import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { linkOnboardingToUser } from '@/services/api/onboarding';
import { clearAnonymousSession } from '@/services/anonymousSession';
import { makeRedirectUri } from 'expo-auth-session';

// Required for web browser auth to close properly
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);

      // Get Apple credential
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Sign in with Supabase using the Apple ID token
      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // Link onboarding data to the authenticated user
          await linkOnboardingToUser(data.user.id);
          await clearAnonymousSession();

          // Navigate to name input screen
          router.replace('/onboarding/name');
        }
      }
    } catch (error: any) {
      // Don't show error if user cancelled
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      console.error('Apple Sign-In error:', error);
      Alert.alert('Sign In Failed', 'Unable to sign in with Apple. Please try again.');
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      // The redirect flow:
      // 1. App → Google auth page
      // 2. Google → Supabase callback (https://...supabase.co/auth/v1/callback)
      // 3. Supabase → App scheme (align://auth/callback)
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

      if (data.url) {
        // Open the OAuth URL in a web browser
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (result.type === 'success' && result.url) {
          // Extract the tokens from the redirect URL
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            // Set the session in Supabase
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) throw sessionError;

            if (sessionData.user) {
              // Link onboarding data to the authenticated user
              await linkOnboardingToUser(sessionData.user.id);
              await clearAnonymousSession();

              // Navigate to name input screen
              router.replace('/onboarding/name');
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Sign In Failed', 'Unable to sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '100%' }]} />
        </View>

        {/* Empty view for spacing since no skip button */}
        <View style={styles.skipPlaceholder} />
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>Save your progress</Text>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        {/* Auth Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Apple Sign-In Button */}
          <Pressable
            style={styles.appleButton}
            onPress={handleAppleSignIn}
            disabled={isAppleLoading}
          >
            {isAppleLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={24} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.appleButtonText}>Sign in with Apple</Text>
              </>
            )}
          </Pressable>

          {/* Google Sign-In Button */}
          <Pressable
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <>
                <GoogleIcon />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Google "G" logo component
function GoogleIcon() {
  return (
    <View style={styles.googleIconContainer}>
      <Text style={styles.googleG}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  skipPlaceholder: {
    width: 40,
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
  contentWrapper: {
    flex: 1,
    paddingTop: 80,
  },
  buttonsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 30,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  appleButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.text,
  },
  googleButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#4285F4',
  },
});
