import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#000000",
        accent: "#FFD400",
        "gray-light": "#F5F5F5",
        "gray-medium": "#E5E5E5",
        "gray-dark": "#2A2A2A",
        border: "#E5E5E5",
        muted: "#F5F5F5",
        "muted-foreground": "#6B7280",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Arial", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
