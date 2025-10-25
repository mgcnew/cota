import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GeminiResponse {
  text: string;
  error?: string;
}

interface LocucaoHistorico {
  id: string;
  prompt: string;
  resposta: string;
  timestamp: Date;
  tipo: string;
}

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<LocucaoHistorico[]>([]);
  const { toast } = useToast();

  const generateLocucao = useCallback(async (
    prompt: string,
    tipo: string,
    apiKey: string,
    opcoes?: {
      emocao?: string;
      intensidade?: string;
      velocidade?: string;
      tom?: string;
    }
  ): Promise<GeminiResponse> => {
    if (!apiKey) {
      toast({
        title: "API Key necessária",
        description: "Configure sua chave da API do Gemini",
        variant: "destructive"
      });
      return { text: '', error: 'API Key não configurada' };
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error?.message || 'Erro desconhecido';
        console.error('Erro da API:', data);
        toast({
          title: "Erro ao gerar locução",
          description: errorMsg,
          variant: "destructive"
        });
        return { text: '', error: errorMsg };
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text) {
        toast({
          title: "Resposta vazia",
          description: "A API não retornou texto. Tente novamente.",
          variant: "destructive"
        });
        return { text: '', error: 'Resposta vazia' };
      }

      // Adicionar ao histórico
      const novaLocucao: LocucaoHistorico = {
        id: Date.now().toString(),
        prompt,
        resposta: text,
        timestamp: new Date(),
        tipo
      };

      setHistorico(prev => [novaLocucao, ...prev]);

      // Salvar no localStorage
      const historicoSalvo = JSON.parse(localStorage.getItem('locucoesHistorico') || '[]');
      localStorage.setItem('locucoesHistorico', JSON.stringify([novaLocucao, ...historicoSalvo].slice(0, 50)));

      toast({
        title: "Locução gerada!",
        description: "Sua locução foi criada com sucesso"
      });

      return { text };
    } catch (error: any) {
      console.error('Erro ao gerar locução:', error);
      const errorMessage = error.message || 'Erro ao processar requisição';
      toast({
        title: "Erro ao gerar locução",
        description: errorMessage,
        variant: "destructive"
      });
      return { text: '', error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const carregarHistorico = useCallback(() => {
    const historicoSalvo = JSON.parse(localStorage.getItem('locucoesHistorico') || '[]');
    setHistorico(historicoSalvo);
  }, []);

  const limparHistorico = useCallback(() => {
    localStorage.removeItem('locucoesHistorico');
    setHistorico([]);
    toast({
      title: "Histórico limpo",
      description: "Todas as locuções foram removidas"
    });
  }, [toast]);

  return {
    loading,
    historico,
    generateLocucao,
    carregarHistorico,
    limparHistorico
  };
};
