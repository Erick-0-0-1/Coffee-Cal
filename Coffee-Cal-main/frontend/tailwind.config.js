/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Light mode - warm latte creams
        cream: {
          50: '#fcfbf8',
          100: '#f4efea',
          200: '#e6dfd5',
          300: '#d5c6b4',
          400: '#c2ab91',
          500: '#b09270',
          600: '#9b7b5c',
          700: '#7c6048',
          800: '#634c3a',
          900: '#523e31',
        },
        // Dark mode - deep espresso and rich mochas
        coffee: {
          50: '#f5f3ef',
          100: '#e6dfd5',
          200: '#d1c4b5',
          300: '#b8a38d',
          400: '#9e8166',
          500: '#8b694b',
          600: '#75543c',
          700: '#5e4332',
          800: '#3e2b1f', // Perfect for dark mode cards/modals
          900: '#2a1b12', // Perfect for dark mode app background
          950: '#1c140d',
        },
        // Accents - buttons, borders, active states
        caramel: {
          400: '#d4a373',
          500: '#c19a6b', // Primary brand color
          600: '#a67c52',
        },
        // Profit analysis & positive numbers
        matcha: {
          400: '#7b9959',
          500: '#658147',
          600: '#4a6332',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}