import { memo, useState, useCallback } from 'react';
import { Package, Star, ClipboardList, History, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
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
        case 'name':     cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR'); break;
        case 'category': cmp = (a.category || '').localeCompare(b.category || '', 'pt-BR'); break;
        case 'brand':    cmp = (a.brand_name || '').localeCompare(b.brand_name || '', 'pt-BR'); break;
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
              <SortHeader label="Categoria" sortId="category" className="w-[13%]" />
              <TableHead className="hidden lg:table-cell w-[12%]">Marca</TableHead>
              <TableHead className="hidden xl:table-cell w-[10%]">Código</TableHead>
              <TableHead className="text-center w-[10%]">Status</TableHead>
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
                    <span className="font-medium text-sm text-foreground truncate">
                      {capitalize(product.name)}
                    </span>
                  </div>
                </TableCell>

                {/* Categoria */}
                <TableCell>
                  <span className="inline-flex items-center text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    {capitalize(product.category)}
                  </span>
                </TableCell>

                {/* Marca */}
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                      {capitalize(product.brand_name || "—")}
                    </span>
                    {product.brand_rating ? (
                      <div className="flex items-center gap-px">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-2.5 w-2.5",
                              i < (product.brand_rating || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"
                            )}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </TableCell>

                {/* Código */}
                <TableCell className="hidden xl:table-cell">
                  <span className="font-mono text-[13px] text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border dark:border-white/5">
                    {product.barcode || "—"}
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
                      <span className="font-medium text-sm text-emerald-700 dark:text-emerald-400 tabular-nums">
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
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span className="text-xs tabular-nums">{product.quotesCount || 0}</span>
                  </div>
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
