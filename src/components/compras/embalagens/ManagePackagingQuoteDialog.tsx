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
  Copy, Check, MessageCircle
} from "lucide-react";
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

// Lazy load heavy tabs
const ComparativoTab = lazy(() => import("./quote-tabs/ComparativoTab").then(m => ({ default: m.ComparativoTab })));
const ExportarTab = lazy(() => import("./quote-tabs/ExportarTab").then(m => ({ default: m.ExportarTab })));
const WhatsappTab = lazy(() => import("./quote-tabs/WhatsappTab").then(m => ({ default: m.WhatsappTab })));


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
  const [activeTab, setActiveTab] = useState("resumo");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingItem, setEditingItem] = useState<{ supplierId: string; packagingId: string } | null>(null);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [formData, setFormData] = useState({
    valorTotal: "", unidadeVenda: "kg", quantidadeVenda: "",
    quantidadeUnidadesEstimada: "", gramatura: "", dimensoes: "",
  });
  
  // Estados para adicionar itens/fornecedores
  const [selectedPackagingToAdd, setSelectedPackagingToAdd] = useState("");
  const [selectedSupplierToAdd, setSelectedSupplierToAdd] = useState("");
  
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
    const TAB_MAP: Record<string, string> = { '1': 'resumo', '2': 'editar', '3': 'valores', '4': 'comparativo', '5': 'exportar' };
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
        if (supplierItem?.custoPorUnidade && supplierItem.custoPorUnidade > 0) {
          allPrices.push({
            supplierId: fornecedor.supplierId, supplierName: fornecedor.supplierName,
            custoPorUnidade: supplierItem.custoPorUnidade, valorTotal: supplierItem.valorTotal || 0
          });
          if (supplierItem.custoPorUnidade < bestPrice) {
            bestPrice = supplierItem.custoPorUnidade;
            bestSupplierId = fornecedor.supplierId;
            bestSupplierName = fornecedor.supplierName;
          }
        }
      });

      allPrices.sort((a, b) => a.custoPorUnidade - b.custoPorUnidade);
      const worstPrice = allPrices.length > 0 ? allPrices[allPrices.length - 1].custoPorUnidade : 0;
      const savings = worstPrice > 0 && bestPrice < Infinity ? worstPrice - bestPrice : 0;

      return { packagingId: item.packagingId, packagingName: item.packagingName, bestPrice: bestPrice === Infinity ? 0 : bestPrice, bestSupplierId, bestSupplierName, allPrices, savings };
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
        text += `   ⚠️ Sem ofertas preenchidas\n`;
      }
      text += `\n`;
    });
    
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Resumo de melhores preços copiado." });
  }, [quote, bestPricesData, toast]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySupplierSummary = useCallback((group: any) => {
    try {
      let text = `📋 *COMPARATIVO DE EMBALAGENS*\n`;
      text += `*Fornecedor:* ${group.supplierName}\n`;
      text += `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n`;
      
      const vitorias = group.itens.filter((i: any) => i.isMelhorPreco);
      if (vitorias.length > 0) {
        text += `✅ *ITENS COM MELHOR PREÇO (${vitorias.length}):*\n`;
        vitorias.forEach((item: any) => {
          text += `• ${item.packagingName}: ${formatCurrency(item.custoPorUnidade)}/un\n`;
          text += `  (Total: ${formatCurrency(item.valorTotal)} - ${item.quantidadeVenda}${item.unidadeVenda})\n`;
        });
        text += `\n*TOTAL VENCIDO: ${formatCurrency(group.valorTotalGanhos)}*\n\n`;
      }

      const outros = group.itens.filter((i: any) => !i.isMelhorPreco);
      if (outros.length > 0) {
        text += `📊 *OUTROS ITENS COTADOS:*\n`;
        outros.forEach((item: any) => {
          text += `• ${item.packagingName}: ${formatCurrency(item.custoPorUnidade)}/un (+${item.diferencaPercentual.toFixed(1)}%)\n`;
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
            <td>${item.packagingName}${item.isMelhorPreco ? ' ★' : ''}</td>
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
      <p>Gerado automaticamente pelo Sistema CotaJá • Embalagens</p>
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
    const valor = parseFloat(formData.valorTotal) || 0;
    const unidades = parseFloat(formData.quantidadeUnidadesEstimada) || 0;
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
      valorTotal: parseFloat(formData.valorTotal) || 0, unidadeVenda: formData.unidadeVenda,
      quantidadeVenda: parseFloat(formData.quantidadeVenda) || 0, quantidadeUnidadesEstimada: parseInt(formData.quantidadeUnidadesEstimada) || 0,
      gramatura: formData.gramatura ? parseFloat(formData.gramatura) : undefined, dimensoes: formData.dimensoes || undefined,
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

  const DialogContentComponent = isMobile ? DrawerContent : DialogContent;
  const DialogHeaderComponent = isMobile ? DrawerHeader : DialogHeader;
  const DialogTitleComponent = isMobile ? DrawerTitle : DialogTitle;
  const DialogDescriptionComponent = isMobile ? DrawerDescription : DialogDescription;

  const content = (
    <div className="flex flex-col h-full bg-background">
        {/* Header Premium */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border/50 bg-card relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20 flex-shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <DialogTitleComponent className="text-base sm:text-lg font-black text-foreground tracking-tight leading-tight truncate">
                  Gerenciar Cotação
                </DialogTitleComponent>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge 
                    variant={quote.status === "ativa" ? "default" : "secondary"} 
                    className={cn(
                      "text-[8px] font-black uppercase tracking-wider h-4 px-1.5 rounded-md", 
                      quote.status === "ativa" ? "bg-brand/10 text-brand border border-brand/20 shadow-none hover:bg-brand/20" : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {quote.status}
                  </Badge>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                    {quote.dataInicio} - {quote.dataFim}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground hidden lg:inline uppercase opacity-40">
                    • {stats.totalEmbalagens} itens • {stats.totalFornecedores} fornec. • {stats.fornecedoresRespondidos} respostas
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
              <Select value={quote.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-28 h-9 text-xs font-bold bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="ativa" className="text-xs font-bold">Ativa</SelectItem>
                  <SelectItem value="concluida" className="text-xs font-bold">Concluída</SelectItem>
                  <SelectItem value="cancelada" className="text-xs font-bold">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} 
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors ml-1">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogDescriptionComponent className="sr-only">Gerenciar cotação de embalagens</DialogDescriptionComponent>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-border/50 bg-muted/30">
            <TabsList className="flex space-x-1 overflow-x-auto scrollbar-hide p-1 bg-background rounded-lg border border-border/50 shadow-sm justify-start sm:justify-center w-full sm:w-auto h-auto">
              <TabsTrigger value="resumo" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted">
                <Trophy className="h-3 w-3" />Resumo
              </TabsTrigger>
              {quote?.status !== "concluida" && (
                <>
                  <TabsTrigger value="editar" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Settings className="h-3 w-3" />Editar
                  </TabsTrigger>
                  <TabsTrigger value="valores" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted">
                    <DollarSign className="h-3 w-3" />Valores
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="comparativo" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted">
                <TrendingDown className="h-3 w-3" />Comparativo
              </TabsTrigger>
              <TabsTrigger value="exportar" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted">
                <FileDown className="h-3 w-3" />Exportar
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted">
                <MessageCircle className="h-3 w-3" />WhatsApp
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab WhatsApp */}
          <TabsContent value="whatsapp" className="flex-1 overflow-hidden m-0 p-0">
            <Suspense fallback={<TabSkeleton />}>
              <WhatsappTab
                quote={quote}
                availableSuppliers={availableSuppliers}
              />
            </Suspense>
          </TabsContent>

          {/* Tab Resumo */}
          <TabsContent value="resumo" className="flex-1 overflow-hidden m-0 p-0">
            <ResumoTab 
              bestPricesData={bestPricesData}
              onCopyBestPrices={handleCopyBestPricesSummary}
              onEditItem={handleEditItem}
              isCompleted={quote?.status === "concluida"}
            />
          </TabsContent>

          {/* Tab Editar Cotação */}
          <TabsContent value="editar" className="flex-1 overflow-hidden m-0 p-0 bg-background">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Seção Embalagens */}
                <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
                  <div className="px-3 py-2 border-b bg-muted/50">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      Embalagens ({quote.itens.length})
                    </h3>
                  </div>
                  {packagingNotInQuote.length > 0 && (
                    <div className="p-4 border-b border-border/50 bg-muted/10">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedPackagingToAdd} onValueChange={setSelectedPackagingToAdd}>
                          <SelectTrigger className="flex-1 h-10 text-xs font-bold bg-background text-foreground border-border shadow-sm hover:bg-muted/40 transition-colors">
                            <SelectValue placeholder="Selecione uma embalagem para adicionar..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border shadow-xl">
                            {packagingNotInQuote.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-medium focus:bg-accent focus:text-accent-foreground">{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddPackaging} disabled={!selectedPackagingToAdd || addQuoteItem.isPending} 
                          className="h-10 px-5 text-xs font-bold uppercase tracking-wider w-full sm:w-auto bg-brand text-black hover:bg-brand/90 shadow-sm rounded-lg">
                          {addQuoteItem.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-background">
                    {quote.itens.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl border-border/50 bg-muted/20"><Package className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" /><p className="text-xs font-medium">Nenhuma embalagem na cotação</p></div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {quote.itens.map((item, index) => (
                          <div key={item.packagingId} className="group relative p-3 flex items-center justify-between bg-card hover:bg-muted/20 hover:border-brand/30 border border-border/50 rounded-xl transition-all shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-muted-foreground w-5 opacity-40">#{index + 1}</span>
                              <div className="w-8 h-8 rounded-lg bg-brand/5 border border-brand/10 flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-brand" />
                              </div>
                              <span className="text-sm font-bold text-foreground">{item.packagingName}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemovePackaging(item.packagingId)} disabled={removeQuoteItem.isPending}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Seção Fornecedores */}
                <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
                  <div className="px-3 py-2 border-b bg-muted/50">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Fornecedores ({quote.fornecedores.length})
                    </h3>
                  </div>
                  {suppliersNotInQuote.length > 0 && (
                    <div className="p-4 border-b border-border/50 bg-muted/10">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd}>
                          <SelectTrigger className="flex-1 h-10 text-xs font-bold bg-background text-foreground border-border shadow-sm hover:bg-muted/40 transition-colors">
                            <SelectValue placeholder="Selecione um fornecedor para adicionar..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border shadow-xl">
                            {suppliersNotInQuote.map(s => <SelectItem key={s.id} value={s.id} className="text-xs font-medium">{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddSupplier} disabled={!selectedSupplierToAdd || addQuoteSupplier.isPending} 
                          className="h-10 px-5 text-xs font-bold uppercase tracking-wider w-full sm:w-auto bg-brand text-black hover:bg-brand/90 shadow-sm rounded-lg">
                          {addQuoteSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-background">
                    {quote.fornecedores.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl border-border/50 bg-muted/20"><Building2 className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" /><p className="text-xs font-medium">Nenhum fornecedor na cotação</p></div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quote.fornecedores.map((fornecedor, index) => (
                          <div key={fornecedor.supplierId} className="group relative flex items-center p-3 rounded-xl border border-border/50 bg-card hover:border-brand/30 hover:bg-muted/20 transition-all shadow-sm">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand/5 border border-brand/10 flex items-center justify-center mr-3 shadow-sm">
                              <Building2 className="h-4 w-4 text-brand" />
                            </div>
                            <div className="flex-1 min-w-0 mr-2">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-black truncate text-foreground">{fornecedor.supplierName}</span>
                              </div>
                              {fornecedor.status === "respondido" ? (
                                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span className="uppercase tracking-widest whitespace-nowrap">📲 VIA PORTAL</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span className="uppercase tracking-wide">Pendente</span>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSupplier(fornecedor.supplierId)}
                              disabled={removeQuoteSupplier.isPending}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab Valores */}
          <TabsContent value="valores" className="flex-1 overflow-hidden m-0 p-0 bg-background">
            <div className="h-full flex flex-col md:flex-row">
              <div className="w-full md:w-60 lg:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/10 flex flex-col">
                {isMobile ? (
                  <div className="p-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Selecionar Fornecedor</Label>
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
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-3 border-b border-border flex-shrink-0"><h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fornecedores</h4></div>
                    <ScrollArea className="flex-1">
                      <div className="p-2 space-y-1 pb-6">
                        {quote.fornecedores.map((fornecedor) => (
                          <button key={fornecedor.supplierId} onClick={() => setSelectedSupplier(fornecedor.supplierId)}
                            className={cn("w-full p-2.5 rounded-xl text-left transition-all font-medium group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-background border",
                              selectedSupplier === fornecedor.supplierId 
                                ? "bg-card text-foreground shadow-sm border-border/50 font-bold" 
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent")}
                            title={fornecedor.supplierName}>
                            <div className="flex items-center gap-2.5">
                              <Building2 className={cn("h-4 w-4 flex-shrink-0 transition-colors", selectedSupplier === fornecedor.supplierId ? "text-brand" : "text-muted-foreground/60 group-hover:text-muted-foreground")} />
                              <span className="truncate text-xs tracking-tight">{fornecedor.supplierName}</span>
                              {fornecedor.status === "respondido" 
                                ? <CheckCircle2 className={cn("h-4 w-4 ml-auto flex-shrink-0", selectedSupplier === fornecedor.supplierId ? "text-brand" : "text-brand")} />
                                : <Clock className={cn("h-3.5 w-3.5 ml-auto flex-shrink-0", selectedSupplier === fornecedor.supplierId ? "text-muted-foreground" : "text-muted-foreground/40")} />
                              }
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
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
                      const isBestPrice = bestData?.bestSupplierId === selectedSupplier;

                      return (
                        <Card key={item.packagingId} className={cn("p-4 transition-all border shadow-sm rounded-xl", 
                          isBestPrice ? "bg-brand/5 border-brand/30 ring-1 ring-brand/10" : "bg-card border-border/50",
                          isEditing && "ring-2 ring-brand border-brand/50 shadow-lg z-10")}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-none border", isBestPrice ? "bg-brand/10 text-brand border-brand/20" : "bg-muted text-muted-foreground border-border/50")}>
                                <Package className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground block text-sm">{item.packagingName}</span>
                                  {(() => {
                                    const lastPurchase = getLastPurchaseInfo(item.packagingId);
                                    if (!lastPurchase) return null;
                                    return (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="cursor-help inline-flex">
                                              <Info className="h-3.5 w-3.5 text-blue-500 hover:text-blue-600 transition-colors" />
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
                                </div>
                                {isBestPrice && <span className="text-[10px] font-bold text-foreground uppercase tracking-wide flex items-center gap-1"><Award className="h-3 w-3" />Melhor Preço</span>}
                              </div>
                            </div>
                            {!isEditing && <Button size="sm" variant="outline" onClick={() => handleEditItem(selectedSupplier, item.packagingId)} 
                              className="h-7 text-xs font-bold uppercase tracking-wider bg-background border-border hover:bg-muted"><Edit2 className="h-3 w-3 mr-1.5" />Editar</Button>}
                          </div>
                          {isEditing ? (
                            <div className="space-y-4 bg-muted/60 -m-1 p-4 rounded-lg border border-border shadow-inner">
                              {/* Grid Principal de Inputs */}
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
                                {/* Preço */}
                                <div className="space-y-1 group flex flex-col">
                                  <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 transition-colors group-focus-within:text-brand">
                                    {isMobile ? "💰 Preço (R$)" : "💰 Preço Pacote/Fardo (R$) *"}
                                  </Label>
                                  <Input 
                                    ref={valorTotalInputRef} 
                                    type="number" 
                                    step="0.01" 
                                    value={formData.valorTotal} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, valorTotal: e.target.value }))} 
                                    onFocus={handleInputFocus} 
                                    placeholder="0.00" 
                                    className="h-10 sm:h-11 rounded-xl bg-background border-border/50 font-bold text-sm focus-visible:ring-brand/30" 
                                  />
                                </div>

                                {/* Unidade */}
                                <div className="space-y-1 group flex flex-col">
                                  <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 transition-colors group-focus-within:text-brand">
                                    {isMobile ? "📦 Venda" : "📦 Vendido como *"}
                                  </Label>
                                  <Select 
                                    value={formData.unidadeVenda} 
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, unidadeVenda: v }))}
                                  >
                                    <SelectTrigger className="h-10 sm:h-11 bg-background border-border/50 font-bold text-sm uppercase">
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
                                <div className="space-y-1 group flex flex-col">
                                  <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 transition-colors group-focus-within:text-brand">
                                    {isMobile ? "🔢 Qtd Compra" : "🔢 Qtd. Comprada *"}
                                  </Label>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={formData.quantidadeVenda} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, quantidadeVenda: e.target.value }))} 
                                    onFocus={handleInputFocus} 
                                    placeholder="1" 
                                    className="h-10 sm:h-11 bg-background border-border/50 font-bold text-sm focus-visible:ring-brand/30" 
                                  />
                                </div>

                                {/* Peças no Pack */}
                                <div className="space-y-1 group flex flex-col">
                                  <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 transition-colors group-focus-within:text-brand">
                                    {isMobile ? "🎯 Peças/Pack" : "🎯 Total Peças no Pack *"}
                                  </Label>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={formData.quantidadeUnidadesEstimada} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, quantidadeUnidadesEstimada: e.target.value }))} 
                                    onFocus={handleInputFocus} 
                                    placeholder="500" 
                                    className="h-10 sm:h-11 rounded-xl bg-background border-border/50 font-bold text-sm focus-visible:ring-brand/30" 
                                  />
                                </div>

                                {/* Gramatura */}
                                <div className="space-y-1 group flex flex-col">
                                  <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 transition-colors group-focus-within:text-brand">
                                    {isMobile ? "📏 Espessura" : "📏 Espessura (mm)"}
                                  </Label>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={formData.gramatura} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, gramatura: e.target.value }))} 
                                    onFocus={handleInputFocus} 
                                    placeholder="0.08" 
                                    className="h-10 sm:h-11 bg-background border-border/50 font-bold text-sm focus-visible:ring-brand/30" 
                                  />
                                </div>

                                {/* Tamanho */}
                                <div className="space-y-1 group flex flex-col">
                                  <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 transition-colors group-focus-within:text-brand">
                                    {isMobile ? "📐 Tamanho" : "📐 Tamanho (LxA)"}
                                  </Label>
                                  <Input 
                                    value={formData.dimensoes} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, dimensoes: e.target.value }))} 
                                    onFocus={handleInputFocus} 
                                    placeholder="30x40" 
                                    className="h-10 sm:h-11 bg-background border-border/50 font-bold text-sm focus-visible:ring-brand/30" 
                                  />
                                </div>
                              </div>
                              {/* Cálculo transparente */}
                              {custoPorUnidadePreview && (
                                <div className="bg-background/80 p-3.5 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <div className="flex flex-col text-center sm:text-left">
                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Custo Real por Unidade</span>
                                    <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5 opacity-60">
                                      <div className="p-1 bg-brand/10 rounded-md">
                                        <TrendingDown className="h-3 w-3 text-brand" />
                                      </div>
                                      <span className="text-[9px] font-bold uppercase tracking-tighter">R$ {formData.valorTotal || '0'} ÷ {formData.quantidadeUnidadesEstimada || '0'} unidades</span>
                                    </div>
                                  </div>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black text-foreground tracking-tighter">{formatCurrency(custoPorUnidadePreview)}</span>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">/un</span>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-2 border-t border-border">
                                <p className="text-[10px] text-muted-foreground font-medium"><kbd className="px-1 py-0.5 rounded bg-background border border-border font-sans">Enter</kbd> salvar</p>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">Cancelar</Button>
                                  <Button size="sm" onClick={handleSaveItem} disabled={updateSupplierItem.isPending || !formData.valorTotal} className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-primary/20">{updateSupplierItem.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Save className="h-3 w-3 mr-1.5" />}Salvar</Button>
                                </div>
                              </div>
                            </div>
                          ) : supplierItem?.valorTotal ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-muted/50 p-3 rounded-lg border border-border">
                              <div><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-0.5">💰 Preço Pacote</span><p className="font-bold text-foreground">{formatCurrency(supplierItem.valorTotal)}</p></div>
                              <div><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-0.5">📦 Formato</span><p className="font-medium text-muted-foreground">{supplierItem.quantidadeVenda} {supplierItem.unidadeVenda}</p></div>
                              <div><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-0.5">🎯 Peças no Pacote</span><p className="font-medium text-muted-foreground">{supplierItem.quantidadeUnidadesEstimada} un</p></div>
                              <div><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-0.5">Custo/un</span><p className={cn("font-black text-base", isBestPrice ? "text-emerald-600" : "text-foreground")}>{formatCurrency(supplierItem.custoPorUnidade)}</p></div>
                            </div>
                          ) : <div className="p-4 rounded-lg border-2 border-dashed border-border bg-muted/50 text-center"><p className="text-xs text-muted-foreground font-medium">Nenhum valor informado</p></div>}
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Tab Comparativo */}
          <TabsContent value="comparativo" className="flex-1 overflow-hidden m-0 p-0 bg-background">
            <Suspense fallback={<TabSkeleton />}>
              <ComparativoTab 
                comparison={comparison}
                comparisonBySupplier={comparisonBySupplier}
                onEditItem={handleEditItem}
                onCopySupplierSummary={handleCopySupplierSummary}
                onExportSupplierHtml={handleExportSupplierHtml}
                copiedId={copiedId}
              />
            </Suspense>
          </TabsContent>

          {/* Tab Exportar PDF */}
          <TabsContent value="exportar" className="flex-1 overflow-hidden m-0 p-0 bg-background">
            <Suspense fallback={<TabSkeleton />}>
              <ExportarTab 
                quote={quote}
                comparison={comparison}
                showHtmlPreview={showHtmlPreview}
                onTogglePreview={() => setShowHtmlPreview(!showHtmlPreview)}
                onGeneratePDF={handleGeneratePDF}
                onDownloadHtml={handleDownloadHtml}
                generateHtmlComparative={generateHtmlComparative}
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
          className="flex flex-col p-0 gap-0 overflow-hidden border-t border-border bg-background transition-all duration-200"
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
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[750px] p-0 gap-0 overflow-hidden border border-border shadow-md rounded-2xl flex flex-col bg-background [&>button]:hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
}
