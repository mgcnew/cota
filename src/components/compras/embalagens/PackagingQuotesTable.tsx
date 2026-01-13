import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Package, Calendar, DollarSign, Building2, MoreVertical, Eye, Trash2, ShoppingCart, CheckCircle2 } from "lucide-react";
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
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
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
    
    return <Badge variant="default">Ativa</Badge>;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted dark:bg-accent/20 border-b border-border dark:border-primary/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="table-header py-4 px-6">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Cotação
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell table-header py-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Embalagens
              </div>
            </TableHead>
            <TableHead className="hidden lg:table-cell table-header py-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </div>
            </TableHead>
            <TableHead className="table-header py-4">Status</TableHead>
            <TableHead className="table-header py-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Melhor Preço
              </div>
            </TableHead>
            <TableHead className="hidden sm:table-cell table-header py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Fornecedores
              </div>
            </TableHead>
            <TableHead className="text-right table-header py-4 px-6">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote, index) => {
            const { respondidos, total, isPronta } = getQuoteStatus(quote);
            const numero = startIndex + index + 1;
            
            return (
              <TableRow 
                key={quote.id}
                className={cn(
                  "sm:hover:bg-accent/50 border-b border-border",
                  index % 2 === 0 ? "bg-card" : "bg-muted/30",
                  isPronta && "bg-emerald-50/50 dark:bg-emerald-900/10"
                )}
              >
                {/* Cotação */}
                <TableCell className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                      isPronta 
                        ? "bg-emerald-100 border-emerald-200" 
                        : "bg-primary/10 border-primary/20"
                    )}>
                      {isPronta ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Package className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="table-cell-primary font-mono truncate">
                        #{numero.toString().padStart(4, '0')}
                      </div>
                      <div className="table-cell-secondary mt-1">
                        {quote.itens.length} item(ns)
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Embalagens */}
                <TableCell className="hidden md:table-cell py-4">
                  <div className="min-w-0">
                    <CapitalizedText className="table-cell-primary truncate max-w-[200px] block">
                      {quote.itens.slice(0, 2).map(i => i.packagingName).join(', ') || 'Sem itens'}
                    </CapitalizedText>
                    {quote.itens.length > 2 && (
                      <div className="table-cell-secondary mt-1">
                        +{quote.itens.length - 2} mais
                      </div>
                    )}
                  </div>
                </TableCell>
                
                {/* Período */}
                <TableCell className="hidden lg:table-cell py-4">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-1 text-foreground">
                      <Calendar className="h-3 w-3 text-primary" />
                      {quote.dataInicio}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {quote.dataFim}
                    </div>
                  </div>
                </TableCell>
                
                {/* Status */}
                <TableCell className="py-4">
                  {getStatusBadge(quote)}
                </TableCell>
                
                {/* Melhor Preço */}
                <TableCell className="py-4">
                  <div className="space-y-1">
                    <div className={cn(
                      "font-bold text-base",
                      quote.melhorPreco !== '-' ? "text-success" : "text-muted-foreground"
                    )}>
                      {quote.melhorPreco}
                    </div>
                    {quote.melhorFornecedor !== '-' && (
                      <CapitalizedText as="div" className="table-cell-secondary truncate max-w-[120px]">
                        {quote.melhorFornecedor}
                      </CapitalizedText>
                    )}
                    {quote.economia !== "0%" && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success rounded-md text-xs font-medium">
                        <DollarSign className="h-3 w-3" />
                        -{quote.economia}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                {/* Fornecedores */}
                <TableCell className="hidden sm:table-cell py-4">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-medium",
                      respondidos === total && total > 0
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-primary/10 border-primary/20 text-primary"
                    )}
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {respondidos}/{total}
                  </Badge>
                </TableCell>
                
                {/* Ações */}
                <TableCell className="py-4 px-4">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-accent transition-colors duration-200"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onManage(quote)} className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2 text-blue-600" />
                          <span>Gerenciar</span>
                        </DropdownMenuItem>
                        
                        {isPronta && (
                          <DropdownMenuItem 
                            onClick={() => onConvertToOrder(quote)} 
                            className="cursor-pointer text-emerald-600"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            <span>Converter em Pedido</span>
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => onDelete(quote)}
                          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Excluir</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
