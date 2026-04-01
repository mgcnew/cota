// vite.config.ts
import { defineConfig } from "file:///C:/Users/mgcin/OneDrive/Documentos/antigravity/cota/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/mgcin/OneDrive/Documentos/antigravity/cota/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/mgcin/OneDrive/Documentos/antigravity/cota/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Users/mgcin/OneDrive/Documentos/antigravity/cota/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\mgcin\\OneDrive\\Documentos\\antigravity\\cota";
var vite_config_default = defineConfig(({ mode }) => ({
  // Base path para GitHub Pages (se necessário)
  // base: process.env.NODE_ENV === 'production' ? '/cotaja/' : '/',
  server: {
    host: "localhost",
    // Mudado para localhost para melhor compatibilidade
    port: 8087,
    strictPort: true,
    // Permite usar outra porta se 8098 estiver ocupada
    open: true,
    // Abre automaticamente no navegador
    proxy: {
      "/whatsapp-api": {
        target: "https://api.w-api.app",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/whatsapp-api/, "")
      }
    }
  },
  preview: {
    host: "localhost",
    port: 8087,
    strictPort: true,
    open: true
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo.png", "robots.txt"],
      manifest: {
        name: "Cota\xE7\xF5esPro",
        short_name: "Cota\xE7\xF5esPro",
        description: "Sistema de Gest\xE3o de Cota\xE7\xF5es",
        theme_color: "#3B82F6",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "logo.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "logo.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    },
    dedupe: ["react", "react-dom"]
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting for better code splitting (Requirements 12.4)
         * Separates heavy libraries into their own chunks for lazy loading
         */
        manualChunks: (id) => {
          if (id.includes("xlsx")) return "vendor-xlsx";
          if (id.includes("jspdf")) return "vendor-pdf";
          if (id.includes("html2canvas")) return "vendor-canvas";
          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("react-router-dom")) return "vendor-router";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("date-fns")) return "vendor-date";
          if (id.includes("@radix-ui")) return "vendor-ui";
        }
      }
    },
    // Increase chunk size warning limit for vendor chunks
    chunkSizeWarningLimit: 1e3
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtZ2NpblxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXGFudGlncmF2aXR5XFxcXGNvdGFcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG1nY2luXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcYW50aWdyYXZpdHlcXFxcY290YVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvbWdjaW4vT25lRHJpdmUvRG9jdW1lbnRvcy9hbnRpZ3Jhdml0eS9jb3RhL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcclxuICAvLyBCYXNlIHBhdGggcGFyYSBHaXRIdWIgUGFnZXMgKHNlIG5lY2Vzc1x1MDBFMXJpbylcclxuICAvLyBiYXNlOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nID8gJy9jb3RhamEvJyA6ICcvJyxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IFwibG9jYWxob3N0XCIsIC8vIE11ZGFkbyBwYXJhIGxvY2FsaG9zdCBwYXJhIG1lbGhvciBjb21wYXRpYmlsaWRhZGVcclxuICAgIHBvcnQ6IDgwODcsXHJcbiAgICBzdHJpY3RQb3J0OiB0cnVlLCAvLyBQZXJtaXRlIHVzYXIgb3V0cmEgcG9ydGEgc2UgODA5OCBlc3RpdmVyIG9jdXBhZGFcclxuICAgIG9wZW46IHRydWUsIC8vIEFicmUgYXV0b21hdGljYW1lbnRlIG5vIG5hdmVnYWRvclxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy93aGF0c2FwcC1hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9hcGkudy1hcGkuYXBwJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3doYXRzYXBwLWFwaS8sICcnKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBwcmV2aWV3OiB7XHJcbiAgICBob3N0OiBcImxvY2FsaG9zdFwiLFxyXG4gICAgcG9ydDogODA4NyxcclxuICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICBvcGVuOiB0cnVlLFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSwgXHJcbiAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXHJcbiAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAnbG9nby5wbmcnLCAncm9ib3RzLnR4dCddLFxyXG4gICAgICBtYW5pZmVzdDoge1xyXG4gICAgICAgIG5hbWU6ICdDb3RhXHUwMEU3XHUwMEY1ZXNQcm8nLFxyXG4gICAgICAgIHNob3J0X25hbWU6ICdDb3RhXHUwMEU3XHUwMEY1ZXNQcm8nLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2lzdGVtYSBkZSBHZXN0XHUwMEUzbyBkZSBDb3RhXHUwMEU3XHUwMEY1ZXMnLFxyXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnIzNCODJGNicsXHJcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLFxyXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdsb2dvLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdsb2dvLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBNYW51YWwgY2h1bmsgc3BsaXR0aW5nIGZvciBiZXR0ZXIgY29kZSBzcGxpdHRpbmcgKFJlcXVpcmVtZW50cyAxMi40KVxyXG4gICAgICAgICAqIFNlcGFyYXRlcyBoZWF2eSBsaWJyYXJpZXMgaW50byB0aGVpciBvd24gY2h1bmtzIGZvciBsYXp5IGxvYWRpbmdcclxuICAgICAgICAgKi9cclxuICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xyXG4gICAgICAgICAgLy8gSGVhdnkgZXhwb3J0IGxpYnJhcmllcyAtIG9ubHkgbG9hZCB3aGVuIG5lZWRlZFxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCd4bHN4JykpIHJldHVybiAndmVuZG9yLXhsc3gnO1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdqc3BkZicpKSByZXR1cm4gJ3ZlbmRvci1wZGYnO1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdodG1sMmNhbnZhcycpKSByZXR1cm4gJ3ZlbmRvci1jYW52YXMnO1xyXG4gICAgICAgICAgLy8gUmVjaGFydHMgbGlicmFyeSBpbiBzZXBhcmF0ZSBjaHVuayBmb3IgbGF6eSBsb2FkaW5nXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlY2hhcnRzJykpIHJldHVybiAndmVuZG9yLWNoYXJ0cyc7XHJcbiAgICAgICAgICAvLyBSZWFjdCByb3V0ZXIgaW4gc2VwYXJhdGUgY2h1bmsgKHJlYWN0IGFuZCByZWFjdC1kb20gc3RheSBpbiBtYWluIGJ1bmRsZSlcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyLWRvbScpKSByZXR1cm4gJ3ZlbmRvci1yb3V0ZXInO1xyXG4gICAgICAgICAgLy8gUXVlcnkgYW5kIHN0YXRlIG1hbmFnZW1lbnRcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5JykpIHJldHVybiAndmVuZG9yLXF1ZXJ5JztcclxuICAgICAgICAgIC8vIERhdGUgdXRpbGl0aWVzXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2RhdGUtZm5zJykpIHJldHVybiAndmVuZG9yLWRhdGUnO1xyXG4gICAgICAgICAgLy8gVUkgY29tcG9uZW50IGxpYnJhcmllcyAtIGdyb3VwIFJhZGl4IFVJXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aScpKSByZXR1cm4gJ3ZlbmRvci11aSc7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBJbmNyZWFzZSBjaHVuayBzaXplIHdhcm5pbmcgbGltaXQgZm9yIHZlbmRvciBjaHVua3NcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVYsU0FBUyxvQkFBb0I7QUFDdFgsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGVBQWU7QUFKeEIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQTtBQUFBO0FBQUEsRUFHekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUE7QUFBQSxJQUNaLE1BQU07QUFBQTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsaUJBQWlCO0FBQUEsUUFDZixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUNBLFVBQVNBLE1BQUssUUFBUSxtQkFBbUIsRUFBRTtBQUFBLE1BQ3ZEO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUMxQyxRQUFRO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxlQUFlLENBQUMsZUFBZSxZQUFZLFlBQVk7QUFBQSxNQUN2RCxVQUFVO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsUUFDVCxPQUFPO0FBQUEsVUFDTDtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSCxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLElBQ0EsUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLEVBQy9CO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQUtOLGNBQWMsQ0FBQyxPQUFPO0FBRXBCLGNBQUksR0FBRyxTQUFTLE1BQU0sRUFBRyxRQUFPO0FBQ2hDLGNBQUksR0FBRyxTQUFTLE9BQU8sRUFBRyxRQUFPO0FBQ2pDLGNBQUksR0FBRyxTQUFTLGFBQWEsRUFBRyxRQUFPO0FBRXZDLGNBQUksR0FBRyxTQUFTLFVBQVUsRUFBRyxRQUFPO0FBRXBDLGNBQUksR0FBRyxTQUFTLGtCQUFrQixFQUFHLFFBQU87QUFFNUMsY0FBSSxHQUFHLFNBQVMsdUJBQXVCLEVBQUcsUUFBTztBQUVqRCxjQUFJLEdBQUcsU0FBUyxVQUFVLEVBQUcsUUFBTztBQUVwQyxjQUFJLEdBQUcsU0FBUyxXQUFXLEVBQUcsUUFBTztBQUFBLFFBQ3ZDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsdUJBQXVCO0FBQUEsRUFDekI7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogWyJwYXRoIl0KfQo=
