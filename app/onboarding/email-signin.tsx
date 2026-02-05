import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';

export default function EmailSignInScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleEmailSignIn = async () => {
    Keyboard.dismiss();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert(t('auth.signInFailed'), t('auth.emailPasswordRequired'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('auth.signInFailed'), t('auth.passwordTooShort'));
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Auth:EmailSignIn] Starting email sign-in...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        console.warn('[Auth:EmailSignIn] Sign-in failed:', error.message);
        Alert.alert(t('auth.signInFailed'), t('auth.emailSignInError'));
        return;
      }

      if (!data.user) {
        Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
        return;
      }

      console.log(
        `[Auth:EmailSignIn] Email sign-in success, userId: ${data.user.id.slice(0, 8)}...`
      );

      // Check for profile, create if missing
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        console.log('[Auth:EmailSignIn] No profile for email user, creating one...');
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: trimmedEmail,
        });
        if (profileError) {
          console.warn('[Auth:EmailSignIn] Error creating fallback profile:', profileError);
        }
      }

      console.log('[Auth:EmailSignIn] Navigating to main app...');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('[Auth:EmailSignIn] Email sign-in error:', error);
      Alert.alert(t('auth.signInFailed'), t('auth.emailSignInError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          <Text style={styles.title}>{t('auth.signInWithEmail')}</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleEmailSignIn}
            />
          </View>
        </View>

        {/* Continue button at bottom */}
        <View style={styles.bottomSection}>
          <Pressable
            style={styles.continueButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleEmailSignIn();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.lg,
    marginBottom: 100,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.md,
    width: '100%',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#FFFFFF',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.primary,
  },
});
