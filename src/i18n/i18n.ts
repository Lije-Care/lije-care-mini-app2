import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import am from '../locales/am.json';

const resources = {
  en: { translation: en },
  am: { translation: am },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'user-language',
      caches: ['localStorage'], // Save selected language in localStorage
    },
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
  });

export default i18n;
