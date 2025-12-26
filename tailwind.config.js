/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        background: "#0f111a",
        surface: "#1a1d2e",
        primary: "#6366f1",
        secondary: "#94a3b8",
        accent: "#f43f5e",
      },
    },
  },
  plugins: [],
}
