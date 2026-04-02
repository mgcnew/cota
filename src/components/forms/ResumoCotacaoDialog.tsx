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
import { generateQuoteExportMessage, sendWhatsAppMedia } from "@/lib/whatsapp-service";
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

      return {
        productId: p.product_id,
        productName: p.product_name,
        quantidade: qtd,
        unidade: p.unidade,
        bestPrice: best.price,
        bestSupplier: best.supplier,
        winnerId,
        totalItem: best.price * qtd,
        priceSequence
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

  // Agrupar produtos por fornecedor vendedor para layout mais claro
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
      
      const raw = quote as any;
      const supplierItems = raw._supplierItems || raw._raw?.quote_supplier_items || [];
      const allPrices = fornecedores.map((f: any) => {
        const item = supplierItems.find((i: any) => i?.supplier_id === f.id && i?.product_id === p.productId);
        const currentPrice = item?.valor_oferecido || 0;
        const initialPrice = item?.price_history && item.price_history.length > 0 ? item.price_history[0].old_price : currentPrice;
        return { nome: f.nome, fornecedorId: f.id, value: currentPrice, valor_inicial: initialPrice };
      }).filter((pr: any) => pr.value > 0).sort((a: any, b: any) => a.value - b.value);

      groups[supplierName].items.push({ ...p, allPrices });
      groups[supplierName].total += p.totalItem;
    });

    const groupedDataExport = Object.values(groups).sort((a, b) => {
      if (a.name === "Pendente / Sem Vencedor") return 1;
      if (b.name === "Pendente / Sem Vencedor") return -1;
      return a.name.localeCompare(b.name);
    });

    // Enviar economia real como prioridade no relatório de texto também
    const economiaReport = totalEconomiaReal > 0 ? totalEconomiaReal : totalEconomiaPotencial;

    const exportMsg = generateQuoteExportMessage(
      statsExport,
      groupedDataExport,
      totalEconomiaReal,
      totalMelhorPreco,
      (quote as any).analise_ia,
      totalEconomiaPotencial
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
      // Delay pequeno para o React aplicar as classes de "Relatorio Mode"
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(contentRef.current, {
        useCORS: true,
        scale: 2, 
        backgroundColor: '#ffffff', // Forçar fundo branco e limpo para o relatório visual
        logging: false,
        width: contentRef.current.scrollWidth,
        height: contentRef.current.scrollHeight, // Capturar tudo (mesmo o que tem scroll)
        onclone: (clonedDoc) => {
          // Forçar modo claro no clone para o print ficar sempre profissional (diurno)
          const el = clonedDoc.querySelector('[data-capture-container="true"]') as HTMLElement;
          if (el) {
            el.classList.remove('dark');
            el.classList.add('light');
            el.style.backgroundColor = '#ffffff';
            el.style.color = '#000000';
            
            // Remover dark da raiz do clone
            clonedDoc.documentElement.classList.remove('dark');
            clonedDoc.body.classList.remove('dark');
          }
        }
      });

      const base64Image = canvas.toDataURL("image/jpeg", 0.85); // JPEG rápido e leve
      
      const targetPhone = prompt("Para qual número (WhatsApp) deseja enviar o Relatório Gráfico? (Com DDD)", "");
      
      if (!targetPhone) {
        setIsCapturing(false);
        return;
      }

      const cleanPhone = targetPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        toast.error("Número inválido");
        setIsCapturing(false);
        return;
      }

      const result = await sendWhatsAppMedia(
        cleanPhone,
        base64Image,
        `📊 *Relatório Gráfico de Negociação - Cotação #${safeStr(quote.id).slice(0, 8)}*\n\n_Documento emitido pelo sistema de compras._`
      );

      if (result.success) {
        toast.success("Resumo enviado com sucesso!");
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Erro ao capturar/enviar print:", error);
      toast.error("Erro ao enviar resumo gráfico: " + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const melhorFornecedor = fornecedoresRanking.length > 0 ? fornecedoresRanking[0] : null;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      hideClose
      title="Relatório de Negociação"
      description={`Cód. #${safeStr(quote.id).slice(0, 8)}`}
      desktopMaxWidth="xl"
      className={cn(
        "shadow-2xl [&>button]:hidden flex flex-col overflow-hidden",
        // Fazer a janela inteira ter fundo limpo para virar documento
        "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
      )}
      footer={
        <div className="flex w-full gap-2">
          <Button
            onClick={handleSendScreenshot}
            disabled={isCapturing}
            variant="outline"
            className="flex-1 h-10 rounded-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
          >
            {isCapturing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
            Capturar Relatório
          </Button>
          <Button
            onClick={handleWhatsAppExport}
            className="flex-1 h-10 rounded-lg bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-xs shadow-sm transition-all uppercase tracking-wider"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Exportar Texto
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            size="sm"
            variant="ghost"
            className="px-4 h-10 font-bold"
          >
            Fechar
          </Button>
        </div>
      }
    >
      <div className="absolute right-3 top-3 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className={cn(ds.components.button.ghost, ds.components.button.size.icon, "!bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800")}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>

      <div 
        ref={contentRef}
        data-capture-container="true"
        className={cn(
          "w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-8",
          isCapturing ? "h-auto overflow-visible p-6 rounded-none shadow-none text-black bg-white" : "flex-1 min-h-0 overflow-y-auto px-4 py-2 custom-scrollbar",
        )}
        style={isCapturing ? { width: '850px' } : undefined} // Se for capturar, crava um width bom para relatórios (A4 style)
      >
        <div className={cn("space-y-6 max-w-4xl mx-auto", isCapturing ? "!text-black" : "")}>

          {/* ── HEADER PROFISSIONAL ── */}
          <div className={cn("flex items-start justify-between pb-4 border-b", isCapturing ? "border-zinc-300" : "border-zinc-200 dark:border-zinc-800")}>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center text-white dark:text-zinc-900 font-black text-xl shadow-lg">
                M
              </div>
              <div>
                <h1 className={cn("text-xl tracking-tight uppercase font-black")}>
                  Relatório de Negociação <span className="text-zinc-400 font-normal text-sm">#{safeStr(quote.id).slice(0, 8)}</span>
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <StatusBadge status={quote.status} />
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <Calendar className="h-3 w-3" />
                    {safeStr(quote.dataInicio)} — {safeStr(quote.dataFim)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className={cn("text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1")}>
                Desempenho da Cotação
              </p>
              <div className="flex items-center justify-end gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <Package className="h-4 w-4 text-zinc-400" />
                {products.length} Itens
                <span className="text-zinc-300 mx-1">|</span>
                <Building2 className="h-4 w-4 text-zinc-400" />
                {fornecedoresRespondidos}/{fornecedores.length} Fornecedores
              </div>
            </div>
          </div>

          {/* ── PAINEL DE KPI / ECONOMIA ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className={cn("rounded-xl p-5 border shadow-sm flex flex-col justify-center", isCapturing ? "border-emerald-200 bg-emerald-50" : "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20")}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className={cn("h-5 w-5", isCapturing ? "text-emerald-600" : "text-emerald-600 dark:text-emerald-400")} />
                <span className={cn("text-xs uppercase tracking-widest font-bold", isCapturing ? "text-emerald-700" : "text-emerald-700 dark:text-emerald-400")}>
                  Economia Real Negociada
                </span>
              </div>
              <p className={cn("text-3xl font-black", isCapturing ? "text-emerald-600" : "text-emerald-600 dark:text-emerald-400")}>
                {formatCurrency(totalEconomiaReal)}
              </p>
              <p className={cn("text-xs font-medium mt-1", isCapturing ? "text-emerald-600/70" : "text-emerald-600/70 dark:text-emerald-400/70")}>
                Valor exato descontado durante as rodadas de oferta
              </p>
            </div>

            <div className={cn("rounded-xl p-5 border shadow-sm flex flex-col justify-center", isCapturing ? "border-zinc-200 bg-zinc-50" : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50")}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className={cn("h-5 w-5", isCapturing ? "text-zinc-600" : "text-zinc-500")} />
                <span className={cn("text-xs uppercase tracking-widest font-bold", isCapturing ? "text-zinc-600" : "text-zinc-500")}>
                  Total do Pedido Fechado
                </span>
              </div>
              <p className={cn("text-3xl font-black", isCapturing ? "text-zinc-900" : "text-zinc-900 dark:text-white")}>
                {formatCurrency(totalMelhorPreco)}
              </p>
              <p className={cn("text-xs font-medium mt-1", isCapturing ? "text-zinc-500" : "text-zinc-500")}>
                Soma de todos os itens com os melhores fornecedores
              </p>
            </div>
          </div>

          <div className={cn("w-full h-px", isCapturing ? "bg-zinc-200" : "bg-zinc-200 dark:bg-zinc-800")} />

          {/* ── RESULTADOS DETALHADOS POR FORNECEDOR ── */}
          <div className="space-y-6">
            <h2 className={cn("text-xs uppercase tracking-widest font-bold", isCapturing ? "text-zinc-400 text-center" : "text-zinc-400")}>
              Detalhamento da Negociação por Fornecedor (Itens Arrematados)
            </h2>

            {groupedProdutosPorVencedor.map(([supplierName, itemsGanhos], gIdx) => {
              const totalFornecedor = itemsGanhos.reduce((acc, i) => acc + i.totalItem, 0);
              
              return (
                <div key={supplierName} className={cn("rounded-xl border overflow-hidden", isCapturing ? "border-zinc-300" : "border-zinc-200 dark:border-zinc-800")}>
                  {/* Fornecedor Header */}
                  <div className={cn("px-4 py-3 flex items-center justify-between border-b", isCapturing ? "bg-zinc-100 border-zinc-300" : "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800")}>
                    <div className="flex items-center gap-2">
                      <Award className={cn("h-5 w-5", supplierName !== 'Pendente' ? "text-brand" : "text-zinc-400")} />
                      <h3 className={cn("font-bold text-sm", isCapturing ? "text-zinc-900" : "")}>{supplierName}</h3>
                      <Badge variant="outline" className={cn("ml-2 text-[10px]", isCapturing ? "border-zinc-400 text-zinc-600" : "border-zinc-300 dark:border-zinc-700")}>
                        {itemsGanhos.length} {itemsGanhos.length === 1 ? 'item' : 'itens'}
                      </Badge>
                    </div>
                    <span className={cn("font-black text-sm", isCapturing ? "text-zinc-900" : "")}>
                      {formatCurrency(totalFornecedor)}
                    </span>
                  </div>

                  {/* Lista de Itens do Fornecedor */}
                  <div className={cn("divide-y", isCapturing ? "divide-zinc-200" : "divide-zinc-100 dark:divide-zinc-800", isCapturing ? "bg-white" : "")}>
                    {itemsGanhos.map((p, idx) => {
                      const hasNegotiation = p.priceSequence && p.priceSequence.length > 1;
                      const initialPrice = hasNegotiation ? p.priceSequence[0] : p.bestPrice;
                      const econUnit = initialPrice - p.bestPrice;
                      const totalEcon = econUnit * p.quantidade;

                      return (
                        <div key={p.productId} className={cn("p-4", isCapturing ? "hover:bg-transparent" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40")}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className={cn("text-sm font-bold", isCapturing ? "text-zinc-900" : "")}>
                                {idx + 1}. {p.productName}
                              </p>
                              <p className={cn("text-xs", isCapturing ? "text-zinc-600" : "text-zinc-500")}>
                                Qtd: <span className="font-semibold">{p.quantidade} {p.unidade}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn("text-sm font-bold", isCapturing ? "text-zinc-900" : "")}>
                                {formatCurrency(p.bestPrice)} <span className={cn("font-normal text-[10px]", isCapturing ? "text-zinc-500" : "text-zinc-500")}>/ {p.unidade}</span>
                              </p>
                              <p className={cn("text-xs font-semibold", isCapturing ? "text-zinc-700" : "")}>
                                Total: {formatCurrency(p.totalItem)}
                              </p>
                            </div>
                          </div>

                          {/* Bloco de Negociação */}
                          {hasNegotiation ? (
                            <div className={cn("mt-3 rounded-lg p-3 border", isCapturing ? "bg-brand/5 border-brand/20" : "bg-brand/5 dark:bg-brand/10 border-brand/20")}>
                              <div className="flex justify-between items-center mb-2">
                                <span className={cn("text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5", isCapturing ? "text-brand" : "text-brand")}>
                                  <TrendingDown className="h-3.5 w-3.5" /> Negociação com Sucesso
                                </span>
                                <div className="flex flex-col items-end">
                                  <span className={cn("text-[10px] uppercase font-black tracking-wider", isCapturing ? "text-emerald-700" : "text-emerald-600 dark:text-emerald-400")}>
                                    Ganho Real: {formatCurrency(totalEcon)}
                                  </span>
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase">
                                    Redução de {((econUnit / initialPrice) * 100).toFixed(1)}% capturada
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                                <div className="flex items-center gap-1.5 min-w-max">
                                  {p.priceSequence.map((val: number, sIdx: number) => {
                                    const isFirst = sIdx === 0;
                                    const isLast = sIdx === p.priceSequence.length - 1;
                                    
                                    return (
                                      <div key={sIdx} className="flex items-center gap-1.5">
                                        <div className={cn(
                                          "px-2 py-1 rounded-md text-[11px] font-black flex flex-col items-center min-w-[70px]",
                                          isLast 
                                            ? "bg-brand text-black shadow-sm" 
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 line-through opacity-60"
                                        )}>
                                          <span className="text-[7px] uppercase tracking-tighter leading-none mb-0.5">
                                            {isFirst ? "1ª Oferta" : isLast ? "Fechado" : `${sIdx + 1}ª Rodada`}
                                          </span>
                                          {formatCurrency(val)}
                                        </div>
                                        {!isLast && <ArrowRight className="h-3 w-3 text-zinc-300" />}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className={cn("mt-2 rounded bg-zinc-50 px-3 py-1.5 flex items-center text-[10px] text-zinc-500 font-medium uppercase tracking-wider", isCapturing ? "border border-zinc-200" : "dark:bg-zinc-900 border border-zinc-100/5 dark:border-zinc-800")}>
                              <Info className="h-3.5 w-3.5 mr-2 text-zinc-400" /> Item fechado pelo lance inicial (Sem recuo necessário)
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── RODAPÉ PARA O DOCUMENTO/PRINT ── */}
          <div className={cn("pt-8 pb-4 text-center border-t mt-8", isCapturing ? "border-zinc-300" : "border-zinc-200 dark:border-zinc-800")}>
            <p className={cn("text-[10px] uppercase tracking-widest font-bold", isCapturing ? "text-zinc-500" : "text-zinc-500")}>
              Este relatório reflete a performance de negociação da equipe de suprimentos.
            </p>
            <p className={cn("text-[9px] mt-1", isCapturing ? "text-zinc-400" : "text-zinc-500")}>
              Gerado via MGC Cotações
            </p>
          </div>
          
        </div>
      </div>
    </ResponsiveModal>
  );
}
