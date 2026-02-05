import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabase';

const LANGUAGES = [
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingWelcome() {
  const { t } = useTranslation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // Verify profile exists (user completed onboarding)
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (profile) {
            if (__DEV__) {
              // In dev mode, show welcome screen for testing instead of auto-redirecting
              console.log(
                `[Auth:AutoLogin] Dev mode - showing welcome screen (user ${user.id.slice(0, 8)}...)`
              );
            } else {
              console.log(
                `[Auth:AutoLogin] Found existing session for ${user.id.slice(0, 8)}..., redirecting`
              );
              router.replace('/(tabs)');
              return;
            }
          }
          // Auth exists but no profile, user abandoned onboarding. Sign them out and show welcome.
          console.log('[Auth:AutoLogin] Session exists but no profile, signing out');
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.warn('[Auth:AutoLogin] Error checking session:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkExistingSession();
  }, []);

  // Show purple screen while checking auth (matches the welcome screen background)
  if (isCheckingAuth) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.textInverse} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Language picker pill + inline dropdown */}
        <View style={styles.languageRow}>
          <View style={styles.languageAnchor}>
            <Pressable
              style={styles.languagePill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLanguageDropdownOpen(!languageDropdownOpen);
              }}
            >
              <Ionicons name="language" size={16} color={colors.text} />
              <Text style={styles.languageFlag}>{currentLang.flag}</Text>
            </Pressable>

            {languageDropdownOpen && (
              <View style={styles.dropdownContainer}>
                {LANGUAGES.map((lang, index) => (
                  <View key={lang.code}>
                    <Pressable
                      style={styles.dropdownRow}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        i18n.changeLanguage(lang.code);
                        setLanguageDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownFlag}>{lang.flag}</Text>
                      <Text
                        style={[
                          styles.dropdownName,
                          lang.code === currentLang.code && styles.dropdownNameActive,
                        ]}
                      >
                        {lang.name}
                      </Text>
                      {lang.code === currentLang.code && (
                        <View style={styles.dropdownCheck}>
                          <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                        </View>
                      )}
                    </Pressable>
                    {index < LANGUAGES.length - 1 && <View style={styles.dropdownDivider} />}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Dismiss overlay when dropdown is open */}
        {languageDropdownOpen && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setLanguageDropdownOpen(false)}
          />
        )}

        {/* Star decorations - positioned to match Figma */}
        <Image
          source={require('../assets/images/stars1.png')}
          style={styles.starsTopRight}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/stars2.png')}
          style={styles.starsLeft}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/stars3.png')}
          style={styles.starsBottomRight}
          resizeMode="contain"
        />

        {/* Main content - positioned slightly above center */}
        <View style={styles.content}>
          <Pressable onPress={() => router.push('/onboarding/generating-plan?skipTo=70')}>
            <Text style={styles.logo}>{t('welcome.align')}</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.tagline}>{t('welcome.forTheGirls')}</Text>
          </Pressable>
        </View>

        {/* Bottom buttons */}
        <View style={styles.bottomSection}>
          <Link href="/onboarding/intro" asChild>
            <Pressable
              style={styles.getStartedButton}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
            >
              <Text style={styles.getStartedText}>{t('welcome.getStarted')}</Text>
            </Pressable>
          </Link>

          <Link href="/onboarding/signin" asChild>
            <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}>
              <Text style={styles.signInText}>
                {t('welcome.alreadyHaveAccount')}
                <Text style={styles.signInBold}>{t('welcome.signIn')}</Text>
              </Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </View>
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
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    zIndex: 100,
  },
  languageAnchor: {
    position: 'relative',
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  languageFlag: {
    fontSize: 16,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 4,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  dropdownName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  dropdownNameActive: {
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  dropdownCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginHorizontal: 16,
  },
  starsTopRight: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.12,
    right: 60,
    width: 90,
    height: 90,
  },
  starsLeft: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.32,
    left: 24,
    width: 70,
    height: 70,
  },
  starsBottomRight: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.58,
    right: 40,
    width: 110,
    height: 110,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: 80,
  },
  logo: {
    fontFamily: fonts.canela,
    fontSize: 96,
    color: colors.textInverse,
    letterSpacing: 4,
    fontStyle: 'italic',
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xl,
    color: colors.textInverse,
    marginTop: spacing.sm,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: colors.textInverse,
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  getStartedText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  signInText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textInverse,
  },
  signInBold: {
    fontFamily: fonts.bold,
  },
});
