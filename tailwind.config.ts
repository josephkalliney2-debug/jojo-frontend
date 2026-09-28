import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jojo: {
          orange: "#EA580C",
          "orange-dark": "#C2410C",
          navy: "#0F172A",
          "navy-light": "#1E293B",
        },
      },
    },
  },
  plugins: [],
};

export default config;
