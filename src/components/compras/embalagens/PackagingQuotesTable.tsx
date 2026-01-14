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
            <div className="flex items-center bg-card/95 border border-purple-200/60 dark:border-purple-900/40 rounded-lg shadow-sm px-4 py-3">
              <div className="w-[12%] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <Package className="h-4 w-4" />
                </div>
                <span className="uppercase text-[11px] font-semibold text-purple-900 dark:text-purple-100">Cotação</span>
              </div>
              <div className="w-[22%] pl-2 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-purple-600/70" />
                <span className="uppercase text-[11px] font-semibold text-purple-900 dark:text-purple-100">Embalagens</span>
              </div>
              <div className="w-[14%] pl-2 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-purple-600/70" />
                <span className="uppercase text-[11px] font-semibold text-purple-900 dark:text-purple-100">Período</span>
              </div>
              <div className="w-[12%] pl-2 flex justify-center items-center gap-1.5">
                <CircleDot className="h-3.5 w-3.5 text-purple-600/70" />
                <span className="uppercase text-[11px] font-semibold text-purple-900 dark:text-purple-100">Status</span>
              </div>
              <div className="w-[16%] pl-2 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-purple-600/70" />
                <span className="uppercase text-[11px] font-semibold text-purple-900 dark:text-purple-100">Melhor Preço</span>
              </div>
              <div className="w-[12%] pl-2 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-purple-600/70" />
                <span className="uppercase text-[11px] font-semibold text-purple-900 dark:text-purple-100">Fornecedores</span>
              </div>
              <div className="w-[12%] pl-2 flex justify-end items-center gap-1.5">
                <MoreVertical className="h-3.5 w-3.5 text-purple-600/70" />
                <span className="uppercase text-[11px] font-semibold text-purple-900 dark:text-purple-100">Ações</span>
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
              <TableCell colSpan={7} className="px-1 py-2">
                <div className={cn(
                  "flex items-center px-3 py-2.5 bg-card/90 rounded-lg border transition-colors",
                  isPronta 
                    ? "border-emerald-300/50 hover:border-emerald-400/70 dark:border-emerald-700/50" 
                    : "border-border hover:border-purple-300/50"
                )}>
                  {/* Cotação */}
                  <div className="w-[12%] flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border",
                      isPronta 
                        ? "bg-emerald-500/10 border-emerald-200/50" 
                        : "bg-purple-500/10 border-purple-200/50"
                    )}>
                      {isPronta ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Package className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-sm">#{numero.toString().padStart(4, '0')}</span>
                      <p className="text-xs text-muted-foreground">{quote.itens.length} item(ns)</p>
                    </div>
                  </div>

                  {/* Embalagens */}
                  <div className="w-[22%] pl-2">
                    <CapitalizedText className="font-medium text-sm truncate block max-w-[180px]">
                      {quote.itens.slice(0, 2).map(i => i.packagingName).join(', ') || 'Sem itens'}
                    </CapitalizedText>
                    {quote.itens.length > 2 && (
                      <p className="text-xs text-muted-foreground">+{quote.itens.length - 2} mais</p>
                    )}
                  </div>
                  
                  {/* Período */}
                  <div className="w-[14%] pl-2 text-sm text-muted-foreground">
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
                      quote.melhorPreco !== '-' ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {quote.melhorPreco}
                    </span>
                    {quote.melhorFornecedor !== '-' && (
                      <CapitalizedText as="p" className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {quote.melhorFornecedor}
                      </CapitalizedText>
                    )}
                  </div>
                  
                  {/* Fornecedores */}
                  <div className="w-[12%] pl-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        respondidos === total && total > 0
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300"
                      )}
                    >
                      <Building2 className="h-3 w-3 mr-1" />
                      {respondidos}/{total}
                    </Badge>
                  </div>
                  
                  {/* Ações */}
                  <div className="w-[12%] pl-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onManage(quote)}>
                          <Eye className="h-4 w-4 mr-2" />Gerenciar
                        </DropdownMenuItem>
                        {isPronta && (
                          <DropdownMenuItem onClick={() => onConvertToOrder(quote)} className="text-emerald-600">
                            <ShoppingCart className="h-4 w-4 mr-2" />Converter em Pedido
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(quote)} className="text-red-600">
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
