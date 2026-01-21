import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { 
  Package, Building2, DollarSign, CheckCircle2, Clock, 
  TrendingDown, Award, Loader2, Save, X, Trophy, Star, Edit2, Plus, Trash2, Settings, FileDown, Download, Eye, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackagingQuoteDisplay } from "@/types/packaging";
import type { PackagingItem } from "@/types/packaging";
import type { Supplier } from "@/hooks/useSuppliers";
import { PACKAGING_SALE_UNITS } from "@/types/packaging";
import jsPDF from "jspdf";

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
  }, [open, quote]);

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
    const unidades = parseInt(formData.quantidadeUnidadesEstimada) || 0;
    return valor > 0 && unidades > 0 ? (valor / unidades).toFixed(4) : null;
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
        doc.text(`R$ ${f.valorTotal.toFixed(2)}`, margin + 70, y);
        
        // Custo por unidade
        if (isWinner) {
          doc.setTextColor(0, 0, 0); // Black
        } else {
          doc.setTextColor(gray[0], gray[1], gray[2]);
        }
        doc.text(`R$ ${f.custoPorUnidade.toFixed(4)}`, margin + 100, y);
        
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
                    <td>R$ ${f.valorTotal.toFixed(2)}</td>
                    <td><strong>R$ ${f.custoPorUnidade.toFixed(4)}</strong></td>
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

  if (!quote) return null;

  const stats = {
    totalEmbalagens: quote.itens.length,
    totalFornecedores: quote.fornecedores.length,
    fornecedoresRespondidos: quote.fornecedores.filter(f => f.status === "respondido").length,
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="w-[96vw] sm:w-[92vw] md:w-[95vw] max-w-[1200px] h-[90vh] sm:h-[92vh] max-h-[850px] p-0 gap-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] flex flex-col bg-white dark:bg-gray-950">
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-transparent pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white shadow-xl shadow-gray-500/20 ring-1 ring-white/20 flex-shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <ResponsiveDialogTitle className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Gerenciar Cotação</ResponsiveDialogTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={quote.status === "ativa" ? "default" : "secondary"} className="text-[10px] font-bold uppercase tracking-wider h-5">{quote.status}</Badge>
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{quote.dataInicio} - {quote.dataFim}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={quote.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32 h-8 text-xs font-medium bg-white/50 dark:bg-gray-900/50 border-gray-200/60 dark:border-gray-700/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} 
                className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl transition-all">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 px-5 py-2 border-b border-gray-200/60 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
              <Package className="h-3.5 w-3.5 text-gray-400" />
              <span><strong className="text-gray-900 dark:text-white">{stats.totalEmbalagens}</strong> embalagens</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5 text-gray-400" />
              <span><strong className="text-gray-900 dark:text-white">{stats.totalFornecedores}</strong> fornecedores</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />
              <span><strong className="text-gray-900 dark:text-white">{stats.fornecedoresRespondidos}</strong> responderam</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-5 py-3 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-950">
            <TabsList className="flex w-full sm:w-auto space-x-1 overflow-x-auto scrollbar-hide p-1 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-700/40 shadow-inner h-auto">
              <TabsTrigger value="resumo" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200 dark:data-[state=active]:ring-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <Trophy className="h-3.5 w-3.5 mb-0.5" />Resumo
              </TabsTrigger>
              <TabsTrigger value="editar" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200 dark:data-[state=active]:ring-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <Settings className="h-3.5 w-3.5 mb-0.5" />Editar
              </TabsTrigger>
              <TabsTrigger value="valores" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200 dark:data-[state=active]:ring-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <DollarSign className="h-3.5 w-3.5 mb-0.5" />Valores
              </TabsTrigger>
              <TabsTrigger value="comparativo" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200 dark:data-[state=active]:ring-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <TrendingDown className="h-3.5 w-3.5 mb-0.5" />Comparativo
              </TabsTrigger>
              <TabsTrigger value="exportar" className="flex-1 sm:flex-none items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200 dark:data-[state=active]:ring-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <FileDown className="h-3.5 w-3.5 mb-0.5" />Exportar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Resumo */}
          <TabsContent value="resumo" className="flex-1 overflow-hidden m-0 p-0 bg-gray-50 dark:bg-gray-950">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-4">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2 px-1">
                  <Star className="h-3.5 w-3.5 text-gray-400" />
                  Melhor Preço por Embalagem
                </h3>
                <Card className="overflow-hidden border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-950 shadow-sm rounded-xl">
                  <div className="divide-y divide-gray-200/60 dark:divide-gray-700/40">
                    {bestPricesData.map((item) => (
                      <div key={item.packagingId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{item.packagingName}</p>
                            {item.allPrices.length > 1 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.allPrices.map((price, idx) => (
                                  <Badge key={price.supplierId} variant="outline"
                                    className={cn("text-[10px] font-medium cursor-pointer border-gray-200 dark:border-gray-700", 
                                      idx === 0 
                                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700" 
                                        : "bg-white dark:bg-gray-950 text-gray-500 hover:bg-gray-50")}
                                    onClick={() => handleEditItem(price.supplierId, item.packagingId)}>
                                    {price.supplierName}: R$ {price.custoPorUnidade.toFixed(4)}/un
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {item.bestPrice > 0 ? (
                              <>
                                <div className="flex items-center gap-2 justify-end">
                                  <Award className="h-4 w-4 text-gray-400" />
                                  <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">R$ {item.bestPrice.toFixed(4)}<span className="text-xs font-medium text-gray-400 ml-0.5">/un</span></span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5">{item.bestSupplierName}</p>
                                {item.savings > 0 && (
                                  <Badge className="mt-1 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-0 text-[10px] font-bold">
                                    <TrendingDown className="h-2.5 w-2.5 mr-1" />
                                    Economia: R$ {item.savings.toFixed(4)}/un
                                  </Badge>
                                )}
                              </>
                            ) : <Badge variant="outline" className="text-gray-400 bg-gray-50 text-[10px]">Sem preço</Badge>}
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
          <TabsContent value="editar" className="flex-1 overflow-hidden m-0 p-0 bg-gray-50 dark:bg-gray-950">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-6">
                {/* Seção Embalagens */}
                <Card className="border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-950 shadow-sm rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      Embalagens da Cotação ({quote.itens.length})
                    </h3>
                  </div>
                  {packagingNotInQuote.length > 0 && (
                    <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900">
                      <div className="flex gap-3">
                        <Select value={selectedPackagingToAdd} onValueChange={setSelectedPackagingToAdd}>
                          <SelectTrigger className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-9 text-xs"><SelectValue placeholder="Selecione uma embalagem para adicionar..." /></SelectTrigger>
                          <SelectContent>{packagingNotInQuote.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button onClick={handleAddPackaging} disabled={!selectedPackagingToAdd || addQuoteItem.isPending} 
                          className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {addQuoteItem.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Plus className="h-3 w-3 mr-1.5" />}Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="divide-y divide-gray-200/60 dark:divide-gray-700/40">
                    {quote.itens.length === 0 ? (
                      <div className="p-8 text-center text-gray-500"><Package className="h-10 w-10 mx-auto mb-3 opacity-20" /><p className="text-xs font-medium">Nenhuma embalagem na cotação</p></div>
                    ) : quote.itens.map((item, index) => (
                      <div key={item.packagingId} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-400 w-6">#{index + 1}</span>
                          <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Package className="h-3 w-3 text-gray-500" />
                          </div>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.packagingName}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemovePackaging(item.packagingId)} disabled={removeQuoteItem.isPending}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Seção Fornecedores */}
                <Card className="border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-950 shadow-sm rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Fornecedores da Cotação ({quote.fornecedores.length})
                    </h3>
                  </div>
                  {suppliersNotInQuote.length > 0 && (
                    <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900">
                      <div className="flex gap-3">
                        <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd}>
                          <SelectTrigger className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-9 text-xs"><SelectValue placeholder="Selecione um fornecedor para adicionar..." /></SelectTrigger>
                          <SelectContent>{suppliersNotInQuote.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button onClick={handleAddSupplier} disabled={!selectedSupplierToAdd || addQuoteSupplier.isPending} 
                          className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {addQuoteSupplier.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Plus className="h-3 w-3 mr-1.5" />}Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="divide-y divide-gray-200/60 dark:divide-gray-700/40">
                    {quote.fornecedores.length === 0 ? (
                      <div className="p-8 text-center text-gray-500"><Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" /><p className="text-xs font-medium">Nenhum fornecedor na cotação</p></div>
                    ) : quote.fornecedores.map((fornecedor, index) => (
                      <div key={fornecedor.supplierId} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-400 w-6">#{index + 1}</span>
                          <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Building2 className="h-3 w-3 text-gray-500" />
                          </div>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{fornecedor.supplierName}</span>
                          {fornecedor.status === "respondido" ? (
                            <Badge className="text-[9px] bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-0"><CheckCircle2 className="h-2.5 w-2.5 mr-1" />Respondido</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] text-gray-500 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"><Clock className="h-2.5 w-2.5 mr-1" />Pendente</Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveSupplier(fornecedor.supplierId)} disabled={removeQuoteSupplier.isPending}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab Valores */}
          <TabsContent value="valores" className="flex-1 overflow-hidden m-0 p-0 bg-gray-50 dark:bg-gray-950">
            <div className="h-full flex">
              <div className="w-56 flex-shrink-0 border-r border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-950">
                <div className="p-3 border-b border-gray-200/60 dark:border-gray-700/40"><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fornecedores</h4></div>
                <ScrollArea className="h-[calc(100%-41px)]">
                  <div className="p-2 space-y-1">
                    {quote.fornecedores.map((fornecedor) => (
                      <button key={fornecedor.supplierId} onClick={() => setSelectedSupplier(fornecedor.supplierId)}
                        className={cn("w-full p-2.5 rounded-lg text-left transition-all text-xs font-medium group relative overflow-hidden",
                          selectedSupplier === fornecedor.supplierId 
                            ? "bg-gray-900 text-white shadow-md ring-1 ring-gray-900/10" 
                            : "text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900")}>
                        <div className="flex items-center gap-2 relative z-10">
                          <Building2 className={cn("h-3.5 w-3.5 flex-shrink-0 transition-colors", selectedSupplier === fornecedor.supplierId ? "text-gray-300" : "text-gray-400 group-hover:text-gray-600")} />
                          <span className="truncate font-bold">{fornecedor.supplierName}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 pl-5.5 relative z-10">
                          {fornecedor.status === "respondido" ? 
                            <span className={cn("text-[9px] flex items-center gap-1", selectedSupplier === fornecedor.supplierId ? "text-gray-300" : "text-gray-900")}><CheckCircle2 className="h-2.5 w-2.5" />Respondido</span> : 
                            <span className={cn("text-[9px] flex items-center gap-1", selectedSupplier === fornecedor.supplierId ? "text-gray-400" : "text-gray-400")}><Clock className="h-2.5 w-2.5" />Pendente</span>
                          }
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 sm:p-6 space-y-3" onKeyDown={handleKeyDown}>
                    {selectedSupplier && quote.itens.map((item) => {
                      const fornecedor = quote.fornecedores.find(f => f.supplierId === selectedSupplier);
                      const supplierItem = fornecedor?.itens.find(si => si.packagingId === item.packagingId);
                      const isEditing = editingItem?.supplierId === selectedSupplier && editingItem?.packagingId === item.packagingId;
                      const bestData = bestPricesData.find(b => b.packagingId === item.packagingId);
                      const isBestPrice = bestData?.bestSupplierId === selectedSupplier;

                      return (
                        <Card key={item.packagingId} className={cn("p-4 transition-all border-gray-200/60 dark:border-gray-700/40 shadow-sm", 
                          isBestPrice ? "bg-gray-50 dark:bg-gray-900 ring-1 ring-gray-200/60" : "bg-white dark:bg-gray-950",
                          isEditing && "ring-2 ring-gray-900 dark:ring-white shadow-lg z-10")}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-sm", isBestPrice ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500")}>
                                <Package className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white block text-sm">{item.packagingName}</span>
                                {isBestPrice && <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1"><Award className="h-3 w-3" />Melhor Preço</span>}
                              </div>
                            </div>
                            {!isEditing && <Button size="sm" variant="outline" onClick={() => handleEditItem(selectedSupplier, item.packagingId)} 
                              className="h-7 text-xs font-bold uppercase tracking-wider bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50"><Edit2 className="h-3 w-3 mr-1.5" />Editar</Button>}
                          </div>
                          {isEditing ? (
                            <div className="space-y-4 bg-gray-50/50 dark:bg-gray-800/30 -m-1 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div><Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Valor Total (R$) *</Label><Input ref={valorTotalInputRef} type="number" step="0.01" value={formData.valorTotal} onChange={(e) => setFormData(prev => ({ ...prev, valorTotal: e.target.value }))} placeholder="0,00" className="h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" /></div>
                                <div><Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Unidade de Venda *</Label><Select value={formData.unidadeVenda} onValueChange={(v) => setFormData(prev => ({ ...prev, unidadeVenda: v }))}><SelectTrigger className="h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"><SelectValue /></SelectTrigger><SelectContent>{PACKAGING_SALE_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Qtd. na Unidade *</Label><Input type="number" step="0.01" value={formData.quantidadeVenda} onChange={(e) => setFormData(prev => ({ ...prev, quantidadeVenda: e.target.value }))} placeholder="Ex: 5" className="h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" /></div>
                                <div><Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Qtd. Unidades Est. *</Label><Input type="number" value={formData.quantidadeUnidadesEstimada} onChange={(e) => setFormData(prev => ({ ...prev, quantidadeUnidadesEstimada: e.target.value }))} placeholder="Ex: 500" className="h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" /></div>
                                <div><Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Gramatura</Label><Input type="number" step="0.01" value={formData.gramatura} onChange={(e) => setFormData(prev => ({ ...prev, gramatura: e.target.value }))} placeholder="Ex: 0.08" className="h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" /></div>
                                <div><Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Dimensões</Label><Input value={formData.dimensoes} onChange={(e) => setFormData(prev => ({ ...prev, dimensoes: e.target.value }))} placeholder="Ex: 30x40cm" className="h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" /></div>
                              </div>
                              {custoPorUnidadePreview && <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center"><span className="text-xs text-gray-500 font-medium">Custo calculado:</span><span className="text-sm font-bold text-gray-900 dark:text-white">R$ {custoPorUnidadePreview}/un</span></div>}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700/50">
                                <p className="text-[10px] text-gray-400 font-medium"><kbd className="px-1 py-0.5 rounded bg-white border border-gray-200 font-sans">Enter</kbd> salvar</p>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="h-8 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900">Cancelar</Button>
                                  <Button size="sm" onClick={handleSaveItem} disabled={updateSupplierItem.isPending || !formData.valorTotal} className="h-8 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-gray-900/20">{updateSupplierItem.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Save className="h-3 w-3 mr-1.5" />}Salvar</Button>
                                </div>
                              </div>
                            </div>
                          ) : supplierItem?.valorTotal ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700/30">
                              <div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Valor Total</span><p className="font-bold text-gray-700 dark:text-gray-300">R$ {supplierItem.valorTotal.toFixed(2)}</p></div>
                              <div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Venda</span><p className="font-medium text-gray-600 dark:text-gray-400">{supplierItem.quantidadeVenda} {supplierItem.unidadeVenda}</p></div>
                              <div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Unidades</span><p className="font-medium text-gray-600 dark:text-gray-400">{supplierItem.quantidadeUnidadesEstimada}</p></div>
                              <div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Custo/un</span><p className={cn("font-black text-base", isBestPrice ? "text-emerald-600" : "text-gray-900 dark:text-white")}>R$ {supplierItem.custoPorUnidade?.toFixed(4) || '-'}</p></div>
                            </div>
                          ) : <div className="p-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 text-center"><p className="text-xs text-gray-400 font-medium">Nenhum valor informado</p></div>}
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Tab Comparativo */}
          <TabsContent value="comparativo" className="flex-1 overflow-hidden m-0 p-0 bg-gray-50 dark:bg-gray-950">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-4">
                {comparison.length === 0 || comparison.every(c => c.fornecedores.length === 0) ? (
                  <div className="text-center py-16 text-gray-400">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <TrendingDown className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">Sem dados comparativos</p>
                    <p className="text-xs">Adicione os valores na aba "Valores" para visualizar</p>
                  </div>
                ) : comparison.map((comp) => (
                  <Card key={comp.packagingId} className="overflow-hidden border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-950 shadow-sm rounded-xl">
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 border-b border-gray-200/60 dark:border-gray-700/40">
                      <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2"><Package className="h-4 w-4 text-gray-400" />{comp.packagingName}</h4>
                    </div>
                    {comp.fornecedores.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-xs font-medium">Nenhum fornecedor respondeu ainda</div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {comp.fornecedores.map((f, index) => (
                          <div key={f.supplierId} className={cn("p-4 flex items-center gap-4 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900", f.isMelhorPreco && "bg-gray-50 dark:bg-gray-900")} onClick={() => handleEditItem(f.supplierId, comp.packagingId)}>
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm", f.isMelhorPreco ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500")}>
                              {f.isMelhorPreco ? <Award className="h-4 w-4" /> : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white text-sm">{f.supplierName}</p>
                              <p className="text-[10px] text-gray-500 font-medium mt-0.5">R$ {f.valorTotal.toFixed(2)} ({f.quantidadeVenda} {f.unidadeVenda} / {f.quantidadeUnidades} un)</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={cn("font-black text-sm", f.isMelhorPreco ? "text-gray-900 dark:text-white" : "text-gray-900 dark:text-gray-300")}>R$ {f.custoPorUnidade.toFixed(4)}/un</p>
                              {!f.isMelhorPreco ? <p className="text-[10px] font-bold text-red-500 mt-0.5">+{f.diferencaPercentual.toFixed(1)}%</p> : <Badge className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-0 text-[9px] mt-0.5 h-4">Melhor</Badge>}
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
          <TabsContent value="exportar" className="flex-1 overflow-hidden m-0 p-0 bg-gray-50 dark:bg-gray-950">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-inner">
                    <FileDown className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 tracking-tight">Exportar Relatório</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Gere um PDF ou HTML com o comparativo completo, ideal para documentação e aprovação.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Preview do que será exportado */}
                  <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
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
                        <div key={i} className="flex items-center gap-2.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Resumo dos vencedores */}
                  <Card className="border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 shadow-sm rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
                      <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5 text-gray-400" />
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
                        
                        if (sorted.length === 0) return <p className="text-xs text-gray-500 italic">Sem dados suficientes</p>;
                        
                        return sorted.map((w, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className={cn("flex items-center gap-2", idx === 0 ? "font-bold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}>
                              {idx === 0 && <Award className="h-3.5 w-3.5 text-gray-400" />}
                              {w.name}
                            </span>
                            <Badge variant="outline" className={cn("h-5 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300", idx !== 0 && "border-gray-200 bg-gray-50 text-gray-500")}>
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
                    className="bg-gray-900 hover:bg-gray-800 text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-gray-900/20 rounded-xl px-8 h-10">
                    <Download className="h-4 w-4 mr-2" />Baixar PDF
                  </Button>
                  <Button size="lg" onClick={handleDownloadHtml} disabled={comparison.every(c => c.fornecedores.length === 0)}
                    variant="outline" className="font-bold uppercase tracking-wider text-xs rounded-xl px-8 h-10 border-gray-200 hover:bg-gray-50">
                    <FileText className="h-4 w-4 mr-2" />Baixar HTML
                  </Button>
                  <Button size="lg" onClick={() => setShowHtmlPreview(!showHtmlPreview)} disabled={comparison.every(c => c.fornecedores.length === 0)}
                    variant="ghost" className="font-bold uppercase tracking-wider text-xs rounded-xl px-8 h-10 text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                    <Eye className="h-4 w-4 mr-2" />{showHtmlPreview ? "Ocultar" : "Visualizar"}
                  </Button>
                </div>

                {/* Preview HTML */}
                {showHtmlPreview && (
                  <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xl">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Preview</p>
                    </div>
                    <iframe srcDoc={generateHtmlComparative()} className="w-full h-[600px] border-0 bg-white" title="HTML Preview" />
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
