import { useMemo } from 'react';
import { formatCurrency } from '@/utils/formatters';

interface Supplier {
  id: string;
  status: "active" | "inactive" | "pending";
  limit: number;
  activeQuotes: number;
  totalQuotes: number;
  cnpj?: string;
}

export interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  percentualAtivos: number;
  totalLimit: string;
  limiteMedioPorAtivo: string;
  activeQuotes: number;
  mediaCotacoesPorFornecedor: string;
  distribuicaoCotacoes: number[];
}

export function useSupplierStats(suppliers: Supplier[] | undefined): SupplierStats {
  return useMemo(() => {
    if (!suppliers) return {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      percentualAtivos: 0,
      totalLimit: "R$ 0",
      limiteMedioPorAtivo: "0.0",
      activeQuotes: 0,
      mediaCotacoesPorFornecedor: "0.0",
      distribuicaoCotacoes: [0, 0, 0, 0, 0, 0, 0]
    };

    const totalLimit = suppliers.reduce((sum, s) => {
      const limitValue = Number(s.limit || 0);
      return sum + (isNaN(limitValue) ? 0 : limitValue);
    }, 0);
    const activeQuotesTotal = suppliers.reduce((sum, s) => sum + ((s as any).activeQuotes || 0), 0);

    const porStatus = {
      active: suppliers.filter(s => s.status === "active").length,
      inactive: suppliers.filter(s => s.status === "inactive").length,
      pending: suppliers.filter(s => s.status === "pending").length
    };

    const percentualAtivos = suppliers.length > 0
      ? Math.round((porStatus.active / suppliers.length) * 100)
      : 0;

    const limiteMedioPorAtivo = porStatus.active > 0
      ? formatCurrency(totalLimit / porStatus.active)
      : "R$ 0,00";

    const fornecedoresComCotacoes = suppliers.filter(s => ((s as any).activeQuotes || 0) > 0 || ((s as any).totalQuotes || 0) > 0);
    const totalQuotes = suppliers.reduce((sum, s) => sum + ((s as any).totalQuotes || 0), 0);
    const mediaCotacoesPorFornecedor = fornecedoresComCotacoes.length > 0
      ? (totalQuotes / fornecedoresComCotacoes.length).toFixed(1)
      : "0.0";

    const distribuicaoCotacoes = [0, 0, 0, 0, 0, 0, 0];
    suppliers.forEach(s => {
      const quotes = s.activeQuotes;
      if (quotes === 0) distribuicaoCotacoes[0]++;
      else if (quotes <= 2) distribuicaoCotacoes[1]++;
      else if (quotes <= 5) distribuicaoCotacoes[2]++;
      else if (quotes <= 8) distribuicaoCotacoes[3]++;
      else if (quotes <= 12) distribuicaoCotacoes[4]++;
      else if (quotes <= 20) distribuicaoCotacoes[5]++;
      else distribuicaoCotacoes[6]++;
    });

    return {
      total: suppliers.length,
      active: porStatus.active,
      inactive: porStatus.inactive,
      pending: porStatus.pending,
      percentualAtivos,
      totalLimit: formatCurrency(totalLimit),
      limiteMedioPorAtivo,
      activeQuotes: activeQuotesTotal,
      mediaCotacoesPorFornecedor,
      distribuicaoCotacoes
    };
  }, [suppliers]);
}
