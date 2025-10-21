import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Insight {
  id: string;
  categoria: 'economia' | 'performance' | 'recomendacao' | 'tendencia';
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  acaoSugerida?: string;
}

interface AnalyticsData {
  metricas: {
    taxaEconomia: number;
    tempoMedioCotacao: number;
    taxaResposta: number;
    valorMedioPedido: number;
  };
  topProdutos: Array<{
    nome: string;
    economia: number;
    cotacoes: number;
  }>;
  performanceFornecedores: Array<{
    nome: string;
    score: number;
    cotacoes: number;
    taxaResposta: number;
  }>;
  tendenciasMensais: Array<{
    mes: string;
    cotacoes: number;
    economia: number;
  }>;
}

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const { toast } = useToast();

  const generateInsights = async (analyticsData: AnalyticsData) => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-analytics-insights', {
        body: { analyticsData }
      });

      if (error) {
        console.error('Erro ao gerar insights:', error);
        
        // Tratamento específico de erros
        if (error.message?.includes('429')) {
          toast({
            title: "Limite de requisições excedido",
            description: "Por favor, aguarde alguns instantes antes de tentar novamente.",
            variant: "destructive",
          });
        } else if (error.message?.includes('402')) {
          toast({
            title: "Créditos insuficientes",
            description: "Adicione créditos ao seu workspace para continuar usando IA.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao gerar insights",
            description: error.message || "Ocorreu um erro ao processar os insights com IA.",
            variant: "destructive",
          });
        }
        
        return;
      }

      if (data?.insights) {
        setInsights(data.insights);
        setLastGenerated(new Date());
        toast({
          title: "Insights gerados com sucesso!",
          description: `${data.insights.length} insights foram gerados pela IA.`,
        });
      }
    } catch (err) {
      console.error('Erro na função de insights:', err);
      toast({
        title: "Erro inesperado",
        description: "Não foi possível gerar os insights. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    insights,
    isGenerating,
    lastGenerated,
    generateInsights,
  };
}
