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
        navigate("/produtos");
        break;
      case "fornecedores":
        navigate("/fornecedores");
        break;
      case "cotacoes":
        navigate("/cotacoes");
        break;
      case "pedidos":
        navigate("/pedidos");
        break;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    const colors: Record<string, string> = {
      "pendente": "bg-warning/10 text-warning border-warning/20",
      "ativa": "bg-info/10 text-info border-info/20",
      "aprovada": "bg-success/10 text-success border-success/20",
      "concluída": "bg-success/10 text-success border-success/20",
      "concluído": "bg-success/10 text-success border-success/20",
      "cancelada": "bg-destructive/10 text-destructive border-destructive/20",
      "recusada": "bg-destructive/10 text-destructive border-destructive/20",
      "em andamento": "bg-info/10 text-info border-info/20",
    };
    return colors[normalizedStatus] || "bg-muted text-muted-foreground";
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Buscar cotações, produtos, fornecedores..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {!searchQuery && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Digite para buscar em todo o sistema</p>
            <p className="text-xs mt-2 opacity-70">
              Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted">K</kbd> para abrir
            </p>
          </div>
        )}

        {searchQuery && !hasResults && (
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        )}

        {filteredResults.produtos.length > 0 && (
          <CommandGroup heading="Produtos">
            {filteredResults.produtos.slice(0, 5).map((produto) => (
              <CommandItem
                key={produto.id}
                value={`produto-${produto.id}`}
                onSelect={() => handleSelect("produtos", produto.id)}
                className="flex items-center gap-3 py-3"
              >
                <div className="p-2 rounded-lg bg-success/10">
                  <Package className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{produto.name}</p>
                  <p className="text-xs text-muted-foreground">{produto.category}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {produto.quotesCount} cotação(ões)
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredResults.fornecedores.length > 0 && (
          <CommandGroup heading="Fornecedores">
            {filteredResults.fornecedores.slice(0, 5).map((fornecedor) => (
              <CommandItem
                key={fornecedor.id}
                value={`fornecedor-${fornecedor.id}`}
                onSelect={() => handleSelect("fornecedores", fornecedor.id)}
                className="flex items-center gap-3 py-3"
              >
                <div className="p-2 rounded-lg bg-warning/10">
                  <Building2 className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fornecedor.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {fornecedor.contact || fornecedor.email || "Sem contato"}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {fornecedor.activeQuotes} ativas
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredResults.cotacoes.length > 0 && (
          <CommandGroup heading="Cotações">
            {filteredResults.cotacoes.slice(0, 5).map((cotacao) => (
              <CommandItem
                key={cotacao.id}
                value={`cotacao-${cotacao.id}`}
                onSelect={() => handleSelect("cotacoes", cotacao.id)}
                className="flex items-center gap-3 py-3"
              >
                <div className="p-2 rounded-lg bg-info/10">
                  <FileText className="h-4 w-4 text-info" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cotacao.id}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {cotacao.produto} • {cotacao.melhorFornecedor}
                  </p>
                </div>
                <Badge variant="outline" className={cn("shrink-0", getStatusColor(cotacao.status))}>
                  {cotacao.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredResults.pedidos.length > 0 && (
          <CommandGroup heading="Pedidos">
            {filteredResults.pedidos.slice(0, 5).map((pedido) => (
              <CommandItem
                key={pedido.id}
                value={`pedido-${pedido.id}`}
                onSelect={() => handleSelect("pedidos", pedido.id)}
                className="flex items-center gap-3 py-3"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {new Date(pedido.order_date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {pedido.supplier_name} • {pedido.items?.length || 0} produto(s)
                  </p>
                </div>
                <Badge variant="outline" className={cn("shrink-0", getStatusColor(pedido.status))}>
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
    <Button
      variant="outline"
      onClick={onClick}
      className="relative w-full justify-start text-sm text-muted-foreground hover:text-foreground bg-background/50 border-border/50 hover:border-primary/50 transition-colors"
    >
      <Search className="mr-2 h-4 w-4 shrink-0" />
      <span className="hidden md:inline-flex flex-1 text-left">
        Buscar cotações, produtos, fornecedores...
      </span>
      <span className="md:hidden flex-1 text-left">Buscar...</span>
      <kbd className="hidden lg:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 ml-auto">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
