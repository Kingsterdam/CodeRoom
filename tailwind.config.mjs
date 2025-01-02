/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  mode: 'jit',
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBackground: '#1a1a1a',
        lightBackground: '#ffffff',
        darkText: '#ffffff',
        lightText: '#000000',
      },
      animation: {
        loading: 'loading 2s infinite',
        'dark-mode-toggle': 'darkModeToggle 0.5s ease-in-out',
      },
      keyframes: {
        darkModeToggle: {
          '0%': { backgroundColor: '#ffffff', color: '#000000' },
          '50%': { backgroundColor: '#888888', color: '#444444' },
          '100%': { backgroundColor: '#1a1a1a', color: '#ffffff' },
        },
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};
