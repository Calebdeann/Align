import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { CircleBackButton } from '@/components';
import { useUserProfileStore } from '@/stores/userProfileStore';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

export default function SelectLanguageScreen() {
  const { t } = useTranslation();
  const { profile, userId, updateProfile } = useUserProfileStore();
  const [selectedLanguage, setSelectedLanguage] = useState(
    profile?.language || i18n.language || 'en'
  );

  async function handleSelectLanguage(code: string) {
    setSelectedLanguage(code);
    i18n.changeLanguage(code);
    if (userId) {
      await updateProfile({ language: code });
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <CircleBackButton />
        <Text style={styles.headerTitle}>{t('profile.selectLanguage')}</Text>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((language, index) => (
          <View key={language.code}>
            <Pressable
              style={styles.languageRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleSelectLanguage(language.code);
              }}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.flag}>{language.flag}</Text>
                <Text style={styles.languageName}>{language.name}</Text>
              </View>
              {selectedLanguage === language.code && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                </View>
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
  },
});
