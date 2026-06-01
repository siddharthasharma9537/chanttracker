import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Warm parchment/temple aesthetic from iOS
        'temple': {
          25: '#fdf9f6',
          50: '#faf8f3',
          100: '#f3ebe0',
          150: '#ede2d6',
          200: '#e8dbd0',
          300: '#d4c5b0',
          400: '#c0b19f',
          500: '#c8914a',
          600: '#b8813a',
          700: '#a86d2a',
          800: '#8b5922',
          900: '#2d1a0a',
        },
        // Spiritual orange (deity/sacred significance) - PRIMARY ACCENT
        'sacred': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        'midnight': {
          50: '#f8f8f8',
          100: '#e0e0e0',
          500: '#4a5568',
          900: '#1a202c',
        },
      },
      fontFamily: {
        devanagari: ['Noto Sans Devanagari', 'Tiro Devanagari Sanskrit', 'serif'],
        telugu: ['Noto Sans Telugu', 'system-ui', 'sans-serif'],
        merriweather: ['Merriweather', 'serif'],
        // Script families for proper rendering of Indian scripts
        'sanskrit': ['Tiro Devanagari Sanskrit', 'serif'],
        'devanagari-serif': ['Tiro Devanagari Sanskrit', 'serif'],
      },
      backgroundImage: {
        'parchment-gradient': 'linear-gradient(135deg, #fdf9f6 0%, #f3ebe0 50%, #ede2d6 100%)',
        'temple-radial': 'radial-gradient(circle at center, #faf8f3 0%, #ede2d6 100%)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}

export default config
