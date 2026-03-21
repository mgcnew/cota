import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow, TableHeader } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Package, Calendar, DollarSign, Building2, MoreVertical, Eye, Trash2, ShoppingCart, CheckCircle2, CircleDot, Info, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import type { PackagingQuoteDisplay } from "@/types/packaging";
import { designSystem as ds } from "@/styles/design-system";

interface PackagingQuotesTableProps {
  quotes: PackagingQuoteDisplay[];
  startIndex: number;
  onManage: (quote: PackagingQuoteDisplay) => void;
  onViewSummary?: (quote: PackagingQuoteDisplay) => void;
  onDelete: (quote: PackagingQuoteDisplay) => void;
  onConvertToOrder: (quote: PackagingQuoteDisplay) => void;
}

export function PackagingQuotesTable({ 
  quotes, 
  startIndex,
  onManage, 
  onViewSummary,
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
        <Badge className={cn(ds.components.badge.success, "gap-1.5")}>
          <CheckCircle2 className="h-3 w-3" />
          Pronta
        </Badge>
      );
    }
    
    if (quote.status === "concluida") {
      return <Badge className={ds.components.badge.secondary}>Concluída</Badge>;
    }
    
    if (quote.status === "cancelada") {
      return <Badge className={ds.components.badge.destructive}>Cancelada</Badge>;
    }
    
    return <Badge className={ds.components.badge.outline}>Ativa</Badge>;
  };

  return (
    <Table className={ds.components.table.root}>
      <TableHeader className={ds.components.table.header}>
        <TableRow className="border-none hover:bg-transparent">
          <TableCell colSpan={7} className="px-1 pb-3 pt-0 border-none">
            <div className={ds.components.table.headerContainer}>
              <div className="w-[12%] flex items-center gap-3">
                <div className={ds.components.table.headerIcon}>
                  <Package className="h-4 w-4" />
                </div>
                <span className={ds.components.table.headerLabel}>Cotação</span>
              </div>
              <div className="w-[22%] pl-2 flex items-center gap-2">
                <span className={ds.components.table.headerLabel}>Embalagens</span>
              </div>
              <div className="w-[14%] pl-2 flex items-center gap-2">
                <span className={ds.components.table.headerLabel}>Período</span>
              </div>
              <div className="w-[12%] pl-2 flex justify-center items-center gap-2">
                <span className={ds.components.table.headerLabel}>Status</span>
              </div>
              <div className="w-[16%] pl-2 flex items-center gap-2">
                <span className={ds.components.table.headerLabel}>Melhor Preço</span>
              </div>
              <div className="w-[12%] pl-2 flex items-center gap-2">
                <span className={ds.components.table.headerLabel}>Fornec.</span>
              </div>
              <div className="w-[12%] flex justify-end items-center px-2">
                <span className={ds.components.table.headerLabel}>Ações</span>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote, index) => {
          const { respondidos, total, isPronta } = getQuoteStatus(quote);
          const numero = startIndex + index + 1;
          
          return (
            <TableRow key={quote.id} className="group border-none hover:bg-transparent">
              <TableCell colSpan={7} className={ds.components.table.cell}>
                <div className={cn(
                  "flex items-center px-4 py-3 mb-1",
                  ds.components.table.row,
                  isPronta && ds.components.table.rowActive
                )}>
                  {/* Cotação */}
                  <div className="w-[12%] flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center border transition-colors",
                      isPronta 
                        ? "bg-brand/10 border-brand/20" 
                        : "bg-muted/50 border-border/50"
                    )}>
                      {isPronta ? (
                        <CheckCircle2 className="h-4 w-4 text-brand" />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <span className={cn("font-bold text-sm", ds.colors.text.primary)}>#{numero.toString().padStart(4, '0')}</span>
                      <p className={cn("text-[11px]", ds.colors.text.muted)}>{quote.itens.length} item(ns)</p>
                    </div>
                  </div>

                  {/* Embalagens */}
                  <div className="w-[22%] pl-2">
                    <CapitalizedText className={cn("font-bold text-sm truncate block max-w-[180px]", ds.colors.text.primary)}>
                      {quote.itens.slice(0, 2).map(i => i.packagingName).join(', ') || 'Sem itens'}
                    </CapitalizedText>
                    {quote.itens.length > 2 && (
                      <p className={cn("text-[11px]", ds.colors.text.muted)}>+{quote.itens.length - 2} mais</p>
                    )}
                  </div>
                  
                  {/* Período */}
                  <div className={cn("w-[14%] pl-2 text-xs", ds.colors.text.secondary)}>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 opacity-50" />
                      {quote.dataInicio}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3 opacity-50" />
                      {quote.dataFim}
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="w-[12%] pl-2 flex justify-center">
                    {getStatusBadge(quote)}
                  </div>
                  
                  {/* Melhor Preço */}
                  <div className="w-[16%] pl-2">
                    <span className={cn(
                      "font-bold text-sm",
                      quote.melhorPreco !== '-' ? "text-brand" : ds.colors.text.muted
                    )}>
                      {quote.melhorPreco}
                    </span>
                    {quote.melhorFornecedor !== '-' && (
                      <CapitalizedText as="p" className={cn("text-[11px] truncate max-w-[120px]", ds.colors.text.muted)}>
                        {quote.melhorFornecedor}
                      </CapitalizedText>
                    )}
                  </div>
                  
                  {/* Fornecedores */}
                  <div className="w-[12%] pl-2">
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit border transition-colors",
                      respondidos === total && total > 0
                        ? "bg-brand/5 border-brand/20 text-brand"
                        : "bg-muted/30 border-border/50 text-muted-foreground"
                    )}>
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="font-bold text-xs">
                        {respondidos}/{total}
                      </span>
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="w-[12%] pl-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={ds.components.button.size.icon}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className={cn(ds.components.card.root, "p-1 min-w-[160px]")}>
                        <DropdownMenuItem onClick={() => onManage(quote)} disabled={quote.status === "concluida"} className="rounded-lg gap-2">
                          <Eye className="h-4 w-4" />Negociar Cotação
                        </DropdownMenuItem>
                        {quote.status === "concluida" && onViewSummary && (
                          <DropdownMenuItem onClick={() => onViewSummary(quote)} className="rounded-lg gap-2 text-brand">
                            <FileText className="h-4 w-4" />Resumo da Cotação
                          </DropdownMenuItem>
                        )}
                        {isPronta && quote.status !== "concluida" && (
                          <DropdownMenuItem onClick={() => onConvertToOrder(quote)} className="rounded-lg gap-2 text-brand">
                            <ShoppingCart className="h-4 w-4" />Converter em Pedido
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className={ds.components.separator.horizontal} />
                        <DropdownMenuItem onClick={() => onDelete(quote)} className="rounded-lg gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                          <Trash2 className="h-4 w-4" />Excluir
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
