'use client';

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { Language, translations, TranslationKey } from './translations';
import { useUiStore } from '../store/use-ui-store';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language = useUiStore((state) => state.language);
  const setLanguageState = useUiStore((state) => state.setLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, [setLanguageState]);

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
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: TranslationKey) => translations.en[key] || key,
    };
  }
  return context;
};
