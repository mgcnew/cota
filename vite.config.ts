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
    port: 8087,
    strictPort: true, // Permite usar outra porta se 8098 estiver ocupada
    open: true, // Abre automaticamente no navegador
  },
  preview: {
    host: "localhost",
    port: 8087,
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
        manualChunks: (id) => {
          // Heavy export libraries - only load when needed
          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (id.includes('jspdf')) return 'vendor-pdf';
          if (id.includes('html2canvas')) return 'vendor-canvas';
          // Recharts library in separate chunk for lazy loading
          if (id.includes('recharts')) return 'vendor-charts';
          // React router in separate chunk (react and react-dom stay in main bundle)
          if (id.includes('react-router-dom')) return 'vendor-router';
          // Query and state management
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          // Date utilities
          if (id.includes('date-fns')) return 'vendor-date';
          // UI component libraries - group Radix UI
          if (id.includes('@radix-ui')) return 'vendor-ui';
        },
      },
    },
    // Increase chunk size warning limit for vendor chunks
    chunkSizeWarningLimit: 1000,
  },
}));
