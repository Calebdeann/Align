import { useRef, useState } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { strongHaptic } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';
import { fonts, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { clearAnonymousSession } from '@/services/anonymousSession';
import { OnboardingBackButton } from '@/components';

const { width, height } = Dimensions.get('screen');

export default function SignInEmailScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const continueScale = useSharedValue(1);
  const continueAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: continueScale.value }],
  }));

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

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        Alert.alert(t('auth.signInFailed'), t('auth.emailSignInError'));
        return;
      }
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
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, email: trimmedEmail });
        if (profileError) {
          await supabase.auth.signOut();
          Alert.alert(t('auth.signInFailed'), t('errors.somethingWentWrongTryAgain'));
          return;
        }
      }

      await clearAnonymousSession();
      router.replace('/(tabs)');
    } catch (error: any) {
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
      <Image
        source={require('../assets/Onboarding Assets/Onboarding P14/auth-bg.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      <SafeAreaView edges={['top']} style={styles.topArea}>
        <View style={styles.header}>
          <OnboardingBackButton />
          <View style={{ flex: 1 }} />
          <View style={{ width: 44 }} />
        </View>

        <Text style={styles.title}>
          {'Sign in with '}
          <Text style={styles.titleItalic}>email</Text>
        </Text>
      </SafeAreaView>

      <View style={styles.contentArea}>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor="rgba(0, 0, 0, 0.4)"
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
            placeholderTextColor="rgba(0, 0, 0, 0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleEmailSignIn}
          />

          <Pressable
            onPress={() => {
              strongHaptic();
              handleEmailSignIn();
            }}
            onPressIn={() => {
              continueScale.value = withSpring(0.93, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
              continueScale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            disabled={isLoading}
          >
            <Animated.View style={[styles.continueButton, continueAnimStyle]}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
              )}
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  contentArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '10%',
    right: '10%',
    justifyContent: 'center',
    paddingBottom: '15%',
  },
  form: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    height: 56,
    paddingHorizontal: 24,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  continueButton: {
    height: 65,
    borderRadius: 36,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  continueButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 19,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
