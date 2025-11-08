import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Configuração simplificada do Vite para diagnóstico
// Use esta versão se a configuração principal não funcionar
export default defineConfig({
  server: {
    host: "localhost",
    port: 8080,
    strictPort: false,
    open: true,
  },
  plugins: [react()], // Sem lovable-tagger para testar
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
});

