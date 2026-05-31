import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { strongHaptic } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/constants/theme';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { OnboardingContinueButton, NameShells } from '@/components';

export default function EditNameScreen() {
  const profile = useUserProfileStore((s) => s.profile);
  const updateProfile = useUserProfileStore((s) => s.updateProfile);
  const { isNavigating } = useNavigationLock();
  const [name, setName] = useState(profile?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const trimmedName = name.trim();
  const canContinue = trimmedName.length >= 2;

  async function handleSave() {
    if (!canContinue) return;
    setIsSaving(true);
    try {
      await updateProfile({ name: trimmedName });
      router.back();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: back button on the left, balanced spacer on the right */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            strongHaptic();
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color="#000000" />
        </Pressable>

        <View style={{ flex: 1 }} />

        <View style={{ width: 44 }} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Your name</Text>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#BBBBBB"
          autoCapitalize="words"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="done"
          onSubmitEditing={
            canContinue
              ? () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  handleSave();
                }
              : undefined
          }
        />
      </View>

      {/* Shell row — single line, shrinks to fit */}
      <NameShells name={trimmedName} style={styles.shellRow} />

      {/* Spacer pushes button to bottom */}
      <View style={{ flex: 1 }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.bottomSection}>
          <OnboardingContinueButton
            onPress={handleSave}
            disabled={!canContinue || isSaving || isNavigating}
            label="Save"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 48,
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    lineHeight: 56,
  },
  inputContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  input: {
    width: '100%',
    height: 54,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: '#000000',
    textAlign: 'left',
  },
  shellRow: {
    paddingHorizontal: spacing.lg,
    marginTop: 20,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
});
