import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, Trash2, History } from 'lucide-react';
import { capitalize } from '@/lib/text-utils';
import { ProductPriceHistoryDialog } from '@/components/forms/ProductPriceHistoryDialog';
import { cn } from '@/lib/utils';
import type { ProductMobile } from '@/hooks/mobile/useProductsMobile';

interface MobileProductCardProps {
  product: ProductMobile;
  onEdit?: (product: ProductMobile) => void;
  onDelete?: (product: ProductMobile) => void;
}

/**
 * Card de produto otimizado para mobile
 * - Lazy loading de imagens
 * - Tamanho otimizado para toque
 * - Ações rápidas acessíveis
 */
export function MobileProductCard({ product, onEdit, onDelete }: MobileProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer - carrega imagem apenas quando visível
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Carregar 100px antes de aparecer
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Card
      ref={cardRef}
      className="mb-3 bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-[#1C1F26] dark:via-[#1C1F26] dark:to-[#1C1F26] border border-gray-200/60 dark:border-gray-700/30 shadow-sm"
    >
      {/* Imagem com lazy loading */}
      {isInView && product.image_url && (
        <div className="relative w-full h-32 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              !imageLoaded && "opacity-0"
            )}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
          )}
        </div>
      )}

      <CardHeader className="pb-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-sm flex-shrink-0">
                <Package className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-base font-bold text-gray-900 dark:text-white truncate">
                {capitalize(product.name)}
              </CardTitle>
            </div>
            
            {/* Categoria e Unidade */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
                {capitalize(product.category || 'Sem categoria')}
              </Badge>
              {product.unit && (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400">
                  {product.unit}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        {/* Código de barras se disponível */}
        {product.barcode && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Código:</span> {product.barcode}
          </div>
        )}

        {/* Ações rápidas - botões grandes para toque */}
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <ProductPriceHistoryDialog
            productName={product.name}
            productId={product.id}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 text-sm bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-700 dark:from-orange-900/20 dark:to-amber-900/20 dark:border-orange-700 dark:text-orange-400"
              >
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            }
          />

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 text-sm"
              onClick={() => onEdit(product)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}

          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 text-sm text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              onClick={() => onDelete(product)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

