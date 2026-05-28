import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { strongHaptic } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/constants/theme';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { OnboardingContinueButton } from '@/components';

const SHELL_IMAGES: Record<string, number> = {
  A: require('../../assets/shells/A.png'),
  B: require('../../assets/shells/B.png'),
  C: require('../../assets/shells/C.png'),
  D: require('../../assets/shells/D.png'),
  E: require('../../assets/shells/E.png'),
  F: require('../../assets/shells/F.png'),
  G: require('../../assets/shells/G.png'),
  H: require('../../assets/shells/H.png'),
  I: require('../../assets/shells/I.png'),
  J: require('../../assets/shells/J.png'),
  K: require('../../assets/shells/K.png'),
  L: require('../../assets/shells/L.png'),
  M: require('../../assets/shells/M.png'),
  N: require('../../assets/shells/N.png'),
  O: require('../../assets/shells/O.png'),
  P: require('../../assets/shells/P.png'),
  Q: require('../../assets/shells/Q.png'),
  R: require('../../assets/shells/R.png'),
  S: require('../../assets/shells/S.png'),
  T: require('../../assets/shells/T.png'),
  U: require('../../assets/shells/U.png'),
  V: require('../../assets/shells/V.png'),
  W: require('../../assets/shells/W.png'),
  X: require('../../assets/shells/X.png'),
  Y: require('../../assets/shells/Y.png'),
  Z: require('../../assets/shells/Z.png'),
};

export default function EditNameScreen() {
  const profile = useUserProfileStore((s) => s.profile);
  const updateProfile = useUserProfileStore((s) => s.updateProfile);
  const { isNavigating } = useNavigationLock();
  const [name, setName] = useState(profile?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const { width: screenWidth } = useWindowDimensions();

  const trimmedName = name.trim();
  const canContinue = trimmedName.length >= 2;
  const shellLetters = trimmedName
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('');

  const shellGap = 8;
  const availableWidth = screenWidth - spacing.lg * 2;
  const shellSize =
    shellLetters.length === 0
      ? 54
      : Math.max(
          18,
          Math.min(
            54,
            (availableWidth - (shellLetters.length - 1) * shellGap) / shellLetters.length
          )
        );

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
          ref={inputRef}
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
      <View style={[styles.shellRow, { gap: shellGap }]}>
        {shellLetters.map((letter, index) => {
          const source = SHELL_IMAGES[letter];
          if (!source) return null;
          return (
            <Image
              key={`${letter}-${index}`}
              source={source}
              style={{ width: shellSize, height: shellSize }}
              contentFit="contain"
            />
          );
        })}
      </View>

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
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: 20,
    minHeight: 62,
    alignItems: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
});
