import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Eye, FileText, Trophy, Building2, Package } from "lucide-react";
import { Quote } from "./types";

interface QuoteExportTabProps {
  quote: Quote;
  products: any[];
  getSupplierProductValue: (supplierId: string, productId: string) => number;
  getNormalizedUnitPrice: (supplierId: string, productId: string) => number;
}

export function QuoteExportTab({
  quote,
  products,
  getSupplierProductValue,
  getNormalizedUnitPrice,
}: QuoteExportTabProps) {
  // Calcular comparativo de preços por produto
  const comparison = useMemo(() => {
    if (!quote || !products.length) return [];

    return products.map((product: any) => {
      const fornecedores = quote.fornecedoresParticipantes
        .map((f) => {
          const valor = getSupplierProductValue(f.id, product.product_id);
          const valorNormalizado = getNormalizedUnitPrice(f.id, product.product_id);
          return {
            supplierId: f.id,
            supplierName: f.nome,
            valorOferecido: valor,
            valorNormalizado: valorNormalizado,
            isMelhorPreco: false,
          };
        })
        .filter((f) => f.valorOferecido > 0);

      // Marcar melhor preço (baseado no valor normalizado)
      if (fornecedores.length > 0) {
        const menorValor = Math.min(...fornecedores.map((f) => f.valorNormalizado));
        fornecedores.forEach((f) => {
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
  }, [quote, products, getSupplierProductValue, getNormalizedUnitPrice]);

  // Calcular vencedores por fornecedor
  const winsPerSupplier = useMemo(() => {
    const wins: Record<string, { name: string; wins: number; totalValue: number }> = {};
    
    comparison.forEach((comp) => {
      const winner = comp.fornecedores.find((f) => f.isMelhorPreco);
      if (winner) {
        if (!wins[winner.supplierId]) {
          wins[winner.supplierId] = { name: winner.supplierName, wins: 0, totalValue: 0 };
        }
        wins[winner.supplierId].wins++;
        wins[winner.supplierId].totalValue += winner.valorOferecido;
      }
    });

    return Object.values(wins).sort((a, b) => b.wins - a.wins);
  }, [comparison]);

  // Gerar HTML comparativo
  const generateHtmlComparative = useCallback(() => {
    if (!quote || !comparison.length) return "";

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comparativo de Cotação - ${quote.id.substring(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; color: #1f2937; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 20px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .info-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .info-card strong { display: block; color: #f97316; margin-bottom: 5px; font-size: 12px; text-transform: uppercase; }
    .info-card span { font-size: 16px; color: #1f2937; font-weight: 600; }
    .winners-section { background: white; padding: 25px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .winners-section h2 { color: #f97316; margin-bottom: 15px; font-size: 18px; display: flex; align-items: center; gap: 10px; }
    .winners-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
    .winner-card { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 15px; border-radius: 8px; border: 1px solid #86efac; }
    .winner-card .rank { display: inline-block; background: #22c55e; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }
    .winner-card .name { font-weight: 600; color: #166534; margin-bottom: 5px; font-size: 16px; }
    .winner-card .wins { font-size: 14px; color: #15803d; }
    .comparatives { display: grid; gap: 20px; }
    .comparative-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .comparative-header { background: #fff7ed; padding: 15px; border-bottom: 2px solid #f97316; }
    .comparative-header h3 { color: #c2410c; font-size: 16px; display: flex; align-items: center; gap: 8px; }
    .comparative-header .qty { font-size: 13px; color: #9a3412; font-weight: normal; margin-left: auto; }
    .comparative-table { width: 100%; border-collapse: collapse; }
    .comparative-table th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    .comparative-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .comparative-table tr:hover { background: #f9fafb; }
    .winner-row { background: #dcfce7 !important; }
    .winner-row td { font-weight: 600; color: #166534; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-winner { background: #22c55e; color: white; }
    .badge-difference { background: #fee2e2; color: #991b1b; }
    .no-response { padding: 20px; text-align: center; color: #9ca3af; font-style: italic; }
    .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; }
    @media print {
      body { background: white; }
      .container { max-width: 100%; padding: 10px; }
      .header { padding: 20px; margin-bottom: 20px; }
      .comparative-card { break-inside: avoid; }
    }
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
      <p>Cotação #${quote.id.substring(0, 8)}</p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <strong>Período</strong>
        <span>${quote.dataInicio} a ${quote.dataFim}</span>
      </div>
      <div class="info-card">
        <strong>Produtos</strong>
        <span>${products.length} itens</span>
      </div>
      <div class="info-card">
        <strong>Fornecedores</strong>
        <span>${quote.fornecedoresParticipantes.length} participantes</span>
      </div>
      <div class="info-card">
        <strong>Gerado em</strong>
        <span>${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</span>
      </div>
    </div>

    ${winsPerSupplier.length > 0 ? `
    <div class="winners-section">
      <h2>🎯 Ranking de Fornecedores</h2>
      <div class="winners-list">
        ${winsPerSupplier.map((w, idx) => `
          <div class="winner-card">
            <div class="rank">#${idx + 1} - ${w.wins} ${w.wins === 1 ? 'produto' : 'produtos'}</div>
            <div class="name">${w.name}</div>
            <div class="wins">Melhor preço em ${w.wins} ${w.wins === 1 ? 'produto' : 'produtos'}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="comparatives">
      ${comparison.map((comp, idx) => `
        <div class="comparative-card">
          <div class="comparative-header">
            <h3>
              <span>${idx + 1}. ${comp.productName}</span>
              <span class="qty">${comp.quantidade} ${comp.unidade}</span>
            </h3>
          </div>
          ${comp.fornecedores.length === 0 ? `
            <div class="no-response">
              Nenhum fornecedor ofereceu preço para este produto
            </div>
          ` : `
            <table class="comparative-table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Valor Oferecido</th>
                  <th>Valor Unit. Normalizado</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${comp.fornecedores
                  .sort((a, b) => a.valorNormalizado - b.valorNormalizado)
                  .map((f, fIdx) => {
                    const melhorValor = Math.min(...comp.fornecedores.map(x => x.valorNormalizado));
                    const diferenca = melhorValor > 0 ? ((f.valorNormalizado - melhorValor) / melhorValor * 100) : 0;
                    return `
                  <tr class="${f.isMelhorPreco ? 'winner-row' : ''}">
                    <td>${f.supplierName}</td>
                    <td>R$ ${f.valorOferecido.toFixed(2)}</td>
                    <td><strong>R$ ${f.valorNormalizado.toFixed(4)}</strong></td>
                    <td>
                      ${f.isMelhorPreco 
                        ? '<span class="badge badge-winner">🏆 MELHOR PREÇO</span>' 
                        : `<span class="badge badge-difference">+${diferenca.toFixed(1)}%</span>`
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
  }, [quote, comparison, products, winsPerSupplier]);

  // Baixar HTML
  const handleDownloadHtml = useCallback(() => {
    const html = generateHtmlComparative();
    if (!html || !quote) return;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cotacao-${quote.id.substring(0, 8)}-${quote.dataInicio.replace(/\//g, '-')}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [generateHtmlComparative, quote]);

  const htmlContent = generateHtmlComparative();

  return (
    <div className="flex flex-col h-full">
      {/* Header com ações */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Exportar Comparativo
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
            <Package className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{products.length}</strong> produtos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{quote.fornecedoresParticipantes.length}</strong> fornecedores
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{winsPerSupplier.length}</strong> com melhor preço
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
