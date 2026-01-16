import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Package, Calendar, DollarSign, Building2, MoreVertical, Eye, Trash2, ShoppingCart, CheckCircle2, CircleDot, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import type { PackagingQuoteDisplay } from "@/types/packaging";

interface PackagingQuotesTableProps {
  quotes: PackagingQuoteDisplay[];
  startIndex: number;
  onManage: (quote: PackagingQuoteDisplay) => void;
  onDelete: (quote: PackagingQuoteDisplay) => void;
  onConvertToOrder: (quote: PackagingQuoteDisplay) => void;
}

export function PackagingQuotesTable({ 
  quotes, 
  startIndex,
  onManage, 
  onDelete, 
  onConvertToOrder 
}: PackagingQuotesTableProps) {
  
  const getQuoteStatus = (quote: PackagingQuoteDisplay) => {
    const respondidos = quote.fornecedores.filter(f => f.status === "respondido").length;
    const total = quote.fornecedores.length;
    const isPronta = quote.status === "ativa" && respondidos === total && total > 0;
    return { respondidos, total, isPronta };
  };

  const getStatusBadge = (quote: PackagingQuoteDisplay) => {
    const { isPronta } = getQuoteStatus(quote);
    
    if (isPronta) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Pronta
        </Badge>
      );
    }
    
    if (quote.status === "concluida") {
      return <Badge variant="secondary">Concluída</Badge>;
    }
    
    if (quote.status === "cancelada") {
      return <Badge variant="destructive">Cancelada</Badge>;
    }
    
    return <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300">Ativa</Badge>;
  };

  return (
    <Table>
      <thead>
        <tr>
          <td colSpan={7} className="px-1 pb-3 pt-0 border-none">
            <div className="flex items-center bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-sm px-4 py-4">
              <div className="w-[12%] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Cotação</span>
              </div>
              <div className="w-[22%] pl-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Embalagens</span>
              </div>
              <div className="w-[14%] pl-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Período</span>
              </div>
              <div className="w-[12%] pl-2 flex justify-center items-center gap-2">
                <CircleDot className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Status</span>
              </div>
              <div className="w-[16%] pl-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Melhor Preço</span>
              </div>
              <div className="w-[12%] pl-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Fornec.</span>
              </div>
              <div className="w-[12%] pl-2 flex justify-end items-center">
                <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Ações</span>
              </div>
            </div>
          </td>
        </tr>
      </thead>
      <TableBody>
        {quotes.map((quote, index) => {
          const { respondidos, total, isPronta } = getQuoteStatus(quote);
          const numero = startIndex + index + 1;
          
          return (
            <TableRow key={quote.id} className="group border-none">
              <TableCell colSpan={7} className="px-1 py-1.5">
                <div className={cn(
                  "flex items-center px-4 py-3 bg-white dark:bg-gray-800/50 rounded-xl border transition-colors duration-150",
                  isPronta 
                    ? "border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20" 
                    : "border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800/70"
                )}>
                  {/* Cotação */}
                  <div className="w-[12%] flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center border",
                      isPronta 
                        ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700" 
                        : "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600/30"
                    )}>
                      {isPronta ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">#{numero.toString().padStart(4, '0')}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{quote.itens.length} item(ns)</p>
                    </div>
                  </div>

                  {/* Embalagens */}
                  <div className="w-[22%] pl-2">
                    <CapitalizedText className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate block max-w-[180px]">
                      {quote.itens.slice(0, 2).map(i => i.packagingName).join(', ') || 'Sem itens'}
                    </CapitalizedText>
                    {quote.itens.length > 2 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">+{quote.itens.length - 2} mais</p>
                    )}
                  </div>
                  
                  {/* Período */}
                  <div className="w-[14%] pl-2 text-sm text-gray-500 dark:text-gray-400">
                    <div>{quote.dataInicio}</div>
                    <div>{quote.dataFim}</div>
                  </div>
                  
                  {/* Status */}
                  <div className="w-[12%] pl-2 flex justify-center">
                    {getStatusBadge(quote)}
                  </div>
                  
                  {/* Melhor Preço */}
                  <div className="w-[16%] pl-2">
                    <span className={cn(
                      "font-bold",
                      quote.melhorPreco !== '-' ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"
                    )}>
                      {quote.melhorPreco}
                    </span>
                    {quote.melhorFornecedor !== '-' && (
                      <CapitalizedText as="p" className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                        {quote.melhorFornecedor}
                      </CapitalizedText>
                    )}
                  </div>
                  
                  {/* Fornecedores */}
                  <div className="w-[12%] pl-2">
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full w-fit",
                      respondidos === total && total > 0
                        ? "bg-emerald-50 dark:bg-emerald-900/20"
                        : "bg-blue-50 dark:bg-blue-900/20"
                    )}>
                      <Building2 className={cn(
                        "h-3 w-3",
                        respondidos === total && total > 0
                          ? "text-emerald-500 dark:text-emerald-400"
                          : "text-blue-500 dark:text-blue-400"
                      )} />
                      <span className={cn(
                        "font-semibold text-xs",
                        respondidos === total && total > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-600 dark:text-blue-400"
                      )}>
                        {respondidos}/{total}
                      </span>
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="w-[12%] pl-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/70 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <DropdownMenuItem onClick={() => onManage(quote)} className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70">
                          <Eye className="h-4 w-4 mr-2" />Gerenciar
                        </DropdownMenuItem>
                        {isPronta && (
                          <DropdownMenuItem onClick={() => onConvertToOrder(quote)} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                            <ShoppingCart className="h-4 w-4 mr-2" />Converter em Pedido
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                        <DropdownMenuItem onClick={() => onDelete(quote)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                          <Trash2 className="h-4 w-4 mr-2" />Excluir
                        </DropdownMenuItem>
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
  );
}
