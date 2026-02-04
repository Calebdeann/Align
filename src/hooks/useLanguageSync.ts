import { useEffect } from 'react';
import i18n, { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n';
import { useUserProfileStore } from '@/stores/userProfileStore';

/**
 * Syncs the i18n language with the user's profile language preference.
 * When the user logs in and their profile loads, this updates i18n to match.
 * Call this in the root layout.
 */
export function useLanguageSync() {
  const language = useUserProfileStore((state) => state.profile?.language);

  useEffect(() => {
    if (
      language &&
      SUPPORTED_LANGUAGES.includes(language as SupportedLanguage) &&
      i18n.language !== language
    ) {
      i18n.changeLanguage(language);
    }
  }, [language]);
}
