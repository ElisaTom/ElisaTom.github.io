import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: '#6366f1',
          fuchsia: '#d946ef',
          emerald: '#10b981',
          rose: '#f43f5e',
          orange: '#f97316',
          teal: '#14b8a6',
          pink: '#ec4899',
        },
      },
    },
  },
  plugins: [],
};

export default config;
