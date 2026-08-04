'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from './language-context';
import { Language } from './translations';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageOption {
  code: Language;
  label: string;
  shortLabel: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', shortLabel: 'EN', nativeName: 'English' },
  { code: 'ml', label: 'Malayalam', shortLabel: 'ML', nativeName: 'മലയാളം' },
];

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((code: Language) => {
    setLanguage(code);
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, [setLanguage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % LANGUAGES.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + LANGUAGES.length) % LANGUAGES.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < LANGUAGES.length) {
          handleSelect(LANGUAGES[focusedIndex].code);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  }, [isOpen, focusedIndex, handleSelect]);

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex, isOpen]);

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Compact Trigger: 🌐 EN ▼ */}
      <button
        ref={triggerRef}
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setFocusedIndex(0); }}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-150 text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:scale-[0.97]"
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Language: ${currentLang.label}. Click to change.`}
        title={`Language: ${currentLang.label}`}
      >
        <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">{currentLang.shortLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-900/10 p-1 z-[100] animate-slideDown"
        >
          {/* Header */}
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Language
          </div>

          {/* Options */}
          {LANGUAGES.map((lang, index) => {
            const isSelected = lang.code === language;
            const isFocused = index === focusedIndex;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(lang.code)}
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-100 cursor-pointer ${
                  isFocused
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium'
                    : isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">{lang.shortLabel}</span>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="font-medium text-xs leading-tight truncate">{lang.nativeName}</span>
                    {lang.nativeName !== lang.label && (
                      <span className="text-[10px] text-slate-400 leading-tight truncate">{lang.label}</span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.5} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
