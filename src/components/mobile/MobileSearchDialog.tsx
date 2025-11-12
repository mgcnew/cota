import { memo, useEffect, useRef, useCallback, useMemo, useState } from "react";
import { Search, Package, Building2, FileText, ShoppingCart, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCotacoes } from "@/hooks/useCotacoes";
import { usePedidos } from "@/hooks/usePedidos";
import { Badge } from "@/components/ui/badge";

interface MobileSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog de busca otimizado para mobile
 * 
 * Otimizações:
 * - Sem CommandDialog (causa travamento)
 * - Renderização condicional
 * - Debounce de 300ms
 * - Scroll otimizado
 * - Sem re-renders desnecessários
 */
export const MobileSearchDialog = memo<MobileSearchDialogProps>(
  function MobileSearchDialog({ open, onOpenChange }) {
    const navigate = useNavigate();
    const dialogRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const debouncedSearch = useDebounce(query, 300);

    // Fetch real data
    const { products } = useProducts();
    const { suppliers } = useSuppliers();
    const { cotacoes } = useCotacoes();
    const { pedidos } = usePedidos();

    // Fechar ao pressionar ESC
    useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    // Fechar ao clicar fora
    useEffect(() => {
      if (!open) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
          onOpenChange(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, onOpenChange]);

    // Filtrar resultados
    const filteredResults = useMemo(() => {
      const q = debouncedSearch.trim();

      if (q.length < 2) {
        return {
          produtos: [],
          fornecedores: [],
          cotacoes: [],
          pedidos: [],
        };
      }

      const qLower = q.toLowerCase();

      return {
        produtos: (products || [])
          .filter(
            (p) =>
              (p.name || "").toLowerCase().includes(qLower) ||
              (p.category || "").toLowerCase().includes(qLower)
          )
          .slice(0, 5),
        fornecedores: (suppliers || [])
          .filter(
            (f) =>
              (f.name || "").toLowerCase().includes(qLower) ||
              (f.contact || "").toLowerCase().includes(qLower) ||
              (f.email || "").toLowerCase().includes(qLower)
          )
          .slice(0, 5),
        cotacoes: (cotacoes || [])
          .filter(
            (c) =>
              (c.id || "").toLowerCase().includes(qLower) ||
              (c.produto || "").toLowerCase().includes(qLower) ||
              (c.melhorFornecedor || "").toLowerCase().includes(qLower)
          )
          .slice(0, 5),
        pedidos: (pedidos || [])
          .filter(
            (p) =>
              (p.supplier_name || "").toLowerCase().includes(qLower) ||
              (p.status || "").toLowerCase().includes(qLower)
          )
          .slice(0, 5),
      };
    }, [debouncedSearch, products, suppliers, cotacoes, pedidos]);

    const handleSelect = useCallback(
      (type: string, id?: string) => {
        onOpenChange(false);
        setQuery("");

        switch (type) {
          case "produtos":
            navigate(id ? `/dashboard/produtos?id=${id}` : "/dashboard/produtos");
            break;
          case "fornecedores":
            navigate(id ? `/dashboard/fornecedores?id=${id}` : "/dashboard/fornecedores");
            break;
          case "cotacoes":
            navigate(id ? `/dashboard/cotacoes?id=${id}` : "/dashboard/cotacoes");
            break;
          case "pedidos":
            navigate(id ? `/dashboard/pedidos?id=${id}` : "/dashboard/pedidos");
            break;
        }
      },
      [navigate, onOpenChange]
    );

    if (!open) return null;

    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />

        {/* Dialog */}
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pointer-events-none"
        >
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg pointer-events-auto overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {!query && (
                <div className="p-6 text-center">
                  <div className="p-3 rounded-full bg-primary/10 dark:bg-primary/20 w-12 h-12 mx-auto flex items-center justify-center mb-3">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                    Busca Global
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Digite para buscar produtos, fornecedores, cotações e pedidos
                  </p>
                </div>
              )}

              {query.trim().length > 0 && query.trim().length < 2 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Digite pelo menos 2 caracteres
                  </p>
                </div>
              )}

              {query.trim().length >= 2 &&
                filteredResults.produtos.length === 0 &&
                filteredResults.fornecedores.length === 0 &&
                filteredResults.cotacoes.length === 0 &&
                filteredResults.pedidos.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nenhum resultado encontrado
                    </p>
                  </div>
                )}

              {/* Produtos */}
              {filteredResults.produtos.length > 0 && (
                <div className="border-b border-gray-100 dark:border-gray-800">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Produtos
                  </div>
                  {filteredResults.produtos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect("produtos", p.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <div className="p-1.5 rounded bg-emerald-500/10 shrink-0">
                        <Package className="h-3 w-3 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {p.category}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Fornecedores */}
              {filteredResults.fornecedores.length > 0 && (
                <div className="border-b border-gray-100 dark:border-gray-800">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Fornecedores
                  </div>
                  {filteredResults.fornecedores.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleSelect("fornecedores", f.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <div className="p-1.5 rounded bg-amber-500/10 shrink-0">
                        <Building2 className="h-3 w-3 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {f.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {f.contact || f.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Cotações */}
              {filteredResults.cotacoes.length > 0 && (
                <div className="border-b border-gray-100 dark:border-gray-800">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Cotações
                  </div>
                  {filteredResults.cotacoes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect("cotacoes", c.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <div className="p-1.5 rounded bg-blue-500/10 shrink-0">
                        <FileText className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {c.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {c.produto}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Pedidos */}
              {filteredResults.pedidos.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Pedidos
                  </div>
                  {filteredResults.pedidos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect("pedidos", p.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <div className="p-1.5 rounded bg-purple-500/10 shrink-0">
                        <ShoppingCart className="h-3 w-3 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {new Date(p.order_date).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {p.supplier_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
);
