import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, lazy, Suspense } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./components/auth/AuthProvider";
import { CompanyAutoSetup } from "./components/auth/CompanyAutoSetup";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";
import { initScrollbarFix } from "./utils/scrollbar-fix";

// Páginas públicas - carregamento imediato
import Auth from "./pages/Auth";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";

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
const Historico = lazy(() => import("./pages/Historico"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Locucoes = lazy(() => import("./pages/Locucoes"));
const Extra = lazy(() => import("./pages/Extra"));
const AgenteCopywriting = lazy(() => import("./pages/AgenteCopywriting"));
const WhatsAppMensagens = lazy(() => import("./pages/WhatsAppMensagens"));
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
                {/* Rotas públicas */}
                <Route path="/" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/accept-invite" element={<AcceptInvite />} />
                
                {/* Rotas protegidas */}
                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                  <Route path="produtos" element={<Suspense fallback={<PageLoader />}><Produtos /></Suspense>} />
                  <Route path="fornecedores" element={<Suspense fallback={<PageLoader />}><Fornecedores /></Suspense>} />
                  <Route path="cotacoes" element={<Suspense fallback={<PageLoader />}><Cotacoes /></Suspense>} />
                  <Route path="pedidos" element={<Suspense fallback={<PageLoader />}><Pedidos /></Suspense>} />
                  <Route path="historico" element={<Navigate to="/dashboard/relatorios?tab=historico" replace />} />
                  <Route path="relatorios" element={<Suspense fallback={<PageLoader />}><Relatorios /></Suspense>} />
                  <Route path="analytics" element={<Navigate to="/dashboard/relatorios?tab=analytics" replace />} />
                  <Route path="locucoes" element={<Suspense fallback={<PageLoader />}><Locucoes /></Suspense>} />
                  <Route path="extra" element={<Suspense fallback={<PageLoader />}><Extra /></Suspense>} />
                  <Route path="agente-copywriting" element={<Suspense fallback={<PageLoader />}><AgenteCopywriting /></Suspense>} />
                  <Route path="whatsapp-mensagens" element={<Suspense fallback={<PageLoader />}><WhatsAppMensagens /></Suspense>} />
                  <Route path="contagem-estoque" element={<Suspense fallback={<PageLoader />}><ContagemEstoque /></Suspense>} />
                  <Route path="anotacoes" element={<Suspense fallback={<PageLoader />}><Anotacoes /></Suspense>} />
                  <Route path="lista-compras" element={<Suspense fallback={<PageLoader />}><ListaCompras /></Suspense>} />
                  <Route path="configuracoes" element={<Suspense fallback={<PageLoader />}><Configuracoes /></Suspense>} />
                </Route>

                {/* Rota 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;