import { memo } from 'react';
import { Package, Tags, Award, Barcode, CircleDot, DollarSign, Building2, ClipboardList, Star, History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActionGroup } from "@/components/ui/table-action-group";
import { LazyImage } from "@/components/responsive/LazyImage";
import { capitalize } from "@/lib/text-utils";
import type { Product } from "@/hooks/useProducts";
import { designSystem } from "@/styles/design-system";
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
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />;
};

export const ProductListDesktop = memo(({ products, onEdit, onDelete, onHistory }: ProductListDesktopProps) => {
  return (
    <div className="hidden md:block overflow-x-auto w-full custom-scrollbar">
      <Table className="w-full border-separate border-spacing-y-2">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={9} className="px-1 py-0 border-none">
              <div className={cn("flex items-center rounded-xl shadow-sm px-4 py-4", designSystem.components.card.flat)}>
                <div className="w-[25%] flex items-center gap-3 pr-4 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="uppercase tracking-wide text-xs font-bold text-gray-500 dark:text-gray-400">Produto</span>
                </div>
                <div className="w-[12%] px-2 flex justify-center items-center gap-2">
                  <Tags className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-bold text-gray-500 dark:text-gray-400">Categoria</span>
                </div>
                <div className="hidden lg:flex w-[12%] px-2 justify-center items-center gap-2">
                  <Award className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-bold text-gray-500 dark:text-gray-400">Marca</span>
                </div>
                <div className="hidden xl:flex w-[10%] px-2 justify-center items-center gap-2">
                  <Barcode className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-bold text-gray-500 dark:text-gray-400">Código</span>
                </div>
                <div className="w-[11%] px-2 flex justify-center items-center gap-2">
                  <CircleDot className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-bold text-gray-500 dark:text-gray-400">Status</span>
                </div>
                <div className="w-[10%] px-2 flex justify-center items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-bold text-gray-500 dark:text-gray-400">Preço</span>
                </div>
                <div className="hidden lg:flex w-[12%] px-2 justify-center items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-bold text-gray-500 dark:text-gray-400">Fornecedor</span>
                </div>
                <div className="w-[8%] px-2 flex justify-center items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-bold text-gray-500 dark:text-gray-400">Cot.</span>
                </div>
                <div className="w-[10%] flex justify-end items-center gap-2 px-2">
                  <span className="uppercase tracking-wide text-xs font-bold text-gray-500 dark:text-gray-400">Ações</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="group border-none hover:bg-transparent">
              <TableCell colSpan={9} className="px-1 py-0 border-none">
                <div className={cn(
                  "flex items-center px-4 py-3 rounded-xl border transition-all duration-200 hover:scale-[1.005] hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-default",
                  designSystem.colors.surface.card,
                  designSystem.colors.border.subtle
                )}>
                  <div className="w-[25%] flex items-center gap-3 pr-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700/50">
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
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{capitalize(product.name)}</div>
                    </div>
                  </div>

                  <div className="w-[12%] px-2 flex justify-center items-center">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0 font-medium px-2.5 py-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      {capitalize(product.category)}
                    </Badge>
                  </div>

                  <div className="hidden lg:flex w-[12%] px-2 flex-col justify-center items-center gap-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-full font-medium">
                      {capitalize(product.brand_name || "—")}
                    </span>
                    {product.brand_rating ? (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 ${i < (product.brand_rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-700"}`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="hidden xl:flex w-[10%] px-2 justify-center items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-md">
                      {product.barcode || "—"}
                    </span>
                  </div>

                  <div className="w-[11%] px-2 flex justify-center items-center">
                    <StatusBadge status={getProductStatus(product)} />
                  </div>

                  <div className="w-[10%] px-2 flex justify-center items-center gap-1.5 bg-gray-50/50 dark:bg-gray-800/20 py-1 rounded-lg mx-1">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{product.lastOrderPrice}</span>
                    {getTrendIcon(product.trend)}
                  </div>

                  <div className="hidden lg:flex w-[12%] px-2 justify-center items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]" title={capitalize(product.bestSupplier || "")}>
                      {capitalize(product.bestSupplier || "—")}
                    </span>
                  </div>

                  <div className="w-[8%] px-2 flex justify-center items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
                      <ClipboardList className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-blue-700 dark:text-blue-300 text-xs">{product.quotesCount || 0}</span>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
