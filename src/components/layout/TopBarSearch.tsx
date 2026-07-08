import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Building2, FileText, ShoppingCart } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCotacoes } from "@/hooks/useCotacoes";
import { usePedidos } from "@/hooks/usePedidos";

// Busca global inline na topbar: sem modal — sugestões aparecem sob o próprio
// campo enquanto o usuário digita, e clicar num resultado navega direto para a
// página com o item já selecionado.
export function TopBarSearch() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);

  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const { cotacoes } = useCotacoes();
  const { pedidos } = usePedidos();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 2) {
      return { produtos: [], fornecedores: [], cotacoes: [], pedidos: [] };
    }
    return {
      produtos: (products || []).filter((p) =>
        (p.name || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q)
      ).slice(0, 5),
      fornecedores: (suppliers || []).filter((f) =>
        (f.name || "").toLowerCase().includes(q) ||
        (f.contact || "").toLowerCase().includes(q) ||
        (f.email || "").toLowerCase().includes(q)
      ).slice(0, 5),
      cotacoes: (cotacoes || []).filter((c) =>
        (c.id || "").toLowerCase().includes(q) ||
        (c.produto || "").toLowerCase().includes(q) ||
        (c.melhorFornecedor || "").toLowerCase().includes(q)
      ).slice(0, 5),
      pedidos: (pedidos || []).filter((p) =>
        (p.supplier_name || "").toLowerCase().includes(q) ||
        (p.items || []).some((item) => (item.product_name || "").toLowerCase().includes(q))
      ).slice(0, 5),
    };
  }, [debouncedQuery, products, suppliers, cotacoes, pedidos]);

  const hasResults =
    results.produtos.length > 0 ||
    results.fornecedores.length > 0 ||
    results.cotacoes.length > 0 ||
    results.pedidos.length > 0;

  const showDropdown = open && query.trim().length > 0;

  const goTo = (path: string) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    navigate(path);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <SearchInput
        ref={inputRef}
        value={query}
        onChange={setQuery}
        onFocus={() => setOpen(true)}
        placeholder="Buscar cotações, produtos, fornecedores..."
        containerClassName="w-full"
        className="h-9"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-border/60 dark:border-white/8 bg-popover shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <Command shouldFilter={false} className="bg-transparent">
            <CommandList className="max-h-[360px]">
              {query.trim().length < 2 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Digite pelo menos 2 caracteres
                </div>
              )}
              {query.trim().length >= 2 && !hasResults && (
                <CommandEmpty className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nenhum resultado encontrado
                </CommandEmpty>
              )}

              {results.produtos.length > 0 && (
                <CommandGroup heading="Produtos">
                  {results.produtos.map((produto) => (
                    <CommandItem
                      key={produto.id}
                      value={`produto-${produto.id}`}
                      onSelect={() => goTo(`/dashboard/produtos?id=${produto.id}`)}
                      className="gap-2 cursor-pointer"
                    >
                      <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{produto.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{produto.category}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.fornecedores.length > 0 && (
                <CommandGroup heading="Fornecedores">
                  {results.fornecedores.map((fornecedor) => (
                    <CommandItem
                      key={fornecedor.id}
                      value={`fornecedor-${fornecedor.id}`}
                      onSelect={() => goTo(`/dashboard/fornecedores?id=${fornecedor.id}`)}
                      className="gap-2 cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fornecedor.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {fornecedor.contact || fornecedor.email || "Sem contato"}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.cotacoes.length > 0 && (
                <CommandGroup heading="Cotações">
                  {results.cotacoes.map((cotacao) => (
                    <CommandItem
                      key={cotacao.id}
                      value={`cotacao-${cotacao.id}`}
                      onSelect={() => goTo(`/dashboard/cotacoes?id=${cotacao.id}`)}
                      className="gap-2 cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cotacao.id}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {cotacao.produto} • {cotacao.melhorFornecedor}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.pedidos.length > 0 && (
                <CommandGroup heading="Pedidos">
                  {results.pedidos.map((pedido) => (
                    <CommandItem
                      key={pedido.id}
                      value={`pedido-${pedido.id}`}
                      onSelect={() => goTo(`/dashboard/pedidos?id=${pedido.id}`)}
                      className="gap-2 cursor-pointer"
                    >
                      <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {new Date(pedido.order_date).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {pedido.supplier_name} • {pedido.items?.length || 0} produto(s)
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
