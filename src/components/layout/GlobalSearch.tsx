import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Building2, FileText, ShoppingCart, X } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const isMobile = false; // Removida dependência mobile
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch real data from database
  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const { cotacoes } = useCotacoes();
  const { pedidos } = usePedidos();

  // Atalho de teclado apenas em desktop
  useEffect(() => {
    if (isMobile) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange, isMobile]);

  const filteredResults = useMemo(() => {
    const query = debouncedSearch.trim();
    
    // Só busca se tiver pelo menos 2 caracteres
    if (query.length < 2) {
      return {
        produtos: [],
        fornecedores: [],
        cotacoes: [],
        pedidos: [],
      };
    }
    
    // Normalizar a query para busca case-insensitive
    const queryLower = query.toLowerCase();
    
    const results = {
      produtos: (products || []).filter(p => {
        const name = (p.name || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        return name.includes(queryLower) || category.includes(queryLower);
      }),
      fornecedores: (suppliers || []).filter(f => {
        const name = (f.name || '').toLowerCase();
        const contact = (f.contact || '').toLowerCase();
        const email = (f.email || '').toLowerCase();
        return name.includes(queryLower) || contact.includes(queryLower) || email.includes(queryLower);
      }),
      cotacoes: (cotacoes || []).filter(c => {
        const id = (c.id || '').toLowerCase();
        const produto = (c.produto || '').toLowerCase();
        const melhorFornecedor = (c.melhorFornecedor || '').toLowerCase();
        const status = (c.status || '').toLowerCase();
        return id.includes(queryLower) || produto.includes(queryLower) || melhorFornecedor.includes(queryLower) || status.includes(queryLower);
      }),
      pedidos: (pedidos || []).filter(p => {
        const supplierName = (p.supplier_name || '').toLowerCase();
        const status = (p.status || '').toLowerCase();
        const hasItemMatch = (p.items || []).some(item => {
          const productName = (item.product_name || '').toLowerCase();
          return productName.includes(queryLower);
        });
        return supplierName.includes(queryLower) || status.includes(queryLower) || hasItemMatch;
      }),
    };
    
    return results;
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
          navigate(`/dashboard/produtos?id=${id}`);
        } else {
          navigate("/dashboard/produtos");
        }
        break;
      case "fornecedores":
        if (id) {
          navigate(`/dashboard/fornecedores?id=${id}`);
        } else {
          navigate("/dashboard/fornecedores");
        }
        break;
      case "cotacoes":
        if (id) {
          navigate(`/dashboard/cotacoes?id=${id}`);
        } else {
          navigate("/dashboard/cotacoes");
        }
        break;
      case "pedidos":
        if (id) {
          navigate(`/dashboard/pedidos?id=${id}`);
        } else {
          navigate("/dashboard/pedidos");
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
      "concluida": "bg-success/10 text-success border-success/20",
      "concluido": "bg-success/10 text-success border-success/20",
      "cancelada": "bg-destructive/10 text-destructive border-destructive/20",
      "recusada": "bg-destructive/10 text-destructive border-destructive/20",
      "em andamento": "bg-info/10 text-info border-info/20",
    };
    return colors[normalizedStatus] || "bg-muted text-muted-foreground";
  };

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <div className="relative h-full flex flex-col overflow-hidden">
        {/* Header otimizado para mobile */}
        <div className="relative border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
          <div className="relative flex items-center px-3 sm:px-4 py-3 sm:py-3.5 gap-2 sm:gap-3">
            {/* Ícone de busca */}
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>

            {/* Input de busca */}
            <CommandInput 
              placeholder={isMobile ? "Buscar..." : "Buscar cotações, produtos, fornecedores..."} 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1 border-0 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none h-auto"
            />

            {/* Botão de limpar (mobile) ou ESC (desktop) */}
            {searchQuery && isMobile ? (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0 touch-manipulation"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="hidden sm:inline-flex h-6 px-2 select-none items-center justify-center rounded border border-input bg-muted font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
                        ESC
                      </kbd>
                    </div>
                  </TooltipTrigger>
                  {!isMobile && (
                    <TooltipContent side="bottom">
                      <p className="text-xs">Fechar busca</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <CommandList>
        {!searchQuery && (
          <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
            <div className="relative mb-4 sm:mb-6">
              <div className="relative p-3 sm:p-4 rounded-full bg-primary/10 dark:bg-primary/20 w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              Busca Global
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Digite para buscar produtos, fornecedores, cotações e pedidos em todo o sistema
            </p>
          </div>
        )}

        {searchQuery.trim().length >= 2 && !hasResults && (
          <CommandEmpty>
            <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
              <div className="relative mb-4">
                <div className="p-3 rounded-full bg-muted w-16 h-16 mx-auto flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">
                Nenhum resultado encontrado
              </h3>
              <p className="text-sm text-muted-foreground">
                Tente usar termos diferentes ou verifique a ortografia
              </p>
            </div>
          </CommandEmpty>
        )}
        
        {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
          <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
            <div className="relative mb-4">
              <div className="p-3 rounded-full bg-muted w-16 h-16 mx-auto flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              Digite pelo menos 2 caracteres
            </h3>
            <p className="text-sm text-muted-foreground">
              Continue digitando para ver os resultados da busca
            </p>
          </div>
        )}

        {searchQuery.trim().length >= 2 && filteredResults.produtos.length > 0 && (
          <>
            <CommandGroup heading="Produtos">
            {filteredResults.produtos.slice(0, 5).map((produto) => (
              <CommandItem
                key={produto.id}
                value={`produto-${produto.id}`}
                onSelect={() => handleSelect("produtos", produto.id)}
                  className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg cursor-pointer aria-selected:bg-accent"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/20 shrink-0">
                    <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                    {produto.name}
                  </p>
                    <p className="text-xs text-muted-foreground truncate">
                    {produto.category}
                  </p>
                </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {produto.quotesCount} cotação(ões)
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
            {(filteredResults.fornecedores.length > 0 || filteredResults.cotacoes.length > 0 || filteredResults.pedidos.length > 0) && (
              <Separator />
            )}
          </>
        )}

        {searchQuery.trim().length >= 2 && filteredResults.fornecedores.length > 0 && (
          <>
            <CommandGroup heading="Fornecedores">
            {filteredResults.fornecedores.slice(0, 5).map((fornecedor) => (
              <CommandItem
                key={fornecedor.id}
                value={`fornecedor-${fornecedor.id}`}
                onSelect={() => handleSelect("fornecedores", fornecedor.id)}
                  className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg cursor-pointer aria-selected:bg-accent"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-400/20 shrink-0">
                    <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                    {fornecedor.name}
                  </p>
                    <p className="text-xs text-muted-foreground truncate">
                    {fornecedor.contact || fornecedor.email || "Sem contato"}
                  </p>
                </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                  {fornecedor.activeQuotes} ativas
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
            {(filteredResults.cotacoes.length > 0 || filteredResults.pedidos.length > 0) && (
              <Separator />
            )}
          </>
        )}

        {searchQuery.trim().length >= 2 && filteredResults.cotacoes.length > 0 && (
          <>
            <CommandGroup heading="Cotações">
            {filteredResults.cotacoes.slice(0, 5).map((cotacao) => (
              <CommandItem
                key={cotacao.id}
                value={`cotacao-${cotacao.id}`}
                onSelect={() => handleSelect("cotacoes", cotacao.id)}
                  className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg cursor-pointer aria-selected:bg-accent"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-400/20 shrink-0">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                    {cotacao.id}
                  </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cotacao.produto} • {cotacao.melhorFornecedor}
                  </p>
                </div>
                  <Badge variant="outline" className={cn("shrink-0 text-xs", getStatusColor(cotacao.status))}>
                  {cotacao.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
            {filteredResults.pedidos.length > 0 && (
              <Separator />
            )}
          </>
        )}

        {searchQuery.trim().length >= 2 && filteredResults.pedidos.length > 0 && (
          <CommandGroup heading="Pedidos">
            {filteredResults.pedidos.slice(0, 5).map((pedido) => (
              <CommandItem
                key={pedido.id}
                value={`pedido-${pedido.id}`}
                onSelect={() => handleSelect("pedidos", pedido.id)}
                className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg cursor-pointer aria-selected:bg-accent"
              >
                <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-400/20 shrink-0">
                  <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {new Date(pedido.order_date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {pedido.supplier_name} • {pedido.items?.length || 0} produto(s)
                  </p>
                </div>
                <Badge variant="outline" className={cn("shrink-0 text-xs", getStatusColor(pedido.status))}>
                  {pedido.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
        </ScrollArea>
      </div>
    </CommandDialog>
  );
}

export function GlobalSearchTrigger({ onClick }: { onClick: () => void }) {
  const isMobile = false; // Removida dependência mobile

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={onClick}
            className={cn(
              "relative justify-start transition-all duration-200 active:scale-95 md:active:scale-100 touch-manipulation",
              // Mobile: apenas ícone
              isMobile && "w-10 h-10 p-0 rounded-lg",
              // Tablet+: barra completa
              !isMobile && "w-full text-sm h-10 px-4 justify-start",
              "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
              "border border-input hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {isMobile ? (
              // Mobile: apenas lupa
              <Search className="h-5 w-5 text-muted-foreground" />
            ) : (
              // Desktop: barra completa
              <div className="flex items-center w-full gap-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground font-normal flex-1 text-left">
                  Buscar cotações, produtos, fornecedores...
                </span>
              </div>
            )}
          </Button>
        </TooltipTrigger>
        {!isMobile && (
          <TooltipContent side="bottom">
            <p className="text-xs">Pressione <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px] font-mono">⌘</kbd> + <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px] font-mono">K</kbd> para abrir</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
