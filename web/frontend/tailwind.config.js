/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Deep navy surfaces — the reference's dark canvas, shifted from maroon to blue
        ink: {
          950: "#050912",
          900: "#080E1C",
          850: "#0C1526",
          800: "#111C32",
          700: "#1A2842",
          600: "#243453",
        },
        line: "#23324F",
        // Primary accent (replaces the reference's coral)
        brand: {
          200: "#BFD4FF",
          300: "#93B4FF",
          400: "#6494FF",
          500: "#3B7DFF",
          600: "#2361EF",
          700: "#1A4CC4",
        },
        // Secondary accent
        mint: {
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
        },
        paper: "#F5F8FF",
        muted: "#9DB0CE",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      letterSpacing: {
        wordmark: "0.34em",
      },
      maxWidth: {
        prose: "62ch",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
low: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        rise: "rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        low: "low 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
