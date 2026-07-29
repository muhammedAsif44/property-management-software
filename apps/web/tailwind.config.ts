import type { Config } from 'tailwindcss';

const config: Config = {
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
        sans: ['var(--font-manrope)', 'sans-serif'],
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
    },
  },
  plugins: [],
};

export default config;

