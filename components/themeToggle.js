'use client';

import { useTheme } from "../context/ThemeContext"; // Import your theme context

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme(); // Get the theme and toggle function from the context

  return (
    <button
      onClick={toggleTheme} // Call toggleTheme to change the theme
      className="py-1 px-2 rounded-lg bg-gray-20 dark:text-black dark:bg-green-300 text-gray-90 font-semibold"
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"} {/* Display icons based on current theme */}
    </button>
  );
};

export default ThemeToggle;
