import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Package, Building2, Calendar, DollarSign } from 'lucide-react';
import type { Quote } from '@/hooks/useCotacoes';

interface CotacoesCardMemoizedProps {
  cotacao: Quote;
  onView: (cotacao: Quote) => void;
  onEdit: (cotacao: Quote) => void;
  onDelete: (cotacao: Quote) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

/**
 * Card de cotação memoizado
 * - React.memo com comparador customizado
 * - Evita re-renders desnecessários
 * - Otimizado para mobile
 */
export const CotacoesCardMemoized = memo<CotacoesCardMemoizedProps>(
  function CotacoesCardMemoized({ cotacao, onView, onEdit, onDelete, getStatusBadge }) {
    return (
      <Card 
        className="hover:shadow-md transition-shadow duration-200 border-gray-200 dark:border-gray-800"
        style={{ contain: 'layout style paint' }}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header com status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {cotacao.produtoResumo}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {cotacao.quantidade}
              </p>
            </div>
            {getStatusBadge(cotacao.statusReal)}
          </div>

          {/* Informações principais */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{cotacao.dataInicio}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{cotacao.fornecedores} forn.</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate font-medium text-green-600 dark:text-green-400">
                {cotacao.melhorPreco}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Package className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{cotacao.economia}</span>
            </div>
          </div>

          {/* Melhor fornecedor */}
          {cotacao.melhorFornecedor !== 'Aguardando' && (
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="font-medium">Melhor: </span>
              {cotacao.melhorFornecedor}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(cotacao)}
              className="flex-1 h-8 text-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Ver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(cotacao)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(cotacao)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
  // Comparador customizado - só re-renderiza se dados relevantes mudarem
  (prevProps, nextProps) => {
    return (
      prevProps.cotacao.id === nextProps.cotacao.id &&
      prevProps.cotacao.statusReal === nextProps.cotacao.statusReal &&
      prevProps.cotacao.melhorPreco === nextProps.cotacao.melhorPreco &&
      prevProps.cotacao.fornecedores === nextProps.cotacao.fornecedores &&
      prevProps.cotacao.economia === nextProps.cotacao.economia
    );
  }
);
