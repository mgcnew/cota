import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, lazy, Suspense, ReactNode } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CompanyAutoSetup } from "./components/auth/CompanyAutoSetup";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { initScrollbarFix } from "./utils/scrollbar-fix";
import { queryClient } from "./lib/queryClient";

/**
 * All pages are lazy loaded for code splitting (Requirements 12.1, 12.2)
 * Each page is loaded in a separate chunk to minimize initial bundle size
 */

// Páginas públicas - lazy load para reduzir bundle inicial
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VendorPortal = lazy(() => import("@/pages/VendorPortal"));
const ShortLinkRedirect = lazy(() => import("@/pages/ShortLinkRedirect"));
const OrderPortal = lazy(() => import("./pages/OrderPortal"));
const PackagingOrderPortal = lazy(() => import("./pages/PackagingOrderPortal"));

// Prefetch function for probable next pages (Requirements 16.5)
const prefetchDashboard = () => import("./pages/Dashboard");

// Páginas principais - lazy load
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Produtos = lazy(() => import("./pages/Produtos"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const Compras = lazy(() => import("./pages/Compras"));
const ContagemEstoque = lazy(() => import("./pages/ContagemEstoque"));
const Anotacoes = lazy(() => import("./pages/Anotacoes"));
const Etiquetas = lazy(() => import("./pages/Etiquetas"));
const Relatorios = lazy(() => import("./pages/Relatorios"));

// Páginas secundárias - lazy load com prioridade baixa
const Configuracoes = lazy(() => import("./pages/Configuracoes"));

// Loading fallback minimalista - rápido e leve
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
  </div>
);

// PageWrapper com Suspense obrigatório para lazy-loaded pages
const PageWrapper = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const App = () => {
  useEffect(() => {
    const cleanup = initScrollbarFix();
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <CompanyAutoSetup />
              <Routes>
                {/* Rotas públicas - lazy loaded with ErrorBoundary (Requirements 10.5, 12.1, 12.2) */}
                <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
                <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
                <Route path="/accept-invite" element={<PageWrapper><AcceptInvite /></PageWrapper>} />
                <Route path="/responder/:token" element={<PageWrapper><VendorPortal /></PageWrapper>} />
                <Route path="/r/:id" element={<PageWrapper><ShortLinkRedirect /></PageWrapper>} />
                <Route path="/pedido/:id" element={<PageWrapper><OrderPortal /></PageWrapper>} />
                <Route path="/rp/:id" element={<PageWrapper><PackagingOrderPortal /></PageWrapper>} />

                {/* Rotas protegidas - with ErrorBoundary */}
                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<PageWrapper><Dashboard /></PageWrapper>} />
                  <Route path="produtos" element={<PageWrapper><Produtos /></PageWrapper>} />
                  <Route path="fornecedores" element={<PageWrapper><Fornecedores /></PageWrapper>} />
                  <Route path="compras" element={<PageWrapper><Compras /></PageWrapper>} />
                  <Route path="cotacoes" element={<Navigate to="/dashboard/compras?tab=cotacoes" replace />} />
                  <Route path="pedidos" element={<Navigate to="/dashboard/compras?tab=pedidos" replace />} />
                  <Route path="lista-compras" element={<Navigate to="/dashboard/compras?tab=lista" replace />} />
                  <Route path="historico" element={<Navigate to="/dashboard/relatorios?tab=historico" replace />} />
                  <Route path="relatorios" element={<PageWrapper><Relatorios /></PageWrapper>} />
                  <Route path="analytics" element={<Navigate to="/dashboard/relatorios?tab=analytics" replace />} />
                  <Route path="contagem-estoque" element={<PageWrapper><ContagemEstoque /></PageWrapper>} />
                  <Route path="etiquetas" element={<PageWrapper><Etiquetas /></PageWrapper>} />
                  <Route path="anotacoes" element={<PageWrapper><Anotacoes /></PageWrapper>} />
                  <Route path="configuracoes" element={<PageWrapper><Configuracoes /></PageWrapper>} />
                </Route>

                {/* Rota 404 - lazy loaded with ErrorBoundary */}
                <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
