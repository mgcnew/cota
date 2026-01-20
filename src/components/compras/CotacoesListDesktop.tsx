import { memo } from 'react';
import { ClipboardList, Package, CircleDot, DollarSign, Building2, Info, Calendar, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusSelect, QUOTE_STATUS_OPTIONS } from "@/components/ui/status-select";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Quote } from "@/hooks/useCotacoes";

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
    <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={7} className="px-1 pb-3 pt-0 border-none">
              <div className="flex items-center bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-sm px-4 py-4">
                <div className="w-[15%] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Cotação</span>
                </div>
                <div className="w-[18%] pl-2 flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Produto</span>
                </div>
                <div className="w-[10%] pl-2 flex justify-center items-center gap-2">
                  <CircleDot className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Status</span>
                </div>
                <div className="w-[14%] pl-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Melhor Preço</span>
                </div>
                <div className="w-[12%] pl-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Fornec.</span>
                </div>
                <div className="w-[8%] pl-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Itens</span>
                </div>
                <div className="w-[10%] pl-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Prazo</span>
                </div>
                <div className="w-[8%] pl-2 flex justify-end items-center">
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Ações</span>
                </div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cotacoes.map((cotacao, index) => {
            const cotacaoNumero = startIndex + index + 1;
            return (
              <TableRow key={cotacao.id} className="group border-none">
                <TableCell colSpan={7} className="px-1 py-1.5">
                  <div className="flex items-center px-4 py-3 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800/70">
                    <div className="w-[15%] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center border border-gray-200 dark:border-gray-600/30">
                        <ClipboardList className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </div>
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">#{cotacaoNumero.toString().padStart(4, '0')}</span>
                    </div>
                    <div className="w-[18%] pl-2">
                      <CapitalizedText className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate block max-w-[150px]">
                        {cotacao.produtoResumo || cotacao.produto}
                      </CapitalizedText>
                    </div>
                    <div className="w-[10%] pl-2 flex justify-center">
                      <StatusSelect
                        value={cotacao.status}
                        options={QUOTE_STATUS_OPTIONS}
                        onChange={(newStatus) => onUpdateStatus(cotacao.id, newStatus)}
                        isLoading={isUpdating}
                      />
                    </div>
                    <div className="w-[14%] pl-2">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{cotacao.melhorPreco || 'R$ 0,00'}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{cotacao.melhorFornecedor || '-'}</p>
                    </div>
                    <div className="w-[12%] pl-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full w-fit">
                        <Building2 className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                        <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs">{cotacao.fornecedores}</span>
                      </div>
                    </div>
                    <div className="w-[8%] pl-2 flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cotacao.produtosLista?.length || 0}</span>
                      {cotacao.produtosLista && cotacao.produtosLista.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[250px]">
                              <p className="font-semibold text-xs mb-1">Produtos cotados:</p>
                              <ul className="text-xs space-y-0.5">
                                {cotacao.produtosLista.map((produto, idx) => (
                                  <li key={idx}>• {produto}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="w-[10%] pl-2 text-sm text-gray-500 dark:text-gray-400">
                      {cotacao.dataFim || '-'}
                    </div>
                    <div className="w-[8%] pl-2 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/70 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                          {(cotacao.status === "concluida" || cotacao.status === "finalizada") ? (
                            <DropdownMenuItem onClick={() => onView(cotacao)} className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                              <Eye className="h-4 w-4 mr-2" />Resumo
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => onManage(cotacao)} className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70">
                                <ClipboardList className="h-4 w-4 mr-2" />Gerenciar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                              <DropdownMenuItem onClick={() => onDelete(cotacao)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                                <Trash2 className="h-4 w-4 mr-2" />Excluir
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
