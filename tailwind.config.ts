import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#f7f4ee',
        cream: '#fdfaf3',
        ink: '#2d2a25',
        muted: '#7d756a',
        warmline: '#e6dfd1',
        coral: '#d96846',
        coralsoft: '#f4d1c5',
        forest: '#3f6b4a',
        rust: '#a64320',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(45, 42, 37, 0.05), 0 2px 8px rgba(45, 42, 37, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
