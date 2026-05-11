import { useState, useCallback, useMemo } from 'react';
import { extractPrice, parseDateBR } from '@/lib/utils';
import type { Quote } from '@/hooks/useCotacoes';

export type SortKey = 'id' | 'produto' | 'status' | 'melhorPreco' | 'fornecedores' | 'itens' | 'prazo';
export type SortDir = 'asc' | 'desc';

export function useTableSort(cotacoes: Quote[]) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const sortedCotacoes = useMemo(() => {
    if (!sortKey) return cotacoes;
    return [...cotacoes].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'id':
          cmp = (a.id || '').localeCompare(b.id || '', 'pt-BR');
          break;
        case 'produto':
          cmp = (a.produtoResumo || a.produto || '').localeCompare(b.produtoResumo || b.produto || '', 'pt-BR');
          break;
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '', 'pt-BR');
          break;
        case 'melhorPreco':
          cmp = extractPrice(a.melhorPreco) - extractPrice(b.melhorPreco);
          break;
        case 'fornecedores':
          cmp = (a.fornecedores || 0) - (b.fornecedores || 0);
          break;
        case 'itens':
          cmp = (a.produtosLista?.length || 0) - (b.produtosLista?.length || 0);
          break;
        case 'prazo':
          cmp = parseDateBR(a.dataFim) - parseDateBR(b.dataFim);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [cotacoes, sortKey, sortDir]);

  return {
    sortKey,
    sortDir,
    handleSort,
    sortedCotacoes
  };
}
