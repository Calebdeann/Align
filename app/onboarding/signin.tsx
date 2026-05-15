import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { clearAnonymousSession } from '@/services/anonymousSession';
import { OnboardingBackButton } from '@/components';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('screen');

export default function SignInScreen() {
  const { t } = useTranslation();
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();
      if (!profile) {
        await supabase.auth.signOut();
        Alert.alert(t('auth.noAccountFound'), t('auth.noAccountMessage'), [
          { text: t('common.ok') },
        ]);
        return;
      }
      await clearAnonymousSession();
      router.replace('/onboarding/find-partner');
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert(t('auth.signInFailed'), error?.message || t('auth.appleSignInError'));
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const redirectTo = 'alyne://auth/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
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
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      if (sessionError) throw sessionError;
      if (!sessionData.user) {
        Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
        return;
      }
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
      await clearAnonymousSession();
      router.replace('/onboarding/find-partner');
    } catch (error: any) {
      Alert.alert(t('auth.signInFailed'), t('auth.googleSignInError'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-screen background image */}
      <Image
        source={require('../../assets/Onboarding Assets/Onboarding P14/auth-bg.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* Top safe area: header */}
      <SafeAreaView edges={['top']} style={styles.topArea}>
        <View style={styles.header}>
          <OnboardingBackButton />
          <View style={styles.progressCenter}>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {'Save your '}
          <Text style={styles.titleItalic}>progress</Text>
        </Text>
      </SafeAreaView>

      {/* Centered auth buttons */}
      <View style={styles.buttonsArea}>
        <View style={styles.buttons}>
          {/* Apple */}
          <Pressable
            style={[styles.authButton, styles.appleButton, { marginBottom: 5 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleAppleSignIn();
            }}
            disabled={isAppleLoading || isGoogleLoading}
          >
            {isAppleLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonRow}>
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                <Text style={styles.appleButtonText}>{t('auth.continueWithApple')}</Text>
              </View>
            )}
          </Pressable>

          {/* Google */}
          <Pressable
            style={[styles.authButton, styles.googleButton]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleGoogleSignIn();
            }}
            disabled={isAppleLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <View style={styles.buttonRow}>
                <Image
                  source={require('../../assets/images/google-logo.png')}
                  style={styles.googleLogo}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
              </View>
            )}
          </Pressable>

          {/* DEV SKIP */}
          {__DEV__ && (
            <Pressable
              onPress={() => router.replace('/onboarding/find-partner')}
              style={styles.devButton}
            >
              <Text style={styles.devButtonText}>Dev: Skip Auth →</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgImage: {
    position: 'absolute',
    width,
    height,
  },
  topArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: 12,
  },
  progressCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    width: 100,
    height: 4,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: 90,
    height: 4,
    backgroundColor: '#000000',
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 52,
    color: '#000000',
    textAlign: 'center',
    paddingTop: spacing.xl,
    lineHeight: 62,
    paddingHorizontal: spacing.lg,
  },
  titleItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 52,
  },
  buttonsArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '20%',
    right: '20%',
    justifyContent: 'center',
    paddingBottom: '20%',
  },
  buttons: {
    gap: spacing.sm,
  },
  authButton: {
    height: 54,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  devButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,0,0,0.12)',
    borderRadius: 8,
  },
  devButtonText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'red',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appleButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#000000',
    letterSpacing: -0.2,
  },
});
