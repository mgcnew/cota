import { memo } from 'react';
import { Package, Search, Plus } from 'lucide-react';

interface ProductsEmptyStateProps {
  type: 'no-products' | 'no-results';
  searchQuery?: string;
  onAddProduct?: () => void;
}

/**
 * Empty State para lista de produtos
 * - Estado vazio inicial (sem produtos)
 * - Busca sem resultados
 * - CTAs claros e visuais
 */
export const ProductsEmptyState = memo<ProductsEmptyStateProps>(
  function ProductsEmptyState({ type, searchQuery, onAddProduct }) {
    if (type === 'no-results') {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Search className="h-10 w-10 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mb-6">
            Não encontramos produtos que correspondam a{' '}
            <span className="font-medium text-gray-900 dark:text-white">"{searchQuery}"</span>
          </p>
          <div className="flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400">
            <p>• Verifique a ortografia</p>
            <p>• Tente palavras-chave diferentes</p>
            <p>• Use termos mais gerais</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-24 h-24 bg-orange-50 dark:bg-orange-950/30 rounded-full flex items-center justify-center mb-4 border-2 border-orange-200 dark:border-orange-800">
          <Package className="h-12 w-12 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum produto cadastrado
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mb-6">
          Comece adicionando seus primeiros produtos para gerenciar seu estoque e criar cotações.
        </p>
        {onAddProduct && (
          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white rounded-lg font-medium transition-colors active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Adicionar Produto
          </button>
        )}
        <div className="mt-8 flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Dica:</p>
          <p>• Cadastre produtos com nome e categoria</p>
          <p>• Adicione código de barras para busca rápida</p>
          <p>• Organize por unidades de medida</p>
        </div>
      </div>
    );
  }
);
