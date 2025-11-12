import { memo } from 'react';
import { Edit, Trash2, Package, Barcode, Tag, MoreVertical } from 'lucide-react';
import type { ProductMobile } from '@/hooks/mobile/useProductsMobile';
import { cn } from '@/lib/utils';

interface ProductMobileCardProps {
  product: ProductMobile;
  onEdit: (product: ProductMobile) => void;
  onDelete: (product: ProductMobile) => void;
}

// Cores com gradientes por categoria
const categoryColors: Record<string, { 
  gradient: string; 
  iconBg: string; 
  iconColor: string; 
  badge: string;
  border: string;
}> = {
  Alimentos: { 
    gradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/10',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300',
    border: 'border-emerald-200/60 dark:border-emerald-800/40'
  },
  Bebidas: { 
    gradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/10',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
    border: 'border-blue-200/60 dark:border-blue-800/40'
  },
  Limpeza: { 
    gradient: 'from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/10',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300',
    border: 'border-purple-200/60 dark:border-purple-800/40'
  },
  Higiene: { 
    gradient: 'from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/10',
    iconBg: 'bg-pink-100 dark:bg-pink-900/40',
    iconColor: 'text-pink-600 dark:text-pink-400',
    badge: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300',
    border: 'border-pink-200/60 dark:border-pink-800/40'
  },
  Escritório: { 
    gradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/10',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300',
    border: 'border-indigo-200/60 dark:border-indigo-800/40'
  },
  default: { 
    gradient: 'from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/10',
    iconBg: 'bg-gray-100 dark:bg-gray-900/40',
    iconColor: 'text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300',
    border: 'border-gray-200/60 dark:border-gray-800/40'
  },
};

/**
 * Card de produto mobile otimizado v3
 * - Design moderno com gradientes
 * - Layout em grid otimizado
 * - Badges e ícones coloridos
 * - Hover effects suaves
 * - Lazy loading de imagens
 * - GPU acceleration
 * - Memoizado para performance
 */
export const ProductMobileCard = memo<ProductMobileCardProps>(
  function ProductMobileCard({ product, onEdit, onDelete }) {
    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(product);
    };
    
    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(product);
    };

    const categoryColor = categoryColors[product.category || ''] || categoryColors.default;

    return (
      <div
        className={cn(
          "group relative overflow-hidden border backdrop-blur-sm",
          "bg-gradient-to-br",
          categoryColor.gradient,
          categoryColor.border,
          "rounded-2xl shadow-sm hover:shadow-lg",
          "hover:scale-[1.02] active:scale-[0.98]",
          "transition-all duration-200 ease-out",
          "touch-manipulation"
        )}
        style={{
          contain: 'layout style paint',
          transform: 'translateZ(0)',
        }}
      >
        {/* Brilho sutil no topo */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
        
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            {/* Ícone/Imagem do produto */}
            <div className={cn(
              "flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden",
              categoryColor.iconBg,
              "group-hover:scale-110 transition-transform duration-200"
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
                <Package className={cn("h-7 w-7", categoryColor.iconColor)} />
              )}
            </div>

            {/* Informações principais */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              {product.category && (
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border",
                  categoryColor.badge
                )}>
                  <Tag className="h-3 w-3" />
                  {product.category}
                </span>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex-shrink-0 flex gap-1">
              <button
                onClick={handleEdit}
                className="p-2 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all duration-200 active:scale-95 backdrop-blur-sm"
                aria-label="Editar produto"
              >
                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all duration-200 active:scale-95 backdrop-blur-sm"
                aria-label="Excluir produto"
              >
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>

          {/* Detalhes em grid */}
          {(product.unit || product.barcode) && (
            <div className="grid grid-cols-2 gap-2">
              {product.unit && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/40 rounded-lg border border-gray-200/40 dark:border-gray-700/30">
                  <Package className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Unidade</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{product.unit}</p>
                  </div>
                </div>
              )}
              {product.barcode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/40 rounded-lg border border-gray-200/40 dark:border-gray-700/30">
                  <Barcode className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Código</p>
                    <p className="text-xs font-mono font-semibold text-gray-900 dark:text-white truncate">{product.barcode}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

