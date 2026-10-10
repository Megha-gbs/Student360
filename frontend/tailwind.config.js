/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kpmg: {
          blue: '#00338D',
          lightblue: '#0091DA',
          purple: '#483698',
          dark: '#00225D',
        },
        surface: {
          light: '#FFFFFF',
          panel: '#FFFFFF',
          muted: '#F5F5F5',
          alt: '#F0F0F0',
          border: '#D0D0D0',
        },
        enterprise: {
          textPrimary: '#1A1A1A',
          textSecondary: '#4A4A4A',
          textMuted: '#767676',
          border: '#D0D0D0',
          present: '#1A7F37',
          absent: '#B91C1C',
          late: '#92600A',
        },
        risk: {
          high: '#B91C1C',
          medium: '#92600A',
          low: '#1A7F37',
        }
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
      },
      boxShadow: {
        none: 'none',
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
