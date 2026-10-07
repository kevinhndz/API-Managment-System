/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stone: {
          700: '#5a4742',
          800: '#453532',
          900: '#302624',
          950: '#211a19'
        },
        navy: {
        50: '#f3f6fb',
          100: '#eee6d8',
          600: '#806b50',
          700: '#66543d',
          800: '#51432f',
          900: '#3b3022',
          950: '#282117'
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
        sans: ['Avenir Next', 'Segoe UI', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        panel: '0 18px 44px -30px rgb(15 23 42 / 0.35)'
      }
    }
  },
  plugins: []
}
