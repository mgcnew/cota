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
import Auth from "./pages/Auth";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";
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
              <CompanyAutoSetup />
              <Routes>
                {/* Rotas públicas de autenticação */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/accept-invite" element={<AcceptInvite />} />
                
                {/* Rotas protegidas */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="produtos" element={<Produtos />} />
                  <Route path="fornecedores" element={<Fornecedores />} />
                  <Route path="cotacoes" element={<Cotacoes />} />
                  <Route path="pedidos" element={<Pedidos />} />
                  <Route path="historico" element={<Historico />} />
                  <Route path="relatorios" element={<Relatorios />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="locucoes" element={<Locucoes />} />
                  <Route path="extra" element={<Extra />} />
                  <Route path="whatsapp-mensagens" element={<WhatsAppMensagens />} />
                  <Route path="configuracoes" element={<Configuracoes />} />
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