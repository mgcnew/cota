import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Package, Building2, X, DollarSign, Calendar, CheckCircle2, Clock, FileText, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Quote } from "@/hooks/useCotacoes";

interface ResumoCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
}

export default function ResumoCotacaoDialog({ open, onOpenChange, quote }: ResumoCotacaoDialogProps) {
  const products = (quote as any)?._raw?.quote_items || [];
  const fornecedores = quote.fornecedoresParticipantes || [];
  
  const safeStr = (val: any) => (typeof val === 'string' ? val : String(val || ''));

  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    const raw = quote as any;
    const supplierItems = raw._supplierItems || raw._raw?.quote_supplier_items || [];
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    return item?.valor_oferecido || 0;
  };

  const getBestPriceForProduct = (productId: string): { price: number; supplierName: string } => {
    let bestPrice = Infinity;
    let supplierName = '-';
    fornecedores.forEach(f => {
      const value = getSupplierProductValue(f.id, productId);
      if (value > 0 && value < bestPrice) {
        bestPrice = value;
        supplierName = safeStr(f.nome);
      }
    });
    return { price: bestPrice === Infinity ? 0 : bestPrice, supplierName };
  };

  const calcularTotalMelhorPreco = () => {
    return products.reduce((total: number, product: any) => {
      const { price } = getBestPriceForProduct(product.product_id);
      return total + price;
    }, 0);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      finalizada: { label: "Finalizada", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
      concluida: { label: "Concluída", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
      ativa: { label: "Ativa", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock },
      pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: Clock },
    };
    return configs[status] || configs.pendente;
  };

  const statusConfig = getStatusConfig(quote.status);
  const StatusIcon = statusConfig.icon;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] p-0 overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        {/* Header Simples */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resumo da Cotação
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">#{safeStr(quote.id).substring(0, 8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={cn("flex items-center gap-1.5", statusConfig.color)}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusConfig.label}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(85vh-80px)]">
          <div className="p-6 space-y-6">
            
            {/* Informações Gerais */}
            <section>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Informações Gerais</h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Período</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{safeStr(quote.dataInicio)} até {safeStr(quote.dataFim)}</p>
                  </div>
                </div>
                <Separator className="bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-start gap-3">
                  <DollarSign className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Melhor Valor Total</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">R$ {calcularTotalMelhorPreco().toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Produtos */}
            <section>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos ({products.length})
              </h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Produto</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Qtd</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Melhor Preço</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Fornecedor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {products.map((product: any) => {
                      const { price, supplierName } = getBestPriceForProduct(product.product_id);
                      return (
                        <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{safeStr(product.product_name)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600 dark:text-gray-300">{safeStr(product.quantidade)} {safeStr(product.unidade)}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">R$ {price.toFixed(2)}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-300">{supplierName}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Fornecedores */}
            <section>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Fornecedores ({fornecedores.length})
              </h3>
              <div className="space-y-2">
                {fornecedores.map((fornecedor, index) => {
                  const total = products.reduce((sum: number, p: any) => sum + getSupplierProductValue(fornecedor.id, p.product_id), 0);
                  const isBest = total > 0 && total === Math.min(...fornecedores.map(f => products.reduce((s: number, p: any) => s + getSupplierProductValue(f.id, p.product_id), 0)).filter(v => v > 0));
                  
                  return (
                    <div key={fornecedor.id} className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      isBest 
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
                        : "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
                    )}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-5">{index + 1}.</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{safeStr(fornecedor.nome)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={cn("text-xs", fornecedor.status === 'respondido' ? "text-green-600 border-green-300 dark:text-green-400" : "text-amber-600 border-amber-300 dark:text-amber-400")}>
                              {fornecedor.status === 'respondido' ? 'Respondido' : 'Pendente'}
                            </Badge>
                            {isBest && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                                <TrendingDown className="h-3 w-3 mr-1" />Melhor
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-semibold", total > 0 ? "text-gray-900 dark:text-white" : "text-gray-400")}>
                          {total > 0 ? `R$ ${total.toFixed(2)}` : '-'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Observações se houver */}
            {(quote as any).observacoes && (
              <section>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Observações</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{safeStr((quote as any).observacoes)}</p>
                </div>
              </section>
            )}

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
