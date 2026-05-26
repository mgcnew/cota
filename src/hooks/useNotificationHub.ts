import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';

export interface UrgentCotacao {
  id: string;
  produto: string;
  dataFim: string;
  urgencyType: 'pronta' | 'vencendo';
}

export function useNotificationHub() {
  const { data: company } = useCompany();
  const [whatsappUnread, setWhatsappUnread] = useState(0);
  const [urgentCotacoes, setUrgentCotacoes] = useState<UrgentCotacao[]>([]);

  const loadWhatsappCount = async () => {
    if (!company) return;
    const { count } = await supabase
      .from('whatsapp_responses')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .eq('is_processed', false);
    setWhatsappUnread(count || 0);
  };

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

      // Pronta: todos os fornecedores responderam
      if (suppliers.length > 0 && suppliers.every((s: any) => s.status === 'respondido')) {
        urgent.push({ id: q.id, produto: q.produto || 'Cotação', dataFim: dataFimFormatted, urgencyType: 'pronta' });
        return;
      }

      // Vencendo: prazo em menos de 48h
      if (dataFimDate && dataFimDate <= in48h && dataFimDate >= today) {
        urgent.push({ id: q.id, produto: q.produto || 'Cotação', dataFim: dataFimFormatted, urgencyType: 'vencendo' });
      }
    });

    setUrgentCotacoes(urgent);
  };

  useEffect(() => {
    if (!company) return;
    loadWhatsappCount();
    loadUrgentCotacoes();

    const channel = supabase
      .channel('notification-hub')
      .on('postgres_changes' as any,
        { event: '*', table: 'whatsapp_responses', filter: `company_id=eq.${company.id}` },
        () => loadWhatsappCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [company]);

  return {
    whatsappUnread,
    urgentCotacoes,
    prontasCount: urgentCotacoes.filter(c => c.urgencyType === 'pronta').length,
    vencendoCount: urgentCotacoes.filter(c => c.urgencyType === 'vencendo').length,
    totalCount: whatsappUnread + urgentCotacoes.length,
    reload: () => { loadWhatsappCount(); loadUrgentCotacoes(); },
  };
}
