// portfolio-site/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // we toggle .dark on <html>
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2b596b",   // your main accent
        accent: "#FF6B35",    // secondary accent (used for highlights)
        'bg-soft': '#f6fbfb',
      },
      blur: {
        xs: '4px',
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
