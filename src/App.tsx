import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Fornecedores from "./pages/Fornecedores";
import Cotacoes from "./pages/Cotacoes";
import Pedidos from "./pages/Pedidos";
import Historico from "./pages/Historico";
import Relatorios from "./pages/Relatorios";
import Analytics from "./pages/Analytics";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
const App = () => <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />} className="bg-white">
              <Route index element={<Dashboard />} />
              <Route path="produtos" element={<Produtos />} />
              <Route path="fornecedores" element={<Fornecedores />} />
              <Route path="cotacoes" element={<Cotacoes />} />
              <Route path="pedidos" element={<Pedidos />} />
              <Route path="historico" element={<Historico />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="configuracoes" element={<Configuracoes />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>;
export default App;