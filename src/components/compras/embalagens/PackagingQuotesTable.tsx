import { memo } from "react";
import { Calendar, MoreVertical, Eye, Trash2, ShoppingCart, FileText, Package, Building2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import type { PackagingQuoteDisplay } from "@/types/packaging";

interface PackagingQuotesTableProps {
  quotes: PackagingQuoteDisplay[];
  startIndex: number;
  onManage: (quote: PackagingQuoteDisplay) => void;
  onViewSummary?: (quote: PackagingQuoteDisplay) => void;
  onDelete: (quote: PackagingQuoteDisplay) => void;
  onConvertToOrder: (quote: PackagingQuoteDisplay) => void;
}

type PrazoUrgency = "expired" | "urgent" | "normal" | null;

const getPrazoUrgency = (dataFim: string): PrazoUrgency => {
  if (!dataFim || dataFim === "-") return null;
  const parts = dataFim.split(/[\/\-]/).map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [df, mf, yf] = parts;
  const prazo = new Date(yf, mf - 1, df);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em48h = new Date(hoje.getTime() + 48 * 60 * 60 * 1000);
  if (prazo < hoje) return "expired";
  if (prazo <= em48h) return "urgent";
  return "normal";
};

export const PackagingQuotesTable = memo(({
  quotes,
  startIndex,
  onManage,
  onViewSummary,
  onDelete,
  onConvertToOrder,
}: PackagingQuotesTableProps) => {

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
    if (quote.status === "concluida") return <Badge className={ds.components.badge.secondary}>Concluída</Badge>;
    if (quote.status === "cancelada") return <Badge className={ds.components.badge.destructive}>Cancelada</Badge>;
    return <Badge className={ds.components.badge.outline}>Ativa</Badge>;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[14%]">Cotação</TableHead>
          <TableHead className="w-[22%]">Embalagens</TableHead>
          <TableHead className="w-[12%]">Status</TableHead>
          <TableHead className="w-[16%]">Melhor Preço</TableHead>
          <TableHead className="w-[10%]">Fornec.</TableHead>
          <TableHead className="w-[8%]">Itens</TableHead>
          <TableHead className="w-[11%]">Prazo</TableHead>
          <TableHead className="text-right w-[7%] pr-4">Ações</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {quotes.map((quote, index) => {
          const { respondidos, total, isPronta } = getQuoteStatus(quote);
          const numero = startIndex + index + 1;
          const urgency = getPrazoUrgency(quote.dataFim);

          return (
            <TableRow key={quote.id} className="group">
              {/* Cotação # */}
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border",
                    isPronta ? "bg-brand/10 border-brand/20" : "bg-brand/10 border-brand/20"
                  )}>
                    {isPronta ? (
                      <CheckCircle2 className="h-4 w-4 text-brand" />
                    ) : (
                      <Package className="h-4 w-4 text-brand" />
                    )}
                  </div>
                  <span className="font-bold text-[11px] text-brand tabular-nums">
                    #{numero.toString().padStart(4, "0")}
                  </span>
                </div>
              </TableCell>

              {/* Embalagens */}
              <TableCell>
                <CapitalizedText className="font-medium text-foreground truncate block max-w-[200px]">
                  {quote.itens.slice(0, 2).map(i => i.packagingName).join(", ") || "Sem itens"}
                </CapitalizedText>
                {quote.itens.length > 2 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{quote.itens.length - 2} mais
                  </span>
                )}
              </TableCell>

              {/* Status */}
              <TableCell>{getStatusBadge(quote)}</TableCell>

              {/* Melhor Preço */}
              <TableCell>
                <div className="flex flex-col">
                  <span className={cn(
                    "font-medium tracking-tight",
                    quote.melhorPreco === "-" ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {quote.melhorPreco || "-"}
                  </span>
                  {quote.melhorFornecedor && quote.melhorFornecedor !== "-" && (
                    <CapitalizedText as="span" className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                      {quote.melhorFornecedor}
                    </CapitalizedText>
                  )}
                </div>
              </TableCell>

              {/* Fornecedores */}
              <TableCell>
                {total === 0 ? (
                  <span className="text-[12px] text-muted-foreground/40">—</span>
                ) : (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-full text-[12px] tabular-nums font-medium border",
                    respondidos === total
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                  )}>
                    {respondidos}/{total}
                  </span>
                )}
              </TableCell>

              {/* Itens */}
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">{quote.itens.length}</span>
                  {quote.itens.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px]">
                          <p className="font-bold mb-1 text-xs">Embalagens cotadas:</p>
                          <ul className="space-y-0.5 text-xs">
                            {quote.itens.map((item, idx) => (
                              <li key={idx} className="truncate">• {item.packagingName}</li>
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
                {!quote.dataFim || quote.dataFim === "-" ? (
                  <span className="text-[12px] text-muted-foreground/40">—</span>
                ) : urgency === "expired" ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium whitespace-nowrap text-red-500 dark:text-red-400">
                    <Calendar className="h-3 w-3" />{quote.dataFim}
                  </span>
                ) : urgency === "urgent" ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium whitespace-nowrap text-amber-500 dark:text-amber-400">
                    <Calendar className="h-3 w-3" />{quote.dataFim}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground whitespace-nowrap">
                    <Calendar className="h-3 w-3 opacity-50" />{quote.dataFim}
                  </span>
                )}
              </TableCell>

              {/* Ações */}
              <TableCell className="pr-4">
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-accent data-[state=open]:bg-accent transition-colors">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 overflow-hidden rounded-xl">
                      {quote.status === "concluida" ? (
                        onViewSummary && (
                          <DropdownMenuItem onClick={() => onViewSummary(quote)} className="gap-2 py-2 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Resumo da Cotação
                          </DropdownMenuItem>
                        )
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => onManage(quote)} className="gap-2 py-2 cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-900/20">
                            <Eye className="h-4 w-4 text-emerald-500" />
                            Negociar Cotação
                          </DropdownMenuItem>
                          {isPronta && (
                            <DropdownMenuItem onClick={() => onConvertToOrder(quote)} className="gap-2 py-2 cursor-pointer focus:bg-brand/10">
                              <ShoppingCart className="h-4 w-4 text-brand" />
                              Converter em Pedido
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(quote)} className="gap-2 py-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                            <Trash2 className="h-4 w-4" />
                            Excluir Cotação
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
});
