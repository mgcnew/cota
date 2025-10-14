import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Building2, FileText, ShoppingCart } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCotacoes } from "@/hooks/useCotacoes";
import { usePedidos } from "@/hooks/usePedidos";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch real data from database
  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const { cotacoes } = useCotacoes();
  const { pedidos } = usePedidos();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const filteredResults = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    
    return {
      produtos: products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      ),
      fornecedores: suppliers.filter(f =>
        f.name.toLowerCase().includes(query) ||
        (f.contact && f.contact.toLowerCase().includes(query)) ||
        (f.email && f.email.toLowerCase().includes(query))
      ),
      cotacoes: cotacoes.filter(c =>
        c.id.toLowerCase().includes(query) ||
        c.produto.toLowerCase().includes(query) ||
        c.melhorFornecedor.toLowerCase().includes(query) ||
        c.status.toLowerCase().includes(query)
      ),
      pedidos: pedidos.filter(p =>
        p.supplier_name.toLowerCase().includes(query) ||
        p.status.toLowerCase().includes(query) ||
        p.items?.some(item => item.product_name.toLowerCase().includes(query))
      ),
    };
  }, [debouncedSearch, products, suppliers, cotacoes, pedidos]);

  const hasResults = 
    filteredResults.produtos.length > 0 ||
    filteredResults.fornecedores.length > 0 ||
    filteredResults.cotacoes.length > 0 ||
    filteredResults.pedidos.length > 0;

  const handleSelect = (type: string, id?: string) => {
    onOpenChange(false);
    setSearchQuery("");
    
    switch (type) {
      case "produtos":
        if (id) {
          navigate(`/produtos?id=${id}`);
        } else {
          navigate("/produtos");
        }
        break;
      case "fornecedores":
        if (id) {
          navigate(`/fornecedores?id=${id}`);
        } else {
          navigate("/fornecedores");
        }
        break;
      case "cotacoes":
        if (id) {
          navigate(`/cotacoes?id=${id}`);
        } else {
          navigate("/cotacoes");
        }
        break;
      case "pedidos":
        if (id) {
          navigate(`/pedidos?id=${id}`);
        } else {
          navigate("/pedidos");
        }
        break;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    const colors: Record<string, string> = {
      "pendente": "bg-warning/10 text-warning border-warning/20",
      "ativa": "bg-info/10 text-info border-info/20",
      "aprovada": "bg-success/10 text-success border-success/20",
      "concluÃ­da": "bg-success/10 text-success border-success/20",
      "concluÃ­do": "bg-success/10 text-success border-success/20",
      "cancelada": "bg-destructive/10 text-destructive border-destructive/20",
      "recusada": "bg-destructive/10 text-destructive border-destructive/20",
      "em andamento": "bg-info/10 text-info border-info/20",
    };
    return colors[normalizedStatus] || "bg-muted text-muted-foreground";
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="relative">
        {/* Header with gradient */}
        <div className="relative border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-400/10 dark:to-purple-400/10" />
          <div className="relative flex items-center px-4 py-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-400/20 dark:to-purple-400/20 mr-3">
              <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CommandInput 
              placeholder="Buscar cotaÃ§Ãµes, produtos, fornecedores..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1 border-0 bg-transparent text-base placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-0 focus:outline-none"
            />
            <div className="flex items-center gap-1 ml-3">
              <kbd className="inline-flex h-6 w-6 select-none items-center justify-center rounded-md border border-slate-300/60 dark:border-slate-600/60 bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 px-1 font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400 shadow-sm">
                ESC
              </kbd>
            </div>
          </div>
        </div>
      </div>
      <CommandList className="max-h-[400px] overflow-hidden">
        {!searchQuery && (
          <div className="px-6 py-12 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-60" />
              <div className="relative p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-400/20 dark:to-purple-400/20 w-20 h-20 mx-auto flex items-center justify-center">
                <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Busca Global
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-sm mx-auto">
              Digite para buscar produtos, fornecedores, cotaÃ§Ãµes e pedidos em todo o sistema
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-500">
              <span>Pressione</span>
              <kbd className="inline-flex h-5 w-5 select-none items-center justify-center rounded border border-slate-300/60 dark:border-slate-600/60 bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 px-1 font-mono text-[10px] font-medium shadow-sm">
                âŒ˜
              </kbd>
              <span>+</span>
              <kbd className="inline-flex h-5 w-5 select-none items-center justify-center rounded border border-slate-300/60 dark:border-slate-600/60 bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 px-1 font-mono text-[10px] font-medium shadow-sm">
                K
              </kbd>
              <span>para abrir rapidamente</span>
            </div>
          </div>
        )}

        {searchQuery && !hasResults && (
          <div className="px-6 py-8 text-center">
            <div className="relative mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 w-16 h-16 mx-auto flex items-center justify-center">
                <Search className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
            </div>
            <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 mb-1">
              Nenhum resultado encontrado
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tente usar termos diferentes ou verifique a ortografia
            </p>
          </div>
        )}

        {filteredResults.produtos.length > 0 && (
          <CommandGroup heading="ðŸŽ¯ Produtos" className="px-2">
            {filteredResults.produtos.slice(0, 5).map((produto) => (
              <CommandItem
                key={produto.id}
                value={`produto-${produto.id}`}
                onSelect={() => handleSelect("produtos", produto.id)}
                className="flex items-center gap-4 py-3 px-3 mx-1 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-green-50/80 dark:hover:from-emerald-900/20 dark:hover:to-green-900/20 transition-all duration-200 cursor-pointer group border border-transparent hover:border-emerald-200/60 dark:hover:border-emerald-700/60"
              >
                <div className="relative">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-400/20 dark:to-green-400/20 group-hover:from-emerald-500/20 group-hover:to-green-500/20 transition-all duration-200">
                    <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-200">
                    {produto.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {produto.category}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 bg-emerald-50/80 dark:bg-emerald-900/30 border-emerald-200/60 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 font-medium">
                  {produto.quotesCount} cotaÃ§Ã£o(Ãµes)
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredResults.fornecedores.length > 0 && (
          <CommandGroup heading="ðŸ¢ Fornecedores" className="px-2">
            {filteredResults.fornecedores.slice(0, 5).map((fornecedor) => (
              <CommandItem
                key={fornecedor.id}
                value={`fornecedor-${fornecedor.id}`}
                onSelect={() => handleSelect("fornecedores", fornecedor.id)}
                className="flex items-center gap-4 py-3 px-3 mx-1 rounded-xl hover:bg-gradient-to-r hover:from-amber-50/80 hover:to-orange-50/80 dark:hover:from-amber-900/20 dark:hover:to-orange-900/20 transition-all duration-200 cursor-pointer group border border-transparent hover:border-amber-200/60 dark:hover:border-amber-700/60"
              >
                <div className="relative">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-400/20 dark:to-orange-400/20 group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-all duration-200">
                    <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors duration-200">
                    {fornecedor.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {fornecedor.contact || fornecedor.email || "Sem contato"}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 bg-amber-50/80 dark:bg-amber-900/30 border-amber-200/60 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 font-medium">
                  {fornecedor.activeQuotes} ativas
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredResults.cotacoes.length > 0 && (
          <CommandGroup heading="ðŸ“‹ CotaÃ§Ãµes" className="px-2">
            {filteredResults.cotacoes.slice(0, 5).map((cotacao) => (
              <CommandItem
                key={cotacao.id}
                value={`cotacao-${cotacao.id}`}
                onSelect={() => handleSelect("cotacoes", cotacao.id)}
                className="flex items-center gap-4 py-3 px-3 mx-1 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-200 cursor-pointer group border border-transparent hover:border-blue-200/60 dark:hover:border-blue-700/60"
              >
                <div className="relative">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/20 dark:to-indigo-400/20 group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all duration-200">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                    {cotacao.id}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {cotacao.produto} â€¢ {cotacao.melhorFornecedor}
                  </p>
                </div>
                <Badge variant="outline" className={cn("shrink-0 font-medium", getStatusColor(cotacao.status))}>
                  {cotacao.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredResults.pedidos.length > 0 && (
          <CommandGroup heading="ðŸ›’ Pedidos" className="px-2">
            {filteredResults.pedidos.slice(0, 5).map((pedido) => (
              <CommandItem
                key={pedido.id}
                value={`pedido-${pedido.id}`}
                onSelect={() => handleSelect("pedidos", pedido.id)}
                className="flex items-center gap-4 py-3 px-3 mx-1 rounded-xl hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-pink-50/80 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-200 cursor-pointer group border border-transparent hover:border-purple-200/60 dark:hover:border-purple-700/60"
              >
                <div className="relative">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/20 dark:to-pink-400/20 group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all duration-200">
                    <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
                    {new Date(pedido.order_date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {pedido.supplier_name} â€¢ {pedido.items?.length || 0} produto(s)
                  </p>
                </div>
                <Badge variant="outline" className={cn("shrink-0 font-medium", getStatusColor(pedido.status))}>
                  {pedido.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function GlobalSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative group w-full">
      <Button
        variant="ghost"
        onClick={onClick}
        className="relative w-full justify-start text-sm bg-white/80 backdrop-blur-xl border border-gray-200/60 hover:border-gray-300/70 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl h-10 px-4 overflow-hidden group-hover:bg-white/90"
      >
        {/* Efeito de vidro gloss */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-white/30 rounded-xl pointer-events-none" />
        
        {/* Borda interna sutil */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/50 pointer-events-none" />
        
        {/* Hover gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex items-center w-full z-10">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 mr-2.5 group-hover:from-blue-500/15 group-hover:to-purple-500/15 transition-all duration-300 shadow-sm">
            <Search className="h-4 w-4 text-blue-600 group-hover:scale-105 transition-transform duration-300" />
          </div>
          
          <div className="flex-1 text-left">
            <span className="hidden md:inline-flex text-gray-600 group-hover:text-gray-800 font-medium text-sm transition-colors duration-300">
              Buscar cotações, produtos, fornecedores...
            </span>
            <span className="md:hidden text-gray-600 group-hover:text-gray-800 font-medium text-sm transition-colors duration-300">
              Buscar...
            </span>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            <kbd className="hidden sm:inline-flex h-6 min-w-[24px] select-none items-center justify-center rounded-md border border-gray-200/60 bg-gradient-to-b from-white to-gray-50/80 px-1.5 font-mono text-[10px] font-medium text-gray-500 shadow-sm backdrop-blur-sm">
              K
            </kbd>
          </div>
        </div>
      </Button>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 to-purple-400/10 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 -z-10" />
    </div>
  );
}
