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
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3" />Análise Comparativa
          </h3>
          <div className="flex bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/30 rounded-md p-0.5">
            <Button 
              variant={comparativoView === "item" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setComparativoView("item")}
              className={cn("h-6 px-2 text-[9px] font-bold uppercase tracking-wider rounded transition-all", 
                comparativoView === "item" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100")}
            >
              <Package className="h-2.5 w-2.5 mr-1" />Item
            </Button>
            <Button 
              variant={comparativoView === "fornecedor" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setComparativoView("fornecedor")}
              className={cn("h-6 px-2 text-[9px] font-bold uppercase tracking-wider rounded transition-all", 
                comparativoView === "fornecedor" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100")}
            >
              <Building2 className="h-2.5 w-2.5 mr-1" />Fornecedor
            </Button>
          </div>
        </div>
        {comparison.length === 0 || comparison.every(c => c.fornecedores.length === 0) ? (
          <div className="text-center py-16 text-zinc-400">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-bold text-zinc-900 dark:text-zinc-50 mb-1">Sem dados comparativos</p>
            <p className="text-xs">Adicione os valores na aba "Valores" para visualizar</p>
          </div>
        ) : comparativoView === "item" ? (
          comparison.map((comp) => (
            <Card key={comp.packagingId} className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card/80 shadow-sm rounded-xl">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
                <h4 className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-50 flex items-center gap-2"><Package className="h-3.5 w-3.5 text-zinc-400" />{comp.packagingName}</h4>
              </div>
              {comp.fornecedores.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 text-xs font-medium">Nenhum fornecedor respondeu ainda</div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {comp.fornecedores.map((f: any, index: number) => (
                    <div key={f.supplierId} className={cn("px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50", f.isMelhorPreco && "bg-zinc-50/50 dark:bg-zinc-800/30")} onClick={() => onEditItem(f.supplierId, comp.packagingId)}>
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0", f.isMelhorPreco ? "bg-primary text-primary-foreground" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500")}>
                        {f.isMelhorPreco ? <Award className="h-3.5 w-3.5" /> : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-[13px]">{f.supplierName}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{formatCurrency(f.valorTotal)} ({f.quantidadeVenda} {f.unidadeVenda} / {f.quantidadeUnidades} un)</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-[13px] text-zinc-900 dark:text-zinc-50">{formatCurrency(f.custoPorUnidade)}/un</p>
                        {!f.isMelhorPreco ? <p className="text-[10px] font-bold text-red-500 mt-0.5">+{f.diferencaPercentual.toFixed(1)}%</p> : <Badge className="bg-primary text-primary-foreground border-0 text-[9px] mt-0.5 h-4">Melhor</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        ) : (
          comparisonBySupplier.map((group) => (
            <Card key={group.supplierId} className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card/80 shadow-sm rounded-xl">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-50">{group.supplierName}</h4>
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                      {group.itens.length} itens • {group.vitorias} vitórias
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900" onClick={() => onCopySupplierSummary(group)} title="Copiar">
                    {copiedId === group.supplierId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-zinc-400" />}
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900" onClick={() => onExportSupplierHtml(group)} title="Exportar">
                    <FileText className="h-3 w-3 text-zinc-400" />
                  </Button>
                  {group.vitorias > 0 && (
                    <div className="text-right ml-1">
                      <Badge className="bg-primary text-primary-foreground border-0 text-[9px] font-bold h-5">
                        <Trophy className="h-2.5 w-2.5 mr-1" />{group.vitorias} {group.vitorias === 1 ? 'VIT.' : 'VIT.'}
                      </Badge>
                      <p className="text-[9px] font-bold text-emerald-600 mt-0.5">{formatCurrency(group.valorTotalGanhos)}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {group.itens.map((item: any) => (
                  <div 
                    key={item.packagingId} 
                    className={cn("px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50", item.isMelhorPreco && "bg-zinc-50/50 dark:bg-zinc-800/30")}
                    onClick={() => onEditItem(group.supplierId, item.packagingId)}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", 
                      item.isMelhorPreco ? "bg-primary text-primary-foreground" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500")}>
                      {item.isMelhorPreco ? <Award className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-[13px]">{item.packagingName}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                        {formatCurrency(item.valorTotal)} ({item.quantidadeVenda} {item.unidadeVenda} / {item.quantidadeUnidades} un)
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[13px] text-zinc-900 dark:text-zinc-50">{formatCurrency(item.custoPorUnidade)}/un</p>
                      {!item.isMelhorPreco 
                        ? <p className="text-[10px] font-bold text-red-500 mt-0.5">+{item.diferencaPercentual.toFixed(1)}%</p>
                        : <Badge className="bg-emerald-500 text-white border-0 text-[9px] h-4 uppercase font-bold mt-0.5">Ganhou</Badge>
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
