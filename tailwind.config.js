/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          blue: '#AEC6CF',
          green: '#77DD77',
          pink: '#FFB7CE',
          purple: '#B19CD9',
          yellow: '#FDFD96',
        }
      }
    },
  },
  plugins: [],
}
