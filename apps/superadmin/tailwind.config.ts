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
        indigo: {
          50: '#f0eefc',
          100: '#e0dbf9',
          200: '#c5bbf5',
          300: '#9d8eef',
          400: '#6f57e6',
          500: '#360CAF', // User Requested Super Admin Primary Color (#360CAF)
          600: '#2d0a94',
          700: '#25087a',
          800: '#1e0761',
          900: '#19064f',
          950: '#0e0330',
        },
        primary: {
          50: '#f0eefc',
          100: '#e0dbf9',
          200: '#c5bbf5',
          300: '#9d8eef',
          400: '#6f57e6',
          500: '#360CAF',
          600: '#2d0a94',
          700: '#25087a',
          800: '#1e0761',
          900: '#19064f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
