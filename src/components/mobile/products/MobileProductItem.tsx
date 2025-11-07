import { memo } from "react";
import { Edit, Trash2 } from "lucide-react";
import type { ProductMobile } from "@/hooks/mobile/useProductsMobile";

interface MobileProductItemProps {
  product: ProductMobile;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Item de produto mobile - Ultra leve e performático
 * Zero dependências pesadas
 */
export const MobileProductItem = memo(function MobileProductItem({
  product,
  onEdit,
  onDelete,
}: MobileProductItemProps) {
  return (
    <div className="h-full px-3 py-2" style={{ contain: 'layout style paint' }}>
      <div className="h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center gap-3 px-3">
        <div className="flex-shrink-0 w-12 h-12 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-12 h-12 rounded object-cover"
              loading="lazy"
              decoding="async"
              style={{ contentVisibility: 'auto' }}
            />
          ) : (
            <span className="text-gray-400 text-lg font-bold">
              {product.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {product.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {product.category || "Sem categoria"} • {product.unit}
          </div>
        </div>

        <div className="flex-shrink-0 flex gap-1">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            aria-label="Editar"
          >
            <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            aria-label="Excluir"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
});

