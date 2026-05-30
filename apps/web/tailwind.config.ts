import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // InsightXI brand palette — premium, data-rich, trustworthy
        pitch: "#0a0f1c",
        insight: "#3b82f6",
        signal: "#22c55e",
      },
    },
  },
  plugins: [],
};

export default config;
