import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Eye, FileText, Building2, Package, Calendar } from "lucide-react";

interface OrderItem {
  produto: string;
  quantidade: number;
  valorUnitario: number;
  unidade: string;
}

interface OrderExportTabProps {
  pedido: any;
  itens: OrderItem[];
  fornecedor: string;
  dataEntrega: string;
  observacoes: string;
  suppliers: any[];
}

export function OrderExportTab({
  pedido,
  itens,
  fornecedor,
  dataEntrega,
  observacoes,
  suppliers,
}: OrderExportTabProps) {
  const selectedSupplier = suppliers.find(s => s.id === fornecedor);
  const calculateTotal = () => itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);
  
  // Formatar valor em reais (padrão brasileiro)
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Gerar HTML do pedido
  const generateOrderHtml = useCallback(() => {
    if (!pedido || !itens.length) return "";

    const total = calculateTotal();
    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      if (dateString.includes('/')) return dateString;
      try { return new Date(dateString).toLocaleDateString('pt-BR'); } catch { return dateString; }
    };

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido #${pedido.id.substring(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; color: #1f2937; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 20px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .info-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .info-card strong { display: block; color: #f97316; margin-bottom: 5px; font-size: 12px; text-transform: uppercase; }
    .info-card span { font-size: 16px; color: #1f2937; font-weight: 600; }
    .items-section { background: white; padding: 25px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .items-section h2 { color: #f97316; margin-bottom: 15px; font-size: 18px; display: flex; align-items: center; gap: 10px; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .items-table th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; font-size: 13px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .items-table tr:hover { background: #f9fafb; }
    .items-table tr:last-child td { border-bottom: none; }
    .total-row { background: #dcfce7 !important; font-weight: 600; }
    .total-row td { color: #166534; font-size: 16px; padding: 15px 12px; }
    .observations { background: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316; margin-bottom: 30px; }
    .observations h3 { color: #c2410c; margin-bottom: 10px; font-size: 16px; }
    .observations p { color: #9a3412; white-space: pre-wrap; }
    .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; }
    @media print {
      body { background: white; }
      .container { max-width: 100%; padding: 10px; }
      .header { padding: 20px; margin-bottom: 20px; }
      .items-section { break-inside: avoid; }
    }
    @media (max-width: 768px) {
      .header h1 { font-size: 22px; }
      .info-grid { grid-template-columns: 1fr; }
      .items-table { font-size: 12px; }
      .items-table th, .items-table td { padding: 8px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 PEDIDO DE COMPRA</h1>
      <p>Pedido #${pedido.id.substring(0, 8)}</p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <strong>Fornecedor</strong>
        <span>${selectedSupplier?.name || fornecedor || '-'}</span>
      </div>
      <div class="info-card">
        <strong>Data de Entrega</strong>
        <span>${formatDate(dataEntrega)}</span>
      </div>
      <div class="info-card">
        <strong>Total de Itens</strong>
        <span>${itens.length} produto${itens.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="info-card">
        <strong>Gerado em</strong>
        <span>${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</span>
      </div>
    </div>

    <div class="items-section">
      <h2>📋 Itens do Pedido</h2>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50%;">Produto</th>
            <th style="width: 15%; text-align: center;">Quantidade</th>
            <th style="width: 15%; text-align: right;">Valor Unit.</th>
            <th style="width: 20%; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itens.map((item, idx) => `
            <tr>
              <td>${idx + 1}. ${item.produto}</td>
              <td style="text-align: center;">${item.quantidade} ${item.unidade}</td>
              <td style="text-align: right;">R$ ${formatCurrency(item.valorUnitario)}</td>
              <td style="text-align: right;"><strong>R$ ${formatCurrency(item.quantidade * item.valorUnitario)}</strong></td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="3" style="text-align: right;">TOTAL DO PEDIDO</td>
            <td style="text-align: right;">R$ ${formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${observacoes ? `
    <div class="observations">
      <h3>📝 Observações</h3>
      <p>${observacoes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Sistema CotaJá - Pedido de Compra</p>
      <p>Este documento foi gerado automaticamente e contém informações confidenciais.</p>
    </div>
  </div>
</body>
</html>
    `;

    return html;
  }, [pedido, itens, fornecedor, dataEntrega, observacoes, selectedSupplier]);

  // Baixar HTML
  const handleDownloadHtml = useCallback(() => {
    const html = generateOrderHtml();
    if (!html || !pedido) return;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pedido-${pedido.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [generateOrderHtml, pedido]);

  const htmlContent = generateOrderHtml();
  const total = calculateTotal();

  return (
    <div className="flex flex-col h-full">
      {/* Header com ações */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Exportar Pedido
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadHtml}
              className="h-8 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Baixar HTML
            </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{selectedSupplier?.name || 'N/A'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{itens.length}</strong> itens
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total: <strong className="text-gray-900 dark:text-white">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Preview do HTML */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Pré-visualização
                </span>
              </div>
              <iframe
                srcDoc={htmlContent}
                className="w-full h-[500px] border-0"
                title="HTML Preview"
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
