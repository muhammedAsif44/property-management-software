import { create } from 'zustand';
import { Language } from '../i18n/translations';
import { Theme } from '../theme/theme-context';

interface UiState {
  theme: Theme;
  language: Language;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'light',
  language: 'en',
  resolvedTheme: 'light',

  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
}));
