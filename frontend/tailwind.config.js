/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  "#f2f7f2",
          100: "#e2ede3",
          200: "#c5dbc8",
          300: "#9dc0a2",
          400: "#6f9f76",
          500: "#4e8256",
          600: "#3b6742",
          700: "#305237",
          800: "#28422d",
          900: "#213726",
        },
        blush: {
          50:  "#fdf4f4",
          100: "#fce8e8",
          200: "#fad5d5",
          300: "#f5b4b4",
          400: "#ed8585",
          500: "#e05a5a",
          600: "#cc3b3b",
          700: "#ab2d2d",
          800: "#8d2929",
          900: "#762828",
        },
        lavender: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        pulse_slow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
