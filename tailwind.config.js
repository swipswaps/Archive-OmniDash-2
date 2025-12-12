/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./views/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ia: {
          50: '#f7f7f8',
          100: '#ececf1',
          200: '#d9d9e3',
          300: '#b4b4c7',
          400: '#8e8ea8',
          500: '#686889',
          600: '#52526e',
          700: '#404055',
          800: '#333342',
          900: '#2b2b36',
        }
      }
    }
  },
  plugins: [],
}

