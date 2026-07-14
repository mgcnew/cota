import { designSystem as ds } from "@/styles/design-system";

// Item normalizado para o relatório de pedido. Tanto o PedidoDialog (gerenciar
// pedido) quanto o RegistrarEntregaDialog montam esse formato a partir dos seus
// próprios estados internos.
export interface PedidoReportItem {
  produto: string;
  marca?: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;              // valor pago/NFe por unidade
  valorUnitarioCotado?: number | null; // valor negociado
  maiorValorCotado?: number | null;    // valor inicial ofertado
  totalItem?: number | null;           // total real da entrega
  quantidadeEntregue?: number | null;
}

export interface PedidoReportParams {
  pedidoId: string;
  isFromQuote: boolean;
  isDelivered: boolean;
  economiaReal: number;
  supplierName: string;
  statusLabel: string;
  dataEntrega: string;
  observacoes: string;
  itens: PedidoReportItem[];
}

// Gera o HTML do relatório de pedido (o mesmo do "Exportar Pedido"). Quando o
// pedido está entregue, exibe a Economia Real; caso contrário, a economia da
// negociação.
export function generatePedidoReportHtml(params: PedidoReportParams): string {
  const {
    pedidoId, isFromQuote, isDelivered, economiaReal,
    supplierName, statusLabel, dataEntrega, observacoes, itens,
  } = params;

  const now = new Date();
  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => {
    if (!d) return "-"; if (d.includes("/")) return d;
    try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
  };
  const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const brand = ds.colors.brand.primary;
  const brandHover = ds.colors.brand.hover;

  const normU = (u: string) => (u || "").toLowerCase().trim();
  const isMetadeU = (u: string) => ["metade", "meia", "1/2"].includes(normU(u));
  const isCaixaU = (u: string) => { const n = normU(u); return n === "cx" || n === "caixa" || n === "caixas" || n.startsWith("cx"); };
  const isVarU = (u: string) => isMetadeU(u) || isCaixaU(u);
  const showRecebido = isDelivered && itens.some(i => isVarU(i.unidade));
  const fmtQtd = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

  let totalInicial = 0;
  let economiaNeg = 0;
  let totalEntregue = 0;

  const itemRows = itens.map((item, idx) => {
    const neg = item.valorUnitarioCotado ?? item.valorUnitario;       // valor negociado/unit.
    const ini = item.maiorValorCotado ?? neg;                          // valor inicial ofertado
    const descUnit = Math.max(0, ini - neg);
    totalInicial += ini * item.quantidade;
    economiaNeg += descUnit * item.quantidade;
    const totalItem = item.totalItem ?? (item.quantidade * item.valorUnitario);
    totalEntregue += totalItem;

    const nome = `${idx + 1}. ${esc(item.produto)}${item.marca ? `<small>Marca: ${esc(item.marca)}</small>` : ""}`;
    const un = esc(item.unidade);
    const cells: string[] = [`<td>${nome}</td>`];
    cells.push(`<td data-label="Qtd" style="text-align:center">${fmtQtd(item.quantidade)} ${un}</td>`);

    if (isFromQuote) {
      const descPct = ini > 0 ? (descUnit / ini) * 100 : 0;
      const descCell = descUnit > 0
        ? `<span class="desc">- R$ ${fmt(descUnit)}<span class="u">/${un}</span> <small>(${descPct.toFixed(1)}%)</small></span>`
        : `<span class="muted">—</span>`;
      cells.push(`<td data-label="Pç. Inicial" style="text-align:right">R$ ${fmt(ini)}<span class="u">/${un}</span></td>`);
      cells.push(`<td data-label="Pç. Negoc." style="text-align:right">R$ ${fmt(neg)}<span class="u">/${un}</span></td>`);
      cells.push(`<td data-label="Desconto" style="text-align:right">${descCell}</td>`);
    } else {
      cells.push(`<td data-label="Valor Unit." style="text-align:right">R$ ${fmt(item.valorUnitario)}<span class="u">/${un}</span></td>`);
    }

    if (showRecebido) {
      const baseQty = item.valorUnitario > 0 ? totalItem / item.valorUnitario : (item.quantidadeEntregue ?? item.quantidade);
      const recUnit = isMetadeU(item.unidade) ? "kg" : isCaixaU(item.unidade) ? "un" : un;
      cells.push(`<td data-label="Recebido" style="text-align:right">${fmtQtd(baseQty)} <span class="u">${recUnit}</span></td>`);
    }
    if (isDelivered) {
      cells.push(`<td data-label="Total" style="text-align:right"><strong>R$ ${fmt(totalItem)}</strong></td>`);
    }
    return `<tr>${cells.join("")}</tr>`;
  }).join("");
  const economiaPct = totalInicial > 0 ? (economiaNeg / totalInicial) * 100 : 0;

  const headCells: string[] = [`<th>Produto</th>`, `<th style="text-align:center">Qtd</th>`];
  if (isFromQuote) {
    headCells.push(`<th style="text-align:right">Pç. Inicial</th>`, `<th style="text-align:right">Pç. Negoc.</th>`, `<th style="text-align:right">Desconto</th>`);
  } else {
    headCells.push(`<th style="text-align:right">Valor Unit.</th>`);
  }
  if (showRecebido) headCells.push(`<th style="text-align:right">Recebido</th>`);
  if (isDelivered) headCells.push(`<th style="text-align:right">Total</th>`);
  const tableHead = headCells.join("");
  const colCount = headCells.length;
  const tableMinWidth = 360 + (isFromQuote ? 240 : 120) + (showRecebido ? 90 : 0) + (isDelivered ? 110 : 0);

  const totalRow = isDelivered
    ? `<tr class="total-row"><td colspan="${colCount - 1}" style="text-align:right">TOTAL DO PEDIDO</td><td style="text-align:right">R$ ${fmt(totalEntregue)}</td></tr>`
    : "";

  const economiaBlock = isDelivered
    ? (economiaReal > 0 ? `
  <div class="economia">
    <div>
      <strong>Economia real</strong>
      <p>Calculada sobre o que foi efetivamente entregue.</p>
    </div>
    <div class="economia-value">
      <span>R$ ${fmt(economiaReal)}</span>
    </div>
  </div>` : "")
    : (isFromQuote ? `
  <div class="economia">
    <div>
      <strong>Economia na negociação</strong>
      <p>Diferença entre o preço inicial ofertado e o valor final negociado.</p>
    </div>
    <div class="economia-value">
      <span>R$ ${fmt(economiaNeg)}</span>
      <small>${economiaPct.toFixed(1)}% sobre R$ ${fmt(totalInicial)}</small>
    </div>
  </div>` : "");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pedido #${pedidoId.substring(0, 8)} - ${esc(supplierName || "")}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; color: #18181b; padding: 20px; line-height: 1.5; }
  .container { max-width: 900px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  .header { background: linear-gradient(135deg, ${brand} 0%, ${brandHover} 100%); color: #fff; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
  .header h1 { font-size: 24px; font-weight: 800; letter-spacing: .5px; }
  .header p { font-size: 13px; font-weight: 600; opacity: .85; margin-top: 4px; }
  .badge { display: inline-block; margin-top: 12px; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; background: rgba(255,255,255,.18); }
  .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px; }
  .info-card { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid ${brand}; }
  .info-card strong { display: block; color: ${brand}; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: .5px; margin-bottom: 4px; }
  .info-card span { font-size: 15px; font-weight: 600; word-break: break-word; }
  .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; min-width: ${tableMinWidth}px; }
  th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; font-weight: 800; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
  td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  td small { display: block; color: #9ca3af; font-size: 11px; margin-top: 2px; }
  td .desc { color: #b91c1c; font-weight: 700; }
  td .desc small { display: inline; color: #9ca3af; font-weight: 600; }
  td .u { color: #9ca3af; font-weight: 500; font-size: 12px; }
  td .muted { color: #d1d5db; }
  .total-row { background: #dcfce7 !important; font-weight: 800; }
  .total-row td { color: #166534; font-size: 16px; }
  .economia { margin-top: 24px; padding: 20px 24px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .economia strong { display: block; color: #065f46; font-size: 13px; text-transform: uppercase; font-weight: 800; letter-spacing: .5px; }
  .economia p { color: #047857; font-size: 12px; margin-top: 4px; }
  .economia-value { text-align: right; white-space: nowrap; }
  .economia-value span { display: block; font-size: 24px; font-weight: 900; color: #059669; }
  .economia-value small { color: #047857; font-size: 12px; font-weight: 600; }
  .obs { background: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid ${brand}; margin-top: 24px; }
  .obs strong { display: block; color: ${brand}; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: .5px; margin-bottom: 6px; }
  .obs p { white-space: pre-wrap; font-size: 14px; }
  .footer { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  @media (max-width: 640px) {
    body { padding: 0; }
    .container { padding: 16px; border-radius: 0; }
    .header { padding: 20px; margin-bottom: 20px; }
    .header h1 { font-size: 20px; }
    .info-grid { grid-template-columns: 1fr; gap: 10px; }
    .economia { flex-direction: column; align-items: flex-start; }
    .economia-value { text-align: left; }
    .table-wrap { overflow: visible; }
    table { min-width: 0; }
    thead { display: none; }
    tbody, tr, td { display: block; }
    tr { border: 1px solid #e5e7eb; border-radius: 10px; padding: 6px 14px; margin-bottom: 10px; background: #fff; }
    td { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 8px 0; border: none; border-bottom: 1px solid #f3f4f6; text-align: right; }
    td:last-child { border-bottom: none; }
    td[data-label]::before { content: attr(data-label); font-size: 10px; text-transform: uppercase; font-weight: 800; letter-spacing: .3px; color: #6b7280; text-align: left; white-space: nowrap; }
    td:first-child { display: block; text-align: left; font-weight: 700; font-size: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 2px; }
    td small { display: inline; margin: 0; }
    .total-row { display: flex; justify-content: space-between; align-items: center; background: #dcfce7; border: none; border-radius: 10px; padding: 14px; }
    .total-row td { display: inline; border: none; padding: 0; }
    .total-row td::before { content: none; }
  }
  @media print {
    body { background: #fff; padding: 0; }
    .container { box-shadow: none; max-width: 100%; padding: 0; }
    .table-wrap { overflow: visible; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>PEDIDO #${pedidoId.substring(0, 8)}</h1>
    <p>${esc(supplierName || "Fornecedor não informado")}</p>
    <span class="badge">${isFromQuote ? "Originado de cotação" : "Pedido direto"}</span>
  </div>
  <div class="info-grid">
    <div class="info-card"><strong>Fornecedor</strong><span>${esc(supplierName || "-")}</span></div>
    <div class="info-card"><strong>Entrega</strong><span>${fmtDate(dataEntrega)}</span></div>
    <div class="info-card"><strong>Status</strong><span>${esc(statusLabel)}</span></div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr>${tableHead}</tr></thead>
      <tbody>
        ${itemRows}
        ${totalRow}
      </tbody>
    </table>
  </div>
  ${economiaBlock}
  ${observacoes ? `<div class="obs"><strong>Observações</strong><p>${esc(observacoes)}</p></div>` : ""}
  <div class="footer">Sistema CotaJá &bull; Pedido de Compra &bull; Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
</div>
</body>
</html>`;
}

// Gera e dispara o download do relatório HTML do pedido.
export function downloadPedidoReport(params: PedidoReportParams): void {
  const html = generatePedidoReportHtml(params);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `pedido-${params.pedidoId.substring(0, 8)}-${new Date().toISOString().split("T")[0]}.html`;
  link.click();
  URL.revokeObjectURL(link.href);
}
