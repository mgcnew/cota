import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, lazy, Suspense, ReactNode } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./components/auth/AuthProvider";
import { CompanyAutoSetup } from "./components/auth/CompanyAutoSetup";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { initScrollbarFix } from "./utils/scrollbar-fix";

/**
 * All pages are lazy loaded for code splitting (Requirements 12.1, 12.2)
 * Each page is loaded in a separate chunk to minimize initial bundle size
 */

// Páginas públicas - lazy load para reduzir bundle inicial
const Landing = lazy(() => import("./pages/Landing"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Auth = lazy(() => import("./pages/Auth"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Prefetch function for probable next pages (Requirements 16.5)
const prefetchDashboard = () => import("./pages/Dashboard");

// Páginas principais - lazy load
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Produtos = lazy(() => import("./pages/Produtos"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const Cotacoes = lazy(() => import("./pages/Cotacoes"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const ListaCompras = lazy(() => import("./pages/ListaCompras"));
const ContagemEstoque = lazy(() => import("./pages/ContagemEstoque"));
const Anotacoes = lazy(() => import("./pages/Anotacoes"));
const Relatorios = lazy(() => import("./pages/Relatorios"));

// Páginas secundárias - lazy load com prioridade baixa
const Extra = lazy(() => import("./pages/Extra"));
const AgenteCopywriting = lazy(() => import("./pages/AgenteCopywriting"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

/**
 * PageWrapper - Wraps lazy-loaded pages with ErrorBoundary and Suspense
 * Provides consistent error handling and loading states across all pages
 * Requirements: 10.5, 12.1, 12.2
 */
const PageWrapper = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// QueryClient configuração padrão
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 600000,
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

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
                <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
                <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
                <Route path="/accept-invite" element={<PageWrapper><AcceptInvite /></PageWrapper>} />
                
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
                  <Route path="cotacoes" element={<PageWrapper><Cotacoes /></PageWrapper>} />
                  <Route path="pedidos" element={<PageWrapper><Pedidos /></PageWrapper>} />
                  <Route path="historico" element={<Navigate to="/dashboard/relatorios?tab=historico" replace />} />
                  <Route path="relatorios" element={<PageWrapper><Relatorios /></PageWrapper>} />
                  <Route path="analytics" element={<Navigate to="/dashboard/relatorios?tab=analytics" replace />} />
                  <Route path="extra" element={<PageWrapper><Extra /></PageWrapper>} />
                  <Route path="agente-copywriting" element={<PageWrapper><AgenteCopywriting /></PageWrapper>} />
                  <Route path="contagem-estoque" element={<PageWrapper><ContagemEstoque /></PageWrapper>} />
                  <Route path="anotacoes" element={<PageWrapper><Anotacoes /></PageWrapper>} />
                  <Route path="lista-compras" element={<PageWrapper><ListaCompras /></PageWrapper>} />
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