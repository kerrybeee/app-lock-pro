/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./electron-main.js",
    "./preload.js",
  ],
  theme: {
    extend: {
      colors: {
        appleBlue: "#007AFF",
        appleGreen: "#34C759",
        appleGrayLight: "#F8F9FA",
        appleGrayMedium: "#E9ECEF",
        appleGrayDark: "#1D1D1F",
        appleGrayText: "#86868B",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        apple: "0 2px 10px rgba(0,0,0,0.1)",
      },
      borderRadius: {
        xl: "12px",
      },
    },
  },
  plugins: [],
};
