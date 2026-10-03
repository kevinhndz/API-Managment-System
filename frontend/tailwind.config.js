/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f3f6fb',
          100: '#e5ecf6',
          600: '#24466e',
          700: '#183757',
          800: '#132d49',
          900: '#10263e',
          950: '#091827'
        },
        sage: {
          50: '#f2f8f5',
          100: '#dfefe7',
          400: '#55a77d',
          500: '#378b64',
          600: '#2a7050'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        panel: '0 14px 40px -24px rgb(15 23 42 / 0.35)'
      }
    }
  },
  plugins: []
}
