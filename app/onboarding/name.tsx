import { useState } from 'react';
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
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useUserProfileStore } from '@/stores/userProfileStore';

export default function NameScreen() {
  const { updateProfile } = useUserProfileStore();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const canContinue = trimmedName.length >= 2 && !nameError;

  async function handleContinue() {
    if (!trimmedName) {
      setNameError('Please enter a name');
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    setNameError(null);

    try {
      // Save the name (skip uniqueness check - names don't need to be unique)
      const success = await updateProfile({ name: trimmedName });

      if (success) {
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        setNameError('Failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error saving name:', error);
      setNameError('Something went wrong. Please try again.');
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '100%' }]} />
        </View>

        {/* Empty view for spacing */}
        <View style={styles.skipPlaceholder} />
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>What should we call you?</Text>
      </View>

      {/* Input */}
      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={handleNameChange}
            placeholder="Enter your name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={canContinue ? handleContinue : undefined}
          />
        </View>
        {nameError && <Text style={styles.errorText}>{nameError}</Text>}
        <Text style={styles.helperText}>This is how we'll address you in the app</Text>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Continue Button */}
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
            <Text style={styles.continueText}>Continue</Text>
          )}
        </Pressable>
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
  inputSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
  },
  inputContainer: {
    ...cardStyle,
    padding: spacing.md,
  },
  input: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    padding: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  helperText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  spacer: {
    flex: 1,
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
