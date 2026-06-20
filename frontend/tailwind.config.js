/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ghost: {
          bg: '#0d0f14',
          card: '#141720',
          border: '#1e2230',
          accent: '#7c5cfc',
          'accent-dim': '#5a3fd4',
          muted: '#3b4060',
          text: '#e2e8f0',
          'text-dim': '#8892b0',
          green: '#4ade80',
          red: '#f87171',
          yellow: '#fbbf24',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
