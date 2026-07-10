import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        dark: "#0B0B0B",
        accent: "#111111", // Professional black accent
        secondary: "#6B7280",
        success: "#22C55E",
      },
      fontFamily: {
        sans: ["var(--font-cormorant)", "serif"],
        serif: ["var(--font-cormorant)", "serif"],
        poem: ["var(--font-cormorant)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
