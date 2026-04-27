import { useState, useMemo, Suspense, lazy, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, X, Package, DollarSign, ShoppingCart, Settings, Download, Loader2, Trash2, Sparkles } from "lucide-react";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { DeleteQuoteDialogLazy } from "@/components/forms/LazyDialogs";
import { supabase } from "@/integrations/supabase/client";
import { normalizePrice, PriceMetadata } from "@/utils/priceNormalization";

// Lazy loading dos componentes das abas
const QuoteSummaryTab = lazy(() => import("@/components/cotacoes/view-dialog/QuoteSummaryTab").then(m => ({ default: m.QuoteSummaryTab })));
const QuoteValuesTab = lazy(() => import("@/components/cotacoes/view-dialog/QuoteValuesTab").then(m => ({ default: m.QuoteValuesTab })));
const QuoteConversionTab = lazy(() => import("@/components/cotacoes/view-dialog/QuoteConversionTab").then(m => ({ default: m.QuoteConversionTab })));
const QuoteEditTab = lazy(() => import("@/components/cotacoes/view-dialog/QuoteEditTab").then(m => ({ default: m.QuoteEditTab })));

interface GerenciarCotacaoDialogProps {
  quote: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { Skeleton } from "@/components/ui/skeleton";
import ResumoCotacaoDialog from "./ResumoCotacaoDialog";

// Skeleton para cada aba
const TabSkeleton = ({ type }: { type: string }) => {
  if (type === 'resumo') {
    return (
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }
  if (type === 'valores') {
    return (
      <div className="h-full flex">
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 p-3 space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
        <div className="flex-1 p-5 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    );
  }
  return (
    <div className="p-5 space-y-4">
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );
};

import { designSystem } from "@/styles/design-system";

export function GerenciarCotacaoDialog({ quote: initialQuote, open, onOpenChange }: GerenciarCotacaoDialogProps) {
  const [activeTab, setActiveTab] = useState("resumo");
  const [showResumoDialog, setShowResumoDialog] = useState(false);

  useEffect(() => {
    if (activeTab === 'converter' && !open) setActiveTab('resumo');
  }, [open, activeTab]);

  const {
    cotacoes, // Get full list to find latest version
    updateQuoteItemPrice,
    addQuoteItem,
    removeQuoteItem,
    addQuoteSupplier,
    removeQuoteSupplier,
    updateQuoteItemQuantity,
    convertToOrder,
    deleteQuote,
    removeSupplierProduct,
    isUpdating
  } = useCotacoes();

  const { products: availableProducts } = useProducts();
  const { suppliers: availableSuppliers } = useSuppliers();

  // Find the latest version of this quote from the global state
  const quote = useMemo(() => {
    if (!initialQuote) return null;
    return cotacoes.find((c: any) => c.id === initialQuote.id) || initialQuote;
  }, [cotacoes, initialQuote]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug removido pois já confirmamos que o BD está OK
  const keyboardOffset = useKeyboardOffset();
  
  const isFinalizada = quote?.status === "finalizada";

  // Memos globais para evitar recálculos
  const products = useMemo(() => {
    if (!quote) return [];
    const rawItems = quote._raw?.quote_items || [];
    return rawItems.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantidade: item.quantidade,
      unidade: item.unidade
    })).sort((a: any, b: any) => (a.product_name || '').localeCompare(b.product_name || ''));
  }, [quote?._raw]);

  const fornecedores = useMemo(() => {
    if (!quote) return [];
    const rawSuppliers = quote._raw?.quote_suppliers || [];
    return rawSuppliers.map((cf: any) => {
      // Find the supplier info to get the contact (seller) name
      const supplierInfo = availableSuppliers?.find((s: any) => s.id === cf.supplier_id);
      return {
        id: cf.supplier_id,
        nome: cf.supplier_name,
        contato: supplierInfo?.contact || cf.supplier_name, // Fallback to company name
        phone: supplierInfo?.phone || "",
        status: cf.status,
        accessToken: cf.access_token
      };
    });
  }, [quote?._raw, availableSuppliers]);

  const supplierItems = useMemo(() => {
    if (!quote) return [];
    return quote._supplierItems || [];
  }, [quote?._supplierItems, quote]); // Add quote to dependency to force re-calc

  // Redirect if tab becomes invalid after finishing
  useEffect(() => {
    if (isFinalizada && (activeTab === 'converter' || activeTab === 'editar')) {
      setActiveTab('resumo');
    }
  }, [isFinalizada, activeTab]);

  // Helpers
  const safeStr = useCallback((val: any) => val || "", []);

  const getSupplierProductValue = useCallback((supplierId: string, productId: string) => {
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    return item?.valor_oferecido || 0;
  }, [supplierItems]);

  const getNormalizedTotalPrice = useCallback((supplierId: string, productId: string): number => {
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    if (!item || !item.valor_oferecido || item.valor_oferecido <= 0) return 0;

    const product = products.find((p: any) => p.product_id === productId);
    if (!product) return 0;

    try {
      const priceMetadata: PriceMetadata = {
        valorOferecido: item.valor_oferecido,
        unidadePreco: item.unidade_preco || 'un',
        fatorConversao: item.fator_conversao || undefined,
        quantidadePorEmbalagem: item.quantidade_por_embalagem || undefined,
      };

      const normalized = normalizePrice(priceMetadata, product.quantidade, product.unidade);
      return normalized.valorTotal;
    } catch (error) {
      console.error('Error normalizing total price:', error);
      return item.valor_oferecido * product.quantidade;
    }
  }, [supplierItems, products]);

  const getBestPriceInfoForProduct = useCallback((productId: string) => {
    let bestPrice = Infinity;
    let bestSupplierId = null;
    let bestSupplierName = "";

    // Filtra apenas preços > 0
    const validPrices = supplierItems.filter((i: any) => i?.product_id === productId && i?.valor_oferecido > 0);

    if (validPrices.length > 0) {
      validPrices.forEach((priceItem: any) => {
        if (priceItem.valor_oferecido < bestPrice) {
          bestPrice = priceItem.valor_oferecido;
          bestSupplierId = priceItem.supplier_id;
          const supplier = fornecedores.find((f: any) => f.id === priceItem.supplier_id);
          bestSupplierName = supplier ? supplier.nome : "";
        }
      });
    } else {
      bestPrice = 0;
    }

    return { bestPrice, bestSupplierId, bestSupplierName };
  }, [supplierItems, fornecedores]);

  // Cálculos para o Resumo
  const stats = useMemo(() => {
    const totalProdutos = products.length;
    const totalFornecedores = fornecedores.length;
    const fornecedoresRespondidos = fornecedores.filter((f: any) => f.status === 'respondido').length;

    let melhorTotal = 0;
    let melhorFornecedor = "";

    // Lógica simplificada para melhor fornecedor total (se necessário)

    return {
      totalProdutos,
      totalFornecedores,
      fornecedoresRespondidos,
      melhorValor: melhorTotal,
      melhorFornecedor
    };
  }, [products, fornecedores]);

  const melhorTotal = useMemo(() => {
    return products.reduce((total: number, product: any) => {
      const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
      return total + bestPrice;
    }, 0);
  }, [products, getBestPriceInfoForProduct]);

  const productPricesData = useMemo(() => {
    return products.map((product: any) => {
      const { bestPrice, bestSupplierId, bestSupplierName } = getBestPriceInfoForProduct(product.product_id);

      const allPrices = fornecedores.map((f: any) => {
        const item = supplierItems.find((i: any) => i?.supplier_id === f.id && i?.product_id === product.product_id);
        const currentPrice = item?.valor_oferecido || 0;
        const initialPrice = item?.price_history && item.price_history.length > 0 
          ? item.price_history[0].old_price 
          : currentPrice;

        return {
          nome: f.nome,
          fornecedorId: f.id,
          value: currentPrice,
          valor_inicial: initialPrice
        };
      }).filter((p: any) => p.value > 0).sort((a: any, b: any) => a.value - b.value);

      const averagePrice = allPrices.length > 0
        ? allPrices.reduce((acc: number, curr: any) => acc + curr.value, 0) / allPrices.length
        : 0;

      const savings = averagePrice > 0 && bestPrice > 0 ? averagePrice - bestPrice : 0;

      return {
        productId: product.product_id,
        productName: product.product_name,
        quantidade: product.quantidade,
        unidade: product.unidade,
        bestPrice,
        bestSupplierId,
        bestSupplierName,
        allPrices,
        savings
      };
    }).sort((a: any, b: any) => b.savings - a.savings);
  }, [products, fornecedores, getBestPriceInfoForProduct, getSupplierProductValue]);

  // Callbacks de Ação
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
  }, [queryClient]);

  const handleUpdateSupplierProductValue = useCallback(async (params: any) => {
    await updateQuoteItemPrice.mutateAsync(params);
  }, [updateQuoteItemPrice]);

  const handleRemoveSupplierProduct = useCallback(async (params: any) => {
    await removeSupplierProduct.mutateAsync(params);
  }, [removeSupplierProduct]);

  // Exportação em HTML
  const generateHtmlComparative = useCallback(() => {
    if (!quote || !products.length) return "";

    const formatCurrency = (value: number) => {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Calcular comparativo
    const comparison = products.map((product: any) => {
      const fornecedores = quote.fornecedoresParticipantes
        .map((f: any) => {
          // Normalizar valores para comparação
          const item = supplierItems.find((i: any) => i?.supplier_id === f.id && i?.product_id === product.product_id);
          const valor = item?.valor_oferecido || 0;
          const valorInicial = Number(item?.valor_inicial) || valor;

          let valorNormalizado = valor;
          if (item?.unidade_preco === 'cx' && item?.fator_conversao) {
            valorNormalizado = valor / item.fator_conversao;
          } else if (item?.unidade_preco === 'pct' && item?.fator_conversao) {
            valorNormalizado = valor / item.fator_conversao;
          } else if (item?.unidade_preco === 'kg' && product.unidade === 'g') {
            valorNormalizado = valor / 1000;
          } else if (item?.unidade_preco === 'ton' && product.unidade === 'kg') {
            valorNormalizado = valor / 1000;
          }

          return {
            supplierId: f.id,
            supplierName: f.nome,
            valorOferecido: valor,
            valorInicial: valorInicial,
            valorNormalizado: valorNormalizado,
            isMelhorPreco: false,
          };
        })
        .filter((f: any) => f.valorOferecido > 0);

      // Marcar melhor preço
      if (fornecedores.length > 0) {
        const menorValor = Math.min(...fornecedores.map((f: any) => f.valorNormalizado));
        fornecedores.forEach((f: any) => {
          if (f.valorNormalizado === menorValor) {
            f.isMelhorPreco = true;
          }
        });
      }

      return {
        productId: product.product_id,
        productName: product.product_name,
        quantidade: product.quantidade,
        unidade: product.unidade,
        fornecedores,
      };
    });

    // Calcular vencedores
    const wins: Record<string, { name: string; wins: number; totalValue: number }> = {};
    comparison.forEach((comp: any) => {
      const winner = comp.fornecedores.find((f: any) => f.isMelhorPreco);
      if (winner) {
        if (!wins[winner.supplierId]) {
          wins[winner.supplierId] = { name: winner.supplierName, wins: 0, totalValue: 0 };
        }
        wins[winner.supplierId].wins++;
        wins[winner.supplierId].totalValue += winner.valorOferecido;
      }
    });
    const winsPerSupplier = Object.values(wins).sort((a: any, b: any) => b.wins - a.wins);

    // Gerar HTML
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comparativo de Cotação - ${quote.id.substring(0, 8)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f3f4f6; color: #1f2937; line-height: 1.5; -webkit-font-smoothing: antialiased; }
    .container { max-width: 1200px; margin: 0 auto; padding: 30px; }
    
    /* Header */
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px 30px; border-radius: 16px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-bottom: 4px solid #10b981; }
    .header-content h1 { font-size: 28px; margin-bottom: 6px; font-weight: 900; letter-spacing: -0.5px; display: flex; align-items: center; gap: 12px; }
    .header-content p { font-size: 14px; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .header-badge { background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: right; }
    .header-badge span { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 4px; }
    .header-badge strong { font-size: 18px; font-weight: 800; color: #34d399; }

    /* Cards Informativos */
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .info-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; }
    .info-card strong { display: block; color: #64748b; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
    .info-card span { font-size: 16px; color: #0f172a; font-weight: 900; }

    /* Ranking */
    .winners-section { background: white; padding: 30px; border-radius: 16px; margin-bottom: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .winners-section h2 { color: #0f172a; margin-bottom: 20px; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; padding-bottom: 15px; border-bottom: 2px solid #f1f5f9; }
    .winners-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .winner-card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }
    .winner-card.first-place { background: linear-gradient(to right, #ecfdf5, #ffffff); border-color: #6ee7b7; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1); }
    .winner-card.first-place::before { content: '🥇 TOP 1'; position: absolute; top: 12px; right: 12px; background: #10b981; color: white; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 900; }
    .winner-card .rank { background: #1e293b; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 12px; width: max-content; }
    .winner-card.first-place .rank { background: #059669; }
    .winner-card .name { font-weight: 900; color: #0f172a; margin-bottom: 6px; font-size: 18px; letter-spacing: -0.5px; }
    .winner-card .wins { font-size: 13px; color: #64748b; font-weight: 600; }

    /* Comparativos */
    .comparatives { display: grid; gap: 24px; }
    .comparative-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .comparative-header { background: #f8fafc; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
    .comparative-header h3 { color: #0f172a; font-size: 16px; font-weight: 900; letter-spacing: -0.5px; }
    .comparative-header .qty { font-size: 12px; color: #64748b; font-weight: 800; background: #e2e8f0; padding: 4px 10px; border-radius: 6px; }
    
    .comparative-table { width: 100%; border-collapse: collapse; }
    .comparative-table th { background: white; padding: 14px 24px; text-align: left; font-weight: 800; font-size: 11px; color: #64748b; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 1px; }
    .comparative-table td { padding: 14px 24px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #334155; vertical-align: middle; }
    
    .winner-row { background: #ecfdf5 !important; }
    .winner-row td { color: #064e3b; }
    .winner-row td:first-child { font-weight: 800; border-left: 4px solid #10b981; padding-left: 20px; }
    .val-oferecido { color: #94a3b8; font-size: 12px; text-decoration: line-through; margin-right: 8px; font-weight: 500; }
    
    .badge { display: inline-flex; align-items: center; justify-content: center; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; }
    .badge-winner { background: #10b981; color: white; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2); }
    .badge-diff-low { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
    .badge-diff-med { background: #ffedd5; color: #ea580c; border: 1px solid #fdba74; }
    .badge-diff-high { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
    .badge-econ { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .econ-positive { color: #059669; font-weight: 800; }
    .econ-label { font-size: 11px; color: #059669; font-weight: 700; margin-left: 12px; }
    
    .no-response { padding: 30px; text-align: center; color: #94a3b8; font-weight: 600; font-style: italic; background: #f8fafc; }
    
    .footer { text-align: center; padding: 30px; color: #94a3b8; font-size: 12px; font-weight: 600; margin-top: 40px; }
    
    @media print {
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .container { max-width: 100%; padding: 0; }
      .header { border-radius: 0; margin-bottom: 20px; }
      .comparative-card { break-inside: avoid; border: 1px solid #e2e8f0; margin-bottom: 15px; }
      .winner-card { break-inside: avoid; }
      .info-grid { gap: 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <h1>📊 COMPARATIVO DE COTAÇÃO</h1>
        <p>Referência #${quote.id.substring(0, 8).toUpperCase()}</p>
      </div>
      <div class="header-badge">
        <span>Itens Analisados</span>
        <strong>${products.length}</strong>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <strong>Início da Cotação</strong>
        <span>${quote.dataInicio}</span>
      </div>
      <div class="info-card">
        <strong>Fim da Cotação</strong>
        <span>${quote.dataFim}</span>
      </div>
      <div class="info-card">
        <strong>Fornecedores</strong>
        <span>${quote.fornecedoresParticipantes.length} convidados</span>
      </div>
      <div class="info-card">
        <strong>Gerado em</strong>
        <span>${new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </div>

    ${winsPerSupplier.length > 0 ? `
    <div class="winners-section">
      <h2>🎯 Ranking de Vencedores</h2>
      <div class="winners-list">
        ${winsPerSupplier.map((w: any, idx: number) => `
          <div class="winner-card ${idx === 0 ? 'first-place' : ''}">
            <div class="rank">#${idx + 1} Lugar</div>
            <div class="name">${w.name}</div>
            <div class="wins">Arrematou <strong>${w.wins}</strong> ${w.wins === 1 ? 'produto' : 'produtos'}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="comparatives">
      ${comparison.map((comp: any, idx: number) => `
        <div class="comparative-card">
          <div class="comparative-header">
            <h3>
              <span>${idx + 1}. ${comp.productName}</span>
              <span class="qty">${comp.quantidade} ${comp.unidade}</span>
            </h3>
          </div>
          ${comp.fornecedores.length === 0 ? `
            <div class="no-response">
              Ninguém enviou preços para este item.
            </div>
          ` : `
            <table class="comparative-table">
              <thead>
                <tr>
                  <th>Fornecedor Participante</th>
                  <th>Val. Inicial</th>
                  <th>Proposta (Unidade/Quant.)</th>
                  <th>Preço Custo Normalizado</th>
                  <th>Economia</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                ${comp.fornecedores
        .sort((a: any, b: any) => a.valorNormalizado - b.valorNormalizado)
        .map((f: any) => {
          const melhorValor = Math.min(...comp.fornecedores.map((x: any) => x.valorNormalizado));
          const diferenca = melhorValor > 0 ? ((f.valorNormalizado - melhorValor) / melhorValor * 100) : 0;
          
          let diferencaClass = 'badge-diff-low';
          if (diferenca > 5 && diferenca <= 15) diferencaClass = 'badge-diff-med';
          if (diferenca > 15) diferencaClass = 'badge-diff-high';

          return `
                  <tr class="${f.isMelhorPreco ? 'winner-row' : ''}">
                    <td>${f.supplierName}</td>
                    <td>${f.valorInicial > 0 && Math.abs(f.valorInicial - f.valorOferecido) > 0.001 ? `R$ ${formatCurrency(f.valorInicial)}` : '-'}</td>
                    <td>
                      ${f.valorOferecido !== f.valorNormalizado ? `<span class="val-oferecido">R$ ${formatCurrency(f.valorOferecido)} original</span>` : `R$ ${formatCurrency(f.valorOferecido)}`}
                    </td>
                    <td><strong>R$ ${formatCurrency(f.valorNormalizado)}</strong></td>
                    <td>
                      ${f.valorInicial > 0 && f.valorInicial > f.valorOferecido
                        ? `<span class="econ-positive">R$ ${formatCurrency((f.valorInicial - f.valorOferecido) * (comp.quantidade || 1))}</span>`
                        : '-'
                      }
                    </td>
                    <td>
                      ${f.isMelhorPreco
              ? '<span class="badge badge-winner">🏆 Melhor Opção</span>'
              : `<span class="badge ${diferencaClass}">+${diferenca.toFixed(1)}% mais caro</span>`
            }
                    </td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          `}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Sistema CotaJá - Comparativo de Cotação</p>
      <p>Este documento foi gerado automaticamente e contém informações confidenciais.</p>
    </div>
  </div>
</body>
</html>
    `;

    return html;
  }, [quote, products, supplierItems]);

  const handleExportHtml = useCallback(() => {
    try {
      const html = generateHtmlComparative();
      if (!html) {
        toast({ title: "Erro ao gerar exportação", description: "Não há dados suficientes para exportar.", variant: "destructive" });
        return;
      }

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cotacao-${quote.id.substring(0, 8)}-${quote.dataInicio.replace(/\//g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: "Exportação concluída", description: "O arquivo foi baixado com sucesso." });
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast({ title: "Erro ao exportar", description: "Ocorreu um erro ao gerar o arquivo.", variant: "destructive" });
    }
  }, [generateHtmlComparative, quote, toast]);

  if (!mounted || !initialQuote || !quote) return null;

  const DialogContentComponent = isMobile ? DrawerContent : DialogContent;
  const DialogTitleComponent = isMobile ? DrawerTitle : DialogTitle;

  const modalContent = (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col min-h-0 bg-transparent overflow-hidden">
        {/* Header - Compacto e Responsivo */}
        <div className="flex items-center justify-between py-3 px-5 border-b bg-card min-h-[64px]">

          <div className="flex items-center gap-4 relative z-10 flex-1 min-w-0">
            {/* Título - Mais compacto */}
            <div className="flex items-center gap-3 min-w-max">
              <div className="p-2 rounded-[10px] bg-brand/10 border border-brand/20">
                <ClipboardList className="h-4 w-4 text-brand" />
              </div>
              <div className="flex flex-col">
                <DialogTitleComponent className="text-base font-black text-foreground tracking-tight leading-none mb-1">
                  Cotação
                </DialogTitleComponent>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">
                  #{safeStr(quote.id).substring(0, 8)}
                </span>
              </div>
            </div>

            {/* Tabs - Flexível e Desenhado como pílulas (Pills) */}
            <div className="flex-1 min-w-0 flex items-center pl-4 border-l border-border/50 ml-2">
              {isMobile ? (
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-32 h-8 rounded-lg text-[11px] font-bold bg-muted/50 border-transparent hover:bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { id: 'resumo', label: 'Resumo' },
                      { id: 'valores', label: 'Valores' },
                      { id: 'converter', label: 'Conversão', hide: isFinalizada },
                      { id: 'editar', label: 'Ajustes', hide: isFinalizada }
                    ].filter(tab => !tab.hide).map((tab) => (
                      <SelectItem key={tab.id} value={tab.id} className="text-xs font-semibold">
                        {tab.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <TabsList className="bg-muted/30 p-1 border border-border/50 rounded-xl h-auto flex gap-1">
                  {[
                    { id: 'resumo', label: 'Resumo' },
                    { id: 'valores', label: 'Valores' },
                    { id: 'converter', label: 'Decisão', hide: isFinalizada },
                    { id: 'editar', label: 'Configurações', hide: isFinalizada }
                  ].filter(tab => !tab.hide).map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="px-3 py-1.5 h-7 text-[10px] font-black uppercase tracking-widest text-muted-foreground rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            {!isMobile && (
              <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResumoDialog(true)}
                  className="text-brand hover:bg-brand/5 h-8 w-8 rounded-lg transition-all"
                  title="Relatório Profissional"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExportHtml}
                  className="text-muted-foreground hover:text-brand hover:bg-brand/5 h-8 w-8 rounded-lg transition-all"
                  title="Exportar HTML"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative bg-background/50 flex flex-col overflow-visible">
          <Suspense fallback={<TabSkeleton type={activeTab} />}>
            <TabsContent value="resumo" className="flex-1 min-h-0 m-0 p-0 overflow-y-auto custom-scrollbar data-[state=active]:flex flex-col">
              {activeTab === 'resumo' && (
                <QuoteSummaryTab
                  stats={stats}
                  melhorTotal={melhorTotal}
                  productPricesData={productPricesData}
                  safeStr={safeStr}
                />
              )}
            </TabsContent>

            <TabsContent value="valores" className="flex-1 min-h-0 m-0 p-0 overflow-hidden data-[state=active]:flex flex-col">
              {activeTab === 'valores' && (
                <QuoteValuesTab
                  products={products}
                  fornecedores={fornecedores}
                  quoteId={quote.id}
                  supplierItems={supplierItems}
                  onUpdateSupplierProductValue={handleUpdateSupplierProductValue}
                  onRemoveSupplierProduct={handleRemoveSupplierProduct}
                  onRefresh={handleRefresh}
                  isMobile={isMobile}
                  safeStr={safeStr}
                  getBestPriceInfoForProduct={getBestPriceInfoForProduct}
                  getNormalizedTotalPrice={getNormalizedTotalPrice}
                  getSupplierProductValue={getSupplierProductValue}
                  isReadOnly={isFinalizada}
                />
              )}
            </TabsContent>

            <TabsContent value="converter" className="flex-1 min-h-0 m-0 p-0 overflow-y-auto custom-scrollbar data-[state=active]:flex flex-col">
              {activeTab === 'converter' && (
                <QuoteConversionTab
                  products={products}
                  fornecedores={fornecedores}
                  quote={quote}
                  onConvertToOrder={(quoteId, orders) => convertToOrder.mutate({ quoteId, orders })}
                  onOpenChange={onOpenChange}
                  getSupplierProductValue={getSupplierProductValue}
                  getBestPriceInfoForProduct={getBestPriceInfoForProduct}
                  supplierItems={supplierItems}
                  safeStr={safeStr}
                  onShowResumo={() => setShowResumoDialog(true)}
                />
              )}
            </TabsContent>

            <TabsContent value="editar" className="flex-1 min-h-0 m-0 p-0 overflow-y-auto custom-scrollbar data-[state=active]:flex flex-col">
              {activeTab === 'editar' && (
                <QuoteEditTab
                  products={products}
                  fornecedores={fornecedores}
                  availableProducts={availableProducts || []}
                  availableSuppliers={availableSuppliers || []}
                  onAddQuoteItem={addQuoteItem.mutateAsync}
                  onRemoveQuoteItem={(productId) => removeQuoteItem.mutateAsync({ quoteId: quote.id, productId })}
                  onAddQuoteSupplier={(supplierId) => {
                    const supplier = availableSuppliers.find(s => s.id === supplierId);
                    return addQuoteSupplier.mutateAsync({
                      quoteId: quote.id,
                      supplierId,
                      supplierName: supplier?.name || "Desconhecido"
                    });
                  }}
                  onRemoveQuoteSupplier={(supplierId) => removeQuoteSupplier.mutateAsync({ quoteId: quote.id, supplierId })}
                  onUpdateQuoteItemQuantity={(productId, quantidade, unidade) => updateQuoteItemQuantity.mutateAsync({ quoteId: quote.id, productId, quantidade, unidade })}
                  quoteId={quote.id}
                  safeStr={safeStr}
                />
              )}
            </TabsContent>
          </Suspense>
        </div>
      </Tabs>

      {/* Footer */}
      {isMobile && (
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-card">

          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportHtml}
            className="text-muted-foreground hover:text-brand hover:bg-brand/10 h-10 w-10 rounded-xl transition-all"
            title="Exportar"
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      )}


    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="rounded-t-2xl p-0 overflow-hidden flex flex-col bg-background border-t border-border"
          style={{
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '95vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '95vh',
            paddingBottom: keyboardOffset > 0 ? 0 : 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          <DrawerTitle className="sr-only">Gerenciar Cotação</DrawerTitle>
          <DrawerDescription className="sr-only">Detalhes e ações da cotação</DrawerDescription>
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[1000px] h-[85vh] p-0 overflow-hidden [&>button]:hidden flex flex-col border border-border/50 bg-card rounded-2xl shadow-2xl">
          <DialogTitle className="sr-only">Gerenciar Cotação</DialogTitle>
          <DialogDescription className="sr-only">Detalhes e ações da cotação</DialogDescription>
          {modalContent}
        </DialogContent>
      </Dialog>

      {showResumoDialog && (
        <ResumoCotacaoDialog
          open={showResumoDialog}
          onOpenChange={setShowResumoDialog}
          quote={quote}
        />
      )}
    </>
  );
}
