/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          // Warm Japanese charcoal / slate palette (Apple/Linear inspired, avoids harsh pitch black)
          950: '#1C1C1E', // Canvas in dark mode (comfortable dark charcoal)
          900: '#151517', // Sidebar in dark mode (slightly deeper slate)
          850: '#202024', // Subtle elevated background
          800: '#2C2C30', // Active item / borders in dark mode
          700: '#3E3E44', // Subtle buttons / outlines
          600: '#636366', // Muted secondary text in dark mode
          500: '#8E8E93', // Muted secondary text
          400: '#AEAEB2', // Secondary icons / timestamps
          300: '#D1D1D6', // Body text in dark mode
          200: '#E5E5EA', // Light mode border
          100: '#F2F2F7', // Light mode subtle active
          50: '#F9FAFB',  // Light mode sidebar
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif"
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace"
        ]
      }
    },
  },
  plugins: [],
};
