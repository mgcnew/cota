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
          <TableCell colSpan={7} className="px-1 pb-0 pt-0 border-none">
            <div className={cn(ds.components.table.headerWrapper, ds.components.table.accents.brand.bg, ds.components.table.accents.brand.border)}>
              <div className="w-[12%] flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", ds.components.table.accents.brand.bg)}>
                  <Package className={cn("h-4 w-4", ds.components.table.accents.brand.icon)} />
                </div>
                <span className={cn(ds.components.table.headerLabel, ds.components.table.accents.brand.text)}>Cotação</span>
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
                  ds.components.table.row,
                  ds.components.table.rowWrapper,
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
                      <span className={ds.components.dataDisplay.code}>#{numero.toString().padStart(4, '0')}</span>
                      <p className={cn("mt-0.5", ds.components.dataDisplay.secondary)}>{quote.itens.length} item(ns)</p>
                    </div>
                  </div>

                  {/* Embalagens */}
                  <div className="w-[22%] pl-2">
                    <CapitalizedText className={cn(ds.components.dataDisplay.highlight, "truncate block max-w-[180px]")}>
                      {quote.itens.slice(0, 2).map(i => i.packagingName).join(', ') || 'Sem itens'}
                    </CapitalizedText>
                    {quote.itens.length > 2 && (
                      <p className={cn("mt-0.5", ds.components.dataDisplay.secondary)}>+{quote.itens.length - 2} mais</p>
                    )}
                  </div>
                  
                  {/* Período */}
                  <div className="w-[14%] pl-2">
                    <div className={cn("flex items-center gap-1", ds.components.dataDisplay.secondary)}>
                      <Calendar className="h-3 w-3 opacity-50" />
                      <span>{quote.dataInicio}</span>
                    </div>
                    <div className={cn("flex items-center gap-1 mt-0.5", ds.components.dataDisplay.secondary)}>
                      <Calendar className="h-3 w-3 opacity-50" />
                      <span>{quote.dataFim}</span>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="w-[12%] pl-2 flex justify-center">
                    {getStatusBadge(quote)}
                  </div>
                  
                  {/* Melhor Preço */}
                  <div className="w-[16%] pl-2">
                    <span className={cn(
                      ds.components.dataDisplay.money,
                      quote.melhorPreco === '-' && "text-muted-foreground"
                    )}>
                      {quote.melhorPreco}
                    </span>
                    {quote.melhorFornecedor !== '-' && (
                      <CapitalizedText as="p" className={cn("mt-0.5 truncate max-w-[120px]", ds.components.dataDisplay.secondary)}>
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
                          <Eye className="h-4 w-4 text-blue-500" />Negociar Cotação
                        </DropdownMenuItem>
                        {quote.status === "concluida" && onViewSummary && (
                          <DropdownMenuItem onClick={() => onViewSummary(quote)} className="rounded-lg gap-2 text-brand">
                            <FileText className="h-4 w-4" />Resumo da Cotação
                          </DropdownMenuItem>
                        )}
                        {isPronta && quote.status !== "concluida" && (
                          <DropdownMenuItem onClick={() => onConvertToOrder(quote)} className="rounded-lg gap-2 text-emerald-500">
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
