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
          "h-11 px-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer select-none transition-colors",
          "hover:text-zinc-800 dark:hover:text-zinc-200",
          isActive && "text-zinc-900 dark:text-zinc-100 font-semibold",
          className
        )}
        onClick={() => handleSort(sortId)}
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {isActive ? (
            sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-0 group-hover/th:opacity-40 transition-opacity" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <SortHeader label="Produto" sortId="name" className="pl-6 w-[28%]" />
              <SortHeader label="Categoria" sortId="category" className="w-[13%]" />
              <th className="h-11 px-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden lg:table-cell w-[12%]">
                Marca
              </th>
              <th className="h-11 px-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden xl:table-cell w-[10%]">
                Código
              </th>
              <th className="h-11 px-4 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 w-[10%]">
                Status
              </th>
              <SortHeader label="Preço" sortId="price" className="w-[10%]" />
              <th className="h-11 px-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden lg:table-cell w-[12%]">
                Fornecedor
              </th>
              <SortHeader label="Cotações" sortId="quotes" className="w-[8%] text-center" />
              <th className="h-11 px-4 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 pr-6 w-[7%]">
                Ações
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {sortedProducts.map((product, idx) => (
              <tr
                key={product.id}
                className={cn(
                  "group transition-colors duration-150",
                  "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                )}
              >
                {/* Produto */}
                <td className="pl-6 pr-4 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-200/80 dark:border-zinc-700 shadow-sm">
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
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {capitalize(product.name)}
                    </span>
                  </div>
                </td>

                {/* Categoria */}
                <td className="px-4 py-4">
                  <span className="inline-flex items-center text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 px-2.5 py-0.5 rounded-full">
                    {capitalize(product.category)}
                  </span>
                </td>

                {/* Marca */}
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">
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
                <td className="px-4 py-4 hidden xl:table-cell">
                  <span className="font-mono text-[13px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-800">
                    {product.barcode || "—"}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-4 text-center">
                  <StatusBadge status={getProductStatus(product)} />
                </td>

                {/* Preço */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {product.lastOrderPrice}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium">
                        por {product.unit || 'un'}
                      </span>
                    </div>
                    {getTrendIcon(product.trend)}
                  </div>
                </td>

                {/* Fornecedor */}
                <td className="px-4 py-4 hidden lg:table-cell">
                  <span
                    className="text-sm text-zinc-600 dark:text-zinc-400 truncate block max-w-[120px]"
                    title={capitalize(product.bestSupplier || "")}
                  >
                    {capitalize(product.bestSupplier || "—")}
                  </span>
                </td>

                {/* Cotações */}
                <td className="px-4 py-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-700 dark:text-zinc-300">
                    <ClipboardList className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span className="font-medium text-xs tabular-nums">
                      {product.quotesCount || 0}
                    </span>
                  </div>
                </td>

                {/* Ações */}
                <td className="px-4 py-4 pr-6 text-right">
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
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-6 py-3 flex items-center justify-between">
          <span className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium">
            {sortedProducts.length} produto{sortedProducts.length !== 1 ? 's' : ''} exibido{sortedProducts.length !== 1 ? 's' : ''}
          </span>
          {sortKey && (
            <button
              onClick={() => { setSortKey(null); setSortDir('asc'); }}
              className="text-[12px] text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium transition-colors"
            >
              Limpar ordenação
            </button>
          )}
        </div>
    </div>
  );
});
