import { useEffect } from 'react';
import i18n from '@/i18n';
import { useExerciseStore } from '@/stores/exerciseStore';

/**
 * Loads exercise translations whenever the i18n language changes.
 * Call this in the root layout alongside useLanguageSync().
 */
export function useExerciseTranslations() {
  const isLoaded = useExerciseStore((state) => state.isLoaded);
  const loadTranslations = useExerciseStore((state) => state.loadTranslations);

  useEffect(() => {
    if (!isLoaded) return;

    // Load for current language
    loadTranslations(i18n.language);

    // Re-load when language changes
    const handleLanguageChange = (lng: string) => {
      loadTranslations(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [isLoaded, loadTranslations]);
}
