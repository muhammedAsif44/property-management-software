import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px' }],
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['13px', { lineHeight: '20px' }],
        'base': ['14px', { lineHeight: '20px' }],
        'md': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '26px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '38px' }],
      },
      colors: {
        emerald: {
          50: '#eefcf6',
          100: '#d7f7e9',
          200: '#b0eed3',
          300: '#7be1b7',
          400: '#42cc97',
          500: '#0B6E4F', // Primary User Request Color
          600: '#095c42',
          700: '#084a36',
          800: '#073c2c',
          900: '#063125',
          950: '#031c15',
        },
        primary: {
          50: '#eefcf6',
          100: '#d7f7e9',
          200: '#b0eed3',
          300: '#7be1b7',
          400: '#42cc97',
          500: '#0B6E4F',
          600: '#095c42',
          700: '#084a36',
          800: '#073c2c',
          900: '#063125',
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slideUp': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slideDown': 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scaleIn': 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'cardReveal': 'cardReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'checkPop': 'checkPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'counterPop': 'counterPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulseGlow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        cardReveal: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        checkPop: {
          '0%': { transform: 'scale(0)' },
          '60%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        counterPop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(11, 110, 79, 0.25)' },
          '50%': { boxShadow: '0 0 0 6px rgba(11, 110, 79, 0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
