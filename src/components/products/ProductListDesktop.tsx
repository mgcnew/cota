import { memo, useState, useCallback } from 'react';
import { Package, History, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActionGroup } from "@/components/ui/table-action-group";
import { LazyImage } from "@/components/responsive/LazyImage";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  return <Minus className="h-3 w-3 text-muted-foreground/30" />;
};

type SortKey = 'name' | 'category' | 'price' | 'quotes';

const CATEGORY_COLORS = [
  "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/50",
  "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50",
  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
  "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50",
  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50",
  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
  "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/50",
  "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900/50",
  "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50",
  "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900/50",
];

const getCategoryColor = (category: string): string => {
  const hash = (category || "").toLowerCase().split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
};
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
        case 'name':     cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR'); break;
        case 'category': cmp = (a.category || '').localeCompare(b.category || '', 'pt-BR'); break;
        case 'price':    cmp = extractPrice(a.lastOrderPrice || '') - extractPrice(b.lastOrderPrice || ''); break;
        case 'quotes':   cmp = (a.quotesCount || 0) - (b.quotesCount || 0); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  })();

  const SortHeader = ({ label, sortId, className }: { label: string; sortId: SortKey; className?: string }) => {
    const isActive = sortKey === sortId;
    return (
      <TableHead
        className={cn("cursor-pointer select-none group/th", isActive && "text-foreground font-semibold", className)}
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
      </TableHead>
    );
  };

  return (
    <>
      <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Produto" sortId="name" className="pl-6 w-[28%]" />
              <SortHeader label="Categoria" sortId="category" className="w-[15%]" />
              <TableHead className="text-center w-[12%]">Status</TableHead>
              <SortHeader label="Preço" sortId="price" className="w-[10%]" />
              <TableHead className="hidden lg:table-cell w-[12%]">Fornecedor</TableHead>
              <SortHeader label="Cotações" sortId="quotes" className="w-[8%] text-center" />
              <TableHead className="text-right pr-6 w-[7%]">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedProducts.map((product) => (
              <TableRow key={product.id} className="group">
                {/* Produto */}
                <TableCell className="pl-6 pr-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0 overflow-hidden border border-border dark:border-white/5 shadow-sm">
                      {product.image_url ? (
                        <LazyImage
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          showSkeleton={true}
                          fallback={<Package className="h-4 w-4 text-muted-foreground" />}
                        />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium text-[13px] text-foreground truncate">
                      {capitalize(product.name)}
                    </span>
                  </div>
                </TableCell>

                {/* Categoria */}
                <TableCell>
                  <span className={cn("inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border", getCategoryColor(product.category || ""))}>
                    {capitalize(product.category)}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell className="text-center">
                  <StatusBadge status={getProductStatus(product)} />
                </TableCell>

                {/* Preço */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="text-[13px] text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {product.lastOrderPrice}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70">
                        por {product.unit || 'un'}
                      </span>
                    </div>
                    {getTrendIcon(product.trend)}
                  </div>
                </TableCell>

                {/* Fornecedor */}
                <TableCell className="hidden lg:table-cell">
                  <span
                    className="text-sm text-muted-foreground truncate block max-w-[120px]"
                    title={capitalize(product.bestSupplier || "")}
                  >
                    {capitalize(product.bestSupplier || "—")}
                  </span>
                </TableCell>

                {/* Cotações */}
                <TableCell className="text-center">
                  {(product.quotesCount || 0) === 0 ? (
                    <span className="text-[12px] text-muted-foreground/40 tabular-nums">—</span>
                  ) : (product.quotesCount || 0) >= 3 ? (
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-[12px] tabular-nums font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
                      {product.quotesCount}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-[12px] tabular-nums font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50">
                      {product.quotesCount}
                    </span>
                  )}
                </TableCell>

                {/* Ações */}
                <TableCell className="pr-6 text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>

      {/* Footer */}
      <div className="border-t border-border dark:border-white/5 bg-muted/20 px-6 py-3 flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">
          {sortedProducts.length} produto{sortedProducts.length !== 1 ? 's' : ''} exibido{sortedProducts.length !== 1 ? 's' : ''}
        </span>
        {sortKey && (
          <button
            onClick={() => { setSortKey(null); setSortDir('asc'); }}
            className="text-[12px] text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Limpar ordenação
          </button>
        )}
      </div>
    </>
  );
});
