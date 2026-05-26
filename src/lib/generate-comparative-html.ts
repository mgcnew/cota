const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function generateHtmlComparative(
  quote: any,
  products: any[],
  supplierItems: any[]
): string {
  if (!quote || !products.length) return "";

  const comparison = products.map((product: any) => {
    const fornecedores = (quote.fornecedoresParticipantes || [])
      .map((f: any) => {
        const item = supplierItems.find(
          (i: any) => i?.supplier_id === f.id && i?.product_id === product.product_id
        );
        const valor = item?.valor_oferecido || 0;
        const valorInicial = Number(item?.valor_inicial) || valor;

        let valorNormalizado = valor;
        if (item?.unidade_preco === 'cx' && item?.fator_conversao) {
          valorNormalizado = valor / item.fator_conversao;
        } else if (item?.unidade_preco === 'pct' && item?.fator_conversao) {
          valorNormalizado = valor / item.fator_conversao;
        } else if (item?.unidade_preco === 'kg' && product.unidade === 'g') {
          valorNormalizado = valor / 1000;
        } else if (item?.unidade_preco === 'ton' && product.unidade === 'kg') {
          valorNormalizado = valor / 1000;
        }

        return { supplierId: f.id, supplierName: f.nome, valorOferecido: valor, valorInicial, valorNormalizado, isMelhorPreco: false };
      })
      .filter((f: any) => f.valorOferecido > 0);

    if (fornecedores.length > 0) {
      const menorValor = Math.min(...fornecedores.map((f: any) => f.valorNormalizado));
      fornecedores.forEach((f: any) => { if (f.valorNormalizado === menorValor) f.isMelhorPreco = true; });
    }

    return { productId: product.product_id, productName: product.product_name, quantidade: product.quantidade, unidade: product.unidade, fornecedores };
  });

  const wins: Record<string, { name: string; wins: number; totalValue: number }> = {};
  comparison.forEach((comp: any) => {
    const winner = comp.fornecedores.find((f: any) => f.isMelhorPreco);
    if (winner) {
      if (!wins[winner.supplierId]) wins[winner.supplierId] = { name: winner.supplierName, wins: 0, totalValue: 0 };
      wins[winner.supplierId].wins++;
      wins[winner.supplierId].totalValue += winner.valorOferecido;
    }
  });
  const winsPerSupplier = Object.values(wins).sort((a: any, b: any) => b.wins - a.wins);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comparativo de Cotação - ${quote.id.substring(0, 8)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f3f4f6; color: #1f2937; line-height: 1.5; -webkit-font-smoothing: antialiased; }
    .container { max-width: 1200px; margin: 0 auto; padding: 30px; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px 30px; border-radius: 16px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-bottom: 4px solid #10b981; }
    .header-content h1 { font-size: 28px; margin-bottom: 6px; font-weight: 900; letter-spacing: -0.5px; }
    .header-content p { font-size: 14px; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .header-badge { background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: right; }
    .header-badge span { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 4px; }
    .header-badge strong { font-size: 18px; font-weight: 800; color: #34d399; }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .info-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; }
    .info-card strong { display: block; color: #64748b; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
    .info-card span { font-size: 16px; color: #0f172a; font-weight: 900; }
    .winners-section { background: white; padding: 30px; border-radius: 16px; margin-bottom: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .winners-section h2 { color: #0f172a; margin-bottom: 20px; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; padding-bottom: 15px; border-bottom: 2px solid #f1f5f9; }
    .winners-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .winner-card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
    .winner-card.first-place { background: linear-gradient(to right, #ecfdf5, #ffffff); border-color: #6ee7b7; box-shadow: 0 4px 12px rgba(16,185,129,0.1); }
    .winner-card.first-place::before { content: 'TOP 1'; position: absolute; top: 12px; right: 12px; background: #10b981; color: white; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 900; }
    .winner-card .rank { background: #1e293b; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 12px; }
    .winner-card.first-place .rank { background: #059669; }
    .winner-card .name { font-weight: 900; color: #0f172a; margin-bottom: 6px; font-size: 18px; letter-spacing: -0.5px; }
    .winner-card .wins-label { font-size: 13px; color: #64748b; font-weight: 600; }
    .comparatives { display: grid; gap: 24px; }
    .comparative-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .comparative-header { background: #f8fafc; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
    .comparative-header h3 { color: #0f172a; font-size: 16px; font-weight: 900; letter-spacing: -0.5px; display: flex; align-items: center; gap: 12px; }
    .comparative-header .qty { font-size: 12px; color: #64748b; font-weight: 800; background: #e2e8f0; padding: 4px 10px; border-radius: 6px; }
    .comparative-table { width: 100%; border-collapse: collapse; }
    .comparative-table th { background: white; padding: 14px 24px; text-align: left; font-weight: 800; font-size: 11px; color: #64748b; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 1px; }
    .comparative-table td { padding: 14px 24px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #334155; vertical-align: middle; }
    .winner-row { background: #ecfdf5 !important; }
    .winner-row td { color: #064e3b; }
    .winner-row td:first-child { font-weight: 800; border-left: 4px solid #10b981; padding-left: 20px; }
    .val-original { color: #94a3b8; font-size: 12px; text-decoration: line-through; margin-right: 8px; font-weight: 500; }
    .badge { display: inline-flex; align-items: center; justify-content: center; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; }
    .badge-winner { background: #10b981; color: white; }
    .badge-diff-low { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
    .badge-diff-med { background: #ffedd5; color: #ea580c; border: 1px solid #fdba74; }
    .badge-diff-high { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
    .econ-positive { color: #059669; font-weight: 800; }
    .no-response { padding: 30px; text-align: center; color: #94a3b8; font-weight: 600; font-style: italic; background: #f8fafc; }
    .footer { text-align: center; padding: 30px; color: #94a3b8; font-size: 12px; font-weight: 600; margin-top: 40px; }
    @media print {
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .container { max-width: 100%; padding: 0; }
      .header { border-radius: 0; margin-bottom: 20px; }
      .comparative-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <h1>COMPARATIVO DE COTAÇÃO</h1>
        <p>Referência #${quote.id.substring(0, 8).toUpperCase()}</p>
      </div>
      <div class="header-badge">
        <span>Itens Analisados</span>
        <strong>${products.length}</strong>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card"><strong>Início da Cotação</strong><span>${quote.dataInicio}</span></div>
      <div class="info-card"><strong>Fim da Cotação</strong><span>${quote.dataFim}</span></div>
      <div class="info-card"><strong>Fornecedores</strong><span>${(quote.fornecedoresParticipantes || []).length} convidados</span></div>
      <div class="info-card"><strong>Gerado em</strong><span>${new Date().toLocaleDateString('pt-BR')}</span></div>
    </div>

    ${winsPerSupplier.length > 0 ? `
    <div class="winners-section">
      <h2>Ranking de Vencedores</h2>
      <div class="winners-list">
        ${winsPerSupplier.map((w: any, idx: number) => `
          <div class="winner-card ${idx === 0 ? 'first-place' : ''}">
            <div class="rank">#${idx + 1} Lugar</div>
            <div class="name">${w.name}</div>
            <div class="wins-label">Arrematou <strong>${w.wins}</strong> ${w.wins === 1 ? 'produto' : 'produtos'}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="comparatives">
      ${comparison.map((comp: any, idx: number) => `
        <div class="comparative-card">
          <div class="comparative-header">
            <h3>
              <span>${idx + 1}. ${comp.productName}</span>
              <span class="qty">${comp.quantidade} ${comp.unidade}</span>
            </h3>
          </div>
          ${comp.fornecedores.length === 0
            ? `<div class="no-response">Nenhum fornecedor enviou preços para este item.</div>`
            : `<table class="comparative-table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Val. Inicial</th>
                  <th>Proposta</th>
                  <th>Preço Normalizado</th>
                  <th>Economia</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                ${comp.fornecedores
                  .slice()
                  .sort((a: any, b: any) => a.valorNormalizado - b.valorNormalizado)
                  .map((f: any) => {
                    const melhorValor = Math.min(...comp.fornecedores.map((x: any) => x.valorNormalizado));
                    const diferenca = melhorValor > 0 ? ((f.valorNormalizado - melhorValor) / melhorValor * 100) : 0;
                    const difClass = diferenca > 15 ? 'badge-diff-high' : diferenca > 5 ? 'badge-diff-med' : 'badge-diff-low';
                    return `
                  <tr class="${f.isMelhorPreco ? 'winner-row' : ''}">
                    <td>${f.supplierName}</td>
                    <td>${f.valorInicial > 0 && Math.abs(f.valorInicial - f.valorOferecido) > 0.001 ? `R$ ${formatCurrency(f.valorInicial)}` : '-'}</td>
                    <td>${f.valorOferecido !== f.valorNormalizado ? `<span class="val-original">R$ ${formatCurrency(f.valorOferecido)} original</span>` : `R$ ${formatCurrency(f.valorOferecido)}`}</td>
                    <td><strong>R$ ${formatCurrency(f.valorNormalizado)}</strong></td>
                    <td>${f.valorInicial > 0 && f.valorInicial > f.valorOferecido ? `<span class="econ-positive">R$ ${formatCurrency((f.valorInicial - f.valorOferecido) * (comp.quantidade || 1))}</span>` : '-'}</td>
                    <td>${f.isMelhorPreco ? '<span class="badge badge-winner">Melhor Opcao</span>' : `<span class="badge ${difClass}">+${diferenca.toFixed(1)}% mais caro</span>`}</td>
                  </tr>`; }).join('')}
              </tbody>
            </table>`}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Sistema CotaJá — Comparativo de Cotação gerado automaticamente.</p>
    </div>
  </div>
</body>
</html>`;
}
