import { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import {
  Package, Building2, DollarSign, CheckCircle2, Clock,
  TrendingDown, Award, Loader2, Save, X, Trophy, Star, Edit2, Plus, Trash2, Settings, FileDown, Download, Eye, FileText, Info,
  Copy, Check, MessageCircle, ShoppingCart, MoreHorizontal, Send, Search
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingQuoteDisplay } from "@/types/packaging";
import type { PackagingItem } from "@/types/packaging";
import type { Supplier } from "@/hooks/useSuppliers";
import { PACKAGING_SALE_UNITS } from "@/types/packaging";
import jsPDF from "jspdf";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { ResumoTab } from "./quote-tabs/ResumoTab";
import { TabSkeleton, ValoresTabSkeleton } from "./quote-tabs/TabSkeleton";
import { generateWhatsAppMessage } from "@/lib/gemini";
import { sendWhatsApp } from "@/lib/whatsapp-service";

// Lazy load heavy tabs
const ConvertTab = lazy(() => import("./quote-tabs/ConvertTab").then(m => ({ default: m.ConvertTab })));

async function getShortLink(tokens: string): Promise<string | null> {
  try {
    const { data: existing } = await supabase
      .from('short_links').select('id').eq('original_tokens', tokens).maybeSingle();
    if (existing) return existing.id;
    const slug = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from('short_links').insert([{ id: slug, original_tokens: tokens }]);
    if (error) throw error;
    return slug;
  } catch { return null; }
}


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PackagingQuoteDisplay | null;
  availablePackagingItems?: PackagingItem[];
  availableSuppliers?: Supplier[];
}

