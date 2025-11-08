import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Package, Building2, Calendar, DollarSign, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { CotacaoMobile } from '@/hooks/mobile/useCotacoesMobile';

interface CotacaoMobileCardProps {
  cotacao: CotacaoMobile;
  onView: (cotacao: CotacaoMobile) => void;
  onEdit: (cotacao: CotacaoMobile) => void;
  onDelete: (cotacao: CotacaoMobile) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

/**
 * Card de cotação otimizado para mobile
 * - React.memo com comparador customizado
 * - Design minimalista e compacto
 * - Ações em dropdown menu
 * - Performance otimizada para infinite scroll
 */
export const CotacaoMobileCard = memo<CotacaoMobileCardProps>(
  function CotacaoMobileCard({ cotacao, onView, onEdit, onDelete, getStatusBadge }) {
    return (
      <Card 
        className="border border-gray-200/80 dark:border-gray-700/30 bg-white dark:bg-[#1C1F26] shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-200"
        style={{ 
          contain: 'layout style paint',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        <CardContent className="p-3 space-y-2.5">
          {/* Header com título e status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate leading-tight">
                {cotacao.produtoResumo}
              </h3>
              {cotacao.produtosLista.length > 1 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  +{cotacao.produtosLista.length - 1} produto{cotacao.produtosLista.length - 1 > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStatusBadge(cotacao.statusReal)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 opacity-70 hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700">
                  <DropdownMenuItem 
                    onClick={() => onView(cotacao)}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                  >
                    <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onEdit(cotacao)}
                    className="hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                  >
                    <Edit className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(cotacao)}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Informações principais - Grid compacto */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              <span className="truncate">{cotacao.dataInicio}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              <span className="truncate">{cotacao.fornecedores} {cotacao.fornecedores === 1 ? 'fornecedor' : 'fornecedores'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 flex-shrink-0 text-green-600 dark:text-green-400" />
              <span className="truncate font-semibold text-green-600 dark:text-green-400">
                {cotacao.melhorPreco}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Package className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              <span className="truncate">{cotacao.economia}</span>
            </div>
          </div>

          {/* Melhor fornecedor */}
          {cotacao.melhorFornecedor !== 'Aguardando' && (
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-gray-800/50">
              <span className="font-medium">Melhor: </span>
              <span className="text-gray-700 dark:text-gray-300">{cotacao.melhorFornecedor}</span>
            </div>
          )}

          {/* Botão principal de ação - Ver */}
          <Button
            variant="default"
            size="sm"
            onClick={() => onView(cotacao)}
            className="w-full h-8 text-xs bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700 text-white mt-1"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Ver Detalhes
          </Button>
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
      prevProps.cotacao.economia === nextProps.cotacao.economia &&
      prevProps.cotacao.produtoResumo === nextProps.cotacao.produtoResumo
    );
  }
);

