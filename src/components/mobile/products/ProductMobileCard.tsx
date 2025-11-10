import { memo } from 'react';
import { Edit, Trash2, Package, Barcode } from 'lucide-react';
import type { ProductMobile } from '@/hooks/mobile/useProductsMobile';
import { cn } from '@/lib/utils';

interface ProductMobileCardProps {
  product: ProductMobile;
  onEdit: (product: ProductMobile) => void;
  onDelete: (product: ProductMobile) => void;
}

// Cores sólidas por categoria
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Alimentos: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  Bebidas: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  Limpeza: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  Higiene: { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  Escritório: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
  default: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
};

/**
 * Card de produto mobile otimizado v2
 * - Design moderno com cores sólidas
 * - Hierarquia visual aprimorada
 * - Badges coloridos por categoria
 * - Micro-interactions suaves
 * - Lazy loading de imagens
 * - Memoizado para evitar re-renders
 */
export const ProductMobileCard = memo<ProductMobileCardProps>(
  function ProductMobileCard({ product, onEdit, onDelete }) {
    const handleEdit = () => onEdit(product);
    const handleDelete = () => onDelete(product);

    const categoryColor = categoryColors[product.category || ''] || categoryColors.default;

    return (
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200"
        style={{
          contain: 'layout style paint',
          willChange: 'transform',
        }}
      >
        <div className="flex items-start gap-3">
          {/* Imagem do produto com borda colorida */}
          <div className={cn(
            "flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden border-2 transition-colors",
            categoryColor.bg,
            categoryColor.border
          )}>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                style={{ contentVisibility: 'auto' }}
              />
            ) : (
              <Package className={cn("h-8 w-8", categoryColor.text)} />
            )}
          </div>

          {/* Informações do produto */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-base text-gray-900 dark:text-white line-clamp-2 leading-tight">
                {product.name}
              </h3>
              {product.category && (
                <span className={cn(
                  "inline-block px-2 py-0.5 rounded-md text-xs font-medium border",
                  categoryColor.bg,
                  categoryColor.text,
                  categoryColor.border
                )}>
                  {product.category}
                </span>
              )}
            </div>

            {/* Detalhes adicionais */}
            <div className="flex flex-wrap gap-2 text-xs">
              {product.unit && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300">
                  <Package className="h-3 w-3" />
                  <span className="font-medium">{product.unit}</span>
                </div>
              )}
              {product.barcode && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300">
                  <Barcode className="h-3 w-3" />
                  <span className="font-mono text-[10px]">{product.barcode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex-shrink-0 flex flex-col gap-2">
            <button
              onClick={handleEdit}
              className="p-2.5 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all duration-200 active:scale-95"
              aria-label="Editar produto"
            >
              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all duration-200 active:scale-95"
              aria-label="Excluir produto"
            >
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

