import { useMemo } from 'react';
import type { Product } from '@/hooks/useProducts';
import { formatCurrency } from '@/utils/formatters';

export interface ProductStats {
  totalProducts: number;
  totalCategories: number;
  activeQuotes: number;
  produtosPorStatus: {
    ativos: number;
    cotados: number;
    pendentes: number;
    semCotacao: number;
  };
  percentualComCotacao: number;
  topCategoria: { nome: string; count: number } | null;
  mediaCotacoesPorProduto: string;
  averageValue: string;
  averageValueNumeric: number;
  economiaMediaPorProduto: string;
  economiaPotencial: number;
  percentualEconomiaMedia: number;
  productsWithPrices: number;
}

export function useProductStats(products: Product[], categories: string[]): ProductStats {
  return useMemo(() => {
    if (!Array.isArray(products) || !Array.isArray(categories)) {
      return {
        totalProducts: 0,
        totalCategories: 0,
        activeQuotes: 0,
        produtosPorStatus: { ativos: 0, cotados: 0, pendentes: 0, semCotacao: 0 },
        percentualComCotacao: 0,
        topCategoria: null,
        mediaCotacoesPorProduto: "0.0",
        averageValue: "R$ 0,00",
        averageValueNumeric: 0,
        economiaMediaPorProduto: "0",
        economiaPotencial: 0,
        percentualEconomiaMedia: 0,
        productsWithPrices: 0,
      };
    }

    const totalCategories = Math.max(0, categories.length - 1);
    const activeQuotes = products.reduce((sum, p) => sum + (p.quotesCount || 0), 0);

    const produtosPorStatus = {
      ativos: products.filter((p) => (p.quotesCount || 0) >= 3).length,
      cotados: products.filter((p) => (p.quotesCount || 0) > 0 && (p.quotesCount || 0) < 3).length,
      pendentes: products.filter((p) => (p.quotesCount || 0) === 0 && (p.lastOrderPrice || 0) > 0).length,
      semCotacao: products.filter((p) => (p.quotesCount || 0) === 0 && (p.lastOrderPrice || 0) === 0).length
    };

    const produtosComCotacao = produtosPorStatus.ativos + produtosPorStatus.cotados;
    const percentualComCotacao = products.length > 0
      ? Math.round((produtosComCotacao / products.length) * 100)
      : 0;

    const categoriaCount = new Map<string, number>();
    products.forEach(p => {
      const cat = p.category || 'Sem Categoria';
      categoriaCount.set(cat, (categoriaCount.get(cat) || 0) + 1);
    });
    const topCategoriaEntry = Array.from(categoriaCount.entries()).sort((a, b) => b[1] - a[1])[0];

    const produtosComCotacaoParaMedia = products.filter((p) => (p.quotesCount || 0) > 0);
    const mediaCotacoesPorProduto = produtosComCotacaoParaMedia.length > 0
      ? (activeQuotes / produtosComCotacaoParaMedia.length).toFixed(1)
      : "0.0";

    const productsWithPrices = products.filter((p) => (p.lastOrderPrice || 0) > 0);
    let averageValue = "R$ 0,00";
    let averageValueNumeric = 0;
    let economiaMediaPorProduto = "0";
    let economiaPotencial = 0;
    let percentualEconomiaMedia = 0;

    if (productsWithPrices.length > 0) {
      const total = productsWithPrices.reduce((sum, p) => {
        const price = Number(p.lastOrderPrice || 0);
        return sum + (isNaN(price) ? 0 : price);
      }, 0);
      averageValueNumeric = total / productsWithPrices.length;
      averageValue = formatCurrency(averageValueNumeric);

      const produtosComMultiplasCotacoes = products.filter((p) => (p.quotesCount || 0) >= 2);
      if (produtosComMultiplasCotacoes.length > 0) {
        percentualEconomiaMedia = Math.round((produtosComMultiplasCotacoes.length / productsWithPrices.length) * 12);
        economiaMediaPorProduto = (averageValueNumeric * (percentualEconomiaMedia / 100)).toFixed(2);
        economiaPotencial = total * 0.08; // 8% de economia potencial estimada
      }
    }

    return {
      totalProducts: products.length,
      totalCategories,
      activeQuotes,
      produtosPorStatus,
      percentualComCotacao,
      topCategoria: topCategoriaEntry ? { nome: topCategoriaEntry[0], count: topCategoriaEntry[1] } : null,
      mediaCotacoesPorProduto,
      averageValue,
      averageValueNumeric,
      economiaMediaPorProduto,
      economiaPotencial,
      percentualEconomiaMedia,
      productsWithPrices: productsWithPrices.length,
    };
  }, [products, categories]);
}
