import { memo } from 'react';
import { Edit, Trash2, Package, Scale } from 'lucide-react';
import type { ProductMobile } from '@/hooks/mobile/useProductsMobile';

interface ProductMobileCardProps {
  product: ProductMobile;
  onEdit: (product: ProductMobile) => void;
  onDelete: (product: ProductMobile) => void;
}

/**
 * Card de produto mobile otimizado
 * - Design limpo e performático
 * - Lazy loading de imagens
 * - Memoizado para evitar re-renders
 */
export const ProductMobileCard = memo<ProductMobileCardProps>(
  function ProductMobileCard({ product, onEdit, onDelete }) {
    const handleEdit = () => onEdit(product);
    const handleDelete = () => onDelete(product);

    return (
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm"
        style={{
          contain: 'layout style paint',
          willChange: 'transform',
        }}
      >
        <div className="flex items-start gap-3">
          {/* Imagem do produto */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
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
              <span className="text-gray-400 text-xl font-bold">
                {product.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Informações do produto */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {product.name}
              </h3>
              {product.category && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {product.category}
                </p>
              )}
            </div>

            {/* Detalhes adicionais */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
              {product.unit && (
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  <span>{product.unit}</span>
                </div>
              )}
              {product.barcode && (
                <div className="flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  <span className="font-mono">{product.barcode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex-shrink-0 flex flex-col gap-1">
            <button
              onClick={handleEdit}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              aria-label="Editar produto"
            >
              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
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

