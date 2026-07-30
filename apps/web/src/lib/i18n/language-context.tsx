'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language, translations, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference from localStorage on client mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('orvyn_pms_lang') as Language;
      if (savedLang === 'en' || savedLang === 'ml') {
        setLanguageState(savedLang);
      }
    } catch (e) {
      // LocalStorage unavailable fallback to 'en'
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('orvyn_pms_lang', lang);
    } catch (e) {
      // Storage failure ignore
    }
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English if translation key is missing
    return translations.en[key] || key;
  }, [language]);

  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback default if rendered outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: TranslationKey) => translations.en[key] || key,
    };
  }
  return context;
};
