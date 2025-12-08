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
    port: 8095,
    strictPort: true, // Permite usar outra porta se 8080 estiver ocupada
    open: true, // Abre automaticamente no navegador
  },
  preview: {
    host: "localhost",
    port: 8095,
    strictPort: true,
    open: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting for better code splitting (Requirements 12.4)
         * Separates heavy libraries into their own chunks for lazy loading
         */
        manualChunks: {
          // Recharts library in separate chunk for lazy loading
          'vendor-charts': ['recharts'],
          // React core libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI component libraries
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover'],
          // Query and state management
          'vendor-query': ['@tanstack/react-query'],
          // Date utilities
          'vendor-date': ['date-fns'],
        },
      },
    },
    // Increase chunk size warning limit for vendor chunks
    chunkSizeWarningLimit: 1000,
  },
}));
