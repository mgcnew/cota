// VERSION: baf1ccb - Updated: 2025-01-21 - Hooks de Contagem de Estoque + Otimizações de animações
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/mobile-nav-optimized.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
