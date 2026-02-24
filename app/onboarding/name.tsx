import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing, radius } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

export default function NameScreen() {
  const { t } = useTranslation();
  const { setAndSave, skipField } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const trimmedName = name.trim();
  const canContinue = trimmedName.length >= 3 && !nameError;

  async function handleContinue() {
    if (!trimmedName) {
      setNameError(t('onboarding.name.errorEmpty'));
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    setNameError(null);

    try {
      await setAndSave('name', trimmedName);
      router.push('/onboarding/experience');
    } catch (error) {
      console.error('Error saving name:', error);
      setNameError(t('errors.somethingWentWrongTryAgain'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleNameChange(value: string) {
    setName(value);
    setNameError(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '2%' }]} />
        </View>

        <Pressable
          onPress={() =>
            withLock(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              skipField('name');
              router.push('/onboarding/experience');
            })
          }
          disabled={isNavigating}
        >
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </Pressable>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{t('onboarding.name.question')}</Text>
      </View>

      {/* Centered input */}
      <View style={styles.centerSection}>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={handleNameChange}
            placeholder={t('onboarding.name.placeholder')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            autoFocus={false}
            returnKeyType="done"
            onSubmitEditing={canContinue ? handleContinue : undefined}
          />
        </View>
        {nameError && <Text style={styles.errorText}>{nameError}</Text>}
      </View>

      {/* Continue Button */}
      {!keyboardVisible && (
        <View style={styles.bottomSection}>
          <Pressable
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleContinue();
            }}
            disabled={!canContinue || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueText}>{t('common.continue')}</Text>
            )}
          </Pressable>
        </View>
      )}
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
  skipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
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
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: -200,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 74,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(239, 239, 239, 0.5)',
  },
  input: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: '#000000',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
});
