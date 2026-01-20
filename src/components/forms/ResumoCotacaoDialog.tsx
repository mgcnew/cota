import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Package, Building2, DollarSign, Calendar, ClipboardList, TrendingDown, Award, Users, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Quote } from "@/hooks/useCotacoes";

interface ResumoCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
}

/**
 * ResumoCotacaoDialog - Quote summary dialog using ResponsiveModal
 * 
 * Requirements: 3.5 - Bottom sheet no mobile, dialog no desktop
 */
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


  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      hideClose
      title="Resumo da Cotação"
      description={`#${safeStr(quote.id).slice(0, 8)}`}
      desktopMaxWidth="lg"
      className="!bg-white/80 dark:!bg-gray-950/80 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl [&>button]:hidden"
      footer={
        <Button 
          onClick={() => onOpenChange(false)} 
          size="sm" 
          className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 font-medium"
        >
          Fechar
        </Button>
      }
    >
      <div className="absolute right-4 top-4 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onOpenChange(false)} 
          className="h-6 w-6 text-gray-400 hover:text-gray-900 dark:hover:text-white !bg-transparent p-0 border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>
      <div className="space-y-4 pt-2">
        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <ClipboardList className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <StatusBadge status={quote.status} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 mb-1">
              <Package className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">Produtos</span>
            </div>
            <p className="text-xl font-bold text-teal-800 dark:text-teal-200">{products.length}</p>
          </Card>
          
          <Card className="p-3 bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 mb-1">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">Fornecedores</span>
            </div>
            <p className="text-xl font-bold text-blue-800 dark:text-blue-200">{fornecedoresRespondidos}/{fornecedores.length}</p>
          </Card>
          
          <Card className="p-3 bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-1.5 text-green-700 dark:text-green-300 mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">Melhor Total</span>
            </div>
            <p className="text-lg font-bold text-green-800 dark:text-green-200">R$ {totalMelhorPreco.toFixed(2)}</p>
          </Card>
          
          <Card className="p-3 bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">Período</span>
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-purple-800 dark:text-purple-200">{safeStr(quote.dataInicio)}</p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium opacity-80">até {safeStr(quote.dataFim)}</p>
            </div>
          </Card>
        </div>

        {/* Melhor Fornecedor */}
        {melhorFornecedor && (
          <Card className="p-3 bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20 dark:border-amber-500/10 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest opacity-80">Melhor Fornecedor</p>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-100 truncate">
                  {safeStr(melhorFornecedor.nome)} • <span className="text-amber-600 dark:text-amber-400">R$ {melhorFornecedor.total.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Produtos */}
        <Card className="overflow-hidden border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md shadow-sm">
          <div className="px-3 py-2.5 bg-white/10 dark:bg-white/5 border-b border-white/10 dark:border-white/5 flex items-center gap-2">
            <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">Produtos ({products.length})</span>
          </div>
          <div className="divide-y divide-white/5 dark:divide-white/5 max-h-[200px] overflow-y-auto">
            {products.map((p: any, i: number) => {
              const best = getBestPrice(p.product_id);
              return (
                <div key={p.product_id} className="px-3 py-2.5 flex items-center gap-2 hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{safeStr(p.product_name)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{safeStr(p.quantidade)} {safeStr(p.unidade)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                      <TrendingDown className="h-3 w-3" />R$ {best.price.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[100px] font-medium opacity-80">{best.supplier}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Fornecedores */}
        <Card className="overflow-hidden border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md shadow-sm">
          <div className="px-3 py-2.5 bg-white/10 dark:bg-white/5 border-b border-white/10 dark:border-white/5 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">Fornecedores ({fornecedores.length})</span>
          </div>
          <div className="divide-y divide-white/5 dark:divide-white/5 max-h-[180px] overflow-y-auto">
            {fornecedores.map((f) => {
              const total = calcularTotalFornecedor(f.id);
              const isBest = melhorFornecedor?.id === f.id;
              return (
                <div key={f.id} className={cn("px-3 py-2.5 flex items-center gap-2 transition-colors", isBest ? "bg-amber-500/10 dark:bg-amber-500/5" : "hover:bg-white/10 dark:hover:bg-white/5")}>
                  <div className={cn("w-2 h-2 rounded-full shrink-0", f.status === 'respondido' ? "bg-green-500" : "bg-amber-500")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{safeStr(f.nome)}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={cn("text-[9px] h-4 font-bold uppercase tracking-tighter", f.status === 'respondido' ? "text-green-600 border-green-500/30 bg-green-500/5 dark:text-green-400 dark:border-green-500/20" : "text-amber-600 border-amber-500/30 bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20")}>
                        {f.status === 'respondido' ? 'Respondido' : 'Pendente'}
                      </Badge>
                      {isBest && <Badge className="text-[9px] h-4 bg-amber-500 text-white dark:bg-amber-600 font-bold uppercase tracking-tighter"><Award className="h-2.5 w-2.5 mr-0.5" />Melhor</Badge>}
                    </div>
                  </div>
                  <p className={cn("text-sm font-bold shrink-0", total > 0 ? (isBest ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white") : "text-gray-400 dark:text-gray-500")}>
                    {total > 0 ? `R$ ${total.toFixed(2)}` : '-'}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Observações */}
        {(quote as any).observacoes && (
          <Card className="p-3 bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">Observações</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{safeStr((quote as any).observacoes)}</p>
          </Card>
        )}
      </div>
    </ResponsiveModal>
  );
}
