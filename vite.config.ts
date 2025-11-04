import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path para GitHub Pages (se necessário)
  // base: process.env.NODE_ENV === 'production' ? '/cotaja/' : '/',
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true, // Força usar a porta 8080, mostra erro se estiver ocupada
    open: true, // Abre automaticamente no navegador
    hmr: {
      port: 8080, // Hot Module Replacement também na porta 8080
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
