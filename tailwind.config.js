/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Assurez-vous que tous vos fichiers sont inclus
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      colors: {
        primary: {
          DEFAULT: '#3B82F6', // Bleu principal
          50: '#EFF6FF', // Bleu ciel très clair
          100: '#DBEAFE', // Bleu ciel
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        blue: {
          50: '#EFF6FF', // Bleu ciel
          100: '#DBEAFE', // Bleu ciel légèrement plus foncé
          200: '#BFDBFE',
          600: '#2563EB', // Bleu moyen
          800: '#1E40AF', // Bleu foncé
        },
        'primary-foreground': '#FFFFFF', // Texte blanc sur fond bleu
        background: '#EFF6FF', // Fond général en bleu ciel
        card: '#DBEAFE', // Fond des cartes en bleu ciel
        sidebar: {
          background: '#DBEAFE', // Fond de la barre latérale en bleu ciel
          border: '#93C5FD', // Bordure bleu clair
          foreground: '#1E40AF', // Texte bleu foncé
          accent: '#BFDBFE', // Accent bleu ciel
        },
        muted: {
          DEFAULT: '#DBEAFE', // Fond muted en bleu ciel
          30: 'rgba(219, 234, 254, 0.3)', // Bleu ciel avec opacité
        },
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      maxWidth: {
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
      },
    },
  },
  plugins: [],
};