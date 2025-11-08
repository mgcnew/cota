import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path para GitHub Pages (se necessário)
  // base: process.env.NODE_ENV === 'production' ? '/cotaja/' : '/',
  server: {
    host: "localhost", // Mudado para localhost para melhor compatibilidade
    port: 8080,
    strictPort: false, // Permite usar outra porta se 8080 estiver ocupada
    open: true, // Abre automaticamente no navegador
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
