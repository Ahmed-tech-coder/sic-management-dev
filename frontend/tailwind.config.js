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
        brand: {
          light: '#EF4444',
          DEFAULT: '#DC2626', // Blood Red
          hover: '#B91C1C',
          dark: '#991B1B',
          soft: 'rgba(220, 38, 38, 0.1)',
        },
      },
      borderRadius: {
        'card': '16px',
        'input': '12px',
        'btn': '12px',
      },
    },
  },
  plugins: [],
}
