import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { LazyImage } from "@/components/responsive/LazyImage";
import { 
  History, Package, Trash2, ClipboardList, 
  TrendingUp, TrendingDown, Minus, Edit, Eye
} from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import type { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

interface MobileProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onHistory?: (product: Product) => void;
  style?: React.CSSProperties;
}

const abbreviateName = (name: string, maxLength: number = 28) => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + '...';
};

/**
 * Mobile product card redesigned to match the quotation table style
 * - Floating card style with glassmorphism
 * - Shortened status labels for better mobile fit
 * - Row click for viewing history
 * - Explicit actions buttons for edit/delete
 */
export const MobileProductCard = memo<MobileProductCardProps>(({
  product,
  onEdit,
  onDelete,
  onHistory,
  style,
}) => {
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(product);
  }, [onEdit, product]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(product);
  }, [onDelete, product]);

  const handleView = useCallback(() => {
    onHistory?.(product);
  }, [onHistory, product]);

  const getProductStatus = (product: Product) => {
    if (product.quotesCount === 0) return "sem_cotacao";
    if (product.lastOrderPrice === "R$ 0,00") return "pendente";
    if (product.quotesCount >= 3) return "ativo";
    return "cotado";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ativo: "Ativo",
      inativo: "Inat.",
      cotado: "Cotado",
      pendente: "Pend.",
      sem_cotacao: "S/ Cot."
    };
    return labels[status] || capitalize(status);
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
    if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
    return <Minus className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />;
  };

  const status = getProductStatus(product);

  return (
    <div 
      onClick={handleView}
      style={style}
      className={cn(
        "bg-white dark:bg-card/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm overflow-hidden touch-manipulation relative active:scale-[0.98] transition-all duration-200",
      )}
    >
      <div className="p-4">
        {/* Header: Image, Name, Price */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center flex-shrink-0 overflow-hidden border border-brand/10">
              {product.image_url ? (
                <LazyImage 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-10 h-10 rounded-xl object-cover"
                  showSkeleton={true}
                  fallback={<Package className="h-5 w-5 text-brand" />}
                />
              ) : (
                <Package className="h-5 w-5 text-brand" />
              )}
            </div>
            
            <div className="min-w-0">
              <h3 className={cn("text-sm truncate leading-tight", ds.typography.weight.bold, ds.colors.text.primary)}>
                {capitalize(product.name)}
              </h3>
              <p className={cn("text-[10px] uppercase font-mono tracking-tight opacity-70 mt-0.5", ds.colors.text.secondary)}>
                {abbreviateName(product.brand_name || product.category, 20)}
              </p>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className={cn("text-sm font-bold", ds.components.dataDisplay.money)}>
              {product.lastOrderPrice}
            </div>
            <div className={cn("text-[9px] uppercase tracking-wider font-medium opacity-60", ds.colors.text.muted)}>
              últ. preço
            </div>
          </div>
        </div>

        {/* Info Row: Status, Performance, Trend */}
        <div className="flex items-center justify-between mb-4 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-xl p-2.5 border border-zinc-100 dark:border-zinc-800/50">
          <StatusBadge 
            status={status} 
            customLabel={getStatusLabel(status)}
            className="h-6"
          />
          
          <div className="flex items-center gap-4">
            <div className={cn("flex items-center gap-1.5", ds.components.dataDisplay.secondary)}>
              <ClipboardList className="w-3.5 h-3.5 opacity-70" />
              <span className="text-[11px] font-bold">{product.quotesCount || 0}</span>
            </div>
            
            <div className={cn("flex items-center gap-1.5", ds.components.dataDisplay.secondary)}>
              {getTrendIcon(product.trend)}
              <span className="text-[11px] font-medium opacity-70">Tend.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            className={cn(
              "flex-1 h-10 rounded-xl touch-target active:scale-[0.96] transition-transform",
              ds.components.button.primary
            )}
            onClick={handleEdit}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-xl border-zinc-200 dark:border-zinc-800 text-red-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 touch-target shrink-0 active:scale-[0.96] transition-transform"
            onClick={handleDelete}
            aria-label="Excluir produto"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {onHistory && (
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-brand hover:border-brand/30 hover:bg-brand/5 touch-target shrink-0 active:scale-[0.96] transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                handleView();
              }}
              aria-label="Ver histórico"
            >
              <History className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.category === nextProps.product.category &&
    prevProps.product.lastOrderPrice === nextProps.product.lastOrderPrice &&
    prevProps.product.quotesCount === nextProps.product.quotesCount &&
    prevProps.product.trend === nextProps.product.trend &&
    prevProps.product.barcode === nextProps.product.barcode &&
    prevProps.product.bestSupplier === nextProps.product.bestSupplier &&
    prevProps.product.image_url === nextProps.product.image_url &&
    prevProps.product.brand_id === nextProps.product.brand_id &&
    prevProps.product.brand_name === nextProps.product.brand_name &&
    prevProps.product.brand_rating === nextProps.product.brand_rating
  );
});

MobileProductCard.displayName = "MobileProductCard";

export default MobileProductCard;
