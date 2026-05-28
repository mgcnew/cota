import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { parseDateBR } from "@/lib/utils";
import type { Quote } from "@/hooks/useCotacoes";

export function useCotacoesFilters(cotacoes: Quote[] = []) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("filter") || "all");

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter && filter !== statusFilter) {
      setStatusFilter(filter);
    }
  }, [searchParams, statusFilter]);

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setSearchParams(prev => {
      if (val === "all") prev.delete("filter");
      else prev.set("filter", val);
      return prev;
    }, { replace: true });
  };

  const filteredCotacoes = useMemo(() => {
    const hoje = new Date();
    // Reseta as horas de 'hoje' para comparação correta
    hoje.setHours(0, 0, 0, 0);
    const em48h = new Date(hoje.getTime() + 48 * 60 * 60 * 1000);

    const filtered = cotacoes.filter(c => {
      const matchText = debouncedSearchTerm.toLowerCase();
      const matchesSearch = !matchText ||
        c.produto.toLowerCase().includes(matchText) ||
        c.id.toLowerCase().includes(matchText) ||
        (c.produtosLista ?? []).some(p => p.toLowerCase().includes(matchText));

      // Filtros especiais
      if (statusFilter === "prontas") {
        const fornecedoresRespondidos = c.fornecedoresParticipantes?.filter(f => f.status === "respondido").length || 0;
        const totalFornecedores = c.fornecedoresParticipantes?.length || 0;
        return matchesSearch && c.statusReal === "ativa" && totalFornecedores > 0 && fornecedoresRespondidos === totalFornecedores;
      }

      if (statusFilter === "vencendo") {
        const dataFimTimestamp = parseDateBR(c.dataFim);
        const dataFim = new Date(dataFimTimestamp);
        return matchesSearch && c.statusReal === "ativa" && dataFim <= em48h && dataFim >= hoje;
      }

      const matchesStatus = statusFilter === "all" || c.statusReal === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const aIsClosed = a.status === 'finalizada' || a.statusReal === 'concluida' || a.statusReal === 'finalizada';
      const bIsClosed = b.status === 'finalizada' || b.statusReal === 'concluida' || b.statusReal === 'finalizada';
      
      // Se um está finalizado e o outro não, o não finalizado (aberto) vem primeiro
      if (aIsClosed !== bIsClosed) {
        return aIsClosed ? 1 : -1;
      }
      
      // Se ambos têm o mesmo status, ordena pela data mais recente (priorizando a última cotação)
      // Usando created_at real se disponível, caso contrário recai na data de início
      const aDate = (a as any)._raw?.created_at ? new Date((a as any)._raw.created_at).getTime() : parseDateBR(a.dataInicio);
      const bDate = (b as any)._raw?.created_at ? new Date((b as any)._raw.created_at).getTime() : parseDateBR(b.dataInicio);
      
      return bDate - aDate;
    });
  }, [cotacoes, debouncedSearchTerm, statusFilter]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    handleStatusFilterChange,
    filteredCotacoes
  };
}
