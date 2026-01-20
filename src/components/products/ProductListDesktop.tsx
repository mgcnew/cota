import { memo } from 'react';
import { Package, Tags, Award, Barcode, CircleDot, DollarSign, Building2, ClipboardList, Star, History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActionGroup } from "@/components/ui/table-action-group";
import { LazyImage } from "@/components/responsive/LazyImage";
import { capitalize } from "@/lib/text-utils";
import type { Product } from "@/hooks/useProducts";

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
    <div className="hidden md:block overflow-x-auto w-full">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableCell colSpan={9} className="px-1 pb-3 pt-0 border-none">
              <div className="flex items-center bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-sm px-4 py-4">
                <div className="w-[25%] flex items-center gap-3 pr-4 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Produto</span>
                </div>
                <div className="w-[12%] px-2 flex justify-center items-center gap-2">
                  <Tags className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Categoria</span>
                </div>
                <div className="hidden lg:flex w-[12%] px-2 justify-center items-center gap-2">
                  <Award className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Marca</span>
                </div>
                <div className="hidden xl:flex w-[10%] px-2 justify-center items-center gap-2">
                  <Barcode className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Código</span>
                </div>
                <div className="w-[11%] px-2 flex justify-center items-center gap-2">
                  <CircleDot className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Status</span>
                </div>
                <div className="w-[10%] px-2 flex justify-center items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Preço</span>
                </div>
                <div className="hidden lg:flex w-[12%] px-2 justify-center items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Fornecedor</span>
                </div>
                <div className="w-[8%] px-2 flex justify-center items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Cot.</span>
                </div>
                <div className="w-[10%] flex justify-end items-center gap-2 px-2">
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Ações</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="group border-none">
              <TableCell colSpan={9} className="px-1 py-1.5">
                <div className="flex items-center px-4 py-3 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-smooth hover:scale-[1.005] hover:shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/70">
                  <div className="w-[25%] flex items-center gap-3 pr-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-600/30">
                      {product.image_url ? (
                        <LazyImage 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-9 h-9 rounded-xl object-cover"
                          showSkeleton={true}
                          fallback={<Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                        />
                      ) : (
                        <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{capitalize(product.name)}</div>
                    </div>
                  </div>

                  <div className="w-[12%] px-2 flex justify-center items-center">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-0 font-medium">
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
                            className={`h-2.5 w-2.5 ${i < (product.brand_rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"}`} 
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="hidden xl:flex w-[10%] px-2 justify-center items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {product.barcode || "—"}
                    </span>
                  </div>

                  <div className="w-[11%] px-2 flex justify-center items-center">
                    <StatusBadge status={getProductStatus(product)} />
                  </div>

                  <div className="w-[10%] px-2 flex justify-center items-center gap-1.5">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{product.lastOrderPrice}</span>
                    {getTrendIcon(product.trend)}
                  </div>

                  <div className="hidden lg:flex w-[12%] px-2 justify-center items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{capitalize(product.bestSupplier || "—")}</span>
                  </div>

                  <div className="w-[8%] px-2 flex justify-center items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                      <ClipboardList className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs">{product.quotesCount || 0}</span>
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
