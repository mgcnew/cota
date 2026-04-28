import { useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package, Building2, DollarSign, Calendar, ClipboardList,
  TrendingDown, Award, X, Check, CheckCircle2, Clock, Sparkles, MessageCircle,
  Camera, Loader2, ArrowRight, Info, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/utils/formatters";
import { generateQuoteExportMessage, generateComparativeQuoteExportMessage, sendWhatsAppMedia, generateWhatsAppGreeting, generateQuoteReportHTML } from "@/lib/whatsapp-service";
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
  const isMobile = useIsMobile();
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

  // Economia capturada: valor_inicial do vencedor - valor_final do vencedor × quantidade
  const totalEconomiaCalculada = useMemo(() => {
    return produtosComVencedor.reduce((sum, p) => {
      const winnerOffer = (p.allOffers || []).find((o: any) => o.isWinner);
      if (!winnerOffer) return sum;
      const inicial = winnerOffer.initialPrice || 0;
      const final_ = winnerOffer.price || 0;
      if (inicial > final_ && final_ > 0) {
        return sum + (inicial - final_) * (p.quantidade || 1);
      }
      return sum;
    }, 0);
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

  const getReportHTMLOpts = () => ({
    quoteId: safeStr(quote.id),
    dateLabel: safeStr(quote.dataInicio),
    companyName: company?.name || "MERCADÃO NOVO BOI JOÃO DIAS",
    totalProdutos: products.length,
    totalFornecedores: fornecedores.length,
    fornecedoresRespondidos,
    totalMelhorPreco,
    totalEconomiaReal: totalEconomiaReal || totalEconomiaCalculada || totalEconomiaPotencial,
    productsData: produtosComVencedor,
    viewMode,
    groupedData: Object.values(
      produtosComVencedor.reduce((acc: Record<string, any>, p: any) => {
        const name = p.bestSupplier || "Pendente / Sem Vencedor";
        if (!acc[name]) acc[name] = { name, items: [], total: 0 };
        acc[name].items.push(p);
        acc[name].total += p.totalItem;
        return acc;
      }, {})
    ).sort((a: any, b: any) => {
      if (a.name === "Pendente / Sem Vencedor") return 1;
      if (b.name === "Pendente / Sem Vencedor") return -1;
      return a.name.localeCompare(b.name);
    })
  });

  const handleWhatsAppExport = async () => {
    if (!contentRef.current) return;
    setIsCapturing(true);

    try {
      // 1. Capture the visible report as image
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

      // 2. Short greeting caption
      const greeting = generateWhatsAppGreeting(
        safeStr(quote.id),
        products.length,
        company?.name
      );

      // 3. Generate HTML report content
      const opts = getReportHTMLOpts();
      const { generateQuoteReportHTML, sendWhatsAppReport, DEFAULT_PHONE_NUMBER } = await import("@/lib/whatsapp-service");
      const htmlContent = generateQuoteReportHTML(opts);

      // 4. Send via API (image + document + greeting)
      toast.promise(
        sendWhatsAppReport(
          DEFAULT_PHONE_NUMBER,
          base64Image,
          htmlContent,
          safeStr(quote.id),
          greeting,
          company?.id
        ),
        {
          loading: 'Enviando relatório completo para WhatsApp...',
          success: (res: any) => {
            if (res?.success === false) throw new Error(res.error || "Erro desconhecido");
            return 'Relatório enviado com sucesso via WhatsApp!';
          },
          error: (err) => `Falha no envio: ${err.message}`
        }
      );
    } catch (error: any) {
      toast.error("Erro ao capturar relatório: " + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadHTML = () => {
    const html = generateQuoteReportHTML(getReportHTMLOpts());
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-cotacao-${safeStr(quote.id).slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Relatório HTML baixado com sucesso!");
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

  const modalContent = (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between py-3 px-5 border-b bg-card min-h-[56px]">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <div className="hidden sm:flex p-2 rounded-[10px] bg-brand/10 border border-brand/20 flex-shrink-0">
            <Sparkles className="h-4 w-4 text-brand" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm md:text-base font-black text-foreground tracking-tight leading-none mb-1 truncate">
              Resumo da Negociação
            </h2>
            <span className="hidden sm:inline text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">
              #{safeStr(quote.id).substring(0, 8)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
          {/* View Toggle */}
          {!isCapturing && (
            <div className="flex p-0.5 bg-muted rounded-lg border border-border/50 mr-1 md:mr-2">
              <button
                onClick={() => setViewMode("winners")}
                className={cn(
                  "px-1 md:px-3 py-1 rounded-md text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === "winners"
                    ? "bg-background text-brand shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Ganhadores
              </button>
              <button
                onClick={() => setViewMode("comparative")}
                className={cn(
                  "px-1 md:px-3 py-1 rounded-md text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === "comparative"
                    ? "bg-background text-brand shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Comp.
              </button>
            </div>
          )}

          <div className="flex items-center gap-0.5 md:gap-1 border-r border-border pr-1 md:pr-2 mr-1">
            <Button variant="ghost" size="icon" onClick={handleDownloadHTML} className="h-7 w-7 md:h-8 md:w-8 rounded-lg text-brand hover:bg-brand/5" title="Baixar HTML">
              <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleWhatsAppExport} disabled={isCapturing} className="h-7 w-7 md:h-8 md:w-8 rounded-lg text-brand hover:bg-brand/5" title="Enviar WhatsApp">
              {isCapturing ? <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-7 w-7 md:h-8 md:w-8 rounded-lg hover:bg-accent">
            <X className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={contentRef}
        data-capture-container="true"
        className={cn(
          "flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-background/50",
          isCapturing ? "h-auto overflow-visible p-10 bg-white" : "px-5 py-5"
        )}
        style={isCapturing ? { width: '1050px' } : undefined}
      >
        <div className="space-y-5 max-w-full mx-auto">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <div className="bg-card border border-border rounded-xl p-2.5 md:p-3">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
                <div className="p-1 bg-brand/10 rounded-md"><Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3 text-brand" /></div>
                <span className="text-[7px] md:text-[8px] font-black text-muted-foreground uppercase tracking-widest">Status</span>
              </div>
              <Badge className="bg-brand/10 text-brand border-brand/20 font-black text-[8px] md:text-[9px] uppercase tracking-widest px-1.5 py-0">{quote.status}</Badge>
            </div>
            <div className="bg-card border border-border rounded-xl p-2.5 md:p-3">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
                <div className="p-1 bg-muted rounded-md"><Building2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground" /></div>
                <span className="text-[7px] md:text-[8px] font-black text-muted-foreground uppercase tracking-widest">Respondentes</span>
              </div>
              <p className="text-base md:text-lg font-black text-foreground leading-none">{fornecedoresRespondidos}<span className="text-[10px] md:text-xs text-muted-foreground font-bold">/{fornecedores.length}</span></p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2.5 md:p-3">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
                <div className="p-1 bg-emerald-500 rounded-md text-white"><TrendingDown className="h-2.5 w-2.5 md:h-3 md:w-3" /></div>
                <span className="text-[7px] md:text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Economia</span>
              </div>
              <p className="text-base md:text-lg font-black text-emerald-600 tracking-tighter leading-none truncate" title={formatCurrency(totalEconomiaReal || totalEconomiaCalculada || totalEconomiaPotencial)}>
                {formatCurrency(totalEconomiaReal || totalEconomiaCalculada || totalEconomiaPotencial)}
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 md:p-3">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
                <div className="p-1 bg-brand rounded-md text-black"><DollarSign className="h-2.5 w-2.5 md:h-3 md:w-3" /></div>
                <span className="text-[7px] md:text-[8px] font-black text-zinc-400 uppercase tracking-widest">Total Pedido</span>
              </div>
              <p className="text-base md:text-lg font-black text-white tracking-tighter leading-none truncate" title={formatCurrency(totalMelhorPreco)}>
                {formatCurrency(totalMelhorPreco)}
              </p>
            </div>
          </div>

          <div className="bg-muted/30 border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                  <Award className="h-3.5 w-3.5 text-brand" />
                  Performance de Fornecedores
                </h3>
              </div>
              <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tight bg-background">
                {fornecedoresRanking.length} Ativos
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fornecedoresRanking.slice(0, 3).map((f, idx) => (
                <div key={f.id} className={cn(
                  "p-4 rounded-xl border transition-all",
                  idx === 0 
                    ? "bg-background border-brand/30 shadow-sm ring-1 ring-brand/5" 
                    : "bg-background/50 border-border"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                      idx === 0 ? "bg-brand text-black" : "bg-muted text-muted-foreground"
                    )}>
                      #{idx + 1}
                    </span>
                    {idx === 0 && <Sparkles className="h-3 w-3 text-brand" />}
                  </div>
                  <h4 className="font-black text-xs text-foreground uppercase truncate mb-1">{f.nome}</h4>
                  <div className="flex items-end justify-between gap-2 mt-3">
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase leading-none mb-1">Itens</p>
                      <p className="text-base font-black text-foreground leading-none">{f.itensGanhos}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase leading-none mb-1">Total</p>
                      <p className="text-xs font-black text-brand leading-none">{formatCurrency(f.total)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                {viewMode === "winners" ? "Itens por Ganhador" : "Painel Comparativo"}
              </h2>
            </div>

            {viewMode === "winners" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groupedProdutosPorVencedor.map(([supplierName, items]) => (
                  <div key={supplierName} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="bg-muted/40 px-4 py-3 flex items-center justify-between border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-brand/10 border border-brand/20 rounded-lg flex items-center justify-center text-brand">
                          <Building2 className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <h3 className="font-black text-xs text-foreground uppercase tracking-tight">{supplierName}</h3>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">{items.length} itens ganhos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-foreground">{formatCurrency(items.reduce((acc, i) => acc + i.totalItem, 0))}</p>
                      </div>
                    </div>
                    <div className="divide-y divide-border/40">
                      {items.map((p, pIdx) => (
                        <div key={p.productId} className="px-4 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-muted-foreground w-4">{pIdx + 1}</span>
                            <div>
                              <p className="text-xs font-bold text-foreground uppercase truncate max-w-[200px] sm:max-w-md">{p.productName}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                {p.quantidade} {p.unidade} • {formatCurrency(p.bestPrice)} / {p.unidade}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-foreground">{formatCurrency(p.totalItem)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {produtosComVencedor.map((p, idx) => (
                  <div key={p.productId} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:border-brand/40 group">
                    <div className="bg-muted/50 px-5 py-3 flex items-center justify-between border-b border-border/60">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-zinc-950 dark:bg-zinc-900 rounded-lg flex items-center justify-center text-brand font-black text-xs border border-zinc-800 shadow-inner">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-foreground uppercase tracking-tight">{p.productName}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[8px] border-border text-muted-foreground font-bold uppercase tracking-widest h-4 px-1.5 py-0">
                              {p.quantidade} {p.unidade}
                            </Badge>
                            <span className="text-[9px] font-bold text-brand uppercase tracking-tighter flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" /> {p.bestSupplier}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Total Item</p>
                        <p className="text-lg font-black text-foreground tracking-tighter leading-none">{formatCurrency(p.totalItem)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1">
                      <div className="grid grid-cols-[1fr_minmax(70px,auto)_minmax(85px,auto)] md:grid-cols-[1fr_120px_140px] gap-2 px-3 md:px-5 py-2 bg-muted/20 border-b border-border/40">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest truncate">Fornecedor</span>
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest text-right">Unitário</span>
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest text-right">Total</span>
                      </div>
                      {p.allOffers.map((offer, oIdx) => (
                        <div key={offer.supplierId} className={cn(
                          "px-3 md:px-5 py-2.5 grid grid-cols-[1fr_minmax(70px,auto)_minmax(85px,auto)] md:grid-cols-[1fr_120px_140px] gap-2 items-center transition-all border-b border-border/20 last:border-0",
                          offer.isWinner 
                            ? "bg-brand/5 dark:bg-brand/10" 
                            : "bg-background hover:bg-muted/30"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded flex items-center justify-center text-[9px] font-black border transition-all",
                              offer.isWinner 
                                ? "bg-brand border-brand text-black shadow-sm" 
                                : "bg-muted border-border text-muted-foreground"
                            )}>
                              {offer.isWinner ? <Check className="h-3 w-3" strokeWidth={4} /> : oIdx + 1}
                            </div>
                            <div className="flex flex-col">
                              <p className={cn(
                                "text-[11px] font-black uppercase tracking-tight", 
                                offer.isWinner ? "text-brand" : "text-foreground"
                              )}>
                                {offer.supplierName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            {offer.wasNegotiated ? (
                              <div className="flex flex-col items-end">
                                <span className="text-[8px] text-muted-foreground line-through leading-none">{formatCurrency(offer.initialPrice)}</span>
                                <span className={cn(
                                  "text-[10px] md:text-[11px] font-bold",
                                  offer.isWinner ? "text-brand" : "text-foreground"
                                )}>{formatCurrency(offer.price)}</span>
                              </div>
                            ) : (
                              <span className={cn(
                                "text-[10px] md:text-[11px] font-bold",
                                offer.isWinner ? "text-brand" : "text-foreground"
                              )}>{formatCurrency(offer.price)}</span>
                            )}
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <p className={cn(
                              "text-[11px] md:text-[13px] font-black tracking-tight leading-none", 
                              offer.isWinner ? "text-brand" : "text-foreground"
                            )}>
                              {formatCurrency(offer.total)}
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

        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="rounded-t-2xl p-0 overflow-hidden flex flex-col bg-background border-t border-border"
          style={{ height: '95vh', maxHeight: '95vh' }}
        >
          <DrawerTitle className="sr-only">Resumo da Negociação</DrawerTitle>
          <DrawerDescription className="sr-only">Relatório de negociação da cotação</DrawerDescription>
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] h-[85vh] p-0 overflow-hidden [&>button]:hidden flex flex-col border border-border/50 bg-card rounded-2xl shadow-2xl">
        <DialogTitle className="sr-only">Resumo da Negociação</DialogTitle>
        <DialogDescription className="sr-only">Relatório de negociação da cotação</DialogDescription>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
