import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing, radius } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { validateReferralCode, applyReferralCode } from '@/services/api/referrals';
import QuestionLayout from '@/components/QuestionLayout';

export default function EnterReferralCodeScreen() {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (code.length !== 6) return;

    setIsValidating(true);
    setError(null);

    try {
      const result = await validateReferralCode(code);

      if (!result.valid || !result.referrerId) {
        setError('Invalid referral code. Please check and try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsValidating(false);
        return;
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check self-referral
        if (user.id === result.referrerId) {
          setError("You can't use your own referral code.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setIsValidating(false);
          return;
        }

        await applyReferralCode(user.id, result.referrerId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error applying referral code:', err);
      setError('Something went wrong. Please try again.');
      setIsValidating(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleCodeChange = (text: string) => {
    // Only allow alphanumeric, auto-uppercase, max 6 chars
    const cleaned = text
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6);
    setCode(cleaned);
    if (error) setError(null);
  };

  return (
    <QuestionLayout
      question="Have a referral code?"
      progress={100}
      showContinue
      onContinue={handleSubmit}
      onSkip={handleSkip}
      continueDisabled={code.length !== 6 || isValidating}
    >
      <View style={styles.content}>
        <Text style={styles.subtitle}>If a friend shared their code with you, enter it below.</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={code}
            onChangeText={handleCodeChange}
            placeholder="XXXXXX"
            placeholderTextColor={colors.textTertiary}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            keyboardType="default"
            editable={!isValidating}
          />

          {isValidating && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </QuestionLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
  },
  input: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(239, 239, 239, 0.5)',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.error,
  },
  loadingOverlay: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