export function ManagePackagingQuoteDialog({ 
  open, 
  onOpenChange, 
  quote,
  availablePackagingItems = [],
  availableSuppliers = []
}: Props) {
  const { 
    updateSupplierItem, 
    getComparison, 
    updateQuoteStatus,
    addQuoteSupplier,
    removeQuoteSupplier,
    addQuoteItem,
    removeQuoteItem
  } = usePackagingQuotes();
  
  const { toast } = useToast();
  const { orders } = usePackagingOrders();
  
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("resumo");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingItem, setEditingItem] = useState<{ supplierId: string; packagingId: string } | null>(null);
  const [formData, setFormData] = useState({
    valorTotal: "", unidadeVenda: "kg", quantidadeVenda: "",
    quantidadeUnidadesEstimada: "", gramatura: "", dimensoes: "",
  });
  
  // Estados para adicionar itens/fornecedores
  const [selectedPackagingToAdd, setSelectedPackagingToAdd] = useState("");
  const [selectedSupplierToAdd, setSelectedSupplierToAdd] = useState("");
  // Busca única (aba Editar) — adiciona embalagem ou fornecedor
  const [editSearch, setEditSearch] = useState("");
  
  const valorTotalInputRef = useRef<HTMLInputElement>(null);

  // Scroll into view helper para inputs
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isMobile) return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // Helper para obter a data da última compra
  const getLastPurchaseInfo = useCallback((packagingId: string) => {
    // Encontra o pedido mais recente que contém este item
    // Os pedidos já vêm ordenados por data de criação decrescente do hook
    const lastOrder = orders.find(order => 
      order.status !== 'cancelado' && 
      order.itens.some(item => item.packagingId === packagingId)
    );

    if (!lastOrder) return null;
    
    // Encontra o item específico dentro do pedido para pegar o preço se necessário
    const item = lastOrder.itens.find(i => i.packagingId === packagingId);
    
    return {
      date: lastOrder.orderDate, // Já está formatada como DD/MM/YYYY
      price: item?.valorUnitario || 0,
      supplierName: lastOrder.supplierName
    };
  }, [orders]);

  useEffect(() => {
    if (editingItem && open) {
      setTimeout(() => {
        valorTotalInputRef.current?.focus();
        valorTotalInputRef.current?.select();
      }, 100);
    }
  }, [editingItem, open]);

  useEffect(() => {
    if (open && quote && quote.fornecedores.length > 0 && !selectedSupplier) {
      setSelectedSupplier(quote.fornecedores[0].supplierId);
    }
    if (open && quote?.status === "concluida" && (activeTab === "editar" || activeTab === "valores")) {
      setActiveTab("resumo");
    }
    if (!open) {
      setSelectedSupplier("");
      setEditingItem(null);
      setSelectedPackagingToAdd("");
      setSelectedSupplierToAdd("");
      setActiveTab("resumo");
    }
  }, [open, quote, selectedSupplier, activeTab]);

  // Keyboard shortcuts: Ctrl+1-5 for tabs, Escape to close
  useEffect(() => {
    if (!open) return;
    const TAB_MAP: Record<string, string> = { '1': 'resumo', '2': 'editar', '3': 'valores', '4': 'converter' };
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && TAB_MAP[e.key]) {
        e.preventDefault();
        setActiveTab(TAB_MAP[e.key]);
      }
      if (e.key === 'Escape' && !editingItem) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, editingItem, onOpenChange]);

  const comparison = useMemo(() => quote ? getComparison(quote) : [], [quote, getComparison]);

  const bestPricesData = useMemo(() => {
    if (!quote) return [];
    return quote.itens.map(item => {
      let bestPrice = Infinity;
      let bestSupplierId: string | null = null;
      let bestSupplierName = "";
      const allPrices: { supplierId: string; supplierName: string; custoPorUnidade: number; valorTotal: number }[] = [];

      quote.fornecedores.forEach(fornecedor => {
        const supplierItem = fornecedor.itens.find(si => si.packagingId === item.packagingId);
        // Relaxed condition: include if has unit cost OR has total value
        const price = supplierItem?.custoPorUnidade || (supplierItem?.valorTotal ? (supplierItem.valorTotal / (supplierItem.quantidadeUnidadesEstimada || 1)) : 0);
        
        if (price > 0) {
          allPrices.push({
            supplierId: fornecedor.supplierId, 
            supplierName: fornecedor.supplierName,
            custoPorUnidade: price, 
            valorTotal: supplierItem?.valorTotal || 0
          });
          if (price < bestPrice) {
            bestPrice = price;
            bestSupplierId = fornecedor.supplierId;
            bestSupplierName = fornecedor.supplierName;
          }
        }
      });

      allPrices.sort((a, b) => a.custoPorUnidade - b.custoPorUnidade);
      const worstPrice = allPrices.length > 0 ? allPrices[allPrices.length - 1].custoPorUnidade : 0;
      const savings = worstPrice > 0 && bestPrice < Infinity ? worstPrice - bestPrice : 0;

      return { 
        packagingId: item.packagingId, 
        packagingName: item.packagingName, 
        bestPrice: bestPrice === Infinity ? 0 : bestPrice, 
        bestSupplierId, 
        bestSupplierName, 
        allPrices, 
        savings 
      };
    });
  }, [quote]);

  const handleCopyBestPricesSummary = useCallback(() => {
    if (!quote || !bestPricesData.length) return;
    
    let text = `🏆 *RESUMO DE MELHORES PREÇOS - EMBALAGENS*\n`;
    text += `*Cotação:* ${quote.dataInicio} - ${quote.dataFim}\n\n`;
    
    bestPricesData.forEach((item, idx) => {
      text += `${idx + 1}. *${item.packagingName}*\n`;
      if (item.bestPrice > 0) {
        text += `   💰 Melhor: ${formatCurrency(item.bestPrice)}/un (${item.bestSupplierName})\n`;
        if (item.savings > 0) text += `   📈 Econ. estimada: ${formatCurrency(item.savings)}/un\n`;
      } else {
        text += `   âš ï¸ Sem ofertas preenchidas\n`;
      }
      text += `\n`;
    });
    
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Resumo de melhores preços copiado." });
  }, [quote, bestPricesData, toast]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);

  const isPronta = useMemo(() => {
    if (!quote) return false;
    const resp = quote.fornecedores.filter(f => f.status === "respondido").length;
    return quote.status === "ativa" && resp === quote.fornecedores.length && quote.fornecedores.length > 0;
  }, [quote]);

  const handleSendWhatsApp = useCallback(async (supplierId: string) => {
    if (!quote) return;
    const fornecedor = quote.fornecedores.find(f => f.supplierId === supplierId);
    const fullData = availableSuppliers.find(s => s.id === supplierId);
    if (!fornecedor) return;
    setSendingId(supplierId);
    try {
      const phone = fullData?.phone;
      const contact = fullData?.contact || fornecedor.supplierName;
      const accessToken = (fornecedor as any).access_token;
      let msg = await generateWhatsAppMessage(contact, quote.itens, !!accessToken, true);
      if (accessToken) {
        const baseUrl = "https://cotaja.vercel.app";
        const shortId = await getShortLink(accessToken);
        msg += shortId ? `\n${baseUrl}/r/${shortId}\n\n` : `\n${baseUrl}/responder/${accessToken}\n\n`;
      }
      if (phone) {
        const result = await sendWhatsApp(phone, msg) as any;
        if (!result?.success) {
          window.open(`https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
        } else {
          toast({ title: "Enviado!", description: `WhatsApp enviado para ${fornecedor.supplierName}.` });
        }
      } else {
        navigator.clipboard.writeText(msg);
        toast({ title: "Sem telefone cadastrado", description: "Mensagem copiada para a área de transferência." });
      }
      setSentIds(prev => new Set(prev).add(supplierId));
    } catch {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    } finally {
      setSendingId(null);
    }
  }, [quote, availableSuppliers, toast]);

  const handleSendWhatsAppAll = useCallback(async () => {
    if (!quote) return;
    for (const f of quote.fornecedores) {
      if (!sentIds.has(f.supplierId)) await handleSendWhatsApp(f.supplierId);
    }
  }, [quote, sentIds, handleSendWhatsApp]);

  const handleCopySupplierSummary = useCallback((group: any) => {
    try {
      let text = `📋 *COMPARATIVO DE EMBALAGENS*\n`;
      text += `*Fornecedor:* ${group.supplierName}\n`;
      text += `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n`;
      
      const vitorias = group.itens.filter((i: any) => i.isMelhorPreco);
      if (vitorias.length > 0) {
        text += `âœ… *ITENS COM MELHOR PREÇO (${vitorias.length}):*\n`;
        vitorias.forEach((item: any) => {
          text += `â€¢ ${item.packagingName}: ${formatCurrency(item.custoPorUnidade)}/un\n`;
          text += `  (Total: ${formatCurrency(item.valorTotal)} - ${item.quantidadeVenda}${item.unidadeVenda})\n`;
        });
        text += `\n*TOTAL VENCIDO: ${formatCurrency(group.valorTotalGanhos)}*\n\n`;
      }

      const outros = group.itens.filter((i: any) => !i.isMelhorPreco);
      if (outros.length > 0) {
        text += `📊 *OUTROS ITENS COTADOS:*\n`;
        outros.forEach((item: any) => {
          text += `â€¢ ${item.packagingName}: ${formatCurrency(item.custoPorUnidade)}/un (+${item.diferencaPercentual.toFixed(1)}%)\n`;
        });
      }

      navigator.clipboard.writeText(text);
      setCopiedId(group.supplierId);
      toast({ title: "Copiado!", description: "Resumo copiado para a área de transferência." });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  }, [toast]);

  const handleExportSupplierHtml = useCallback((group: any) => {
    if (!quote) return;
    
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta de Embalagens - ${group.supplierName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, system-ui, sans-serif; padding: 40px 20px; background: #f9fafb; color: #111827; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e5e7eb; }
    .header { margin-bottom: 30px; border-bottom: 2px solid #111827; padding-bottom: 20px; }
    .header h1 { font-size: 24px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .header p { color: #6b7280; font-size: 14px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; padding: 12px; background: #f3f4f6; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #4b5563; }
    td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .winner { background: #ecfdf5; color: #065f46; font-weight: 700; }
    .total-box { margin-top: 30px; padding: 20px; background: #111827; color: white; border-radius: 12px; display: flex; justify-between; align-items: center; }
    .total-label { font-size: 12px; text-transform: uppercase; font-weight: 800; opacity: 0.7; }
    .total-value { font-size: 24px; font-weight: 900; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Resumo de Cotação</h1>
      <p><strong>Fornecedor:</strong> ${group.supplierName}</p>
      <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
      <p><strong>Cotação:</strong> ${quote.dataInicio} - ${quote.dataFim}</p>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Formato</th>
          <th>Preço Unit.</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${group.itens.map((item: any) => `
          <tr class="${item.isMelhorPreco ? 'winner' : ''}">
            <td>${item.packagingName}${item.isMelhorPreco ? ' â˜…' : ''}</td>
            <td>${item.quantidadeVenda} ${item.unidadeVenda}</td>
            <td>${formatCurrency(item.custoPorUnidade)}</td>
            <td>${formatCurrency(item.valorTotal)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="total-box">
      <div>
        <p class="total-label">Total Vencido em Vitórias</p>
        <p style="font-size: 14px; opacity: 0.8;">${group.vitorias} itens com melhor preço</p>
      </div>
      <div style="text-align: right; margin-left: auto;">
        <p class="total-value">${formatCurrency(group.valorTotalGanhos)}</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Gerado automaticamente pelo Sistema CotaJá â€¢ Embalagens</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `proposta-embalagens-${group.supplierName.replace(/\s+/g, '-')}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast({ title: "Exportado!", description: "Arquivo HTML gerado com sucesso." });
  }, [quote, toast]);

  const comparisonBySupplier = useMemo(() => {
    if (!quote || !comparison.length) return [];
    
    return quote.fornecedores.map(fornecedor => {
      const items = comparison.map(comp => {
        const supplierResult = comp.fornecedores.find(f => f.supplierId === fornecedor.supplierId);
        if (!supplierResult) return null;
        
        return {
          packagingId: comp.packagingId,
          packagingName: comp.packagingName,
          ...supplierResult
        };
      }).filter((i): i is NonNullable<typeof i> => i !== null);
      
      return {
        supplierId: fornecedor.supplierId,
        supplierName: fornecedor.supplierName,
        itens: items,
        vitorias: items.filter(i => i.isMelhorPreco).length,
        valorTotalGanhos: items.filter(i => i.isMelhorPreco).reduce((sum, item) => sum + (item.valorTotal || 0), 0)
      };
    }).filter(s => s.itens.length > 0).sort((a, b) => b.vitorias - a.vitorias);
  }, [quote, comparison]);

  // Embalagens e fornecedores não presentes na cotação
  const packagingNotInQuote = useMemo(() => {
    if (!quote) return availablePackagingItems;
    const idsInQuote = quote.itens.map(i => i.packagingId);
    return availablePackagingItems.filter(p => !idsInQuote.includes(p.id));
  }, [quote, availablePackagingItems]);

  const suppliersNotInQuote = useMemo(() => {
    if (!quote) return availableSuppliers;
    const idsInQuote = quote.fornecedores.map(f => f.supplierId);
    return availableSuppliers.filter(s => !idsInQuote.includes(s.id));
  }, [quote, availableSuppliers]);

  const handleStatusChange = useCallback((status: string) => {
    if (quote && status !== quote.status) updateQuoteStatus.mutate({ quoteId: quote.id, status });
  }, [quote, updateQuoteStatus]);

  const custoPorUnidadePreview = useMemo(() => {
    const valor = parseFloat(formData.valorTotal.replace(',', '.')) || 0;
    const unidades = parseFloat(formData.quantidadeUnidadesEstimada.replace(',', '.')) || 0;
    return valor > 0 && unidades > 0 ? valor / unidades : null;
  }, [formData.valorTotal, formData.quantidadeUnidadesEstimada]);

  const handleEditItem = useCallback((supplierId: string, packagingId: string) => {
    if (!quote) return;
    const fornecedor = quote.fornecedores.find(f => f.supplierId === supplierId);
    const item = fornecedor?.itens.find(i => i.packagingId === packagingId);
    setFormData({
      valorTotal: item?.valorTotal?.toString() || "", unidadeVenda: item?.unidadeVenda || "kg",
      quantidadeVenda: item?.quantidadeVenda?.toString() || "", quantidadeUnidadesEstimada: item?.quantidadeUnidadesEstimada?.toString() || "",
      gramatura: item?.gramatura?.toString() || "", dimensoes: item?.dimensoes || "",
    });
    setEditingItem({ supplierId, packagingId });
    setSelectedSupplier(supplierId);
    setActiveTab("valores");
  }, [quote]);

  const handleSaveItem = useCallback(async () => {
    if (!editingItem || !quote) return;
    await updateSupplierItem.mutateAsync({
      quoteId: quote.id, supplierId: editingItem.supplierId, packagingId: editingItem.packagingId,
      valorTotal: parseFloat(formData.valorTotal.replace(',', '.')) || 0, unidadeVenda: formData.unidadeVenda,
      quantidadeVenda: parseFloat(formData.quantidadeVenda.replace(',', '.')) || 1, quantidadeUnidadesEstimada: parseInt(formData.quantidadeUnidadesEstimada.replace(',', '.')) || 1,
      gramatura: formData.gramatura ? parseFloat(formData.gramatura.replace(',', '.')) : undefined, dimensoes: formData.dimensoes || undefined,
    });
    setEditingItem(null);
  }, [editingItem, quote, formData, updateSupplierItem]);

  const handleAddPackaging = useCallback(() => {
    if (!quote || !selectedPackagingToAdd) return;
    const pkg = availablePackagingItems.find(p => p.id === selectedPackagingToAdd);
    if (!pkg) return;
    addQuoteItem.mutate({ quoteId: quote.id, packagingId: pkg.id, packagingName: pkg.name });
    setSelectedPackagingToAdd("");
  }, [quote, selectedPackagingToAdd, availablePackagingItems, addQuoteItem]);

  const handleRemovePackaging = useCallback((packagingId: string) => {
    if (!quote) return;
    removeQuoteItem.mutate({ quoteId: quote.id, packagingId });
  }, [quote, removeQuoteItem]);

  const handleAddPackagingById = useCallback((id: string) => {
    if (!quote) return;
    const pkg = availablePackagingItems.find(p => p.id === id);
    if (!pkg) return;
    addQuoteItem.mutate({ quoteId: quote.id, packagingId: pkg.id, packagingName: pkg.name });
  }, [quote, availablePackagingItems, addQuoteItem]);

  const handleAddSupplierById = useCallback((id: string) => {
    if (!quote) return;
    const supplier = availableSuppliers.find(s => s.id === id);
    if (!supplier) return;
    addQuoteSupplier.mutate({ quoteId: quote.id, supplierId: supplier.id, supplierName: supplier.name });
  }, [quote, availableSuppliers, addQuoteSupplier]);

  const handleAddSupplier = useCallback(() => {
    if (!quote || !selectedSupplierToAdd) return;
    const supplier = availableSuppliers.find(s => s.id === selectedSupplierToAdd);
    if (!supplier) return;
    addQuoteSupplier.mutate({ quoteId: quote.id, supplierId: supplier.id, supplierName: supplier.name });
    setSelectedSupplierToAdd("");
  }, [quote, selectedSupplierToAdd, availableSuppliers, addQuoteSupplier]);

  const handleRemoveSupplier = useCallback((supplierId: string) => {
    if (!quote) return;
    removeQuoteSupplier.mutate({ quoteId: quote.id, supplierId });
    if (selectedSupplier === supplierId) setSelectedSupplier("");
  }, [quote, selectedSupplier, removeQuoteSupplier]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && editingItem && formData.valorTotal) {
      e.preventDefault(); handleSaveItem();
    } else if (e.key === "Escape" && editingItem) {
      e.preventDefault(); setEditingItem(null);
    }
  }, [editingItem, formData.valorTotal, handleSaveItem]);

  // Função para gerar PDF comparativo
  const handleGeneratePDF = useCallback(() => {
    if (!quote || !comparison.length) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Cores
    const primary = [31, 41, 55]; // gray-800
    const accent = [107, 114, 128]; // gray-500
    const success = [10, 10, 10]; // black
    const gray = [156, 163, 175]; // gray-400

    // Header com fundo escuro
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("COMPARATIVO DE COTAÇÃO", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Embalagens", pageWidth / 2, 23, { align: "center" });
    doc.setFontSize(9);
    doc.text(`Período: ${quote.dataInicio} a ${quote.dataFim}`, pageWidth / 2, 30, { align: "center" });

    y = 45;

    // Info da cotação
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, y);
    doc.text(`Total: ${quote.itens.length} embalagens | ${quote.fornecedores.length} fornecedores`, pageWidth - margin, y, { align: "right" });
    
    y += 15;

    // Para cada embalagem
    comparison.forEach((comp, idx) => {
      // Verificar se precisa de nova página
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Título da embalagem com fundo
      doc.setFillColor(249, 250, 251); // gray-50
      doc.rect(margin, y - 5, pageWidth - margin * 2, 10, 'F');
      
      doc.setTextColor(17, 24, 39); // gray-900
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}. ${comp.packagingName}`, margin + 3, y + 2);
      
      y += 12;

      if (comp.fornecedores.length === 0) {
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Nenhum fornecedor respondeu", margin + 5, y);
        y += 15;
        return;
      }

      // Cabeçalho da tabela
      doc.setFillColor(243, 244, 246); // gray-100
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("FORNECEDOR", margin + 3, y);
      doc.text("VALOR", margin + 70, y);
      doc.text("CUSTO/UN", margin + 100, y);
      doc.text("STATUS", margin + 140, y);
      
      y += 8;

      // Linhas dos fornecedores
      comp.fornecedores.forEach((f, fIdx) => {
        const isWinner = f.isMelhorPreco;
        
        if (isWinner) {
          doc.setFillColor(243, 244, 246); // gray-100 (destaque sutil)
          doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');
        }

        doc.setFont("helvetica", isWinner ? "bold" : "normal");
        doc.setFontSize(9);
        
        // Nome do fornecedor
        doc.setTextColor(31, 41, 55); // gray-800
        const supplierName = f.supplierName.length > 25 ? f.supplierName.substring(0, 22) + "..." : f.supplierName;
        doc.text(supplierName, margin + 3, y);
        
        // Valor
        doc.text(`R$ ${f.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 70, y);
        
        // Custo por unidade
        if (isWinner) {
          doc.setTextColor(0, 0, 0); // Black
        } else {
          doc.setTextColor(gray[0], gray[1], gray[2]);
        }
        doc.text(`R$ ${f.custoPorUnidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 100, y);
        
        // Status
        if (isWinner) {
          doc.setTextColor(0, 0, 0); // Black
          doc.text("🏆 MELHOR PREÇO", margin + 140, y);
        } else {
          doc.setTextColor(107, 114, 128); // gray-500
          doc.text(`+${f.diferencaPercentual.toFixed(1)}%`, margin + 140, y);
        }
        
        y += 8;
      });

      y += 10;
    });

    // Resumo final
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    y += 5;
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(margin, y - 5, pageWidth - margin * 2, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO DOS VENCEDORES", margin + 5, y + 3);
    
    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Contar vitórias por fornecedor
    const winsPerSupplier: Record<string, { name: string; wins: number }> = {};
    comparison.forEach(comp => {
      const winner = comp.fornecedores.find(f => f.isMelhorPreco);
      if (winner) {
        if (!winsPerSupplier[winner.supplierId]) {
          winsPerSupplier[winner.supplierId] = { name: winner.supplierName, wins: 0 };
        }
        winsPerSupplier[winner.supplierId].wins++;
      }
    });

    const sortedWinners = Object.values(winsPerSupplier).sort((a, b) => b.wins - a.wins);
    const winnersText = sortedWinners.map(w => `${w.name}: ${w.wins} item(s)`).join(" | ");
    doc.text(winnersText || "Nenhum vencedor definido", margin + 5, y + 5);
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 290, { align: "center" });
      doc.text("Sistema CotaJá - Comparativo de Embalagens", margin, 290);
    }

    // Salvar
    doc.save(`cotacao-embalagens-${quote.dataInicio.replace(/\//g, '-')}.pdf`);
  }, [quote, comparison]);

  // Handle loading state when open but no quote
  if (!quote && open) {
    const DialogContentComponent = isMobile ? DrawerContent : DialogContent;
    return (
      isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="h-[95vh] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </DialogContent>
        </Dialog>
      )
    );
  }

  // Função para gerar HTML comparativo
  const generateHtmlComparative = useCallback(() => {
    if (!quote || !comparison.length) return "";

    const winsPerSupplier: Record<string, { name: string; wins: number }> = {};
    comparison.forEach(comp => {
      const winner = comp.fornecedores.find(f => f.isMelhorPreco);
      if (winner) {
        if (!winsPerSupplier[winner.supplierId]) {
          winsPerSupplier[winner.supplierId] = { name: winner.supplierName, wins: 0 };
        }
        winsPerSupplier[winner.supplierId].wins++;
      }
    });

    const sortedWinners = Object.values(winsPerSupplier).sort((a, b) => b.wins - a.wins);

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comparativo de Cotação - Embalagens</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; color: #1f2937; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 40px 20px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
    .header p { font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .info-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #1f2937; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .info-card strong { display: block; color: #1f2937; margin-bottom: 5px; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
    .info-card span { font-size: 14px; color: #4b5563; font-weight: 600; }
    .winners-section { background: white; padding: 25px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .winners-section h2 { color: #111827; margin-bottom: 15px; font-size: 18px; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .winners-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
    .winner-card { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .winner-card .rank { display: inline-block; background: #111827; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }
    .winner-card .name { font-weight: 700; color: #111827; margin-bottom: 5px; }
    .winner-card .wins { font-size: 14px; color: #4b5563; }
    .comparatives { display: grid; gap: 20px; }
    .comparative-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .comparative-header { background: #f9fafb; padding: 15px; border-bottom: 2px solid #1f2937; }
    .comparative-header h3 { color: #111827; font-size: 16px; display: flex; align-items: center; gap: 8px; font-weight: 800; }
    .comparative-table { width: 100%; border-collapse: collapse; }
    .comparative-table th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 1px; }
    .comparative-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .comparative-table tr:hover { background: #f9fafb; }
    .winner-row { background: #f3f4f6 !important; }
    .winner-row td { font-weight: 700; color: #000; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .badge-winner { background: #000; color: white; }
    .badge-difference { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; }
    @media (max-width: 768px) {
      .header h1 { font-size: 22px; }
      .info-grid { grid-template-columns: 1fr; }
      .winners-list { grid-template-columns: 1fr; }
      .comparative-table { font-size: 12px; }
      .comparative-table th, .comparative-table td { padding: 8px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 COMPARATIVO DE COTAÇÃO</h1>
      <p>Embalagens</p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <strong>Período</strong>
        <span>${quote.dataInicio} a ${quote.dataFim}</span>
      </div>
      <div class="info-card">
        <strong>Embalagens</strong>
        <span>${quote.itens.length} itens</span>
      </div>
      <div class="info-card">
        <strong>Fornecedores</strong>
        <span>${quote.fornecedores.length} participantes</span>
      </div>
      <div class="info-card">
        <strong>Gerado em</strong>
        <span>${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</span>
      </div>
    </div>

    ${sortedWinners.length > 0 ? `
    <div class="winners-section">
      <h2>🎯 Vencedores por Fornecedor</h2>
      <div class="winners-list">
        ${sortedWinners.map((w, idx) => `
          <div class="winner-card">
            <div class="rank">#${idx + 1} - ${w.wins} ${w.wins === 1 ? 'item' : 'itens'}</div>
            <div class="name">${w.name}</div>
            <div class="wins">Melhor preço em ${w.wins} ${w.wins === 1 ? 'embalagem' : 'embalagens'}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="comparatives">
      ${comparison.map((comp, idx) => `
        <div class="comparative-card">
          <div class="comparative-header">
            <h3>${idx + 1}. ${comp.packagingName}</h3>
          </div>
          ${comp.fornecedores.length === 0 ? `
            <div style="padding: 20px; text-align: center; color: #9ca3af;">
              Nenhum fornecedor respondeu
            </div>
          ` : `
            <table class="comparative-table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Valor</th>
                  <th>Custo/Un</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${comp.fornecedores.map((f, fIdx) => `
                  <tr class="${f.isMelhorPreco ? 'winner-row' : ''}">
                    <td>${f.supplierName}</td>
                    <td>R$ ${f.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td><strong>R$ ${f.custoPorUnidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                    <td>
                      ${f.isMelhorPreco 
                        ? '<span class="badge badge-winner">🏆 MELHOR PREÇO</span>'
                        : '<span class="badge badge-difference">+' + f.diferencaPercentual.toFixed(1) + '%</span>'
                      }
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Sistema CotaJá - Comparativo de Embalagens</p>
      <p>Este documento foi gerado automaticamente e contém informações confidenciais.</p>
    </div>
  </div>
</body>
</html>
    `;

    return html;
  }, [quote, comparison]);

  // Função para baixar HTML
  const handleDownloadHtml = useCallback(() => {
    const html = generateHtmlComparative();
    if (!html || !quote) return;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cotacao-embalagens-${quote.dataInicio.replace(/\//g, '-')}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [generateHtmlComparative, quote]);

  if (!quote && open) {
    const DialogContentComponent = isMobile ? DrawerContent : DialogContent;
    return (
      isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="h-[95vh] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </DialogContent>
        </Dialog>
      )
    );
  }

  if (!quote) return null;

  const stats = {
    totalEmbalagens: quote.itens.length,
    totalFornecedores: quote.fornecedores.length,
    fornecedoresRespondidos: quote.fornecedores.filter(f => f.status === "respondido").length,
  };

  const exportDisabled = comparison.length === 0 || comparison.every(c => c.fornecedores.length === 0);

  const DialogContentComponent = isMobile ? DrawerContent : DialogContent;
  const DialogHeaderComponent = isMobile ? DrawerHeader : DialogHeader;
  const DialogTitleComponent = isMobile ? DrawerTitle : DialogTitle;
  const DialogDescriptionComponent = isMobile ? DrawerDescription : DialogDescription;

  const content = (
    <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 border-b border-border dark:border-white/5 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20 flex-shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitleComponent className="text-sm font-bold text-foreground tracking-tight leading-tight">
                Gerenciar Cotação
              </DialogTitleComponent>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <span className="text-[11px] text-muted-foreground">
                  {quote.dataInicio} – {quote.dataFim}
                </span>
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                    <Package className="h-3 w-3" />{stats.totalEmbalagens}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                    <Building2 className="h-3 w-3" />{stats.totalFornecedores}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />{stats.fornecedoresRespondidos}/{stats.totalFornecedores}
                  </span>
                </div>
              </div>
            </div>
            {/* Ações de exportação + fechar */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleGeneratePDF} disabled={exportDisabled} title="Baixar PDF"
                className="h-8 px-2.5 gap-1.5 text-[11px] font-bold border-border hover:bg-muted rounded-lg">
                <Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">PDF</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadHtml} disabled={exportDisabled} title="Baixar HTML"
                className="h-8 px-2.5 gap-1.5 text-[11px] font-bold border-border hover:bg-muted rounded-lg">
                <FileText className="h-3.5 w-3.5" /><span className="hidden sm:inline">HTML</span>
              </Button>
              {/* X only on desktop — drawer closes by swipe on mobile */}
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}
                className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogDescriptionComponent className="sr-only">Gerenciar cotação de embalagens</DialogDescriptionComponent>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 border-b border-border dark:border-white/5 bg-muted/20">

            {/* Mobile: 3 tabs + "Mais" dropdown */}
            <div className="flex md:hidden">
              <TabsList className="flex-1 grid grid-cols-3 h-auto p-0 bg-transparent rounded-none border-none shadow-none gap-0">
                {[
                  { value: "resumo",      icon: <Trophy className="h-4 w-4" />,      label: "Resumo"  },
                  { value: "valores",     icon: <DollarSign className="h-4 w-4" />,  label: "Valores" },
                  { value: "converter",   icon: <ShoppingCart className="h-4 w-4" />, label: "Pedido" },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex flex-col items-center gap-1 py-2.5 h-auto rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-brand data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand text-muted-foreground border-b-2 border-transparent transition-colors"
                  >
                    {tab.icon}
                    <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* "Editar" — única aba oculta no mobile (exportação foi para o header) */}
              {quote?.status !== "concluida" && (
                <button
                  onClick={() => setActiveTab("editar")}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 px-4 transition-colors min-w-[64px] border-b-2",
                    activeTab === "editar"
                      ? "text-brand border-brand"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  )}>
                  <Settings className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Editar</span>
                </button>
              )}
            </div>

            {/* Desktop: scrollable pill bar */}
            <div className="hidden md:flex px-4 py-2.5">
              <TabsList className="flex gap-0.5 p-1 bg-background rounded-lg border border-border dark:border-white/5 shadow-sm h-auto">
                {[
                  { value: "resumo",      icon: <Trophy className="h-3 w-3" />,      label: "Resumo",      show: true },
                  { value: "editar",      icon: <Settings className="h-3 w-3" />,    label: "Editar",      show: quote?.status !== "concluida" },
                  { value: "valores",     icon: <DollarSign className="h-3 w-3" />,  label: "Valores",     show: quote?.status !== "concluida" },
                  { value: "converter",   icon: <ShoppingCart className="h-3 w-3" />, label: "Pedido",     show: true },
                ].filter(t => t.show).map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted",
                      tab.value === "converter"
                        ? "data-[state=active]:bg-brand/10 data-[state=active]:text-brand data-[state=active]:shadow-sm"
                        : "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    )}
                  >
                    {tab.icon}{tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab Resumo */}
          <TabsContent value="resumo" className="flex-1 overflow-hidden m-0 p-0">
            <ResumoTab
              bestPricesData={bestPricesData}
              comparisonBySupplier={comparisonBySupplier}
              onCopyBestPrices={handleCopyBestPricesSummary}
              onCopySupplierSummary={handleCopySupplierSummary}
              onExportSupplierHtml={handleExportSupplierHtml}
              copiedId={copiedId}
              onEditItem={handleEditItem}
              isCompleted={quote?.status === "concluida"}
            />
          </TabsContent>

          {/* Tab Editar Cotação */}
          <TabsContent value="editar" className="flex-1 overflow-hidden m-0 p-0 bg-background">
            <div className="flex flex-col h-full min-h-0 p-3 sm:p-4 gap-3 overflow-y-auto md:overflow-hidden">
              {/* Busca única — adiciona embalagem OU fornecedor */}
              <div className="relative flex-shrink-0 z-30">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={editSearch}
                  onChange={(e) => setEditSearch(e.target.value)}
                  placeholder="Buscar embalagem ou fornecedor para adicionar..."
                  className="pl-9 h-9 text-xs bg-background border-border"
                />
                {editSearch.trim() && (() => {
                  const term = editSearch.trim().toLowerCase();
                  const pkgs = packagingNotInQuote.filter(p => p.name.toLowerCase().includes(term));
                  const sups = suppliersNotInQuote.filter(s => s.name.toLowerCase().includes(term));
                  return (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[260px] overflow-y-auto custom-scrollbar bg-card border border-border dark:border-white/5 rounded-lg shadow-xl">
                      {pkgs.length === 0 && sups.length === 0 && (
                        <div className="px-3 py-4 text-center text-xs text-muted-foreground">Nada encontrado</div>
                      )}
                      {pkgs.length > 0 && (
                        <div>
                          <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Embalagens</p>
                          {pkgs.map(p => (
                            <button key={p.id} onClick={() => handleAddPackagingById(p.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50 transition-colors">
                              <Package className="h-3.5 w-3.5 text-brand shrink-0" />
                              <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">{p.name}</span>
                              <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      {sups.length > 0 && (
                        <div>
                          <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Fornecedores</p>
                          {sups.map(s => (
                            <button key={s.id} onClick={() => handleAddSupplierById(s.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50 transition-colors">
                              <Building2 className="h-3.5 w-3.5 text-brand shrink-0" />
                              <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">{s.name}</span>
                              <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Duas colunas: Fornecedores | Embalagens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
                {/* Fornecedores */}
                <div className="flex flex-col rounded-xl border border-border dark:border-white/5 bg-card/30 overflow-hidden min-h-0">
                  <div className="px-3 py-2 border-b border-border dark:border-white/5 bg-muted/40 flex items-center gap-1.5 flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Fornecedores</span>
                    <Badge className="ml-auto bg-brand/10 text-brand border-brand/20 h-5 px-1.5 !text-[10px] font-bold">{quote.fornecedores.length}</Badge>
                  </div>
                  <div className="flex-1 min-h-0 max-h-[280px] md:max-h-none overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                    {quote.fornecedores.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Building2 className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-xs font-medium">Nenhum fornecedor</p>
                      </div>
                    ) : quote.fornecedores.map(f => (
                      <div key={f.supplierId} className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border dark:border-white/5 bg-card hover:border-brand/30 transition-all">
                        <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="flex-1 min-w-0 text-xs font-bold text-foreground truncate">{f.supplierName}</span>
                        {f.status === "respondido" ? (
                          <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Resp.</span>
                        ) : (
                          <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />Pend.</span>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSupplier(f.supplierId)} disabled={removeQuoteSupplier.isPending}
                          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Embalagens */}
                <div className="flex flex-col rounded-xl border border-border dark:border-white/5 bg-card/30 overflow-hidden min-h-0">
                  <div className="px-3 py-2 border-b border-border dark:border-white/5 bg-muted/40 flex items-center gap-1.5 flex-shrink-0">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Embalagens</span>
                    <Badge className="ml-auto bg-brand/10 text-brand border-brand/20 h-5 px-1.5 !text-[10px] font-bold">{quote.itens.length}</Badge>
                  </div>
                  <div className="flex-1 min-h-0 max-h-[280px] md:max-h-none overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                    {quote.itens.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Package className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-xs font-medium">Nenhuma embalagem</p>
                      </div>
                    ) : quote.itens.map(item => (
                      <div key={item.packagingId} className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border dark:border-white/5 bg-card hover:border-brand/30 transition-all">
                        <div className="w-6 h-6 rounded-md bg-brand/5 border border-brand/10 flex items-center justify-center shrink-0">
                          <Package className="h-3 w-3 text-brand" />
                        </div>
                        <span className="flex-1 min-w-0 text-xs font-bold text-foreground truncate">{item.packagingName}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemovePackaging(item.packagingId)} disabled={removeQuoteItem.isPending}
                          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Valores */}
          <TabsContent value="valores" className="flex-1 overflow-hidden m-0 p-0 bg-background">
            <div className="h-full flex flex-col md:flex-row gap-3 p-3 sm:p-4 min-h-0 overflow-hidden">
              <div className="w-full md:w-60 lg:w-64 flex-shrink-0 rounded-xl border border-border dark:border-white/5 bg-card/30 flex flex-col overflow-hidden min-h-0">
                {isMobile ? (
                  <div className="p-3 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Selecionar Fornecedor</Label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger className="w-full h-10 bg-background border-input">
                        <SelectValue placeholder="Selecione um fornecedor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {quote.fornecedores.map((fornecedor) => (
                          <SelectItem key={fornecedor.supplierId} value={fornecedor.supplierId}>
                            <div className="flex items-center gap-2">
                              <span>{fornecedor.supplierName}</span>
                              {fornecedor.status === "respondido" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                              {sentIds.has(fornecedor.supplierId) && <MessageCircle className="h-3 w-3 text-emerald-500" />}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => selectedSupplier && handleSendWhatsApp(selectedSupplier)}
                        disabled={!selectedSupplier || sendingId === selectedSupplier}
                        className={cn(
                          "flex-1 h-9 text-xs font-bold gap-1.5",
                          selectedSupplier && sentIds.has(selectedSupplier)
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-[#25D366] hover:bg-[#20BA5A] text-white"
                        )}
                      >
                        {sendingId === selectedSupplier
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : selectedSupplier && sentIds.has(selectedSupplier)
                            ? <><CheckCircle2 className="h-3.5 w-3.5" />Reenviar</>
                            : <><MessageCircle className="h-3.5 w-3.5" />WhatsApp</>
                        }
                      </Button>
                      {sentIds.size < quote.fornecedores.length && (
                        <Button
                          size="sm" variant="outline"
                          onClick={handleSendWhatsAppAll}
                          className="h-9 px-3 text-xs font-bold gap-1.5 border-border"
                          title="Enviar para todos"
                        >
                          <Send className="h-3.5 w-3.5" />Todos
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-2.5 border-b border-border dark:border-white/5 flex-shrink-0 flex items-center justify-between gap-2">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fornecedores</h4>
                      {quote.fornecedores.length > 0 && sentIds.size < quote.fornecedores.length && (
                        <button
                          onClick={handleSendWhatsAppAll}
                          className="text-[10px] font-bold text-muted-foreground/50 hover:text-[#25D366] transition-colors flex items-center gap-1"
                          title="Enviar WhatsApp para todos"
                        >
                          <Send className="h-3 w-3" />Todos
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {quote.fornecedores.map((fornecedor) => (
                          <div key={fornecedor.supplierId} className="flex items-center gap-1 min-w-0">
                            <button onClick={() => setSelectedSupplier(fornecedor.supplierId)}
                              className={cn("flex-1 min-w-0 p-2.5 rounded-xl text-left transition-all font-medium group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-background border",
                                selectedSupplier === fornecedor.supplierId
                                  ? "bg-card text-foreground shadow-sm border-border/50 font-bold"
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent")}
                              title={fornecedor.supplierName}>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Building2 className={cn("h-4 w-4 flex-shrink-0 transition-colors", selectedSupplier === fornecedor.supplierId ? "text-brand" : "text-muted-foreground/60 group-hover:text-muted-foreground")} />
                                <span className="flex-1 min-w-0 truncate text-xs tracking-tight">{fornecedor.supplierName}</span>
                                {fornecedor.status === "respondido"
                                  ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-brand" />
                                  : <Clock className={cn("h-3.5 w-3.5 flex-shrink-0", selectedSupplier === fornecedor.supplierId ? "text-muted-foreground" : "text-muted-foreground/40")} />
                                }
                              </div>
                            </button>
                            <button
                              onClick={() => handleSendWhatsApp(fornecedor.supplierId)}
                              disabled={sendingId === fornecedor.supplierId}
                              title="Enviar WhatsApp"
                              className={cn(
                                "p-2 rounded-lg transition-colors flex-shrink-0",
                                sentIds.has(fornecedor.supplierId)
                                  ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                  : "text-muted-foreground/30 hover:text-[#25D366] hover:bg-[#25D366]/10"
                              )}
                            >
                              {sendingId === fornecedor.supplierId
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : sentIds.has(fornecedor.supplierId)
                                  ? <CheckCircle2 className="h-3.5 w-3.5" />
                                  : <MessageCircle className="h-3.5 w-3.5" />
                              }
                            </button>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
              <div className="flex-1 rounded-xl border border-border dark:border-white/5 bg-card/30 overflow-hidden min-h-0 flex flex-col">
                {selectedSupplier && (
                  <div className="px-4 py-2.5 border-b border-border dark:border-white/5 bg-muted/20 flex items-center gap-2 flex-shrink-0">
                    <Building2 className="h-4 w-4 text-brand shrink-0" />
                    <span className="text-xs font-bold text-foreground truncate">
                      {quote.fornecedores.find(f => f.supplierId === selectedSupplier)?.supplierName}
                    </span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Valores</span>
                  </div>
                )}
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-4 md:p-5 space-y-3 pb-10" onKeyDown={handleKeyDown}>
                    {!selectedSupplier ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                        <Building2 className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Selecione um fornecedor para editar os valores</p>
                      </div>
                    ) : quote.itens.map((item) => {
                      const fornecedor = quote.fornecedores.find(f => f.supplierId === selectedSupplier);
                      const supplierItem = fornecedor?.itens.find(si => si.packagingId === item.packagingId);
                      const isEditing = editingItem?.supplierId === selectedSupplier && editingItem?.packagingId === item.packagingId;
                      const bestData = bestPricesData.find(b => b.packagingId === item.packagingId);
                      const isBestPrice = bestData && bestData.bestPrice > 0 && bestData.bestSupplierId === selectedSupplier;

                      return (
                        <Card key={item.packagingId} className={cn("p-3 transition-all border shadow-sm rounded-xl",
                          isBestPrice ? "bg-brand/5 border-brand/30 ring-1 ring-brand/10" : "bg-card border-border/50",
                          isEditing && "ring-2 ring-brand border-brand/50 shadow-lg z-10")}>
                          <div className={cn("flex items-center justify-between gap-2", isEditing ? "mb-3" : "mb-2")}>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border", isBestPrice ? "bg-brand/10 text-brand border-brand/20" : "bg-muted text-muted-foreground border-border/50")}>
                                <Package className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-foreground text-sm truncate">{item.packagingName}</span>
                                {(() => {
                                  const lastPurchase = getLastPurchaseInfo(item.packagingId);
                                  if (!lastPurchase) return null;
                                  return (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="cursor-help inline-flex shrink-0">
                                            <Info className="h-3.5 w-3.5 text-brand hover:text-brand/80 transition-colors" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[200px] text-xs">
                                          <p className="font-bold mb-1">Última Compra:</p>
                                          <p>Data: {lastPurchase.date}</p>
                                          <p>Fornecedor: {lastPurchase.supplierName}</p>
                                          <p>Preço: {formatCurrency(lastPurchase.price)}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                })()}
                                {isBestPrice && <span className="text-[9px] font-bold text-brand uppercase tracking-wide flex items-center gap-0.5 shrink-0"><Award className="h-2.5 w-2.5" />Melhor</span>}
                              </div>
                            </div>
                            {!isEditing && <Button size="sm" variant="outline" onClick={() => handleEditItem(selectedSupplier, item.packagingId)}
                              className="h-7 px-2.5 text-xs font-bold bg-background border-border hover:bg-muted hover:border-brand/40 touch-manipulation shrink-0"><Edit2 className="h-3.5 w-3.5 mr-1.5" />Editar</Button>}
                          </div>
                          {isEditing ? (
                            <div className="space-y-2.5 bg-muted/60 -m-1 p-3 rounded-lg border border-border dark:border-white/5 shadow-inner">
                              {/* Essenciais — calculam o custo por unidade */}
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1.5 ml-0.5">Dados do pacote</p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                  {/* Preço */}
                                  <div className="group flex flex-col">
                                    <Label className="text-[10px] font-medium text-muted-foreground mb-0.5 ml-0.5 transition-colors group-focus-within:text-brand">Preço do pacote *</Label>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground pointer-events-none select-none">R$</span>
                                      <Input
                                        ref={valorTotalInputRef}
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.valorTotal}
                                        onChange={(e) => setFormData(prev => ({ ...prev, valorTotal: e.target.value }))}
                                        onFocus={handleInputFocus}
                                        placeholder="0,00"
                                        className="h-9 pl-8 rounded-lg bg-background border-border/50 font-bold text-sm focus-visible:ring-brand/30"
                                      />
                                    </div>
                                  </div>

                                  {/* Unidade */}
                                  <div className="group flex flex-col">
                                    <Label className="text-[10px] font-medium text-muted-foreground mb-0.5 ml-0.5 transition-colors group-focus-within:text-brand">Vendido como *</Label>
                                    <Select
                                      value={formData.unidadeVenda}
                                      onValueChange={(v) => setFormData(prev => ({ ...prev, unidadeVenda: v }))}
                                    >
                                      <SelectTrigger className="h-9 rounded-lg bg-background border-border/50 font-bold text-sm uppercase">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-card border-border shadow-2xl rounded-xl">
                                        {PACKAGING_SALE_UNITS.map(u => (
                                          <SelectItem key={u.value} value={u.value} className="text-xs font-bold uppercase focus:bg-brand/10">
                                            {u.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Qtd Compra */}
                                  <div className="group flex flex-col">
                                    <Label className="text-[10px] font-medium text-muted-foreground mb-0.5 ml-0.5 transition-colors group-focus-within:text-brand">Qtd. comprada *</Label>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={formData.quantidadeVenda}
                                      onChange={(e) => setFormData(prev => ({ ...prev, quantidadeVenda: e.target.value }))}
                                      onFocus={handleInputFocus}
                                      placeholder="1"
                                      className="h-9 rounded-lg bg-background border-border/50 font-bold text-sm focus-visible:ring-brand/30"
                                    />
                                  </div>

                                  {/* Peças no Pack */}
                                  <div className="group flex flex-col">
                                    <Label className="text-[10px] font-medium text-muted-foreground mb-0.5 ml-0.5 transition-colors group-focus-within:text-brand">Peças no pack *</Label>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={formData.quantidadeUnidadesEstimada}
                                      onChange={(e) => setFormData(prev => ({ ...prev, quantidadeUnidadesEstimada: e.target.value }))}
                                      onFocus={handleInputFocus}
                                      placeholder="500"
                                      className="h-9 rounded-lg bg-background border-border/50 font-bold text-sm focus-visible:ring-brand/30"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Especificações — opcionais */}
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1.5 ml-0.5">Especificações <span className="font-medium normal-case tracking-normal opacity-70">(opcional)</span></p>
                                <div className="grid grid-cols-2 gap-2">
                                  {/* Gramatura */}
                                  <div className="group flex flex-col">
                                    <Label className="text-[10px] font-medium text-muted-foreground mb-0.5 ml-0.5 transition-colors group-focus-within:text-brand">Espessura (mm)</Label>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={formData.gramatura}
                                      onChange={(e) => setFormData(prev => ({ ...prev, gramatura: e.target.value }))}
                                      onFocus={handleInputFocus}
                                      placeholder="0.08"
                                      className="h-9 rounded-lg bg-background border-border/40 text-sm focus-visible:ring-brand/30"
                                    />
                                  </div>

                                  {/* Tamanho */}
                                  <div className="group flex flex-col">
                                    <Label className="text-[10px] font-medium text-muted-foreground mb-0.5 ml-0.5 transition-colors group-focus-within:text-brand">Tamanho (LxA)</Label>
                                    <Input
                                      value={formData.dimensoes}
                                      onChange={(e) => setFormData(prev => ({ ...prev, dimensoes: e.target.value }))}
                                      onFocus={handleInputFocus}
                                      placeholder="30x40"
                                      className="h-9 rounded-lg bg-background border-border/40 text-sm focus-visible:ring-brand/30"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Custo por unidade + ações — barra única */}
                              <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-border dark:border-white/5">
                                {custoPorUnidadePreview ? (
                                  <div className="flex items-baseline gap-1.5 min-w-0">
                                    <TrendingDown className="h-3.5 w-3.5 text-brand shrink-0 self-center" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">Custo/un</span>
                                    <span className="text-lg font-black text-foreground tracking-tight tabular-nums">{formatCurrency(custoPorUnidadePreview)}</span>
                                    <span className="text-[9px] text-muted-foreground/70 truncate hidden sm:inline">= {formData.valorTotal || '0'} ÷ {formData.quantidadeUnidadesEstimada || '0'}</span>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                                    <kbd className="px-1 py-0.5 rounded bg-background border border-border dark:border-white/5 font-sans text-[9px]">Ctrl</kbd>
                                    +
                                    <kbd className="px-1 py-0.5 rounded bg-background border border-border dark:border-white/5 font-sans text-[9px]">Enter</kbd>
                                    salvar
                                  </p>
                                )}
                                <div className="flex gap-2 shrink-0">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="h-8 px-3 text-xs font-bold text-muted-foreground hover:text-foreground">Cancelar</Button>
                                  <Button size="sm" onClick={handleSaveItem} disabled={updateSupplierItem.isPending || !formData.valorTotal} className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg shadow-md shadow-primary/20">{updateSupplierItem.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Save className="h-3 w-3 mr-1.5" />}Salvar</Button>
                                </div>
                              </div>
                            </div>
                          ) : supplierItem?.valorTotal ? (
                            <div className="flex items-center justify-between gap-3 bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border dark:border-white/5">
                              {/* Detalhes secundários */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 flex-1">
                                <span className="font-bold text-foreground whitespace-nowrap">{formatCurrency(supplierItem.valorTotal)}</span>
                                <span className="opacity-50">·</span>
                                <span className="truncate">{supplierItem.quantidadeVenda} {supplierItem.unidadeVenda}</span>
                                {supplierItem.quantidadeUnidadesEstimada && (
                                  <>
                                    <span className="opacity-50">·</span>
                                    <span className="whitespace-nowrap">{supplierItem.quantidadeUnidadesEstimada} un</span>
                                  </>
                                )}
                              </div>
                              {/* Custo/un inline */}
                              <div className="flex items-baseline gap-1 flex-shrink-0">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custo/un</span>
                                <span className={cn("font-extrabold text-sm tabular-nums", isBestPrice ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                                  {formatCurrency(supplierItem.custoPorUnidade)}
                                </span>
                              </div>
                            </div>
                          ) : <div className="py-2 rounded-lg border-2 border-dashed border-border bg-muted/50 text-center"><p className="text-xs text-muted-foreground font-medium">Nenhum valor informado</p></div>}
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Tab Converter em Pedido */}
          <TabsContent value="converter" className="flex-1 overflow-hidden m-0 p-0 bg-background">
            <Suspense fallback={<TabSkeleton />}>
              <ConvertTab 
                quote={quote}
                onConversionComplete={() => {
                  // Refresh data after conversion
                }}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent 
          className="flex flex-col p-0 gap-0 overflow-hidden border-t border-border dark:border-white/5 bg-background transition-all duration-200"
          style={{ 
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '95vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '95vh',
            paddingBottom: keyboardOffset > 0 ? 0 : 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[750px] p-0 gap-0 overflow-hidden border border-border dark:border-white/5 shadow-md rounded-2xl flex flex-col bg-background [&>button]:hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
}

