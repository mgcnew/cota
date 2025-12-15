import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GeminiResponse {
  text: string;
  error?: string;
}

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Erro ao parsear resposta JSON:', jsonError);
        const errorMsg = `Erro ao processar resposta da API (Status: ${response.status})`;
        toast({
          title: "Erro ao gerar conteúdo",
          description: errorMsg,
          variant: "destructive"
        });
        return { text: '', error: errorMsg };
      }
      
      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.error || `Erro ${response.status}: ${response.statusText}` || 'Erro desconhecido';
        console.error('Erro da API:', data);
        toast({
          title: "Erro ao gerar conteúdo",
          description: errorMsg,
          variant: "destructive"
        });
        return { text: '', error: errorMsg };
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text || !text.trim()) {
        const errorMsg = data?.candidates?.[0]?.finishReason 
          ? `Geração bloqueada: ${data.candidates[0].finishReason}` 
          : 'A API não retornou texto válido';
        toast({
          title: "Resposta vazia",
          description: errorMsg,
          variant: "destructive"
        });
        return { text: '', error: errorMsg };
      }

      toast({
        title: "Conteúdo gerado!",
        description: "Seu conteúdo foi criado com sucesso"
      });

      return { text };
    } catch (error: any) {
      console.error('Erro ao gerar conteúdo:', error);
      const errorMessage = error.message || 'Erro ao processar requisição';
      toast({
        title: "Erro ao gerar conteúdo",
        description: errorMessage,
        variant: "destructive"
      });
      return { text: '', error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    generateLocucao
  };
};
