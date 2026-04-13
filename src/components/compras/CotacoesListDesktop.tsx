import { memo } from 'react';
import { ClipboardList, Package, CircleDot, DollarSign, Building2, Info, Calendar, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusSelect, QUOTE_STATUS_OPTIONS } from "@/components/ui/status-select";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Quote } from "@/hooks/useCotacoes";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { StatusBadge } from '@/components/ui/status-badge';

interface CotacoesListDesktopProps {
  cotacoes: Quote[];
  startIndex: number;
  onUpdateStatus: (quoteId: string, status: string) => void;
  onView: (quote: Quote) => void;
  onManage: (quote: Quote) => void;
  onDelete: (quote: Quote) => void;
  isUpdating: boolean;
}

export const CotacoesListDesktop = memo(({
  cotacoes,
  startIndex,
  onUpdateStatus,
  onView,
  onManage,
  onDelete,
  isUpdating
}: CotacoesListDesktopProps) => {
  return (
    <div className="hidden md:block overflow-x-auto w-full custom-scrollbar">
      <Table className={ds.components.table.root}>
        <TableHeader className={ds.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={7} className="px-1 pb-0 pt-0 border-none">
              <div className={cn(ds.components.table.headerWrapper, ds.components.table.accents.brand.bg, ds.components.table.accents.brand.border)}>
                <div className="w-[15%] flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", ds.components.table.accents.brand.bg)}>
                    <ClipboardList className={cn("h-4 w-4", ds.components.table.accents.brand.icon)} />
                  </div>
                  <span className={cn(ds.components.table.headerLabel, ds.components.table.accents.brand.text)}>Cotação</span>
                </div>
                <div className="w-[18%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Produto</span>
                </div>
                <div className="w-[12%] pl-2 flex justify-center items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Status</span>
                </div>
                <div className="w-[14%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Melhor Preço</span>
                </div>
                <div className="w-[12%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Fornec.</span>
                </div>
                <div className="w-[8%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Itens</span>
                </div>
                <div className="w-[11%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Prazo</span>
                </div>
                <div className="w-[10%] flex justify-end items-center px-2">
                  <span className={ds.components.table.headerLabel}>Ações</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cotacoes.map((cotacao, index) => {
            const cotacaoNumero = startIndex + index + 1;
            return (
              <TableRow key={cotacao.id} className="group border-none hover:bg-transparent">
                <TableCell colSpan={7} className={ds.components.table.cell}>
                  <div className={cn(
                    ds.components.table.row,
                    ds.components.table.rowWrapper
                  )}>
                    {/* Cotação # */}
                    <div className="w-[15%] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-border/40">
                        <ClipboardList className="h-4 w-4 text-brand" />
                      </div>
                      <span className={ds.components.dataDisplay.code}>
                        #{cotacaoNumero.toString().padStart(4, '0')}
                      </span>
                    </div>

                    {/* Resumo do Produto */}
                    <div className="w-[18%] pl-2 min-w-0">
                      <CapitalizedText className={cn(ds.components.dataDisplay.highlight, "truncate block")}>
                        {cotacao.produtoResumo || cotacao.produto}
                      </CapitalizedText>
                    </div>

                    {/* Status Select */}
                    <div className="w-[12%] pl-2 flex justify-center">
                      <StatusSelect
                        value={cotacao.status}
                        options={QUOTE_STATUS_OPTIONS}
                        onChange={(newStatus) => onUpdateStatus(cotacao.id, newStatus)}
                        isLoading={isUpdating}
                        disabled={cotacao.status === 'finalizada'}
                      />
                    </div>

                    {/* Melhor Preço */}
                    <div className="w-[14%] pl-2 min-w-0">
                      <div className="flex flex-col">
                        <span className={ds.components.dataDisplay.money}>{cotacao.melhorPreco || 'R$ 0,00'}</span>
                        <p className={cn("truncate opacity-70", ds.components.dataDisplay.secondary)}>{cotacao.melhorFornecedor || '-'}</p>
                      </div>
                    </div>

                    {/* Contagem de Fornecedores */}
                    <div className="w-[12%] pl-2">
                      <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border w-fit", ds.components.dataDisplay.badge.quotes.root)}>
                        <Building2 className={ds.components.dataDisplay.badge.quotes.icon} />
                        <span className={ds.components.dataDisplay.badge.quotes.text}>{cotacao.fornecedores}</span>
                      </div>
                    </div>

                    {/* Itens Tooltip */}
                    <div className="w-[8%] pl-2 flex items-center gap-1.5">
                      <span className={ds.components.dataDisplay.highlight}>{cotacao.produtosLista?.length || 0}</span>
                      {cotacao.produtosLista && cotacao.produtosLista.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-zinc-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className={ds.components.tooltip.content}>
                              <p className="font-bold mb-1">Produtos cotados:</p>
                              <ul className="space-y-0.5">
                                {cotacao.produtosLista.map((produto, idx) => (
                                  <li key={idx}>• {produto}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    {/* Data de Prazo */}
                    <div className="w-[11%] pl-2">
                      <div className={cn("flex items-center gap-1.5", ds.components.dataDisplay.secondary)}>
                        <Calendar className="h-3 w-3 opacity-50" />
                        {cotacao.dataFim || '-'}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="w-[10%] flex justify-end items-center px-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn(ds.components.button.size.icon, ds.components.button.ghost)}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 overflow-hidden rounded-xl">
                          {(cotacao.status === "concluida" || cotacao.status === "finalizada") ? (
                            <DropdownMenuItem onClick={() => onView(cotacao)} className="gap-2">
                              <Eye className="h-4 w-4 text-blue-500" />
                              Resumo da Decisão
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => onManage(cotacao)} className="gap-2">
                                <ClipboardList className="h-4 w-4 text-emerald-500" />
                                Negociar Cotação
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDelete(cotacao)} className="gap-2 text-red-500 focus:text-red-500">
                                <Trash2 className="h-4 w-4" />
                                Excluir Cotação
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});
