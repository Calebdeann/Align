import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useUserProfileStore } from '@/stores/userProfileStore';

interface Language {
  code: string;
  name: string;
  flag: string;
  available: boolean;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', available: true },
  { code: 'zh', name: '中国人', flag: '🇨🇳', available: false },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳', available: false },
  { code: 'es', name: 'Español', flag: '🇪🇸', available: false },
  { code: 'fr', name: 'Français', flag: '🇫🇷', available: false },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', available: false },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', available: false },
  { code: 'pt', name: 'Português', flag: '🇧🇷', available: false },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', available: false },
  { code: 'ro', name: 'Română', flag: '🇷🇴', available: false },
  { code: 'az', name: 'Azərbaycanca', flag: '🇦🇿', available: false },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', available: false },
];

export default function SelectLanguageScreen() {
  const { profile, userId, updateProfile } = useUserProfileStore();
  const [selectedLanguage, setSelectedLanguage] = useState(profile?.language || 'en');

  async function handleSelectLanguage(code: string, available: boolean) {
    if (!available || !userId) return;

    setSelectedLanguage(code);
    await updateProfile({ language: code });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Select Language</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((language, index) => (
          <View key={language.code}>
            <Pressable
              style={styles.languageRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleSelectLanguage(language.code, language.available);
              }}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.flag}>{language.flag}</Text>
                <Text style={styles.languageName}>{language.name}</Text>
              </View>
              {language.available ? (
                selectedLanguage === language.code && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                  </View>
                )
              ) : (
                <Text style={styles.comingSoon}>Coming Soon</Text>
              )}
            </Pressable>
            {index < LANGUAGES.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flag: {
    fontSize: 24,
  },
  languageName: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoon: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
  },
});
