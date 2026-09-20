import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: {
        canvas: "hsl(var(--canvas))",
        panel: "hsl(var(--panel))",
        line: "hsl(var(--line))",
        ink: "hsl(var(--ink))",
        muted: "hsl(var(--muted))",
        accent: "hsl(var(--accent))"
      },
      boxShadow: { panel: "0 22px 70px rgba(0,0,0,.28)" }
    }
  },
  plugins: []
} satisfies Config;
