import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import ru from './locales/ru.json';
import ro from './locales/ro.json';
import az from './locales/az.json';
import nl from './locales/nl.json';

export const SUPPORTED_LANGUAGES = [
  'en',
  'zh',
  'hi',
  'es',
  'fr',
  'de',
  'ru',
  'pt',
  'it',
  'ro',
  'az',
  'nl',
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    de: { translation: de },
    fr: { translation: fr },
    pt: { translation: pt },
    it: { translation: it },
    zh: { translation: zh },
    hi: { translation: hi },
    ru: { translation: ru },
    ro: { translation: ro },
    az: { translation: az },
    nl: { translation: nl },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
