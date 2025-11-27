import { Quote, FornecedorParticipante } from "./types";

// Função helper para converter dados do hook para formato Quote
export function convertQuoteDetailsToQuote(detailsData: any): Quote {
    const quoteItems = detailsData.quote_items || [];
    const quoteSuppliers = detailsData.quote_suppliers || [];
    const supplierItems = detailsData.supplier_items || [];

    // Calcular valores oferecidos por fornecedor
    const fornecedoresParticipantes: FornecedorParticipante[] = quoteSuppliers.map((supplier: any) => {
        const items = supplierItems.filter((item: any) =>
            item.quote_id === detailsData.id && item.supplier_id === supplier.supplier_id
        );
        const totalValue = items.reduce((sum: number, item: any) => sum + (item.valor_oferecido || 0), 0);

        return {
            id: supplier.supplier_id,
            nome: supplier.supplier_name || 'Desconhecido',
            valorOferecido: totalValue,
            dataResposta: supplier.data_resposta ? new Date(supplier.data_resposta).toLocaleDateString("pt-BR") : null,
            observacoes: supplier.observacoes || "",
            status: supplier.status as "pendente" | "respondido"
        };
    });

    // Calcular melhor preço
    const valoresRespondidos = fornecedoresParticipantes
        .filter(f => f.valorOferecido > 0)
        .map(f => f.valorOferecido);

    const melhorValor = valoresRespondidos.length > 0 ? Math.min(...valoresRespondidos) : 0;
    const fornecedorMelhorPreco = fornecedoresParticipantes.find(f => f.valorOferecido === melhorValor);

    // Calcular economia
    const calcularEconomia = () => {
        if (valoresRespondidos.length < 2) return "0%";
        const maxValor = Math.max(...valoresRespondidos);
        const minValor = Math.min(...valoresRespondidos);
        const economia = maxValor - minValor;
        return maxValor > 0 ? `${((economia / maxValor) * 100).toFixed(1)}%` : "0%";
    };

    const produtosLista = quoteItems.map((item: any) => item.product_name || "Produto");
    const produtosTexto = quoteItems
        .map((item: any) => `${item.product_name} (${item.quantidade}${item.unidade})`)
        .join(", ");

    let produtoResumo = produtosLista[0] || "Sem produtos";
    if (produtosLista.length > 1) {
        produtoResumo = produtoResumo + "...";
    }

    // Calcular status real
    let statusReal = detailsData.status;
    if (detailsData.data_planejada) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const planejada = new Date(detailsData.data_planejada);
        planejada.setHours(0, 0, 0, 0);

        if (planejada > hoje && detailsData.status === 'planejada') {
            statusReal = 'planejada';
        } else if (planejada <= hoje && detailsData.status === 'planejada') {
            statusReal = 'ativa';
        }
    }

    return {
        id: detailsData.id,
        produto: produtosTexto || "Sem produtos",
        produtoResumo,
        produtosLista,
        quantidade: `${quoteItems.length} produto(s)`,
        status: detailsData.status,
        statusReal,
        dataInicio: new Date(detailsData.data_inicio).toLocaleDateString("pt-BR"),
        dataFim: new Date(detailsData.data_fim).toLocaleDateString("pt-BR"),
        dataPlanejada: detailsData.data_planejada,
        fornecedores: fornecedoresParticipantes.length,
        melhorPreco: melhorValor > 0 ? `R$ ${melhorValor.toFixed(2)}` : "R$ 0.00",
        melhorFornecedor: fornecedorMelhorPreco?.nome || "Aguardando",
        economia: calcularEconomia(),
        fornecedoresParticipantes,
        _raw: detailsData,
        _supplierItems: supplierItems,
    };
}
