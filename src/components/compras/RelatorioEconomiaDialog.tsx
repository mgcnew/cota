import { useState, useMemo } from "react";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePedidos } from "@/hooks/usePedidos";
import { Download, MessageCircle, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sendWhatsAppMessage } from "@/lib/w-api";
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
interface RelatorioEconomiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RelatorioEconomiaDialog({ open, onOpenChange }: RelatorioEconomiaDialogProps): JSX.Element {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [targetPhone, setTargetPhone] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { pedidos } = usePedidos();

  const filteredPedidos = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));
    
    return pedidos.filter(p => {
      // Pedidos criados no período - TRATAMENTO DE DATA SEM OFFSET UTC
      const dateStr = p.order_date;
      let pDate;
      
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/').map(Number);
        pDate = new Date(y, m - 1, d);
      } else {
        // Assume YYYY-MM-DD
        const [y, m, d] = dateStr.split('-').map(Number);
        pDate = new Date(y, m - 1, d);
      }
      
      // Reseta horário para comparar apenas a data (início do dia local)
      const pDateLocal = startOfDay(pDate);
      
      return isWithinInterval(pDateLocal, { start, end });
    });
  }, [pedidos, startDate, endDate]);

  const reportData = useMemo(() => {
    let totalEconomy = 0;
    const itemsList: any[] = [];

    filteredPedidos.forEach(pedido => {
      (pedido.items || []).forEach(item => {
        // LÓGICA DE ECONOMIA REAL NEGOCIADA
        // Se maior_valor_cotado for igual ao preço final ou nulo, economia é zero (legado)
        // Se o maior_valor_cotado for absurdo (muito maior) em itens legados, 
        // mas não temos histórico de lances, preferimos ser conservadores.
        let precoInicial = item.maior_valor_cotado || item.unit_price;
        const precoFinal = item.unit_price;

        const isKgOrUn = ['kg', 'un', 'unid', 'unidade'].includes((item.unidade_pedida || '').toLowerCase().trim());
        const showUnitWarning = !isKgOrUn;
        
        let diferenca = precoInicial - precoFinal;
        if (diferenca < 0) diferenca = 0;
        
        // Se a diferença for zero, não houve negociação registrada ou é item legado
        const economia = diferenca * (item.quantity || 1);
        
        if (economia > 0) {
          totalEconomy += economia;
        }

        const reductionPercent = precoInicial > 0 ? ((precoInicial - precoFinal) / precoInicial) * 100 : 0;

        itemsList.push({
          productName: item.product_name,
          supplierName: pedido.supplier_name,
          quantity: item.quantity,
          unit: item.unidade_pedida || 'un',
          precoInicial,
          precoFinal,
          economia,
          reductionPercent,
          showUnitWarning
        });
      });
    });

    return { totalEconomy, itemsList };
  }, [filteredPedidos]);

  const generateWhatsAppText = () => {
    const { totalEconomy, itemsList } = reportData;
    let text = `*RELATÓRIO DE ECONOMIA*\nPeríodo: ${format(parseISO(startDate), "dd/MM/yyyy")} a ${format(parseISO(endDate), "dd/MM/yyyy")}\n\n`;
    
    if (itemsList.length === 0) {
      return text + "Nenhum pedido/item no período.";
    }

    itemsList.forEach((item, idx) => {
      text += `*${idx + 1}. ${item.productName}*\n`;
      text += `- Fornecedor: ${item.supplierName}\n`;
      text += `- Volume/Peso: ${item.quantity} ${item.unit}${item.showUnitWarning ? ' (Aferido/KG)' : ''}\n`;
      
      if (item.precoInicial > item.precoFinal) {
        text += `- Oferta Inicial (Vencedor): ${formatCurrency(item.precoInicial)}\n`;
        text += `- Preço Fechado: *${formatCurrency(item.precoFinal)}* (-${item.reductionPercent.toFixed(1)}%)\n`;
        text += `- Economia Unitária: *${formatCurrency(item.precoInicial - item.precoFinal)} /kg*\n`;
        text += `- Economia Total: *+ ${formatCurrency(item.economia)}*\n`;
        if (item.showUnitWarning) {
          text += `_Obs: Desconto negociado sobre o Peso (KG), não sobre a unidade de embalagem (${item.unit})._\n`;
        }
      } else {
        text += `- Preço de Fechamento: *${formatCurrency(item.precoFinal)}* (Lance Inicial)\n`;
      }
      text += `\n`;
    });

    text += `*ECONOMIA TOTAL NEGOCIADA: ${formatCurrency(totalEconomy)}* 🏆\n`;
    text += `_Diferença entre a 1ª oferta do fornecedor e o valor final de fechamento._\n`;
    return text;
  };

  const handleSendManual = () => {
    const text = generateWhatsAppText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSendAPI = async () => {
    if (!targetPhone) {
      toast({ title: "Aviso", description: "Digite o número de destino.", variant: "destructive" });
      return;
    }
    const cleanPhone = targetPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({ title: "Aviso", description: "Número de telefone inválido.", variant: "destructive" });
      return;
    }

    try {
      setIsSending(true);
      const text = generateWhatsAppText();
      await sendWhatsAppMessage(cleanPhone, text);
      toast({ title: "Enviado", description: "Relatório enviado via W-API com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const generateHTMLBlob = () => {
    const { totalEconomy, itemsList } = reportData;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Economia</title>
        <style>
          body { font-family: system-ui, sans-serif; color: #333; line-height: 1.5; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1a1a1a; margin-bottom: 5px; }
          .subtitle { color: #666; margin-bottom: 30px; font-size: 1.1em; }
          .summary { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 30px; font-size: 1.2em; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f8f9fa; font-weight: bold; }
          .economy { color: #22c55e; font-weight: bold; }
          tr:hover { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>Relatório de Desempenho (Compras)</h1>
        <div class="subtitle">Período referenciado: ${format(parseISO(startDate), "dd/MM/yyyy")} a ${format(parseISO(endDate), "dd/MM/yyyy")}</div>
        
        <div class="summary">
          ROI de Negociação (Economia Real): ${formatCurrency(totalEconomy)} <br/>
          <small style="font-weight: normal; font-size: 0.8em; color: #555;">(Cálculo: [Preço Inicial - Preço Negociado] x Volume Total Comprado)</small>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Fornecedor</th>
              <th>Peso/Qtd</th>
              <th>Oferta 1º (Vencedor)</th>
              <th>Preço Fechado</th>
              <th>Redução (%)</th>
              <th>Econ. Unit.</th>
              <th>Econ. Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList.map(item => `
              <tr>
                <td style="font-size: 0.85em;">${item.productName}</td>
                <td style="font-size: 0.8em; color: #666;">${item.supplierName}</td>
                <td>
                  ${item.quantity} ${item.unit}
                  ${item.showUnitWarning ? '<br/><span style="font-size: 8px; color: #e11d48; font-weight: bold;">(DESC. POR KG)</span>' : ''}
                </td>
                <td>${formatCurrency(item.precoInicial)}</td>
                <td><strong>${formatCurrency(item.precoFinal)}</strong></td>
                <td style="color: #22c55e; font-size: 0.85em;">${item.reductionPercent > 0 ? item.reductionPercent.toFixed(1) + '%' : '-'}</td>
                <td style="color: #22c55e;">${item.precoInicial > item.precoFinal ? formatCurrency(item.precoInicial - item.precoFinal) : '-'}</td>
                <td class="${item.economia > 0 ? 'economy' : ''}">${item.economia > 0 ? formatCurrency(item.economia) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    return html;
  };

  const handleExportHTML = () => {
    const html = generateHTMLBlob();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-economia-${startDate}-a-${endDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerar Relatório de Economia</DialogTitle>
          <DialogDescription>
            Defina o período e exporte ou envie por WhatsApp a lista de itens convertidos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Pedidos Encontrados:</span>
              <span className="font-semibold">{filteredPedidos.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Itens Totais:</span>
              <span className="font-semibold">{reportData.itemsList.length}</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-md font-bold mt-2">
              <span>Economia Total:</span>
              <span>{formatCurrency(reportData.totalEconomy)}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label className="text-muted-foreground">Envio Oposto/Direto pela API</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Ex: 11999999999 (opcional para API)" 
                value={targetPhone}
                onChange={e => setTargetPhone(e.target.value)}
              />
              <Button size="icon" variant="outline" onClick={handleSendAPI} disabled={isSending || reportData.itemsList.length === 0} title="Enviar via W-API">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportHTML} disabled={reportData.itemsList.length === 0}>
            <Download className="mr-2 h-4 w-4" /> HTML
          </Button>
          <Button className="w-full sm:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white" onClick={handleSendManual} disabled={reportData.itemsList.length === 0}>
            <MessageCircle className="mr-2 h-4 w-4" /> Enviar p/ Diretor (WhatsApp)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
