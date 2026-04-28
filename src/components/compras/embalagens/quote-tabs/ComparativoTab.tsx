import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, Building2, TrendingDown, Award, Trophy, 
  Copy, Check, FileText 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";

interface ComparativoTabProps {
  comparison: any[];
  comparisonBySupplier: any[];
  onEditItem: (supplierId: string, packagingId: string) => void;
  onCopySupplierSummary: (group: any) => void;
  onExportSupplierHtml: (group: any) => void;
  copiedId: string | null;
}

export function ComparativoTab({ 
  comparison, 
  comparisonBySupplier, 
  onEditItem, 
  onCopySupplierSummary, 
  onExportSupplierHtml,
  copiedId
}: ComparativoTabProps) {
  const [comparativoView, setComparativoView] = useState<"item" | "fornecedor">("item");

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-4 space-y-3 pb-10">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3" />Análise Comparativa
          </h3>
          <div className="flex bg-muted/20 border border-border/50 rounded-md p-0.5">
            <Button 
              variant={comparativoView === "item" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setComparativoView("item")}
              className={cn("h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all", 
                comparativoView === "item" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <Package className="h-3 w-3 mr-1.5" />Item
            </Button>
            <Button 
              variant={comparativoView === "fornecedor" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setComparativoView("fornecedor")}
              className={cn("h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all", 
                comparativoView === "fornecedor" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <Building2 className="h-3 w-3 mr-1.5" />Fornecedor
            </Button>
          </div>
        </div>
        {comparison.length === 0 || comparison.every(c => c.fornecedores.length === 0) ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="h-8 w-8 opacity-50 text-foreground" />
            </div>
            <p className="font-bold text-foreground mb-1">Sem dados comparativos</p>
            <p className="text-xs">Adicione os valores na aba "Valores" para visualizar</p>
          </div>
        ) : comparativoView === "item" ? (
          comparison.map((comp) => (
            <Card key={comp.packagingId} className="overflow-hidden border-border bg-card shadow-sm rounded-xl">
              <div className="bg-muted/20 px-4 py-3 border-b border-border/50">
                <h4 className="font-semibold text-[13px] text-foreground flex items-center gap-2"><Package className="h-3.5 w-3.5 text-muted-foreground" />{comp.packagingName}</h4>
              </div>
              {comp.fornecedores.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs font-medium">Nenhum fornecedor respondeu ainda</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {comp.fornecedores.map((f: any, index: number) => (
                    <div key={f.supplierId} className={cn("px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer hover:bg-muted/30", f.isMelhorPreco && "bg-brand/5")} onClick={() => onEditItem(f.supplierId, comp.packagingId)}>
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0", f.isMelhorPreco ? "bg-brand/10 text-brand border-brand/20 shadow-none" : "bg-muted text-muted-foreground")}>
                        {f.isMelhorPreco ? <Award className="h-3.5 w-3.5" /> : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-[13px]">{f.supplierName}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{formatCurrency(f.valorTotal)} ({f.quantidadeVenda} {f.unidadeVenda} / {f.quantidadeUnidades} un)</p>
                      </div>
                      <div className="text-right flex-shrink-0 whitespace-nowrap">
                        <p className="font-bold text-[13px] text-foreground">{formatCurrency(f.custoPorUnidade)}/un</p>
                        {!f.isMelhorPreco ? <p className="text-[10px] font-bold text-red-500 mt-0.5">+{f.diferencaPercentual.toFixed(1)}%</p> : <Badge className="bg-brand/10 text-brand border border-brand/20 text-[9px] font-bold mt-0.5">Melhor</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        ) : (
          comparisonBySupplier.map((group) => (
            <Card key={group.supplierId} className="overflow-hidden border-border bg-card shadow-sm rounded-xl">
              <div className="bg-muted/20 px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand flex-shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[13px] text-foreground">{group.supplierName}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                      {group.itens.length} itens • {group.vitorias} vitórias
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-border hover:bg-muted" onClick={() => onCopySupplierSummary(group)} title="Copiar">
                    {copiedId === group.supplierId ? <Check className="h-3 w-3 text-brand" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-border hover:bg-muted" onClick={() => onExportSupplierHtml(group)} title="Exportar">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  {group.vitorias > 0 && (
                    <div className="text-right ml-1">
                      <Badge className="bg-brand/10 text-brand border border-brand/20 text-[9px] font-bold h-5 shadow-none pb-0">
                        <Trophy className="h-2.5 w-2.5 mr-1" />{group.vitorias} VIT.
                      </Badge>
                      <p className="text-[9px] font-bold text-brand mt-0.5">{formatCurrency(group.valorTotalGanhos)}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {group.itens.map((item: any) => (
                  <div 
                    key={item.packagingId} 
                    className={cn("px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer hover:bg-muted/30", item.isMelhorPreco && "bg-brand/5")}
                    onClick={() => onEditItem(group.supplierId, item.packagingId)}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", 
                      item.isMelhorPreco ? "bg-brand/10 text-brand border border-brand/20 shadow-none" : "bg-muted text-muted-foreground border border-border/50")}>
                      {item.isMelhorPreco ? <Award className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-[13px]">{item.packagingName}</p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        {formatCurrency(item.valorTotal)} ({item.quantidadeVenda} {item.unidadeVenda} / {item.quantidadeUnidades} un)
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 whitespace-nowrap">
                      <p className="font-bold text-[13px] text-foreground">{formatCurrency(item.custoPorUnidade)}/un</p>
                      {!item.isMelhorPreco 
                        ? <p className="text-[10px] font-bold text-red-500 mt-0.5">+{item.diferencaPercentual.toFixed(1)}%</p>
                        : <Badge className="bg-brand/10 text-brand border border-brand/20 text-[9px] font-bold mt-0.5">Ganhou</Badge>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
