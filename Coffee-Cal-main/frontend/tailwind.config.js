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
        // Light mode - cream/beige theme
        cream: {
          50: '#fefdfb',
          100: '#fef8f0',
          200: '#fdf1e1',
          300: '#fae9d0',
          400: '#f5dcb8',
          500: '#ebc79e',
          600: '#d9a876',
          700: '#c18a5a',
          800: '#a06d45',
          900: '#735037',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}