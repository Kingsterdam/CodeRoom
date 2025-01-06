/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        loading: 'loading 2s infinite',
      },
      transform: {
        'rotate-y-360': 'rotateY(360deg)',
        'rotate-y-0': 'rotateY(0deg)',
      },
      loading: {
        '0%': { width: '0%', backgroundColor: '#4285f4' },
        '50%': { width: '50%', backgroundColor: '#34a853' },
        '100%': { width: '100%', backgroundColor: '#fbbc05' },
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};
