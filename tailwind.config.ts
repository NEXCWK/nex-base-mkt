import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#000000",
        accent: "#FFD400",
        "accent-soft": "#FFF6CC",
        "accent-strong": "#B8980A",
        "gray-light": "#F5F5F5",
        "gray-medium": "#E5E5E5",
        "gray-dark": "#2A2A2A",
        canvas: "#FAFAFA",
        border: "#E5E5E5",
        muted: "#F5F5F5",
        "muted-foreground": "#6B6B6B",
      },
      fontFamily: {
        sans: ["ProximaNova", "Inter", "system-ui", "Arial", "sans-serif"],
        proxima: ["ProximaNova", "Inter", "system-ui", "Arial", "sans-serif"],
      },
      // Numeric aliases so legacy classes like `font-600` / `font-700`
      // (used across the app) actually apply a weight.
      fontWeight: {
        "300": "300",
        "400": "400",
        "500": "500",
        "600": "600",
        "700": "700",
        "800": "800",
        "900": "900",
      },
      borderRadius: {
        xl: "0.875rem",
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.3125rem",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.04)",
        card: "0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02)",
        "card-hover": "0 4px 20px rgba(0,0,0,0.08)",
        pop: "0 12px 40px -8px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.06)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
