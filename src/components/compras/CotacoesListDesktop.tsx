import { memo } from 'react';
import { ClipboardList, Package, CircleDot, DollarSign, Building2, Info, Calendar, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusSelect, QUOTE_STATUS_OPTIONS } from "@/components/ui/status-select";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Quote } from "@/hooks/useCotacoes";
import { designSystem } from "@/styles/design-system";
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
      <Table className={designSystem.components.table.root}>
        <TableHeader className={designSystem.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={7} className="px-1 pb-3 pt-0 border-none">
              <div className={designSystem.components.table.headerContainer}>
                <div className="w-[15%] flex items-center gap-3">
                  <div className={designSystem.components.table.headerIcon}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className={designSystem.components.table.headerLabel}>Cotação</span>
                </div>
                <div className="w-[18%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Produto</span>
                </div>
                <div className="w-[12%] pl-2 flex justify-center items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Status</span>
                </div>
                <div className="w-[14%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Melhor Preço</span>
                </div>
                <div className="w-[12%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Fornec.</span>
                </div>
                <div className="w-[8%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Itens</span>
                </div>
                <div className="w-[11%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Prazo</span>
                </div>
                <div className="w-[10%] flex justify-end items-center px-2">
                  <span className={designSystem.components.table.headerLabel}>Ações</span>
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
                <TableCell colSpan={7} className={designSystem.components.table.cell}>
                  <div className={cn(
                    "flex items-center px-4 py-3 mb-1",
                    designSystem.components.table.row
                  )}>
                    <div className="w-[15%] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-border/40">
                        <ClipboardList className="h-4 w-4 text-brand" />
                      </div>
                      <span className={cn("font-bold text-sm", designSystem.colors.text.primary)}>
                        #{cotacaoNumero.toString().padStart(4, '0')}
                      </span>
                    </div>
                    <div className="w-[18%] pl-2 min-w-0">
                      <CapitalizedText className={cn("font-bold text-sm truncate block", designSystem.colors.text.primary)}>
                        {cotacao.produtoResumo || cotacao.produto}
                      </CapitalizedText>
                    </div>
                    <div className="w-[12%] pl-2 flex justify-center">
                      <StatusSelect
                        value={cotacao.status}
                        options={QUOTE_STATUS_OPTIONS}
                        onChange={(newStatus) => onUpdateStatus(cotacao.id, newStatus)}
                        isLoading={isUpdating}
                      />
                    </div>
                    <div className="w-[14%] pl-2 min-w-0">
                      <span className="font-bold text-emerald-500 text-sm">{cotacao.melhorPreco || 'R$ 0,00'}</span>
                      <p className={cn("text-xs truncate opacity-70", designSystem.colors.text.secondary)}>{cotacao.melhorFornecedor || '-'}</p>
                    </div>
                    <div className="w-[12%] pl-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20 w-fit">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">{cotacao.fornecedores}</span>
                      </div>
                    </div>
                    <div className="w-[8%] pl-2 flex items-center gap-1.5">
                      <span className={cn("text-sm font-bold", designSystem.colors.text.primary)}>{cotacao.produtosLista?.length || 0}</span>
                      {cotacao.produtosLista && cotacao.produtosLista.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-zinc-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className={designSystem.components.tooltip.content}>
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
                    <div className={cn("w-[11%] pl-2 text-xs font-medium", designSystem.colors.text.secondary)}>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 opacity-50" />
                        {cotacao.dataFim || '-'}
                      </div>
                    </div>
                    <div className="w-[10%] flex justify-end items-center px-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn(designSystem.components.button.size.icon, designSystem.components.button.ghost)}>
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
