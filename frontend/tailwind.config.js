/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060b18",
          900: "#0a1020",
          800: "#0f1830",
          700: "#162040",
          600: "#1e2d55",
          500: "#263566",
        },
        accent: {
          blue:   "#4f8ef7",
          indigo: "#6c63ff",
          cyan:   "#22d3ee",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
