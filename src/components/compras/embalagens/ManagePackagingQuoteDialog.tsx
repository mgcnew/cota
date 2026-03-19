import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  TrendingDown, Award, Loader2, Save, X, Trophy, Star, Edit2, Plus, Trash2, Settings, FileDown, Download, Eye, FileText, Info
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
    if (!open) {
      setSelectedSupplier("");
      setEditingItem(null);
      setSelectedPackagingToAdd("");
      setSelectedSupplierToAdd("");
    }
  }, [open, quote, selectedSupplier]);

  const comparison = useMemo(() => quote ? getComparison(quote) : [], [quote, getComparison]);

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
        doc.text(`R$ ${f.custoPorUnidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`, margin + 100, y);
        
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
                    <td><strong>R$ ${f.custoPorUnidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</strong></td>
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
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-border bg-background relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground border border-border flex-shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <DialogTitleComponent className="text-lg font-black text-foreground tracking-tight">Gerenciar Cotação</DialogTitleComponent>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={quote.status === "ativa" ? "default" : "secondary"} className="text-[10px] font-bold uppercase tracking-wider h-5">{quote.status}</Badge>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{quote.dataInicio} - {quote.dataFim}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={quote.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32 h-8 text-xs font-medium bg-background border-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} 
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 px-5 py-2 border-b border-border bg-muted/50">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span><strong className="text-foreground">{stats.totalEmbalagens}</strong> embalagens</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span><strong className="text-foreground">{stats.totalFornecedores}</strong> fornecedores</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span><strong className="text-foreground">{stats.fornecedoresRespondidos}</strong> responderam</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-5 py-3 border-b border-border bg-background">
            <TabsList className="flex w-full sm:w-auto space-x-1 overflow-x-auto scrollbar-hide p-1 bg-muted rounded-xl border border-border h-auto">
              <TabsTrigger value="resumo" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground">
                <Trophy className="h-3.5 w-3.5 mb-0.5" />Resumo
              </TabsTrigger>
              <TabsTrigger value="editar" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground">
                <Settings className="h-3.5 w-3.5 mb-0.5" />Editar
              </TabsTrigger>
              <TabsTrigger value="valores" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground">
                <DollarSign className="h-3.5 w-3.5 mb-0.5" />Valores
              </TabsTrigger>
              <TabsTrigger value="comparativo" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground">
                <TrendingDown className="h-3.5 w-3.5 mb-0.5" />Comparativo
              </TabsTrigger>
              <TabsTrigger value="exportar" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground">
                <FileDown className="h-3.5 w-3.5 mb-0.5" />Exportar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Resumo */}
          <TabsContent value="resumo" className="flex-1 overflow-hidden m-0 p-0 bg-background">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-4">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-1">
                  <Star className="h-3.5 w-3.5 text-muted-foreground" />
                  Melhor Preço por Embalagem
                </h3>
                <Card className="overflow-hidden border-border bg-card shadow-sm rounded-xl">
                  <div className="divide-y divide-border">
                    {bestPricesData.map((item) => (
                      <div key={item.packagingId} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-sm">{item.packagingName}</p>
                            {item.allPrices.length > 1 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.allPrices.map((price, idx) => (
                                  <Badge key={price.supplierId} variant="outline"
                                    className={cn("text-[10px] font-medium cursor-pointer border-border", 
                                      idx === 0 
                                        ? "bg-muted text-foreground border-border hover:bg-muted/80" 
                                        : "bg-background text-muted-foreground hover:bg-muted/50")}
                                    onClick={() => handleEditItem(price.supplierId, item.packagingId)}>
                                    {price.supplierName}: {formatCurrency(price.custoPorUnidade)}/un
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {item.bestPrice > 0 ? (
                              <>
                                <div className="flex items-center gap-2 justify-end">
                                  <Award className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-lg font-black text-foreground tracking-tight">{formatCurrency(item.bestPrice)}<span className="text-xs font-medium text-muted-foreground ml-0.5">/un</span></span>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">{item.bestSupplierName}</p>
                                {item.savings > 0 && (
                                  <Badge className="mt-1 bg-primary text-primary-foreground border-0 text-[10px] font-bold">
                                    <TrendingDown className="h-2.5 w-2.5 mr-1" />
                                    Economia: {formatCurrency(item.savings)}/un
                                  </Badge>
                                )}
                              </>
                            ) : <Badge variant="outline" className="text-muted-foreground bg-muted/50 text-[10px]">Sem preço</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab Editar Cotação */}
          <TabsContent value="editar" className="flex-1 overflow-hidden m-0 p-0 bg-white dark:bg-gray-950">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-6">
                {/* Seção Embalagens */}
                <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
                  <div className="p-4 border-b bg-muted/50">
                    <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Embalagens da Cotação ({quote.itens.length})
                    </h3>
                  </div>
                  {packagingNotInQuote.length > 0 && (
                    <div className="p-4 border-b bg-background">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedPackagingToAdd} onValueChange={setSelectedPackagingToAdd}>
                          <SelectTrigger className="flex-1 h-9 text-xs font-medium bg-background text-foreground border-input">
                            <SelectValue placeholder="Selecione uma embalagem para adicionar..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border">
                            {packagingNotInQuote.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-medium focus:bg-accent focus:text-accent-foreground">{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddPackaging} disabled={!selectedPackagingToAdd || addQuoteItem.isPending} 
                          className="h-9 px-4 text-xs font-bold uppercase tracking-wider w-full sm:w-auto">
                          {addQuoteItem.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Plus className="h-3 w-3 mr-1.5" />}Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="divide-y">
                    {quote.itens.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-3 opacity-20" /><p className="text-xs font-medium">Nenhuma embalagem na cotação</p></div>
                    ) : quote.itens.map((item, index) => (
                      <div key={item.packagingId} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-muted-foreground w-6">#{index + 1}</span>
                          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                            <Package className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-bold">{item.packagingName}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemovePackaging(item.packagingId)} disabled={removeQuoteItem.isPending}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Seção Fornecedores */}
                <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
                  <div className="p-4 border-b bg-muted/50">
                    <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Fornecedores da Cotação ({quote.fornecedores.length})
                    </h3>
                  </div>
                  {suppliersNotInQuote.length > 0 && (
                    <div className="p-4 border-b bg-background">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd}>
                          <SelectTrigger className="flex-1 h-9 text-xs font-medium"><SelectValue placeholder="Selecione um fornecedor para adicionar..." /></SelectTrigger>
                          <SelectContent>{suppliersNotInQuote.map(s => <SelectItem key={s.id} value={s.id} className="text-xs font-medium">{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button onClick={handleAddSupplier} disabled={!selectedSupplierToAdd || addQuoteSupplier.isPending} 
                          className="h-9 px-4 text-xs font-bold uppercase tracking-wider w-full sm:w-auto">
                          {addQuoteSupplier.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Plus className="h-3 w-3 mr-1.5" />}Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-background">
                    {quote.fornecedores.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl"><Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" /><p className="text-xs font-medium">Nenhum fornecedor na cotação</p></div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quote.fornecedores.map((fornecedor, index) => (
                          <div key={fornecedor.supplierId} className="group relative flex items-center p-3 rounded-xl border bg-card hover:bg-accent/50 transition-all">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center mr-3 shadow-sm">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0 mr-2">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-black truncate">{fornecedor.supplierName}</span>
                              </div>
                              {fornecedor.status === "respondido" ? (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span className="uppercase tracking-wide">Respondido</span>
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
              <div className="w-full md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/30">
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
                    <div className="p-3 border-b border-border"><h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fornecedores</h4></div>
                    <ScrollArea className="h-[calc(100%-41px)]">
                      <div className="p-2 space-y-1">
                        {quote.fornecedores.map((fornecedor) => (
                          <button key={fornecedor.supplierId} onClick={() => setSelectedSupplier(fornecedor.supplierId)}
                            className={cn("w-full p-2.5 rounded-lg text-left transition-all text-xs font-medium group relative overflow-hidden",
                              selectedSupplier === fornecedor.supplierId 
                                ? "bg-primary text-primary-foreground shadow-md" 
                                : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                            <div className="flex items-center gap-2 relative z-10">
                              <Building2 className={cn("h-3.5 w-3.5 flex-shrink-0 transition-colors", selectedSupplier === fornecedor.supplierId ? "text-primary-foreground/80" : "text-muted-foreground group-hover:text-foreground")} />
                              <span className="truncate font-bold">{fornecedor.supplierName}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1.5 pl-5.5 relative z-10">
                              {fornecedor.status === "respondido" ? 
                                <span className={cn("text-[9px] flex items-center gap-1", selectedSupplier === fornecedor.supplierId ? "text-primary-foreground/90" : "text-foreground")}><CheckCircle2 className="h-2.5 w-2.5" />Respondido</span> : 
                                <span className={cn("text-[9px] flex items-center gap-1", selectedSupplier === fornecedor.supplierId ? "text-primary-foreground/70" : "text-muted-foreground")}><Clock className="h-2.5 w-2.5" />Pendente</span>
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
                  <div className="p-4 sm:p-6 space-y-3" onKeyDown={handleKeyDown}>
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
                        <Card key={item.packagingId} className={cn("p-4 transition-all border-border shadow-sm", 
                          isBestPrice ? "bg-muted/50 ring-1 ring-border" : "bg-card",
                          isEditing && "ring-2 ring-primary shadow-lg z-10")}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-sm", isBestPrice ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
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
                            <div className="space-y-4 bg-muted/50 -m-1 p-4 rounded-lg border border-border">
                              {/* Linha 1: Preço e como é vendido */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">💰 Preço do Pacote/Fardo (R$) *</Label>
                                  <Input ref={valorTotalInputRef} type="number" step="0.01" value={formData.valorTotal} onChange={(e) => setFormData(prev => ({ ...prev, valorTotal: e.target.value }))} onFocus={handleInputFocus} placeholder="Ex: 50.00" className="h-9 bg-background border-input font-bold" />
                                  <p className="text-[9px] text-muted-foreground mt-1 leading-tight">Quanto o fornecedor cobra</p>
                                </div>
                                <div>
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">📦 Vendido como *</Label>
                                  <Select value={formData.unidadeVenda} onValueChange={(v) => setFormData(prev => ({ ...prev, unidadeVenda: v }))}><SelectTrigger className="h-9 bg-background border-input"><SelectValue /></SelectTrigger><SelectContent>{PACKAGING_SALE_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent></Select>
                                  <p className="text-[9px] text-muted-foreground mt-1 leading-tight">Como vem: pacote, kg, caixa...</p>
                                </div>
                                <div>
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">🔢 Qtd. Comprada *</Label>
                                  <Input type="number" step="0.01" value={formData.quantidadeVenda} onChange={(e) => setFormData(prev => ({ ...prev, quantidadeVenda: e.target.value }))} onFocus={handleInputFocus} placeholder="Ex: 1" className="h-9 bg-background border-input" />
                                  <p className="text-[9px] text-muted-foreground mt-1 leading-tight">Quantos pacotes/kg pelo preço acima</p>
                                </div>
                              </div>
                              {/* Linha 2: Conteúdo e especificações */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">🎯 Total de Peças no Pacote *</Label>
                                  <Input type="number" step="0.01" value={formData.quantidadeUnidadesEstimada} onChange={(e) => setFormData(prev => ({ ...prev, quantidadeUnidadesEstimada: e.target.value }))} onFocus={handleInputFocus} placeholder="Ex: 500" className="h-9 bg-background border-input font-bold" />
                                  <p className="text-[9px] text-muted-foreground mt-1 leading-tight">Quantas sacolas/peças vêm dentro</p>
                                </div>
                                <div>
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Espessura/Gramatura (mm)</Label>
                                  <Input type="number" step="0.01" value={formData.gramatura} onChange={(e) => setFormData(prev => ({ ...prev, gramatura: e.target.value }))} onFocus={handleInputFocus} placeholder="Ex: 0.08" className="h-9 bg-background border-input" />
                                  <p className="text-[9px] text-muted-foreground mt-1 leading-tight">Opcional — espessura do material</p>
                                </div>
                                <div>
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Tamanho (LxA)</Label>
                                  <Input value={formData.dimensoes} onChange={(e) => setFormData(prev => ({ ...prev, dimensoes: e.target.value }))} onFocus={handleInputFocus} placeholder="Ex: 30×40cm" className="h-9 bg-background border-input" />
                                  <p className="text-[9px] text-muted-foreground mt-1 leading-tight">Opcional — largura × altura</p>
                                </div>
                              </div>
                              {/* Cálculo transparente */}
                              {custoPorUnidadePreview && (
                                <div className="bg-background p-3 rounded-lg border border-border">
                                  <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Custo por unidade</span>
                                      <span className="text-[9px] text-muted-foreground mt-0.5">R$ {formData.valorTotal || '0'} ÷ {formData.quantidadeUnidadesEstimada || '0'} peças</span>
                                    </div>
                                    <span className="text-lg font-black text-foreground">{formatCurrency(custoPorUnidadePreview)}<span className="text-xs font-medium text-muted-foreground ml-0.5">/un</span></span>
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
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-4">
                {comparison.length === 0 || comparison.every(c => c.fornecedores.length === 0) ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <TrendingDown className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-bold text-foreground mb-1">Sem dados comparativos</p>
                    <p className="text-xs">Adicione os valores na aba "Valores" para visualizar</p>
                  </div>
                ) : comparison.map((comp) => (
                  <Card key={comp.packagingId} className="overflow-hidden border-border bg-card shadow-sm rounded-xl">
                    <div className="bg-muted/50 p-3 border-b border-border">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" />{comp.packagingName}</h4>
                    </div>
                    {comp.fornecedores.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-xs font-medium">Nenhum fornecedor respondeu ainda</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {comp.fornecedores.map((f, index) => (
                          <div key={f.supplierId} className={cn("p-4 flex items-center gap-4 transition-colors cursor-pointer hover:bg-muted/50", f.isMelhorPreco && "bg-muted/30")} onClick={() => handleEditItem(f.supplierId, comp.packagingId)}>
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm", f.isMelhorPreco ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                              {f.isMelhorPreco ? <Award className="h-4 w-4" /> : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-foreground text-sm">{f.supplierName}</p>
                              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{formatCurrency(f.valorTotal)} ({f.quantidadeVenda} {f.unidadeVenda} / {f.quantidadeUnidades} un)</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={cn("font-black text-sm", f.isMelhorPreco ? "text-foreground" : "text-foreground")}>{formatCurrency(f.custoPorUnidade)}/un</p>
                              {!f.isMelhorPreco ? <p className="text-[10px] font-bold text-red-500 mt-0.5">+{f.diferencaPercentual.toFixed(1)}%</p> : <Badge className="bg-primary text-primary-foreground border-0 text-[9px] mt-0.5 h-4">Melhor</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab Exportar PDF */}
          <TabsContent value="exportar" className="flex-1 overflow-hidden m-0 p-0 bg-background">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center shadow-inner">
                    <FileDown className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-black text-foreground mb-2 tracking-tight">Exportar Relatório</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Gere um PDF ou HTML com o comparativo completo, ideal para documentação e aprovação.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Preview do que será exportado */}
                  <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-border bg-muted/50">
                      <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        Conteúdo
                      </h4>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {[
                        `Período: ${quote.dataInicio} a ${quote.dataFim}`,
                        `${quote.itens.length} embalagens comparadas`,
                        `${quote.fornecedores.length} fornecedores participantes`,
                        "Tabela de preços detalhada",
                        "Destaque dos melhores preços",
                        "Ranking de fornecedores"
                      ].map((text, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Resumo dos vencedores */}
                  <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-border bg-muted/50">
                      <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                        Vencedores
                      </h4>
                    </div>
                    <div className="p-4 space-y-2">
                      {(() => {
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
                        const sorted = Object.values(winsPerSupplier).sort((a, b) => b.wins - a.wins);
                        
                        if (sorted.length === 0) return <p className="text-xs text-muted-foreground italic">Sem dados suficientes</p>;
                        
                        return sorted.map((w, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className={cn("flex items-center gap-2", idx === 0 ? "font-bold text-foreground" : "text-muted-foreground")}>
                              {idx === 0 && <Award className="h-3.5 w-3.5 text-muted-foreground" />}
                              {w.name}
                            </span>
                            <Badge variant="outline" className={cn("h-5 border-border bg-background text-foreground", idx !== 0 && "border-border bg-muted/50 text-muted-foreground")}>
                              {w.wins} {w.wins === 1 ? "item" : "itens"}
                            </Badge>
                          </div>
                        ));
                      })()}
                    </div>
                  </Card>
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                  <Button size="lg" onClick={handleGeneratePDF} disabled={comparison.every(c => c.fornecedores.length === 0)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20 rounded-xl px-8 h-10">
                    <Download className="h-4 w-4 mr-2" />Baixar PDF
                  </Button>
                  <Button size="lg" onClick={handleDownloadHtml} disabled={comparison.every(c => c.fornecedores.length === 0)}
                    variant="outline" className="font-bold uppercase tracking-wider text-xs rounded-xl px-8 h-10 border-border hover:bg-muted">
                    <FileText className="h-4 w-4 mr-2" />Baixar HTML
                  </Button>
                  <Button size="lg" onClick={() => setShowHtmlPreview(!showHtmlPreview)} disabled={comparison.every(c => c.fornecedores.length === 0)}
                    variant="ghost" className="font-bold uppercase tracking-wider text-xs rounded-xl px-8 h-10 text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Eye className="h-4 w-4 mr-2" />{showHtmlPreview ? "Ocultar" : "Visualizar"}
                  </Button>
                </div>

                {/* Preview HTML */}
                {showHtmlPreview && (
                  <div className="mt-6 border border-border rounded-xl overflow-hidden shadow-2xl">
                    <div className="bg-muted/50 px-4 py-2 border-b border-border">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Preview</p>
                    </div>
                    <iframe srcDoc={generateHtmlComparative()} className="w-full h-[400px] sm:h-[600px] border-0 bg-background" title="HTML Preview" />
                  </div>
                )}
              </div>
            </ScrollArea>
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
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[95vw] max-w-[1200px] h-[90vh] sm:h-[92vh] max-h-[850px] p-0 gap-0 overflow-hidden border border-border shadow-2xl rounded-[2rem] flex flex-col bg-background animate-in fade-in zoom-in-95 duration-300">
        {content}
      </DialogContent>
    </Dialog>
  );
}
