/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Assurez-vous que tous vos fichiers sont inclus
  ],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
};