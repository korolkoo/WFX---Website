import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // CORREÇÃO: Usando aspas simples, sem colchetes []
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mapeia o nome da classe para a variável CSS
        wfx: {
          bg: "var(--bg)",
          card: "var(--card)",
          text: "var(--text)",
          primary: "var(--primary)",
          border: "var(--border)",
          muted: "var(--muted)",
        },
      },
    },
  },
  plugins: [],
};
export default config;