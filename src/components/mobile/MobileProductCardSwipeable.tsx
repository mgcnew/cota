import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, Trash2, History } from 'lucide-react';
import { capitalize } from '@/lib/text-utils';
import { ProductPriceHistoryDialog } from '@/components/forms/ProductPriceHistoryDialog';
import { cn } from '@/lib/utils';
import type { ProductMobile } from '@/hooks/mobile/useProductsMobile';

interface MobileProductCardSwipeableProps {
  product: ProductMobile;
  onEdit?: (product: ProductMobile) => void;
  onDelete?: (product: ProductMobile) => void;
}

/**
 * Card de produto com Swipe Actions
 * - Deslize para esquerda para ver ações
 * - Gestos nativos mobile
 * - Feedback visual suave
 */
export function MobileProductCardSwipeable({ 
  product, 
  onEdit, 
  onDelete 
}: MobileProductCardSwipeableProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);

  // Limpar swipe quando clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setSwipeOffset(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers de toque/mouse para swipe
  const handleStart = (clientX: number) => {
    startXRef.current = clientX;
    currentXRef.current = clientX;
    setIsSwiping(true);
  };

  const handleMove = (clientX: number) => {
    if (!isSwiping) return;

    currentXRef.current = clientX;
    const deltaX = currentXRef.current - startXRef.current;

    // Limitar swipe para esquerda (ações)
    if (deltaX < 0) {
      setSwipeOffset(Math.max(deltaX, -120)); // Máximo 120px
    }
  };

  const handleEnd = () => {
    setIsSwiping(false);
    
    // Se deslizou mais de 60px, mostrar ações
    if (swipeOffset < -60) {
      setSwipeOffset(-120);
    } else {
      // Voltar para posição inicial
      setSwipeOffset(0);
    }
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  // Mouse events (para desktop com touchpad)
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isSwiping) {
      handleMove(e.clientX);
    }
  };

  const onMouseUp = () => {
    handleEnd();
  };

  const handleActionClick = (action: 'edit' | 'delete') => {
    setSwipeOffset(0); // Fechar ações
    
    if (action === 'edit' && onEdit) {
      onEdit(product);
    } else if (action === 'delete' && onDelete) {
      onDelete(product);
    }
  };

  return (
    <div className="relative overflow-hidden mb-4">
      <div
        ref={cardRef}
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Card principal com design moderno */}
        <Card className="flex-1 min-w-0 bg-gradient-to-br from-white via-orange-50/50 to-amber-50/30 dark:from-[#1C1F26] dark:via-[#1C1F26] dark:to-[#1C1F26] border-2 border-orange-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardHeader className="pb-3 p-5 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-900/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {capitalize(product.name)}
                    </CardTitle>
                  </div>
                </div>
                
                {/* Categoria e Unidade com design melhorado */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-semibold bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-400 dark:border-blue-700 shadow-sm">
                    {capitalize(product.category || 'Sem categoria')}
                  </Badge>
                  {product.unit && (
                    <Badge variant="outline" className="text-xs font-semibold bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600 shadow-sm">
                      {product.unit}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-4">
            {/* Código de barras se disponível */}
            {product.barcode && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Código:</span>
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">{product.barcode}</span>
              </div>
            )}

            {/* Ação rápida - Histórico com design melhorado */}
            <ProductPriceHistoryDialog
              productName={product.name}
              productId={product.id}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-200 text-orange-700 hover:from-orange-100 hover:via-amber-100 hover:to-orange-100 hover:border-orange-300 hover:shadow-md dark:from-orange-900/20 dark:via-amber-900/20 dark:to-orange-900/20 dark:border-orange-700 dark:text-orange-400 dark:hover:from-orange-900/30 dark:hover:via-amber-900/30 dark:hover:to-orange-900/30 transition-all duration-200 rounded-xl"
                >
                  <History className="h-4 w-4 mr-2" />
                  Ver Histórico de Preços
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Ações de swipe com design melhorado */}
        <div className="flex items-center gap-2 px-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 min-w-[140px] rounded-r-2xl">
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              className="h-full min-h-[100px] bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
              onClick={() => handleActionClick('edit')}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Edit className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold">Editar</span>
              </div>
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="h-full min-h-[100px] bg-gradient-to-br from-red-500 to-red-600 text-white border-0 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
              onClick={() => handleActionClick('delete')}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Trash2 className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold">Excluir</span>
              </div>
            </Button>
          )}
        </div>
      </div>

      {/* Indicador visual de swipe melhorado */}
      {swipeOffset === 0 && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-40 group-hover:opacity-60 transition-opacity">
          <div className="flex gap-1.5 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}

