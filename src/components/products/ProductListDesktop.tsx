import { memo, useState, useCallback } from 'react';
import { Package, Star, ClipboardList, History, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActionGroup } from "@/components/ui/table-action-group";
import { LazyImage } from "@/components/responsive/LazyImage";
import { capitalize } from "@/lib/text-utils";
import type { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface ProductListDesktopProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onHistory: (product: Product) => void;
}

const getProductStatus = (product: Product) => {
  if (product.quotesCount === 0) return "sem_cotacao";
  if (product.lastOrderPrice === "R$ 0,00") return "pendente";
  if (product.quotesCount >= 3) return "ativo";
  return "cotado";
};

const getTrendIcon = (trend: "up" | "down" | "stable") => {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />;
};

type SortKey = 'name' | 'category' | 'brand' | 'price' | 'quotes';
type SortDir = 'asc' | 'desc';

const extractPrice = (priceStr: string): number => {
  const cleaned = priceStr.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

export const ProductListDesktop = memo(({ products, onEdit, onDelete, onHistory }: ProductListDesktopProps) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const sortedProducts = (() => {
    if (!sortKey) return products;
    return [...products].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR');
          break;
        case 'category':
          cmp = (a.category || '').localeCompare(b.category || '', 'pt-BR');
          break;
        case 'brand':
          cmp = (a.brand_name || '').localeCompare(b.brand_name || '', 'pt-BR');
          break;
        case 'price':
          cmp = extractPrice(a.lastOrderPrice || '') - extractPrice(b.lastOrderPrice || '');
          break;
        case 'quotes':
          cmp = (a.quotesCount || 0) - (b.quotesCount || 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  })();

  const SortHeader = ({ label, sortId, className }: { label: string; sortId: SortKey; className?: string }) => {
    const isActive = sortKey === sortId;
    return (
      <th
        className={cn(
          "h-10 px-3 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors",
          "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
          isActive && "text-zinc-800 dark:text-zinc-100",
          className
        )}
        onClick={() => handleSort(sortId)}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {isActive ? (
            sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover/th:opacity-40 transition-opacity" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="hidden md:block w-full">
      <div className="bg-white dark:bg-card border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40">
              <SortHeader label="Produto" sortId="name" className="pl-4 w-[28%]" />
              <SortHeader label="Categoria" sortId="category" className="w-[13%]" />
              <th className="h-10 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hidden lg:table-cell w-[12%]">
                Marca
              </th>
              <th className="h-10 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hidden xl:table-cell w-[10%]">
                Código
              </th>
              <th className="h-10 px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[10%]">
                Status
              </th>
              <SortHeader label="Preço" sortId="price" className="w-[10%]" />
              <th className="h-10 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hidden lg:table-cell w-[12%]">
                Fornecedor
              </th>
              <SortHeader label="Cot." sortId="quotes" className="w-[6%] text-center" />
              <th className="h-10 px-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pr-4 w-[9%]">
                Ações
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {sortedProducts.map((product, idx) => (
              <tr
                key={product.id}
                className={cn(
                  "group transition-colors duration-150",
                  "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30",
                  idx % 2 === 1 && "bg-zinc-50/40 dark:bg-zinc-900/20"
                )}
              >
                {/* Produto */}
                <td className="pl-4 pr-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60">
                      {product.image_url ? (
                        <LazyImage
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          showSkeleton={true}
                          fallback={<Package className="h-4 w-4 text-zinc-400" />}
                        />
                      ) : (
                        <Package className="h-4 w-4 text-zinc-400" />
                      )}
                    </div>
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                      {capitalize(product.name)}
                    </span>
                  </div>
                </td>

                {/* Categoria */}
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md">
                    {capitalize(product.category)}
                  </span>
                </td>

                {/* Marca */}
                <td className="px-3 py-2.5 hidden lg:table-cell">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300 truncate max-w-[120px]">
                      {capitalize(product.brand_name || "—")}
                    </span>
                    {product.brand_rating ? (
                      <div className="flex items-center gap-px">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-2.5 w-2.5",
                              i < (product.brand_rating || 0)
                                ? "text-amber-400 fill-amber-400"
                                : "text-zinc-200 dark:text-zinc-700"
                            )}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </td>

                {/* Código */}
                <td className="px-3 py-2.5 hidden xl:table-cell">
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-200/80 dark:border-zinc-700">
                    {product.barcode || "—"}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-2.5 text-center">
                  <StatusBadge status={getProductStatus(product)} />
                </td>

                {/* Preço */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                        {product.lastOrderPrice}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        /{product.unit || 'un'}
                      </span>
                    </div>
                    {getTrendIcon(product.trend)}
                  </div>
                </td>

                {/* Fornecedor */}
                <td className="px-3 py-2.5 hidden lg:table-cell">
                  <span
                    className="text-sm text-zinc-600 dark:text-zinc-300 truncate block max-w-[120px]"
                    title={capitalize(product.bestSupplier || "")}
                  >
                    {capitalize(product.bestSupplier || "—")}
                  </span>
                </td>

                {/* Cotações */}
                <td className="px-3 py-2.5 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 rounded-md border border-blue-100 dark:border-blue-500/20">
                    <ClipboardList className="h-3 w-3 text-blue-500" />
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-xs tabular-nums">
                      {product.quotesCount || 0}
                    </span>
                  </div>
                </td>

                {/* Ações */}
                <td className="px-3 py-2.5 pr-4 text-right">
                  <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                    <TableActionGroup
                      showView={false}
                      onEdit={() => onEdit(product)}
                      onDelete={() => onDelete(product)}
                      additionalActions={[
                        {
                          icon: <History className="h-4 w-4" />,
                          label: "Histórico de Preços",
                          onClick: () => onHistory(product),
                          variant: "default" as const,
                        }
                      ]}
                      dropdownLabel="Ações"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer com info */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-4 py-2 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
            {sortedProducts.length} produto{sortedProducts.length !== 1 ? 's' : ''} exibido{sortedProducts.length !== 1 ? 's' : ''}
          </span>
          {sortKey && (
            <button
              onClick={() => { setSortKey(null); setSortDir('asc'); }}
              className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 font-medium transition-colors"
            >
              Limpar ordenação
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
