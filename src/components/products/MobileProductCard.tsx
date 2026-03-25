import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { LazyImage } from "@/components/responsive/LazyImage";
import { 
  ChevronDown, ChevronUp, History, Package, Trash2, ClipboardList, 
  TrendingUp, TrendingDown, Minus, Star, Edit 
} from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface MobileProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onHistory?: (product: Product) => void;
  style?: React.CSSProperties;
}

/**
 * Memoized mobile product card optimized for virtualization
 * - Touch-optimized spacing (min 44x44px touch targets)
 * - Single-column layout for mobile
 * - LazyImage for product images
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */
export const MobileProductCard = memo<MobileProductCardProps>(({
  product,
  onEdit,
  onDelete,
  onHistory,
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEdit = useCallback(() => onEdit(product), [onEdit, product]);
  const handleDelete = useCallback(() => onDelete(product), [onDelete, product]);
  const handleHistory = useCallback(() => onHistory?.(product), [onHistory, product]);

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

  return (
    <Collapsible 
      open={isExpanded} 
      onOpenChange={setIsExpanded}
      style={style}
      className={cn(
        "bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/30 overflow-hidden transition-all duration-300"
      )}
    >
      <div className="p-2.5">
        {/* Header compacto */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {product.image_url ? (
                <LazyImage 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-9 h-9 rounded-lg object-cover"
                  showSkeleton={true}
                  fallback={<Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                />
              ) : (
                <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{capitalize(product.name)}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] px-1.5 py-0">
                  {capitalize(product.category)}
                </Badge>
                {product.brand_name && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-1.5 py-0 rounded-full border border-gray-200 dark:border-gray-700">
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{capitalize(product.brand_name)}</span>
                    {product.brand_rating ? (
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-2 w-2 ${i < (product.brand_rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"}`} 
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
                <StatusBadge status={getProductStatus(product)} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-9 w-9 p-0 flex-shrink-0 active:scale-95 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
            >
              <Edit className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>
        
        {/* Info compacta em linha */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-green-700 dark:text-green-400">{product.lastOrderPrice}</span>
            {getTrendIcon(product.trend)}
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <ClipboardList className="h-3 w-3" />
            <span>{product.quotesCount || 0} cotações</span>
          </div>
          {product.bestSupplier && (
            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[80px]">{capitalize(product.bestSupplier)}</span>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <CollapsibleTrigger asChild>
        <button
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50/50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700/30 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground active:bg-gray-100 dark:active:bg-gray-700/50 touch-target min-h-[48px]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Ver Menos</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Detalhes do Produto</span>
            </>
          )}
        </button>
      </CollapsibleTrigger>

      {/* Expandable Details */}
      <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
        <div className="p-3 pt-0 space-y-3 border-t border-gray-200 dark:border-gray-700/30">
          
          <div className="grid grid-cols-2 gap-2 pt-3">
            {onHistory && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-10 touch-target active:scale-95 transition-transform"
                onClick={handleHistory}
              >
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              className={cn(
                "h-10 touch-target text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 active:scale-95 transition-transform",
                !onHistory && "col-span-2"
              )}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-render prevention
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
