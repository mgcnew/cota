import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Package, Calendar, Building2, DollarSign, Truck, Clock, CheckCircle2, Copy, Check, FileText } from "lucide-react";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import type { PackagingOrderDisplay } from "@/types/packaging";
import { PACKAGING_ORDER_STATUS } from "@/types/packaging";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import { designSystem as ds } from "@/styles/design-system";

import { ConfirmWhatsAppPackagingOrderDialog } from "@/components/forms/ConfirmWhatsAppPackagingOrderDialog";
import { supabase } from "@/integrations/supabase/client";

interface PackagingOrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PackagingOrderDisplay | null;
}

export function PackagingOrderDetailsDialog({ open, onOpenChange, order }: PackagingOrderDetailsDialogProps) {
  if (!order) return null;

  const statusConfig = PACKAGING_ORDER_STATUS.find(s => s.value === order.status);
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    red: "bg-red-100 text-red-700 border-red-200",
  };
  const IconComponent = order.status === "pendente" ? Clock : order.status === "confirmado" ? CheckCircle2 : order.status === "entregue" ? Truck : Clock;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);

  const handleWhatsAppConfirm = async () => {
    // Atualiza status local se necessário, no banco o dialogo ja vai fazer
    try {
      await supabase.from('packaging_orders').update({status: 'enviado'}).eq('id', order.id);
    } catch(err) {}
  };

  const handleCopyOrderSummary = useCallback(() => {
    if (!order) return;
    
    let text = `📦 *PEDIDO DE EMBALAGENS*\n`;
    text += `*Fornecedor:* ${order.supplierName}\n`;
    text += `*Data:* ${order.orderDate}\n`;
    if (order.deliveryDate) text += `*Previsão:* ${order.deliveryDate}\n`;
    text += `\n*ITENS:*\n`;
    
    order.itens.forEach(item => {
      text += `• ${item.packagingName}: ${item.quantidade} ${item.unidadeCompra || 'un'} × ${formatCurrency(item.valorUnitario)} = ${formatCurrency(item.valorTotal)}\n`;
    });
    
    text += `\n*VALOR TOTAL: ${formatCurrency(order.totalValue)}*\n`;
    if (order.observations) text += `\n*Obs:* ${order.observations}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copiado!", description: "Resumo do pedido copiado para a área de transferência." });
    setTimeout(() => setCopied(false), 2000);
  }, [order, toast]);

  const handleExportOrderHtml = useCallback(() => {
    if (!order) return;
    
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido # - ${order.supplierName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, system-ui, sans-serif; padding: 40px 20px; background: #f9fafb; color: #111827; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .header { margin-bottom: 30px; border-bottom: 2px solid #111827; padding-bottom: 20px; }
    .header h1 { font-size: 24px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .header p { color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th { text-align: left; padding: 14px 12px; background: #f3f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #4b5563; font-weight: 800; }
    td { padding: 14px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .total-section { margin-top: 40px; padding: 24px; background: #111827; color: white; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
    .total-label { font-size: 11px; text-transform: uppercase; font-weight: 800; opacity: 0.7; letter-spacing: 1px; }
    .total-value { font-size: 28px; font-weight: 900; }
    .obs-section { margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 12px; border-left: 4px solid #e5e7eb; }
    .obs-label { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #6b7280; margin-bottom: 8px; }
    .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    @media print { body { padding: 0; background: white; } .container { box-shadow: none; border: none; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Pedido de Compra</h1>
      <p><strong>Fornecedor:</strong> ${order.supplierName}</p>
      <p><strong>Data do Pedido:</strong> ${order.orderDate}</p>
      ${order.deliveryDate ? `<p><strong>Previsão de Entrega:</strong> ${order.deliveryDate}</p>` : ''}
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 50%">Descrição</th>
          <th style="text-align: center;">Qtd</th>
          <th style="text-align: center;">Unidade</th>
          <th style="text-align: right;">Unitário</th>
        </tr>
      </thead>
      <tbody>
        ${order.itens.map(item => `
          <tr>
            <td style="font-weight: 600;">${item.packagingName}</td>
            <td style="text-align: center;">${item.quantidade}</td>
            <td style="text-align: center;">${item.unidadeCompra || '-'}</td>
            <td style="text-align: right;">${formatCurrency(item.valorUnitario)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    ${order.observations ? `
      <div class="obs-section">
        <p class="obs-label">Observações</p>
        <p style="font-size: 14px; line-height: 1.5;">${order.observations}</p>
      </div>
    ` : ''}

    <div class="total-section">
      <div>
        <p class="total-label">Total a Pagar</p>
        <p style="font-size: 14px; opacity: 0.8;">${order.itens.length} itens incluídos</p>
      </div>
      <div style="text-align: right;">
        <p class="total-value">${formatCurrency(order.totalValue)}</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Gerado pelo Sistema CotaJá • Departamento de Compras</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pedido-${order.supplierName.replace(/\s+/g, '-')}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast({ title: "Exportado!", description: "Arquivo HTML gerado com sucesso." });
  }, [order, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className={cn("h-5 w-5", ds.colors.icon.primary)} />
              Detalhes do Pedido
            </div>
            <div className="flex items-center gap-2 mr-6">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-2 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] uppercase tracking-wider"
                onClick={() => setWhatsAppOpen(true)}
                title="Enviar via WhatsApp"
              >
                WhatsApp
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-2 rounded-lg border-border hover:bg-muted font-bold text-[10px] uppercase tracking-wider"
                onClick={handleCopyOrderSummary}
                title="Copiar Resumo"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-muted-foreground" />
                    Copiar
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-2 rounded-lg border-border hover:bg-muted font-bold text-[10px] uppercase tracking-wider"
                onClick={handleExportOrderHtml}
                title="Exportar HTML"
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                HTML
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info do pedido */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />Fornecedor</p>
              <CapitalizedText className="font-semibold">{order.supplierName}</CapitalizedText>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Data do Pedido</p>
              <p className="font-semibold">{order.orderDate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" />Previsão de Entrega</p>
              <p className="font-semibold">{order.deliveryDate || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="outline" className={cn("text-xs", colorClasses[statusConfig?.color || ""] || "")}>
                <IconComponent className="h-3 w-3 mr-1" />
                {statusConfig?.label || order.status}
              </Badge>
            </div>
          </div>

          {/* Itens do pedido */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className={cn("h-4 w-4", ds.colors.icon.primary)} />
              Itens do Pedido ({order.itens.length})
            </h3>
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Embalagem</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.itens.map((item, index) => (
                    <TableRow key={item.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                      <TableCell>
                        <CapitalizedText className="font-medium">{item.packagingName}</CapitalizedText>
                      </TableCell>
                      <TableCell className="text-center">{item.quantidade}</TableCell>
                      <TableCell className="text-center">{item.unidadeCompra || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valorUnitario)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.valorTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Total do Pedido</p>
              <p className="text-2xl font-bold text-emerald-600 flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                {formatCurrency(order.totalValue)}
              </p>
            </div>
          </div>

          {/* Observações */}
          {order.observations && (
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Observações</p>
              <p className="text-sm">{order.observations}</p>
            </div>
          )}
        </div>
      </DialogContent>
      <ConfirmWhatsAppPackagingOrderDialog 
        open={whatsAppOpen} 
        onOpenChange={setWhatsAppOpen} 
        pedido={order} 
        onConfirm={handleWhatsAppConfirm} 
      />
    </Dialog>
  );
}
