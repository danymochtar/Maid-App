import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cherry red brand palette — primary CTA + accents
        brand: {
          50: "#fef2f4",
          100: "#fde6ea",
          200: "#fbd0d8",
          300: "#f7a2b1",
          400: "#f1738a",
          500: "#dc143c", // cherry red
          600: "#b91c2e",
          700: "#991825",
          800: "#7a141d",
          900: "#5c0f15",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
