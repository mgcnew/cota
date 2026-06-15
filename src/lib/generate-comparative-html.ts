import { getBaseUnit } from "@/utils/priceNormalization";

const fmt = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function generateHtmlComparative(
  quote: any,
  products: any[],
  supplierItems: any[]
): string {
  if (!quote || !products.length) return "";

  // ── Build comparison data ──────────────────────────────────────────────────
  const comparison = products.map((product: any) => {
    const fornecedores = (quote.fornecedoresParticipantes || [])
      .map((f: any) => {
        const item = supplierItems.find(
          (i: any) => i?.supplier_id === f.id && i?.product_id === product.product_id
        );
        const valor = item?.valor_oferecido || 0;
        const valorInicial = Number(item?.valor_inicial) || valor;

        let valorNormalizado = valor;
        if (item?.unidade_preco === 'cx' && item?.fator_conversao) valorNormalizado = valor / item.fator_conversao;
        else if (item?.unidade_preco === 'pct' && item?.fator_conversao) valorNormalizado = valor / item.fator_conversao;
        else if (item?.unidade_preco === 'kg' && product.unidade === 'g') valorNormalizado = valor / 1000;
        else if (item?.unidade_preco === 'ton' && product.unidade === 'kg') valorNormalizado = valor / 1000;

        return { supplierId: f.id, supplierName: f.nome, valorOferecido: valor, valorInicial, valorNormalizado, isMelhorPreco: false };
      })
      .filter((f: any) => f.valorOferecido > 0);

    if (fornecedores.length > 0) {
      const menor = Math.min(...fornecedores.map((f: any) => f.valorNormalizado));
      fornecedores.forEach((f: any) => { if (f.valorNormalizado === menor) f.isMelhorPreco = true; });
    }

    return { productId: product.product_id, productName: product.product_name, quantidade: product.quantidade, unidade: product.unidade, fornecedores };
  });

  // ── Supplier winners ───────────────────────────────────────────────────────
  const wins: Record<string, { name: string; wins: number; totalValue: number }> = {};
  comparison.forEach((comp: any) => {
    const winner = comp.fornecedores.find((f: any) => f.isMelhorPreco);
    if (winner) {
      if (!wins[winner.supplierId]) wins[winner.supplierId] = { name: winner.supplierName, wins: 0, totalValue: 0 };
      wins[winner.supplierId].wins++;
      wins[winner.supplierId].totalValue += winner.valorNormalizado * (comp.quantidade || 1);
    }
  });
  const winsPerSupplier = Object.values(wins).sort((a: any, b: any) => b.wins - a.wins);

  // ── Economy metrics ────────────────────────────────────────────────────────
  let bestTotal = 0;
  let economyTotal = 0;
  comparison.forEach((comp: any) => {
    const best = comp.fornecedores.find((f: any) => f.isMelhorPreco);
    if (best) {
      const subtotal = best.valorNormalizado * (comp.quantidade || 1);
      bestTotal += subtotal;
      if (best.valorInicial > best.valorOferecido) {
        economyTotal += (best.valorInicial - best.valorOferecido) * (comp.quantidade || 1);
      }
    }
  });
  const economyPct = bestTotal > 0 ? (economyTotal / (bestTotal + economyTotal)) * 100 : 0;

  const rankEmoji = ['🥇', '🥈', '🥉'];
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Negociação — ${quote.id.substring(0, 8).toUpperCase()}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
      color-scheme: light;
    }

    .page { max-width: 900px; margin: 0 auto; padding: 40px 24px 60px; }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    .header-title { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
    .header-doc { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -.5px; line-height: 1; }
    .header-meta { font-size: 12px; color: #64748b; margin-top: 6px; }
    .header-right { text-align: right; }
    .header-id { font-size: 12px; font-weight: 600; color: #94a3b8; font-variant-numeric: tabular-nums; }
    .header-date { font-size: 13px; color: #64748b; margin-top: 4px; }

    /* ── Economy hero ── */
    .economy-hero {
      background: #0f172a;
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    .economy-hero-left {}
    .economy-hero-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .economy-hero-value {
      font-size: 40px;
      font-weight: 900;
      color: #34d399;
      letter-spacing: -1px;
      line-height: 1;
    }
    .economy-hero-sub {
      font-size: 13px;
      color: #64748b;
      margin-top: 8px;
    }
    .economy-hero-sub strong { color: #94a3b8; }
    .economy-hero-right { text-align: right; }
    .economy-pct-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .economy-pct {
      font-size: 32px;
      font-weight: 900;
      color: #34d399;
      letter-spacing: -.5px;
      line-height: 1;
    }
    .economy-total-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #64748b;
      margin-top: 16px;
      margin-bottom: 4px;
    }
    .economy-total-value {
      font-size: 20px;
      font-weight: 800;
      color: #e2e8f0;
      letter-spacing: -.3px;
    }

    /* ── Stat cards ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 6px; }
    .stat-value { font-size: 18px; font-weight: 800; color: #0f172a; }

    /* ── Section titles ── */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .12em;
      color: #64748b;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    /* ── Winners ── */
    .winners-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
      margin-bottom: 36px;
    }
    .winner-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .winner-card.first { border-color: #6ee7b7; background: #f0fdf9; }
    .winner-emoji { font-size: 24px; line-height: 1; flex-shrink: 0; }
    .winner-name { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
    .winner-stats { font-size: 11px; color: #64748b; font-weight: 500; }
    .winner-total { font-size: 12px; font-weight: 700; color: #059669; margin-top: 2px; }

    /* ── Product table ── */
    .products-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }

    .product-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .product-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .product-name { font-size: 14px; font-weight: 800; color: #0f172a; }
    .product-qty {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      background: #e2e8f0;
      padding: 3px 10px;
      border-radius: 20px;
    }

    table { width: 100%; border-collapse: collapse; }
    th {
      padding: 10px 20px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: #94a3b8;
      background: white;
      border-bottom: 1px solid #f1f5f9;
    }
    td {
      padding: 12px 20px;
      font-size: 13px;
      font-weight: 500;
      color: #334155;
      border-bottom: 1px solid #f8fafc;
    }
    tr:last-child td { border-bottom: none; }

    .row-winner { background: #f0fdf9; }
    .row-winner td { color: #065f46; }
    .row-winner td:first-child { font-weight: 700; border-left: 3px solid #10b981; padding-left: 17px; }

    .price-strong { font-size: 14px; font-weight: 800; color: #0f172a; }
    .row-winner .price-strong { color: #059669; }

    .badge-best {
      display: inline-flex; align-items: center; gap: 4px;
      background: #dcfce7; color: #15803d;
      border: 1px solid #bbf7d0;
      padding: 3px 10px; border-radius: 20px;
      font-size: 10px; font-weight: 700; letter-spacing: .05em;
    }
    .badge-diff {
      display: inline-block;
      padding: 3px 8px; border-radius: 20px;
      font-size: 10px; font-weight: 700;
    }
    .diff-low  { background: #fef9c3; color: #a16207; }
    .diff-med  { background: #ffedd5; color: #c2410c; }
    .diff-high { background: #fee2e2; color: #b91c1c; }

    .no-bids { padding: 24px; text-align: center; color: #94a3b8; font-size: 13px; font-style: italic; }

    /* ── Footer ── */
    .footer {
      text-align: center;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
    }

    @media print {
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px; max-width: 100%; }
      .product-card { break-inside: avoid; }
      .economy-hero { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="header-title">CotaJá · Relatório de Negociação</div>
      <div class="header-doc">${(quote.produto || quote.produtoResumo || 'Cotação').toUpperCase()}</div>
      <div class="header-meta">Período: ${quote.dataInicio} → ${quote.dataFim}</div>
    </div>
    <div class="header-right">
      <div class="header-id">Ref. #${quote.id.substring(0, 8).toUpperCase()}</div>
      <div class="header-date">Gerado em ${today}</div>
    </div>
  </div>

  ${economyTotal > 0 ? `
  <!-- Economy Hero -->
  <div class="economy-hero">
    <div class="economy-hero-left">
      <div class="economy-hero-label">Economia obtida na negociação</div>
      <div class="economy-hero-value">R$ ${fmt(economyTotal)}</div>
      <div class="economy-hero-sub">em relação aos preços iniciais praticados</div>
    </div>
    <div class="economy-hero-right">
      <div class="economy-pct-label">Redução média</div>
      <div class="economy-pct">${economyPct.toFixed(1)}%</div>
      <div class="economy-total-label">Melhor total da cotação</div>
      <div class="economy-total-value">R$ ${fmt(bestTotal)}</div>
    </div>
  </div>
  ` : bestTotal > 0 ? `
  <!-- Melhor Total (sem economia calculável) -->
  <div class="economy-hero">
    <div class="economy-hero-left">
      <div class="economy-hero-label">Melhor total da cotação</div>
      <div class="economy-hero-value">R$ ${fmt(bestTotal)}</div>
      <div class="economy-hero-sub">considerando o melhor preço por item</div>
    </div>
  </div>
  ` : ''}

  <!-- Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Produtos</div>
      <div class="stat-value">${products.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Fornecedores</div>
      <div class="stat-value">${(quote.fornecedoresParticipantes || []).length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Vencedores</div>
      <div class="stat-value">${winsPerSupplier.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Responderam</div>
      <div class="stat-value">${(quote.fornecedoresParticipantes || []).filter((f: any) => f.status === 'respondido').length} de ${(quote.fornecedoresParticipantes || []).length}</div>
    </div>
  </div>

  ${winsPerSupplier.length > 0 ? `
  <!-- Winners -->
  <div class="section-title">Vencedores da Cotação</div>
  <div class="winners-grid">
    ${winsPerSupplier.map((w: any, idx: number) => `
      <div class="winner-card ${idx === 0 ? 'first' : ''}">
        <div class="winner-emoji">${rankEmoji[idx] || '🏅'}</div>
        <div>
          <div class="winner-name">${w.name}</div>
          <div class="winner-stats">${w.wins} ${w.wins === 1 ? 'item' : 'itens'} arrematados</div>
          <div class="winner-total">R$ ${fmt(w.totalValue)}</div>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Products -->
  <div class="section-title">Comparativo por Produto</div>
  <div class="products-list">
    ${comparison.map((comp: any, idx: number) => `
      <div class="product-card">
        <div class="product-header">
          <span class="product-name">${idx + 1}. ${comp.productName}</span>
          <span class="product-qty">${comp.quantidade} ${comp.unidade}</span>
        </div>
        ${comp.fornecedores.length === 0
          ? `<div class="no-bids">Nenhum fornecedor enviou proposta para este item.</div>`
          : `<table>
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Proposta (unit.)</th>
                  <th>Diferença</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                ${comp.fornecedores
                  .slice()
                  .sort((a: any, b: any) => a.valorNormalizado - b.valorNormalizado)
                  .map((f: any) => {
                    const melhor = Math.min(...comp.fornecedores.map((x: any) => x.valorNormalizado));
                    const diff = melhor > 0 ? ((f.valorNormalizado - melhor) / melhor * 100) : 0;
                    const diffClass = diff > 15 ? 'diff-high' : diff > 5 ? 'diff-med' : 'diff-low';
                    return `
                  <tr class="${f.isMelhorPreco ? 'row-winner' : ''}">
                    <td>${f.supplierName}</td>
                    <td><span class="price-strong">R$ ${fmt(f.valorNormalizado)}</span><span style="color:#94a3b8;font-weight:500"> /${getBaseUnit(comp.unidade || 'un')}</span></td>
                    <td>${f.isMelhorPreco ? '—' : `<span class="badge-diff ${diffClass}">+${diff.toFixed(1)}%</span>`}</td>
                    <td>${f.isMelhorPreco ? '<span class="badge-best">✓ Melhor opção</span>' : ''}</td>
                  </tr>`;
                  }).join('')}
              </tbody>
            </table>`}
      </div>
    `).join('')}
  </div>

  <div class="footer">
    CotaJá · Relatório gerado automaticamente em ${today} · Ref. #${quote.id.substring(0, 8).toUpperCase()}
  </div>

</div>
</body>
</html>`;
}
