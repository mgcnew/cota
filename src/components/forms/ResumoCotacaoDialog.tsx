import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Package, Building2, DollarSign, Calendar, ClipboardList,
  TrendingDown, Award, X, CheckCircle2, Clock, Sparkles, MessageCircle,
  Camera, Loader2, ArrowRight, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import { formatCurrency } from "@/utils/formatters";
import { generateQuoteExportMessage, generateComparativeQuoteExportMessage, sendWhatsAppMedia } from "@/lib/whatsapp-service";
import type { Quote } from "@/hooks/useCotacoes";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";

interface ResumoCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
}

export default function ResumoCotacaoDialog({ open, onOpenChange, quote }: ResumoCotacaoDialogProps) {
  const { data: company } = useCompany();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [viewMode, setViewMode] = useState<"winners" | "comparative">("winners");

  const products = useMemo(() => {
    const items = (quote as any)?._raw?.quote_items || [];
    return [...items].sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
  }, [quote]);
  
  const fornecedores = quote.fornecedoresParticipantes || [];
  const fornecedoresRespondidos = fornecedores.filter(f => f.status === "respondido").length;

  const safeStr = (val: any): string => typeof val === 'string' ? val : String(val || '');

  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    const raw = quote as any;
    const items = raw._supplierItems || raw._raw?.quote_supplier_items || [];
    return items.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId)?.valor_oferecido || 0;
  };

  const getProductHistorySequence = (productId: string, winnerId: string | null): number[] => {
    if (!winnerId) return [];
    
    const raw = quote as any;
    const supplierItems = raw._supplierItems || raw._raw?.quote_supplier_items || [];
    const item = supplierItems.find((i: any) => i?.supplier_id === winnerId && i?.product_id === productId);
    
    if (!item) return [];
    
    const history = item.price_history || [];
    const currentPrice = item.valor_oferecido;
    const initialPrice = item.valor_inicial;
    
    // Inicia a sequência com o valor inicial (primeiro de todos)
    const sequencePrices: number[] = [];
    if (initialPrice > 0) {
      sequencePrices.push(initialPrice);
    }
    
    const seq = [...history].sort((a: any, b: any) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());
    seq.forEach((h: any) => {
      // Evita duplicar o valor inicial se ele já estiver na sequência
      if (sequencePrices.length === 0 || sequencePrices[sequencePrices.length - 1] !== h.old_price) {
        sequencePrices.push(h.old_price);
      }
    });
    
    if (sequencePrices.length === 0 || Math.abs(sequencePrices[sequencePrices.length - 1] - currentPrice) > 0.001) {
      sequencePrices.push(currentPrice);
    }
    
    return sequencePrices;
  };

  const calcularTotalFornecedor = (supplierId: string): number => {
    return products.reduce((sum: number, p: any) => {
      const precoUn = getSupplierProductValue(supplierId, p.product_id);
      const qtd = Number(p.quantidade) || 1;
      return sum + (precoUn * qtd);
    }, 0);
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

  const produtosComVencedor = useMemo(() => {
    return products.map((p: any) => {
      const best = getBestPrice(p.product_id);
      const qtd = Number(p.quantidade) || 1;
      
      let winnerId: string | null = null;
      fornecedores.forEach(f => {
        const val = getSupplierProductValue(f.id, p.product_id);
        if (val > 0 && val === best.price) {
          winnerId = f.id;
        }
      });
      
      const priceSequence = getProductHistorySequence(p.product_id, winnerId);

      // Coletar todos os fornecedores que deram lance para este item
      const allOffers = fornecedores.map(f => {
        const val = getSupplierProductValue(f.id, p.product_id);
        const raw = quote as any;
        const supplierItems = raw._supplierItems || raw._raw?.quote_supplier_items || [];
        const entry = supplierItems.find((i: any) => i?.supplier_id === f.id && i?.product_id === p.product_id);
        const initialPrice = Number(entry?.valor_inicial) || val;
        return {
          supplierId: f.id,
          supplierName: safeStr(f.nome),
          price: val,
          initialPrice,
          total: val * qtd,
          isWinner: f.id === winnerId && val > 0,
          wasNegotiated: initialPrice > 0 && val > 0 && Math.abs(initialPrice - val) > 0.001
        };
      }).filter(s => s.price > 0).sort((a, b) => a.price - b.price);

      return {
        productId: p.product_id,
        productName: p.product_name,
        quantidade: qtd,
        unidade: p.unidade,
        bestPrice: best.price,
        bestSupplier: best.supplier,
        winnerId,
        totalItem: best.price * qtd,
        priceSequence,
        allOffers
      };
    });
  }, [products, fornecedores]);

  const totalMelhorPreco = produtosComVencedor.reduce((t, p) => t + p.totalItem, 0);

  const totalEconomiaPotencial = useMemo(() => {
    let economia = 0;
    products.forEach((p: any) => {
      const qtd = Number(p.quantidade) || 1;
      const prices = fornecedores
        .map(f => getSupplierProductValue(f.id, p.product_id))
        .filter(val => val > 0)
        .sort((a, b) => b - a);

      if (prices.length > 1) {
        const highestPrice = prices[0];
        const bestPrice = prices[prices.length - 1];
        if (highestPrice > bestPrice) {
          economia += (highestPrice - bestPrice) * qtd;
        }
      }
    });
    return economia;
  }, [products, fornecedores]);

  const totalEconomiaReal = useMemo(() => {
    let economia = 0;
    produtosComVencedor.forEach((p: any) => {
      if (p.priceSequence && p.priceSequence.length > 1) {
        const first = p.priceSequence[0];
        const last = p.priceSequence[p.priceSequence.length - 1];
        if (first > last && p.quantidade) {
          economia += (first - last) * p.quantidade;
        }
      }
    });
    return economia;
  }, [produtosComVencedor]);

  const fornecedoresRanking = useMemo(() => {
    return fornecedores
      .map(f => {
        const itensGanhos = produtosComVencedor.filter(p => p.winnerId === f.id);
        const totalGanho = itensGanhos.reduce((sum, p) => sum + p.totalItem, 0);
        return {
          ...f,
          total: totalGanho,
          itensGanhos: itensGanhos.length,
          isRespondido: f.status === 'respondido'
        };
      })
      .filter(f => f.total > 0)
      .sort((a, b) => b.itensGanhos - a.itensGanhos || a.total - b.total);
  }, [fornecedores, produtosComVencedor]);

  const groupedProdutosPorVencedor = useMemo(() => {
    const groups: Record<string, any[]> = {};
    produtosComVencedor.forEach(p => {
      const name = p.bestSupplier || 'Pendente';
      if (!groups[name]) groups[name] = [];
      groups[name].push(p);
    });
    
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === 'Pendente') return 1;
      if (b[0] === 'Pendente') return -1;
      return b[1].length - a[1].length;
    });
  }, [produtosComVencedor]);

  const handleWhatsAppExport = () => {
    const statsExport = {
      totalProdutos: products.length,
      totalFornecedores: fornecedores.length,
      fornecedoresRespondidos: fornecedoresRespondidos,
    };

    const groups: Record<string, { name: string, items: any[], total: number }> = {};
    produtosComVencedor.forEach(p => {
      const supplierName = p.bestSupplier || "Pendente / Sem Vencedor";
      if (!groups[supplierName]) {
        groups[supplierName] = { name: supplierName, items: [], total: 0 };
      }
      groups[supplierName].items.push(p);
      groups[supplierName].total += p.totalItem;
    });

    const groupedDataExport = Object.values(groups).sort((a, b) => {
      if (a.name === "Pendente / Sem Vencedor") return 1;
      if (b.name === "Pendente / Sem Vencedor") return -1;
      return a.name.localeCompare(b.name);
    });

    const exportMsg = viewMode === 'winners' 
      ? generateQuoteExportMessage(
          statsExport,
          groupedDataExport,
          totalEconomiaReal,
          totalMelhorPreco,
          (quote as any).analise_ia,
          totalEconomiaPotencial,
          company?.name
        )
      : generateComparativeQuoteExportMessage(
          statsExport,
          produtosComVencedor,
          totalEconomiaReal,
          totalMelhorPreco,
          (quote as any).analise_ia,
          company?.name
        );

    toast.promise(
      import("@/lib/whatsapp-service").then(m => m.sendWhatsApp(m.DEFAULT_PHONE_NUMBER, exportMsg, company?.id)),
      {
        loading: 'Enviando relatório para WhatsApp...',
        success: (res: any) => {
          if (res?.success === false) throw new Error(res.error || "Erro desconhecido");
          return 'Relatório enviado com sucesso via API!';
        },
        error: (err) => `Falha no envio via API: ${err.message}. Tente novamente.`
      }
    );
  };

  const handleSendScreenshot = async () => {
    if (!contentRef.current) return;
    
    setIsCapturing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const canvas = await html2canvas(contentRef.current, {
        useCORS: true,
        scale: 2, 
        backgroundColor: '#ffffff',
        logging: false,
        width: contentRef.current.scrollWidth,
        height: contentRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[data-capture-container="true"]') as HTMLElement;
          if (el) {
            el.classList.remove('dark');
            el.classList.add('light');
            el.style.backgroundColor = '#ffffff';
            el.style.color = '#000000';
            clonedDoc.documentElement.classList.remove('dark');
            clonedDoc.body.classList.remove('dark');
          }
        }
      });

      const base64Image = canvas.toDataURL("image/jpeg", 0.9);
      const targetPhone = prompt("Número do WhatsApp (com DDD):", "");
      if (!targetPhone) { setIsCapturing(false); return; }

      const cleanPhone = targetPhone.replace(/\D/g, '');
      const result = await sendWhatsAppMedia(
        cleanPhone,
        base64Image,
        `📊 *Relatório de Negociação - Cotação #${safeStr(quote.id).slice(0, 8)}*\n\n_Documento oficial de compras._`
      );

      if (result.success) toast.success("Relatório enviado!");
      else throw new Error(result.error);
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      hideClose
      title="Relatório de Negociação"
      description={`Cód. #${safeStr(quote.id).slice(0, 8)}`}
      desktopMaxWidth="xl"
      className="shadow-2xl flex flex-col overflow-hidden bg-white dark:bg-zinc-950"
      footer={
        <div className="flex w-full gap-2 p-4">
          <Button
            onClick={handleSendScreenshot}
            disabled={isCapturing}
            variant="outline"
            className="flex-1 h-12 font-bold text-xs uppercase tracking-wider"
          >
            {isCapturing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
            Gerar Imagem do Relatório
          </Button>
          <Button
            onClick={handleWhatsAppExport}
            className="flex-1 h-12 bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-xs uppercase tracking-wider"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar como Texto
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="ghost" className="h-12 font-bold px-6">
            Fechar
          </Button>
        </div>
      }
    >
      <div className="absolute right-3 top-3 z-50">
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div 
        ref={contentRef}
        data-capture-container="true"
        className={cn(
          "w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100",
          isCapturing ? "h-auto overflow-visible p-10 bg-white" : "flex-1 overflow-y-auto px-6 py-4 custom-scrollbar"
        )}
        style={isCapturing ? { width: '900px' } : undefined}
      >
        <div className="space-y-8 max-w-5xl mx-auto">
          
          {!isCapturing && (
            <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit mx-auto border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <button
                onClick={() => setViewMode("winners")}
                className={cn(
                  "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  viewMode === "winners" 
                    ? "bg-white dark:bg-zinc-800 text-brand shadow-md" 
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                Ganhadores
              </button>
              <button
                onClick={() => setViewMode("comparative")}
                className={cn(
                  "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  viewMode === "comparative" 
                    ? "bg-white dark:bg-zinc-800 text-brand shadow-md" 
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                Comparativo Completo
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pb-6 border-b-2 border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl border-4 border-zinc-100">
                M
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                  Relatório de Negociação
                </h1>
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-brand">#{safeStr(quote.id).slice(0, 8)}</span>
                  <span className="text-zinc-300">•</span>
                  {safeStr(quote.dataInicio)}
                </p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <Badge className="bg-brand hover:bg-brand text-white font-black px-3 py-1 text-[10px] uppercase tracking-widest">
                {quote.status}
              </Badge>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">
                {fornecedoresRespondidos}/{fornecedores.length} Fornecedores Participantes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b-2 border-zinc-100 dark:border-zinc-900">
            <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-200 dark:shadow-none">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-[0.2em]">Economia Gerada</span>
              </div>
              <p className="text-4xl font-black text-emerald-600 tracking-tighter relative z-10">
                {formatCurrency(totalEconomiaReal || totalEconomiaPotencial)}
              </p>
              <p className="text-[10px] font-bold text-emerald-700/60 dark:text-emerald-500/60 uppercase mt-2 relative z-10">Eficiência capturada na negociação</p>
              
              {/* Subtle bar chart background for premium feel */}
              <div className="absolute bottom-0 right-0 flex items-end gap-1 p-2 opacity-10">
                <div className="w-2 h-8 bg-emerald-500 rounded-t-sm"></div>
                <div className="w-2 h-12 bg-emerald-500 rounded-t-sm"></div>
                <div className="w-2 h-6 bg-emerald-500 rounded-t-sm"></div>
                <div className="w-2 h-16 bg-emerald-500 rounded-t-sm"></div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 dark:bg-zinc-900 dark:border-zinc-700 rounded-3xl p-6 shadow-xl relative overflow-hidden group transition-all hover:shadow-2xl">
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 transition-all group-hover:scale-120"></div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="p-2 bg-brand rounded-xl text-black shadow-lg shadow-brand/20">
                  <DollarSign className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Total do Pedido</span>
              </div>
              <p className="text-4xl font-black text-white tracking-tighter relative z-10">
                {formatCurrency(totalMelhorPreco)}
              </p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2 relative z-10">Investimento total em {products.length} itens</p>
              
              <div className="absolute top-4 right-4 opacity-10 rotate-12">
                <Package className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Supplier Performance Ranking */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <Award className="h-4 w-4 text-brand" />
                  Performance dos Fornecedores
                </h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">Ranking baseado em itens arrematados</p>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-zinc-300 dark:border-zinc-700">
                Top {fornecedoresRanking.length} Participantes
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fornecedoresRanking.slice(0, 3).map((f, idx) => (
                <div key={f.id} className={cn(
                  "p-5 rounded-2xl border transition-all hover:scale-[1.02]",
                  idx === 0 
                    ? "bg-white dark:bg-zinc-800 border-brand/30 shadow-lg shadow-brand/5 ring-1 ring-brand/10" 
                    : "bg-white/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                      idx === 0 ? "bg-brand text-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    )}>
                      #{idx + 1} Lugar
                    </span>
                    {idx === 0 && <Sparkles className="h-3 w-3 text-brand" />}
                  </div>
                  <h4 className="font-black text-sm text-zinc-900 dark:text-white uppercase truncate mb-1">{f.nome}</h4>
                  <div className="flex items-end justify-between gap-2 mt-4">
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase leading-none mb-1">Itens</p>
                      <p className="text-lg font-black text-zinc-900 dark:text-white leading-none">{f.itensGanhos}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase leading-none mb-1">Valor</p>
                      <p className="text-sm font-black text-brand leading-none">{formatCurrency(f.total)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                {viewMode === "winners" ? "Vencedores por Fornecedor" : "Quadro Comparativo de Ofertas"}
              </h2>
              {isCapturing && (
                <span className="text-[10px] font-bold text-zinc-300 uppercase">Documento Auditado via CotaJá</span>
              )}
            </div>

            {viewMode === "winners" ? (
              <div className="space-y-6">
                {groupedProdutosPorVencedor.map(([supplierName, items], idx) => (
                  <div key={supplierName} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="bg-zinc-50/50 dark:bg-zinc-800/50 px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-zinc-900 dark:text-white uppercase tracking-tight">{supplierName}</h3>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">{items.length} itens conquistados</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-zinc-900 dark:text-white">{formatCurrency(items.reduce((acc, i) => acc + i.totalItem, 0))}</p>
                      </div>
                    </div>
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                      {items.map((p, pIdx) => (
                        <div key={p.productId} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-zinc-300">{pIdx + 1}</span>
                            <div>
                              <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase">{p.productName}</p>
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">
                                {p.quantidade} {p.unidade} • {formatCurrency(p.bestPrice)} / {p.unidade}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(p.totalItem)}</p>
                            {(p.priceSequence?.length || 0) > 1 && (
                              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] h-4 px-1.5 font-black uppercase mt-1">
                                Negociado
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {produtosComVencedor.map((p, idx) => (
                  <div key={p.productId} className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden transition-all hover:border-brand/40 group">
                    <div className="bg-zinc-900 dark:bg-zinc-800 px-8 py-6 flex items-center justify-between group-hover:bg-zinc-950 transition-colors">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-black font-black text-lg shadow-lg shadow-brand/20">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-black text-base text-white uppercase tracking-wider">{p.productName}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-400 font-bold uppercase tracking-widest px-2 py-0">
                              {p.quantidade} {p.unidade}
                            </Badge>
                            <span className="text-[10px] font-black text-brand uppercase tracking-tighter">🏆 {p.bestSupplier}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Total Item</p>
                        <p className="text-2xl font-black text-white tracking-tighter leading-none">{formatCurrency(p.totalItem)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      <div className="grid grid-cols-[1fr_120px_140px] px-8 py-3 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Fornecedor</span>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Unitário</span>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Total Ofertado</span>
                      </div>
                      {p.allOffers.map((offer, oIdx) => (
                        <div key={offer.supplierId} className={cn(
                          "px-8 py-5 grid grid-cols-[1fr_120px_140px] items-center transition-all",
                          offer.isWinner 
                            ? "bg-emerald-50/40 dark:bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/20" 
                            : "bg-white dark:bg-zinc-900/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border-2 transition-all",
                              offer.isWinner 
                                ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-200 dark:shadow-none scale-110" 
                                : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                            )}>
                              {offer.isWinner ? <CheckCircle2 className="h-3.5 w-3.5" /> : oIdx + 1}
                            </div>
                            <div className="flex flex-col">
                              <p className={cn(
                                "text-sm font-black uppercase tracking-tight", 
                                offer.isWinner ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"
                              )}>
                                {offer.supplierName}
                              </p>
                              {offer.isWinner && (
                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.1em] mt-0.5 flex items-center gap-1.5 bg-emerald-100/50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
                                  Melhor Oferta Identificada
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {offer.wasNegotiated ? (
                              <div>
                                <p className="text-[10px] text-zinc-400 line-through leading-none">{formatCurrency(offer.initialPrice)}</p>
                                <p className={cn(
                                  "text-sm font-bold",
                                  offer.isWinner ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-600"
                                )}>{formatCurrency(offer.price)}</p>
                              </div>
                            ) : (
                              <p className={cn(
                                "text-sm font-bold",
                                offer.isWinner ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500"
                              )}>{formatCurrency(offer.price)}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-lg font-black tracking-tighter leading-none", 
                              offer.isWinner ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"
                            )}>
                              {formatCurrency(offer.total)}
                            </p>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1">
                              {p.quantidade} {p.unidade}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-12 pb-6 border-t border-zinc-100 dark:border-zinc-900 text-center space-y-2">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Gestão de Suprimentos Auditada</p>
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-300 uppercase">
              <span>MGC Cotações</span>
              <span className="text-zinc-200">•</span>
              <span>Inteligência de Mercado</span>
            </div>
          </div>

        </div>
      </div>
    </ResponsiveModal>
  );
}
