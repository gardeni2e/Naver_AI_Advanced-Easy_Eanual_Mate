/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#64748B",
        line: "#E5EAF2",
        panel: "#F6F8FC",
        card: "#FFFFFF",
        accent: "#3B82F6",
        "accent-dark": "#2563EB",
        violet: "#7C3AED",
        sky: "#0EA5E9",
        warning: "#F97316",
        info: "#EEF6FF"
      },
      boxShadow: {
        soft: "0 24px 70px rgba(15, 23, 42, 0.10)",
        card: "0 14px 34px rgba(15, 23, 42, 0.08)",
        glow: "0 18px 54px rgba(59, 130, 246, 0.16)"
      }
    }
  },
  plugins: []
};
