import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { linkOnboardingToUser } from '@/services/api/onboarding';
import { clearAnonymousSession } from '@/services/anonymousSession';

// Required for web browser auth to close properly
WebBrowser.maybeCompleteAuthSession();

// White signup screen - for NEW account creation after paywall
export default function SignUpScreen() {
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleAppleSignUp = async () => {
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

          // Navigate to main app
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      // Don't show error if user cancelled
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      console.error('Apple Sign-Up error:', error);
      Alert.alert('Sign Up Failed', 'Unable to sign up with Apple. Please try again.');
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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

              // Navigate to main app
              router.replace('/(tabs)');
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Google Sign-Up error:', error);
      Alert.alert('Sign Up Failed', 'Unable to sign up with Google. Please try again.');
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Create your{'\n'}account</Text>
          <Text style={styles.subtitle}>
            Sign up to save your progress and access your personalized plan
          </Text>
        </View>

        {/* Sign up buttons */}
        <View style={styles.bottomSection}>
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
                <Text style={styles.appleButtonText}>Sign up with Apple</Text>
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
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundOnboarding,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    padding: spacing.lg,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleIcon: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#4285F4',
  },
  googleButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#000000',
  },
});
