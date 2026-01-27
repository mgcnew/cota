import { memo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Edit, Trash2, TrendingUp, TrendingDown, Minus, History, Building2, FileText, Clock, Scale } from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import { ProductPriceHistoryDialog } from "@/components/forms/ProductPriceHistoryDialog";
import { LazyImage } from "@/components/responsive/LazyImage";
import type { Product } from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
  isMobile: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onImageClick?: (url: string) => void;
  getTrendIcon: (trend: string) => JSX.Element;
  getStatusBadge: (quotesCount: number) => JSX.Element;
}

/**
 * Card de produto otimizado com React.memo
 * - Memoizado para evitar re-renders desnecessários
 * - Lazy loading de imagens
 * - Callbacks otimizados
 */
export const ProductCardMemoized = memo<ProductCardProps>(({
  product,
  isMobile,
  onEdit,
  onDelete,
  onImageClick,
  getTrendIcon,
  getStatusBadge,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleEditClick = useCallback(() => {
    onEdit(product);
  }, [onEdit, product]);

  const handleDeleteClick = useCallback(() => {
    onDelete(product);
  }, [onDelete, product]);

  const handleImageClickInternal = useCallback(() => {
    if (product.image_url && onImageClick) {
      onImageClick(product.image_url);
    }
  }, [product.image_url, onImageClick]);

  return (
    <Card className="group border border-gray-200/60 dark:border-gray-700/30 bg-gradient-to-br from-white to-gray-50/30 dark:from-[#1C1F26] dark:to-[#1C1F26] sm:hover:border-orange-300/70 dark:sm:hover:border-orange-600/50 sm:hover:shadow-xl sm:dark:hover:shadow-lg sm:dark:hover:shadow-black/20 sm:transition-shadow sm:duration-200 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Thumbnail com lazy loading */}
            <div 
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20 ${product.image_url && !imageError ? 'cursor-pointer' : ''}`}
              onClick={handleImageClickInternal}
            >
              {product.image_url && !imageError ? (
                <LazyImage
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover sm:transition-transform sm:duration-200 sm:group-hover:scale-110"
                  containerClassName="w-full h-full"
                  showSkeleton={true}
                  enableBlurUp={true}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600 dark:text-orange-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate pr-1">
                {capitalize(product.name)}
              </CardTitle>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-[10px] sm:text-xs bg-orange-50/80 dark:bg-orange-900/30 border-orange-200/60 dark:border-orange-700/60 text-orange-700 dark:text-orange-400 font-medium px-1.5 sm:px-2">
                  {capitalize(product.category)}
                </Badge>
                <div className="flex items-center gap-0.5 sm:gap-1 text-gray-500 text-[10px] sm:text-xs">
                  <Scale className="h-3 w-3" />
                  <span>{product.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions dropdown - apenas desktop */}
          {!isMobile && (
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/20"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
        {isMobile ? (
          <div className="space-y-2.5">
            {/* Mobile: Layout simplificado */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/30">
              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Unidade</span>
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">{product.unit}</span>
            </div>

            {product.barcode && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/30">
                <div className="flex items-center gap-2">
                  <Scale className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Código</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white font-mono">{product.barcode}</span>
              </div>
            )}

            {/* Botões de ação rápida mobile */}
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <ProductPriceHistoryDialog 
                productName={product.name} 
                productId={product.id} 
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                  >
                    <History className="h-3.5 w-3.5 mr-1.5" />
                    Histórico
                  </Button>
                } 
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="flex-1 h-9 text-xs"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                className="flex-1 h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Excluir
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop: Layout completo */}
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/60 dark:border-green-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400 mb-1">Última Compra</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-300">{product.lastOrderPrice || "R$ 0,00"}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {getTrendIcon(product.trend || "stable")}
                    <span className="text-xs sm:text-sm font-medium text-green-600 hidden sm:inline">Tendência</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    Atualizado
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/30">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fornecedor</span>
                </div>
                <span className="table-cell-primary truncate max-w-[120px]">{capitalize(product.bestSupplier || "N/A")}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-lg bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/30 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    <span className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400">Cotações</span>
                  </div>
                  <span className="text-base sm:text-lg font-bold text-blue-800 dark:text-blue-300">{product.quotesCount || 0}</span>
                </div>

                <div className="p-2 sm:p-3 rounded-lg bg-purple-50/80 dark:bg-purple-900/20 border border-purple-200/60 dark:border-purple-700/30 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    <span className="text-[10px] sm:text-xs font-medium text-purple-600 dark:text-purple-400">Atualizado</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-purple-800 dark:text-purple-300">{product.lastUpdate || "N/A"}</span>
                </div>
              </div>
            </div>
          </>
        )}

        <ProductPriceHistoryDialog 
          productName={product.name} 
          productId={product.id} 
          trigger={
            <Button 
              variant="outline" 
              className={`w-full bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-700 ${!isMobile ? 'hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 hover:text-orange-800 transition-all duration-200' : ''}`}
            >
              <History className="h-4 w-4 mr-2" />
              Ver Histórico de Preços
            </Button>
          } 
        />
      </CardContent>

      {/* Elemento decorativo */}
      <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-orange-200 dark:bg-orange-900/20 rounded-full opacity-20"></div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison para otimizar re-renders
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.category === nextProps.product.category &&
    prevProps.product.unit === nextProps.product.unit &&
    prevProps.product.barcode === nextProps.product.barcode &&
    prevProps.product.image_url === nextProps.product.image_url &&
    prevProps.product.lastOrderPrice === nextProps.product.lastOrderPrice &&
    prevProps.product.quotesCount === nextProps.product.quotesCount &&
    prevProps.isMobile === nextProps.isMobile
  );
});

ProductCardMemoized.displayName = "ProductCardMemoized";
