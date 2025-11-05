import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./components/auth/AuthProvider";
import { CompanyAutoSetup } from "./components/auth/CompanyAutoSetup";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { MobileProvider } from "./contexts/MobileProvider";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Fornecedores from "./pages/Fornecedores";
import Cotacoes from "./pages/Cotacoes";
import Pedidos from "./pages/Pedidos";
import Historico from "./pages/Historico";
import Relatorios from "./pages/Relatorios";
import Analytics from "./pages/Analytics";
import Locucoes from "./pages/Locucoes";
import Extra from "./pages/Extra";
import WhatsAppMensagens from "./pages/WhatsAppMensagens";
import Configuracoes from "./pages/Configuracoes";
import ContagemEstoque from "./pages/ContagemEstoque";
import Anotacoes from "./pages/Anotacoes";
import Auth from "./pages/Auth";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import { initScrollbarFix } from "./utils/scrollbar-fix";

const queryClient = new QueryClient();

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
              <MobileProvider>
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
                  <Route index element={<Dashboard />} />
                  <Route path="produtos" element={<Produtos />} />
                  <Route path="fornecedores" element={<Fornecedores />} />
                  <Route path="cotacoes" element={<Cotacoes />} />
                  <Route path="pedidos" element={<Pedidos />} />
                  <Route path="historico" element={<Navigate to="/dashboard/relatorios?tab=historico" replace />} />
                  <Route path="relatorios" element={<Relatorios />} />
                  <Route path="analytics" element={<Navigate to="/dashboard/relatorios?tab=analytics" replace />} />
                  <Route path="locucoes" element={<Locucoes />} />
                  <Route path="extra" element={<Extra />} />
                  <Route path="whatsapp-mensagens" element={<WhatsAppMensagens />} />
                  <Route path="contagem-estoque" element={<ContagemEstoque />} />
                  <Route path="anotacoes" element={<Anotacoes />} />
                  <Route path="configuracoes" element={<Configuracoes />} />
                </Route>

                {/* Rota 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </MobileProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;