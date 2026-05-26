import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';

export interface UrgentCotacao {
  id: string;
  produto: string;
  dataFim: string;
  urgencyType: 'pronta' | 'vencendo';
}

export interface SupplierResponse {
  id: string;
  supplierName: string;
  produto: string;
  quoteId: string;
  updatedAt: string;
}

export function useNotificationHub() {
  const { data: company } = useCompany();
  const [urgentCotacoes, setUrgentCotacoes] = useState<UrgentCotacao[]>([]);
  const [recentResponses, setRecentResponses] = useState<SupplierResponse[]>([]);

  const loadUrgentCotacoes = async () => {
    if (!company) return;

    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, status, produto, data_fim, data_planejada, quote_suppliers(id, status)')
      .eq('company_id', company.id)
      .in('status', ['ativa', 'planejada'])
      .not('data_fim', 'is', null);

    if (!quotes) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in48h = new Date(today.getTime() + 48 * 60 * 60 * 1000);

    const ativas = quotes.filter(q => {
      if (q.status === 'ativa') return true;
      if (q.status === 'planejada' && q.data_planejada) {
        return new Date(q.data_planejada) <= today;
      }
      return false;
    });

    const urgent: UrgentCotacao[] = [];

    ativas.forEach(q => {
      const suppliers = (q.quote_suppliers as any[]) || [];
      const dataFimDate = q.data_fim ? new Date(q.data_fim) : null;
      const dataFimFormatted = dataFimDate
        ? `${String(dataFimDate.getDate()).padStart(2, '0')}/${String(dataFimDate.getMonth() + 1).padStart(2, '0')}/${dataFimDate.getFullYear()}`
        : '';

      if (suppliers.length > 0 && suppliers.every((s: any) => s.status === 'respondido')) {
        urgent.push({ id: q.id, produto: q.produto || 'Cotação', dataFim: dataFimFormatted, urgencyType: 'pronta' });
        return;
      }

      if (dataFimDate && dataFimDate <= in48h && dataFimDate >= today) {
        urgent.push({ id: q.id, produto: q.produto || 'Cotação', dataFim: dataFimFormatted, urgencyType: 'vencendo' });
      }
    });

    setUrgentCotacoes(urgent);
  };

  const loadRecentResponses = async () => {
    if (!company) return;

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('quote_suppliers')
      .select('id, supplier_name, updated_at, quote_id, quotes!inner(id, produto, company_id)')
      .eq('quotes.company_id', company.id)
      .eq('status', 'respondido')
      .gte('updated_at', since)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (!data) return;

    setRecentResponses(
      data.map((r: any) => ({
        id: r.id,
        supplierName: r.supplier_name,
        produto: r.quotes?.produto || 'Cotação',
        quoteId: r.quote_id,
        updatedAt: r.updated_at,
      }))
    );
  };

  useEffect(() => {
    if (!company) return;

    loadUrgentCotacoes();
    loadRecentResponses();

    const channel = supabase
      .channel('notification-hub')
      .on('postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'quote_suppliers' },
        (payload: any) => {
          if (payload.new?.status === 'respondido') {
            loadRecentResponses();
            loadUrgentCotacoes();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [company]);

  return {
    urgentCotacoes,
    recentResponses,
    prontasCount: urgentCotacoes.filter(c => c.urgencyType === 'pronta').length,
    vencendoCount: urgentCotacoes.filter(c => c.urgencyType === 'vencendo').length,
    totalCount: urgentCotacoes.length + recentResponses.length,
    reload: () => { loadUrgentCotacoes(); loadRecentResponses(); },
  };
}
