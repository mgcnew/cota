import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Package, Building2, X, DollarSign, Calendar, CheckCircle2, Clock, ClipboardList, TrendingDown, Award, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Quote } from "@/hooks/useCotacoes";

interface ResumoCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
}

// Configurações de status
const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  finalizada: { label: "Finalizada", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800", Icon: CheckCircle2 },
  concluida: { label: "Concluída", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800", Icon: CheckCircle2 },
  ativa: { label: "Ativa", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800", Icon: Clock },
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800", Icon: Clock },
};

export default function ResumoCotacaoDialog({ open, onOpenChange, quote }: ResumoCotacaoDialogProps) {
  // Dados da cotação
  const products = (quote as any)?._raw?.quote_items || [];
  const fornecedores = quote.fornecedoresParticipantes || [];
  const fornecedoresRespondidos = fornecedores.filter(f => f.status === "respondido").length;
  
  // Helpers
  const safeStr = (val: any): string => typeof val === 'string' ? val : String(val || '');
  
  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    const raw = quote as any;
    const items = raw._supplierItems || raw._raw?.quote_supplier_items || [];
    return items.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId)?.valor_oferecido || 0;
  };

  const calcularTotalFornecedor = (supplierId: string): number => {
    return products.reduce((sum: number, p: any) => sum + getSupplierProductValue(supplierId, p.product_id), 0);
  };

  const getBestPrice = (productId: string) => {
    let best = { price: 0, supplier: '-' };
    fornecedores.forEach(f => {
      const val = getSupplierProductValue(f.id, productId);
      if (val > 0 && (best.price === 0 || val < best.price)) {
        best = { price: val, supplier: safeStr(f.nome) };
      }
    });
    return best;
  };

  const totalMelhorPreco = products.reduce((t: number, p: any) => t + getBestPrice(p.product_id).price, 0);
  
  const melhorFornecedor = fornecedores.reduce((best: any, f) => {
    const total = calcularTotalFornecedor(f.id);
    if (total > 0 && (!best || total < best.total)) return { ...f, total };
    return best;
  }, null);

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.pendente;
  const StatusIcon = statusConfig.Icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] p-0 flex flex-col">
        
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
                <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold truncate text-gray-900 dark:text-white">Resumo da Cotação</DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">#{safeStr(quote.id).slice(0, 8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />{statusConfig.label}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-7 w-7 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800">
                <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 mb-1">
                  <Package className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Produtos</span>
                </div>
                <p className="text-xl font-bold text-teal-800 dark:text-teal-200">{products.length}</p>
              </Card>
              
              <Card className="p-3 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 mb-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Fornecedores</span>
                </div>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200">{fornecedoresRespondidos}/{fornecedores.length}</p>
              </Card>
              
              <Card className="p-3 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <div className="flex items-center gap-1.5 text-green-700 dark:text-green-300 mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Melhor Total</span>
                </div>
                <p className="text-lg font-bold text-green-800 dark:text-green-200">R$ {totalMelhorPreco.toFixed(2)}</p>
              </Card>
              
              <Card className="p-3 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Período</span>
                </div>
                <p className="text-xs font-bold text-purple-800 dark:text-purple-200">{safeStr(quote.dataInicio)}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">até {safeStr(quote.dataFim)}</p>
              </Card>
            </div>

            {/* Melhor Fornecedor */}
            {melhorFornecedor && (
              <Card className="p-3 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Melhor Fornecedor</p>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200 truncate">
                      {safeStr(melhorFornecedor.nome)} • R$ {melhorFornecedor.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Produtos */}
            <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Produtos ({products.length})</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[200px] overflow-y-auto">
                {products.map((p: any, i: number) => {
                  const best = getBestPrice(p.product_id);
                  return (
                    <div key={p.product_id} className="px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-5 shrink-0">{i + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{safeStr(p.product_name)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{safeStr(p.quantidade)} {safeStr(p.unidade)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />R$ {best.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{best.supplier}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Fornecedores */}
            <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Fornecedores ({fornecedores.length})</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[180px] overflow-y-auto">
                {fornecedores.map((f) => {
                  const total = calcularTotalFornecedor(f.id);
                  const isBest = melhorFornecedor?.id === f.id;
                  return (
                    <div key={f.id} className={cn("px-3 py-2 flex items-center gap-2", isBest && "bg-amber-50/50 dark:bg-amber-900/10")}>
                      <div className={cn("w-2 h-2 rounded-full shrink-0", f.status === 'respondido' ? "bg-green-500" : "bg-amber-500")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{safeStr(f.nome)}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className={cn("text-[10px] h-5", f.status === 'respondido' ? "text-green-600 border-green-300 dark:text-green-400 dark:border-green-700" : "text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700")}>
                            {f.status === 'respondido' ? 'Respondido' : 'Pendente'}
                          </Badge>
                          {isBest && <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Award className="h-2.5 w-2.5 mr-0.5" />Melhor</Badge>}
                        </div>
                      </div>
                      <p className={cn("text-sm font-bold shrink-0", total > 0 ? (isBest ? "text-amber-700 dark:text-amber-300" : "text-gray-900 dark:text-white") : "text-gray-400 dark:text-gray-500")}>
                        {total > 0 ? `R$ ${total.toFixed(2)}` : '-'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Observações */}
            {(quote as any).observacoes && (
              <Card className="p-3 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Observações</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{safeStr((quote as any).observacoes)}</p>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <Button onClick={() => onOpenChange(false)} size="sm" className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
