import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";

// Mock data - Em produção, isso viria de uma API ou contexto global
const mockData = {
  produtos: [
    { id: "1", name: "Parafuso M8", category: "Fixação", stock: 150 },
    { id: "2", name: "Porca M8", category: "Fixação", stock: 200 },
    { id: "3", name: "Arruela Lisa", category: "Fixação", stock: 300 },
    { id: "4", name: "Cabo de Rede CAT6", category: "Elétrica", stock: 50 },
    { id: "5", name: "Tomada 2P+T", category: "Elétrica", stock: 75 },
  ],
  fornecedores: [
    { id: "1", name: "TechSul Materiais", contact: "contato@techsul.com" },
    { id: "2", name: "Distribuidora Norte", contact: "vendas@norte.com" },
    { id: "3", name: "Atacado Center", contact: "comercial@atacadocenter.com" },
  ],
  cotacoes: [
    { id: "COT-001", produto: "Parafuso M8", fornecedor: "TechSul Materiais", status: "Pendente" },
    { id: "COT-002", produto: "Cabo de Rede CAT6", fornecedor: "Distribuidora Norte", status: "Aprovada" },
    { id: "COT-003", produto: "Tomada 2P+T", fornecedor: "Atacado Center", status: "Recusada" },
  ],
  pedidos: [
    { id: "PED-001", fornecedor: "TechSul Materiais", produtos: ["Parafuso M8"], status: "Em Andamento" },
    { id: "PED-002", fornecedor: "Distribuidora Norte", produtos: ["Cabo de Rede CAT6"], status: "Concluído" },
  ],
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredResults = {
    produtos: mockData.produtos.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    fornecedores: mockData.fornecedores.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.contact.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    cotacoes: mockData.cotacoes.filter(c =>
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.produto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fornecedor.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    pedidos: mockData.pedidos.filter(p =>
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fornecedor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.produtos.some(prod => prod.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  };

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
    const colors: Record<string, string> = {
      "Pendente": "bg-warning/10 text-warning border-warning/20",
      "Aprovada": "bg-success/10 text-success border-success/20",
      "Recusada": "bg-destructive/10 text-destructive border-destructive/20",
      "Em Andamento": "bg-info/10 text-info border-info/20",
      "Concluído": "bg-success/10 text-success border-success/20",
    };
    return colors[status] || "bg-muted text-muted-foreground";
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
                  Estoque: {produto.stock}
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
                  <p className="text-xs text-muted-foreground truncate">{fornecedor.contact}</p>
                </div>
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
                    {cotacao.produto} • {cotacao.fornecedor}
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
                  <p className="font-medium truncate">{pedido.id}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {pedido.fornecedor} • {pedido.produtos.length} produto(s)
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
