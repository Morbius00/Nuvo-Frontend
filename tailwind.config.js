/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './index.ts', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#12141A',
          raised: '#1A1D26',
          surface: '#20242E',
          surface2: '#262B36',
        },
        line: {
          hair: 'rgba(255,255,255,0.08)',
          glass: 'rgba(255,255,255,0.14)',
        },
        primary: {
          50: '#E9FFEF',
          100: '#CBFFDA',
          200: '#9CFFBC',
          300: '#7CFF9E',
          400: '#4FF08A',
          500: '#22E37A',
          600: '#14C56A',
          700: '#0FAE5C',
          800: '#0B8A48',
          900: '#076535',
        },
        lime: {
          400: '#C6FF6B',
          500: '#B6FF4D',
        },
        danger: {
          400: '#FF8080',
          500: '#FF5C5C',
          600: '#E23F3F',
        },
        tier: {
          green: '#22E37A',
          yellow: '#F2D24B',
          orange: '#FF9142',
          red: '#FF4D4D',
          hard: '#E11D48',
        },
        ink: {
          DEFAULT: '#F5F7F7',
          secondary: 'rgba(245,247,247,0.64)',
          muted: 'rgba(245,247,247,0.4)',
          onPrimary: '#04140B',
        },
      },
      fontFamily: {
        sans: ['Manrope_400Regular'],
        medium: ['Manrope_500Medium'],
        semibold: ['Manrope_600SemiBold'],
        bold: ['Manrope_700Bold'],
        extrabold: ['Manrope_800ExtraBold'],
      },
      borderRadius: {
        xl2: '20px',
        '4xl': '28px',
        '5xl': '32px',
      },
    },
  },
  plugins: [],
};
