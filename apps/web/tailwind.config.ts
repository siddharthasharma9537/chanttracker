import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'temple': {
          50: '#faf8f3',
          100: '#f3ebe0',
          500: '#c8914a',
          900: '#2d1a0a',
        },
        'midnight': {
          50: '#f8f8f8',
          100: '#e0e0e0',
          500: '#4a5568',
          900: '#1a202c',
        },
        'dawn': {
          50: '#fdf6f3',
          100: '#f5e6e0',
          500: '#d97706',
          900: '#3b2415',
        },
      },
      fontFamily: {
        devanagari: ['Tiro Devanagari Sanskrit', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
