'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from './language-context';
import { Language } from './translations';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string; nativeName: string; subLabel: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English', subLabel: 'Default (US/UK)' },
    { code: 'ml', label: 'Malayalam', flag: '🇮🇳', nativeName: 'മലയാളം', subLabel: 'Regional (Kerala)' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left z-50" ref={containerRef}>
      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-1.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-400 text-slate-900 transition-all duration-200 text-xs font-black flex items-center gap-2 shadow-xs hover:shadow-md active:scale-98 group cursor-pointer"
        title="Switch Language / ഭാഷ മാറ്റുക"
        type="button"
      >
        <div className="w-5 h-5 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold shrink-0 border border-emerald-200/60 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
          <Globe className="w-3.2 h-3.2 group-hover:rotate-12 transition-transform duration-300" />
        </div>
        
        <span className="text-sm">{currentLang.flag}</span>
        <span className="font-extrabold text-slate-900 text-xs tracking-tight">{currentLang.nativeName}</span>
        
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100">
          
          {/* Header Title */}
          <div className="px-2.5 py-2 flex items-center justify-between text-slate-700 pb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <Globe className="w-3 h-3 text-emerald-600" />
              <span>Select Language / ഭാഷ</span>
            </div>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              i18n
            </span>
          </div>

          {/* Language Options List */}
          <div className="pt-1.5 space-y-1">
            {languages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-800 hover:text-slate-950 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <span className="text-lg leading-none shrink-0">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-xs">{lang.nativeName}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{lang.subLabel}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
