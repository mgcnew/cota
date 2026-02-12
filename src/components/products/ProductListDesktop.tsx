import { memo } from 'react';
import { Package, Tags, Award, Barcode, CircleDot, DollarSign, Building2, ClipboardList, Star, History, TrendingUp, TrendingDown, Minus, Eye, EyeOff } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActionGroup } from "@/components/ui/table-action-group";
import { LazyImage } from "@/components/responsive/LazyImage";
import { capitalize } from "@/lib/text-utils";
import type { Product } from "@/hooks/useProducts";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface ProductListDesktopProps {
  products: Product[];
  hiddenProductIds: Set<string>;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onHistory: (product: Product) => void;
  onToggleVisibility: (productId: string) => void;
}

const getProductStatus = (product: Product) => {
  if (product.quotesCount === 0) return "sem_cotacao";
  if (product.lastOrderPrice === "R$ 0,00") return "pendente";
  if (product.quotesCount >= 3) return "ativo";
  return "cotado";
};

const getTrendIcon = (trend: "up" | "down" | "stable") => {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />;
};

export const ProductListDesktop = memo(({ products, hiddenProductIds, onEdit, onDelete, onHistory, onToggleVisibility }: ProductListDesktopProps) => {
  return (
    <div className="hidden md:block overflow-x-auto w-full custom-scrollbar">
      <Table className={designSystem.components.table.root}>
        <TableHeader className={designSystem.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={10} className="px-1 pb-3 pt-0 border-none">
              <div className={cn("flex items-center rounded-xl shadow-sm px-4 py-4 border border-border/40", designSystem.components.card.flat)}>
                <div className="w-[5%] flex justify-center items-center">
                   <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="w-[20%] flex items-center gap-3 pr-4 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Produto</span>
                </div>
                <div className="w-[12%] px-2 flex justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Categoria</span>
                </div>
                <div className="hidden lg:flex w-[12%] px-2 justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Marca</span>
                </div>
                <div className="hidden xl:flex w-[10%] px-2 justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Código</span>
                </div>
                <div className="w-[11%] px-2 flex justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Status</span>
                </div>
                <div className="w-[10%] px-2 flex justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Preço</span>
                </div>
                <div className="hidden lg:flex w-[12%] px-2 justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Fornecedor</span>
                </div>
                <div className="w-[8%] px-2 flex justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Cot.</span>
                </div>
                <div className="w-[10%] flex justify-end items-center gap-2 px-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Ações</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isHidden = hiddenProductIds.has(product.id);
            return (
              <TableRow key={product.id} className="group border-none hover:bg-transparent">
                <TableCell colSpan={10} className={designSystem.components.table.cell}>
                  <div className={cn(
                    "flex items-center px-4 py-3 mb-1 transition-all duration-300",
                    designSystem.components.table.row,
                    isHidden ? "opacity-50 grayscale bg-gray-50 dark:bg-gray-900/50" : ""
                  )}>
                    <div className="w-[5%] flex justify-center items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-brand hover:bg-brand/10"
                              onClick={() => onToggleVisibility(product.id)}
                            >
                              {isHidden ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isHidden ? "Mostrar item" : "Ocultar item"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="w-[20%] flex items-center gap-3 pr-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/40">
                        {product.image_url ? (
                          <LazyImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            showSkeleton={true}
                            fallback={<Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                          />
                        ) : (
                          <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn("font-semibold text-sm truncate", designSystem.colors.text.primary)}>{capitalize(product.name)}</div>
                      </div>
                    </div>

                    <div className="w-[12%] px-2 flex justify-center items-center">
                      <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-0 font-medium px-2.5 py-0.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        {capitalize(product.category)}
                      </Badge>
                    </div>

                    <div className="hidden lg:flex w-[12%] px-2 flex-col justify-center items-center gap-1">
                      <span className={cn("text-sm truncate max-w-full font-medium", designSystem.colors.text.primary)}>
                        {capitalize(product.brand_name || "—")}
                      </span>
                      {product.brand_rating ? (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-2.5 w-2.5 ${i < (product.brand_rating || 0) ? "text-amber-400 fill-amber-400" : "text-zinc-300 dark:text-zinc-700"}`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="hidden xl:flex w-[10%] px-2 justify-center items-center">
                      <span className={cn("text-[10px] font-mono bg-muted/50 px-2 py-1 rounded-md", designSystem.colors.text.muted)}>
                        {product.barcode || "—"}
                      </span>
                    </div>

                    <div className="w-[11%] px-2 flex justify-center items-center">
                      <StatusBadge status={getProductStatus(product)} />
                    </div>

                    <div className="w-[10%] px-2 flex justify-center items-center gap-1.5 bg-zinc-50/50 dark:bg-zinc-800/20 py-1 rounded-lg mx-1">
                      <span className={cn("font-bold text-sm", designSystem.colors.text.primary)}>{product.lastOrderPrice}</span>
                      {getTrendIcon(product.trend)}
                    </div>

                    <div className="hidden lg:flex w-[12%] px-2 justify-center items-center">
                      <span className={cn("text-sm truncate max-w-[120px]", designSystem.colors.text.secondary)} title={capitalize(product.bestSupplier || "")}>
                        {capitalize(product.bestSupplier || "—")}
                      </span>
                    </div>

                    <div className="w-[8%] px-2 flex justify-center items-center gap-1.5">
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <ClipboardList className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">{product.quotesCount || 0}</span>
                      </div>
                    </div>

                    <div className="w-[10%] flex justify-end items-center px-2">
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
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});
