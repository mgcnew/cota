import { memo, useState, useCallback } from 'react';
import { ClipboardList, Building2, Info, Calendar, MoreVertical, Eye, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { StatusSelect, QUOTE_STATUS_OPTIONS } from "@/components/ui/status-select";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Quote } from "@/hooks/useCotacoes";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";

interface CotacoesListDesktopProps {
  cotacoes: Quote[];
  startIndex: number;
  onUpdateStatus: (quoteId: string, status: string) => void;
  onView: (quote: Quote) => void;
  onManage: (quote: Quote) => void;
  onDelete: (quote: Quote) => void;
  isUpdating: boolean;
}

type SortKey = 'id' | 'produto' | 'status' | 'melhorPreco' | 'fornecedores' | 'itens' | 'prazo';
type SortDir = 'asc' | 'desc';

const extractPrice = (priceStr: string): number => {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

export const CotacoesListDesktop = memo(({
  cotacoes,
  startIndex,
  onUpdateStatus,
  onView,
  onManage,
  onDelete,
  isUpdating
}: CotacoesListDesktopProps) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const sortedCotacoes = (() => {
    if (!sortKey) return cotacoes;
    return [...cotacoes].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'id':
          cmp = (a.id || '').localeCompare(b.id || '', 'pt-BR');
          break;
        case 'produto':
          cmp = (a.produtoResumo || a.produto || '').localeCompare(b.produtoResumo || b.produto || '', 'pt-BR');
          break;
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '', 'pt-BR');
          break;
        case 'melhorPreco':
          cmp = extractPrice(a.melhorPreco || '') - extractPrice(b.melhorPreco || '');
          break;
        case 'fornecedores':
          cmp = (a.fornecedores || 0) - (b.fornecedores || 0);
          break;
        case 'itens':
          cmp = (a.produtosLista?.length || 0) - (b.produtosLista?.length || 0);
          break;
        case 'prazo':
          // Assume format dd/mm/yyyy
          const parseDate = (dStr: string) => {
            if (!dStr) return 0;
            const parts = dStr.split('/');
            if (parts.length === 3) {
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
            }
            return 0;
          };
          cmp = parseDate(a.dataFim || '') - parseDate(b.dataFim || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  })();

  const SortHeader = ({ label, sortId, className }: { label: string; sortId: SortKey; className?: string }) => {
    const isActive = sortKey === sortId;
    return (
      <th
        className={cn(
          "h-11 px-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer select-none transition-colors group/th",
          "hover:text-zinc-800 dark:hover:text-zinc-200",
          isActive && "text-zinc-900 dark:text-zinc-100 font-semibold",
          className
        )}
        onClick={() => handleSort(sortId)}
      >
        <div className="flex items-center gap-1.5">
          {label}
          <div className="flex flex-col items-center justify-center w-3 h-3 text-zinc-300 dark:text-zinc-600 transition-colors">
            {isActive ? (
              sortDir === 'asc' ? (
                <ChevronUp className="w-3 h-3 text-brand" />
              ) : (
                <ChevronDown className="w-3 h-3 text-brand" />
              )
            ) : (
              <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </th>
    );
  };

  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/20">
            <SortHeader label="Cotação" sortId="id" className="w-[15%]" />
            <SortHeader label="Produto" sortId="produto" className="w-[18%]" />
            <SortHeader label="Status" sortId="status" className="w-[12%]" />
            <SortHeader label="Melhor Preço" sortId="melhorPreco" className="w-[14%]" />
            <SortHeader label="Fornec." sortId="fornecedores" className="w-[10%]" />
            <SortHeader label="Itens" sortId="itens" className="w-[8%]" />
            <SortHeader label="Prazo" sortId="prazo" className="w-[11%]" />
            <th className="h-11 px-4 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 w-[12%]">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {sortedCotacoes.map((cotacao, index) => {
            const originalIndex = cotacoes.findIndex(c => c.id === cotacao.id);
            const cotacaoNumero = startIndex + originalIndex + 1;
            
            return (
              <tr 
                key={cotacao.id} 
                className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                {/* Cotação # */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700/50 flex-shrink-0 group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors">
                      <ClipboardList className="h-4 w-4 text-brand" />
                    </div>
                    <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      #{cotacaoNumero.toString().padStart(4, '0')}
                    </span>
                  </div>
                </td>

                {/* Resumo do Produto */}
                <td className="px-4 py-3 align-middle">
                  <span className="truncate block max-w-[180px]" title={cotacao.produtoResumo || cotacao.produto}>
                    <CapitalizedText className="font-medium text-zinc-900 dark:text-zinc-100">
                      {cotacao.produtoResumo || cotacao.produto}
                    </CapitalizedText>
                  </span>
                </td>

                {/* Status Select */}
                <td className="px-4 py-3 align-middle">
                  <div className="w-full max-w-[130px]">
                    <StatusSelect
                      value={cotacao.status}
                      options={QUOTE_STATUS_OPTIONS}
                      onChange={(newStatus) => onUpdateStatus(cotacao.id, newStatus)}
                      isLoading={isUpdating}
                      disabled={cotacao.status === 'finalizada'}
                    />
                  </div>
                </td>

                {/* Melhor Preço */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex flex-col">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {cotacao.melhorPreco || 'R$ 0,00'}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]" title={cotacao.melhorFornecedor || '-'}>
                      {cotacao.melhorFornecedor || '-'}
                    </span>
                  </div>
                </td>

                {/* Contagem de Fornecedores */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 w-fit">
                    <Building2 className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {cotacao.fornecedores}
                    </span>
                  </div>
                </td>

                {/* Itens Tooltip */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {cotacao.produtosLista?.length || 0}
                    </span>
                    {cotacao.produtosLista && cotacao.produtosLista.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[250px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md">
                            <p className="font-bold mb-1 text-xs">Produtos cotados:</p>
                            <ul className="space-y-0.5 text-xs">
                              {cotacao.produtosLista.map((produto, idx) => (
                                <li key={idx} className="truncate">• {produto}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </td>

                {/* Data de Prazo */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    <Calendar className="h-3.5 w-3.5 opacity-60" />
                    {cotacao.dataFim || '-'}
                  </div>
                </td>

                {/* Ações */}
                <td className="px-4 py-3 align-middle text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 data-[state=open]:bg-zinc-200 dark:data-[state=open]:bg-zinc-700 transition-colors">
                        <MoreVertical className="h-4 w-4 text-zinc-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md">
                      {(cotacao.status === "concluida" || cotacao.status === "finalizada") ? (
                        <DropdownMenuItem onClick={() => onView(cotacao)} className="gap-2 py-2 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20">
                          <Eye className="h-4 w-4 text-blue-500" />
                          Resumo da Decisão
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => onManage(cotacao)} className="gap-2 py-2 cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-900/20">
                            <ClipboardList className="h-4 w-4 text-emerald-500" />
                            Negociar Cotação
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                          <DropdownMenuItem onClick={() => onDelete(cotacao)} className="gap-2 py-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                            <Trash2 className="h-4 w-4" />
                            Excluir Cotação
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
