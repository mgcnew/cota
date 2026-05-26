import { memo } from 'react';
import { Info, Calendar, MoreVertical, Eye, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, ClipboardList } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { StatusSelect, QUOTE_STATUS_OPTIONS } from "@/components/ui/status-select";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Quote } from "@/hooks/useCotacoes";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { useTableSort, SortKey } from '@/hooks/useTableSort';

interface CotacoesListDesktopProps {
  cotacoes: Quote[];
  startIndex: number;
  onUpdateStatus: (quoteId: string, status: string) => void;
  onView: (quote: Quote) => void;
  onManage: (quote: Quote) => void;
  onDelete: (quote: Quote) => void;
  isUpdating: boolean;
}

type PrazoUrgency = 'expired' | 'urgent' | 'normal' | null;

const getPrazoUrgency = (dataFim: string): PrazoUrgency => {
  if (!dataFim || dataFim === '-') return null;
  const parts = dataFim.split(/[\/\-]/).map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [df, mf, yf] = parts;
  const prazo = new Date(yf, mf - 1, df);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em48h = new Date(hoje.getTime() + 48 * 60 * 60 * 1000);
  if (prazo < hoje) return 'expired';
  if (prazo <= em48h) return 'urgent';
  return 'normal';
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
  const { sortKey, sortDir, handleSort, sortedCotacoes } = useTableSort(cotacoes);

  const SortHeader = ({ label, sortId, className }: { label: string; sortId: SortKey; className?: string }) => {
    const isActive = sortKey === sortId;
    return (
      <TableHead
        className={cn("cursor-pointer select-none group/th", isActive && "text-foreground font-semibold", className)}
        onClick={() => handleSort(sortId)}
      >
        <div className="flex items-center gap-1.5">
          {label}
          <div className="w-3 h-3 text-muted-foreground/30 transition-colors">
            {isActive ? (
              sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-brand" /> : <ChevronDown className="w-3 h-3 text-brand" />
            ) : (
              <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </TableHead>
    );
  };

  return (
    <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Cotação" sortId="id" className="w-[15%]" />
              <SortHeader label="Produto" sortId="produto" className="w-[18%]" />
              <SortHeader label="Status" sortId="status" className="w-[12%]" />
              <SortHeader label="Melhor Preço" sortId="melhorPreco" className="w-[14%]" />
              <SortHeader label="Fornec." sortId="fornecedores" className="w-[10%]" />
              <SortHeader label="Itens" sortId="itens" className="w-[8%]" />
              <SortHeader label="Prazo" sortId="prazo" className="w-[11%]" />
              <TableHead className="text-right w-[12%]">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedCotacoes.map((cotacao) => {
              const originalIndex = cotacoes.findIndex(c => c.id === cotacao.id);
              const cotacaoNumero = startIndex + originalIndex + 1;

              return (
                <TableRow key={cotacao.id} className="group">
                  {/* Cotação # */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-brand/10 dark:bg-brand/10 flex items-center justify-center flex-shrink-0 border border-brand/20">
                        <span className="font-bold text-[11px] text-brand tabular-nums leading-none">
                          {cotacaoNumero.toString().padStart(4, '0')}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Resumo do Produto */}
                  <TableCell>
                    <span className="truncate block max-w-[180px]" title={cotacao.produtoResumo || cotacao.produto}>
                      <CapitalizedText className="font-medium text-foreground">
                        {cotacao.produtoResumo || cotacao.produto}
                      </CapitalizedText>
                    </span>
                  </TableCell>

                  {/* Status Select */}
                  <TableCell>
                    <div className="w-full max-w-[130px]">
                      <StatusSelect
                        value={cotacao.status}
                        options={QUOTE_STATUS_OPTIONS}
                        onChange={(newStatus) => onUpdateStatus(cotacao.id, newStatus)}
                        isLoading={isUpdating}
                        disabled={cotacao.status === 'finalizada'}
                      />
                    </div>
                  </TableCell>

                  {/* Melhor Preço */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 tracking-tight">
                        {cotacao.melhorPreco || 'R$ 0,00'}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[120px]" title={cotacao.melhorFornecedor || '-'}>
                        {cotacao.melhorFornecedor || '-'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Contagem de Fornecedores */}
                  <TableCell>
                    {(cotacao.fornecedores || 0) === 0 ? (
                      <span className="text-[12px] text-muted-foreground/40">—</span>
                    ) : (cotacao.fornecedores || 0) >= 3 ? (
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-[12px] tabular-nums font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
                        {cotacao.fornecedores}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-[12px] tabular-nums font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50">
                        {cotacao.fornecedores}
                      </span>
                    )}
                  </TableCell>

                  {/* Itens */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">{cotacao.produtosLista?.length || 0}</span>
                      {cotacao.produtosLista && cotacao.produtosLista.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[250px]">
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
                  </TableCell>

                  {/* Prazo */}
                  <TableCell>
                    {(() => {
                      const urgency = getPrazoUrgency(cotacao.dataFim);
                      if (!cotacao.dataFim || cotacao.dataFim === '-') {
                        return <span className="text-[12px] text-muted-foreground/40">—</span>;
                      }
                      if (urgency === 'expired') {
                        return (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium whitespace-nowrap text-red-500 dark:text-red-400">
                            <Calendar className="h-3 w-3" />
                            {cotacao.dataFim}
                          </span>
                        );
                      }
                      if (urgency === 'urgent') {
                        return (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium whitespace-nowrap text-amber-500 dark:text-amber-400">
                            <Calendar className="h-3 w-3" />
                            {cotacao.dataFim}
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground whitespace-nowrap">
                          <Calendar className="h-3 w-3 opacity-50" />
                          {cotacao.dataFim}
                        </span>
                      );
                    })()}
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-accent data-[state=open]:bg-accent transition-colors">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 overflow-hidden rounded-xl">
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(cotacao)} className="gap-2 py-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                              <Trash2 className="h-4 w-4" />
                              Excluir Cotação
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
    </Table>
  );
});
