// VERSION: f4b3985 - Updated: 2025-01-XX - FORCE LOVABLE SYNC
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileProvider } from "@/contexts/MobileProvider";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <MobileProvider>
        <App />
      </MobileProvider>
    </AuthProvider>
  </ErrorBoundary>
);
