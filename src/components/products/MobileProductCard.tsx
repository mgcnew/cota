import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { LazyImage } from "@/components/responsive/LazyImage";
import { 
  Package, Edit, Trash2, MoreVertical, History,
  DollarSign, ClipboardList, CircleDot, Barcode, Building2,
  TrendingUp, TrendingDown, Minus
} from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/hooks/useProducts";

interface MobileProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
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
  style,
}) => {
  const handleEdit = useCallback(() => onEdit(product), [onEdit, product]);
  const handleDelete = useCallback(() => onDelete(product), [onDelete, product]);

  const getProductStatus = (product: Product) => {
    if (product.quotesCount === 0) return "sem_cotacao";
    if (product.lastQuotePrice === "R$ 0,00") return "pendente";
    if (product.quotesCount >= 3) return "ativo";
    return "cotado";
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
    if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
    return <Minus className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />;
  };

  return (
    <div 
      style={style}
      className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Product image with LazyImage - touch target 44x44px */}
          <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {product.image_url ? (
              <LazyImage 
                src={product.image_url} 
                alt={product.name} 
                className="w-11 h-11 rounded-xl object-cover"
                showSkeleton={true}
                fallback={<Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
              />
            ) : (
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{capitalize(product.name)}</p>
            <Badge variant="secondary" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs mt-1">
              {capitalize(product.category)}
            </Badge>
          </div>
        </div>
        {/* Dropdown menu with 44x44px touch target */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-11 w-11 flex-shrink-0 touch-target">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit} className="min-h-[44px]">
              <Edit className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600 min-h-[44px]">
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-[44px]">
              <History className="h-4 w-4 mr-2" /> Histórico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Product details grid with touch-optimized spacing */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 min-h-[28px]">
          <DollarSign className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
          <span className="text-gray-500 dark:text-gray-400">Preço:</span>
          <span className="font-semibold text-green-700 dark:text-green-400">{product.lastQuotePrice}</span>
          {getTrendIcon(product.trend)}
        </div>
        <div className="flex items-center gap-2 min-h-[28px]">
          <ClipboardList className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
          <span className="text-gray-500 dark:text-gray-400">Cotações:</span>
          <span className="font-semibold text-blue-700 dark:text-blue-400">{product.quotesCount || 0}</span>
        </div>
        <div className="flex items-center gap-2 min-h-[28px]">
          <CircleDot className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-gray-500 dark:text-gray-400">Status:</span>
          <StatusBadge status={getProductStatus(product)} />
        </div>
        <div className="flex items-center gap-2 min-h-[28px]">
          <Barcode className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-gray-500 dark:text-gray-400">Código:</span>
          <span className="text-gray-700 dark:text-gray-300 truncate">{product.barcode || "N/A"}</span>
        </div>
      </div>
      
      {/* Supplier info */}
      {product.bestSupplier && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/30 flex items-center gap-2 text-xs min-h-[28px]">
          <Building2 className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-gray-500 dark:text-gray-400">Fornecedor:</span>
          <span className="text-gray-700 dark:text-gray-300 truncate">{capitalize(product.bestSupplier)}</span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-render prevention
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.category === nextProps.product.category &&
    prevProps.product.lastQuotePrice === nextProps.product.lastQuotePrice &&
    prevProps.product.quotesCount === nextProps.product.quotesCount &&
    prevProps.product.trend === nextProps.product.trend &&
    prevProps.product.barcode === nextProps.product.barcode &&
    prevProps.product.bestSupplier === nextProps.product.bestSupplier &&
    prevProps.product.image_url === nextProps.product.image_url
  );
});

MobileProductCard.displayName = "MobileProductCard";

export default MobileProductCard;
