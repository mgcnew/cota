import { lazy, Suspense, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Sun, Moon, Calculator, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TopBarSearch } from "./TopBarSearch";

const ProcurementCalculator = lazy(() => import("@/components/compras/ProcurementCalculator"));

// Mapeamento rota → título exibido na topbar. Do mais específico para o mais
// genérico, pois o match é por startsWith (ex: "/dashboard/produtos" precisa
// ser checado antes de "/dashboard").
const PAGE_TITLES: { path: string; title: string }[] = [
  { path: "/dashboard/produtos", title: "Produtos" },
  { path: "/dashboard/fornecedores", title: "Fornecedores" },
  { path: "/dashboard/compras", title: "Compras" },
  { path: "/dashboard/embalagens", title: "Embalagens" },
  { path: "/dashboard/analise-compras", title: "Análise de Compras" },
  { path: "/dashboard/relatorios", title: "Relatórios" },
  { path: "/dashboard/contagem-estoque", title: "Contagem de Estoque" },
  { path: "/dashboard/etiquetas", title: "Etiquetas" },
  { path: "/dashboard/faixas", title: "Faixas Promocionais" },
  { path: "/dashboard/anotacoes", title: "Anotações" },
  { path: "/dashboard/configuracoes", title: "Configurações" },
  { path: "/dashboard", title: "Dashboard" },
];

function getPageTitle(pathname: string): string {
  return PAGE_TITLES.find((p) => pathname.startsWith(p.path))?.title ?? "Dashboard";
}

interface TopBarProps {
  sidebarExpanded?: boolean;
}

export function TopBar({ sidebarExpanded = false }: TopBarProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const title = getPageTitle(location.pathname);
  const [calcOpen, setCalcOpen] = useState(false);
  const showCalc = location.pathname.startsWith("/dashboard/compras");

  return (
    <header
      className={cn(
        "hidden md:flex fixed top-0 right-0 h-14 z-40 items-center gap-4 px-4 lg:px-6",
        "bg-card border-b border-border dark:border-white/5",
        "transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        sidebarExpanded ? "left-64" : "left-14"
      )}
    >
      <h1 className="text-[15px] font-bold text-foreground tracking-tight shrink-0 truncate max-w-[240px]">
        {title}
      </h1>

      <div className="flex-1 flex justify-center max-w-md mx-auto">
        <TopBarSearch />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showCalc && (
          <button
            onClick={() => setCalcOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-primary/50"
            title="Calculadora"
          >
            <Calculator className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-primary/50"
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4 text-amber-400" />
            : <Moon className="w-4 h-4 text-indigo-400" />
          }
        </button>
      </div>

      {showCalc && (
        <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
          <DialogContent className="max-w-[360px] p-0 overflow-hidden rounded-2xl" hideClose>
            <DialogHeader className="sr-only">
              <DialogTitle>Calculadora</DialogTitle>
            </DialogHeader>
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>}>
              <ProcurementCalculator />
            </Suspense>
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
}
