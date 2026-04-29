import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"',
          '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },
      colors: {
        brand: {
          50:  '#EBF5FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#007AFF',
          600: '#0066DB',
          700: '#0055B3',
          800: '#004494',
          900: '#002F80',
        },
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 28px rgba(0,0,0,0.12)',
        'sidebar':    '1px 0 0 rgba(0,0,0,0.06)',
        'bottom-nav': '0 -1px 0 rgba(0,0,0,0.08)',
        'modal':      '0 24px 64px rgba(0,0,0,0.28)',
        'elevated':   '0 4px 16px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}

export default config
