import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

interface AudioConfig {
  audioEncoding: string;
  pitch: number;
  speakingRate: number;
  volumeGainDb: number;
}

const vozesPtBr: Record<string, VoiceConfig> = {
  'masculina-padrao': {
    languageCode: 'pt-BR',
    name: 'pt-BR-Wavenet-B',
    ssmlGender: 'MALE'
  },
  'masculina-grave': {
    languageCode: 'pt-BR',
    name: 'pt-BR-Wavenet-C',
    ssmlGender: 'MALE'
  },
  'feminina-padrao': {
    languageCode: 'pt-BR',
    name: 'pt-BR-Wavenet-A',
    ssmlGender: 'FEMALE'
  },
  'feminina-suave': {
    languageCode: 'pt-BR',
    name: 'pt-BR-Wavenet-C',
    ssmlGender: 'FEMALE'
  }
};

export const useTextToSpeech = () => {
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAudio = useCallback(async (
    text: string,
    apiKey: string,
    opcoes: {
      voz: string;
      velocidade: number;
      tom: number;
      volume: number;
    }
  ) => {
    if (!apiKey) {
      toast({
        title: "API Key necessária",
        description: "Configure sua chave da API do Google Cloud",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const voiceConfig = vozesPtBr[opcoes.voz] || vozesPtBr['feminina-padrao'];
      
      // Processar texto com marcações SSML
      const ssmlText = processarSSML(text);

      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: {
              ssml: ssmlText
            },
            voice: voiceConfig,
            audioConfig: {
              audioEncoding: 'MP3',
              pitch: opcoes.tom,
              speakingRate: opcoes.velocidade,
              volumeGainDb: opcoes.volume
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao gerar áudio');
      }

      const data = await response.json();
      const audioContent = data.audioContent;

      // Converter base64 para blob e criar URL
      const audioBlob = base64ToBlob(audioContent, 'audio/mp3');
      const url = URL.createObjectURL(audioBlob);
      
      setAudioUrl(url);

      toast({
        title: "Áudio gerado!",
        description: "Sua locução está pronta para ouvir e baixar"
      });

      return url;
    } catch (error) {
      console.error('Erro ao gerar áudio:', error);
      toast({
        title: "Erro ao gerar áudio",
        description: "Verifique sua API Key e tente novamente",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const downloadAudio = useCallback((url: string, filename: string = 'locucao.mp3') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Download iniciado",
      description: "Seu áudio está sendo baixado"
    });
  }, [toast]);

  return {
    loading,
    audioUrl,
    generateAudio,
    downloadAudio
  };
};

// Função auxiliar para processar marcações SSML
function processarSSML(text: string): string {
  let ssml = `<speak>${text}`;
  
  // Detectar e processar marcações de ênfase
  // [enfase]texto[/enfase] -> <emphasis level="strong">texto</emphasis>
  ssml = ssml.replace(/\[enfase\](.*?)\[\/enfase\]/g, '<emphasis level="strong">$1</emphasis>');
  
  // [suave]texto[/suave] -> <emphasis level="moderate">texto</emphasis>
  ssml = ssml.replace(/\[suave\](.*?)\[\/suave\]/g, '<emphasis level="moderate">$1</emphasis>');
  
  // [pausa] -> <break time="500ms"/>
  ssml = ssml.replace(/\[pausa\]/g, '<break time="500ms"/>');
  
  // [pausa-longa] -> <break time="1s"/>
  ssml = ssml.replace(/\[pausa-longa\]/g, '<break time="1s"/>');
  
  // [rapido]texto[/rapido] -> <prosody rate="fast">texto</prosody>
  ssml = ssml.replace(/\[rapido\](.*?)\[\/rapido\]/g, '<prosody rate="fast">$1</prosody>');
  
  // [lento]texto[/lento] -> <prosody rate="slow">texto</prosody>
  ssml = ssml.replace(/\[lento\](.*?)\[\/lento\]/g, '<prosody rate="slow">$1</prosody>');
  
  // [alto]texto[/alto] -> <prosody pitch="+2st">texto</prosody>
  ssml = ssml.replace(/\[alto\](.*?)\[\/alto\]/g, '<prosody pitch="+2st">$1</prosody>');
  
  // [baixo]texto[/baixo] -> <prosody pitch="-2st">texto</prosody>
  ssml = ssml.replace(/\[baixo\](.*?)\[\/baixo\]/g, '<prosody pitch="-2st">$1</prosody>');
  
  // [feliz]texto[/feliz] -> adiciona ênfase e tom mais alto
  ssml = ssml.replace(/\[feliz\](.*?)\[\/feliz\]/g, '<prosody pitch="+1st" rate="medium"><emphasis level="moderate">$1</emphasis></prosody>');
  
  // [triste]texto[/triste] -> tom mais baixo e mais lento
  ssml = ssml.replace(/\[triste\](.*?)\[\/triste\]/g, '<prosody pitch="-1st" rate="slow">$1</prosody>');
  
  // [animado]texto[/animado] -> mais rápido e enfático
  ssml = ssml.replace(/\[animado\](.*?)\[\/animado\]/g, '<prosody rate="fast"><emphasis level="strong">$1</emphasis></prosody>');
  
  // [calmo]texto[/calmo] -> mais lento e suave
  ssml = ssml.replace(/\[calmo\](.*?)\[\/calmo\]/g, '<prosody rate="slow"><emphasis level="reduced">$1</emphasis></prosody>');

  ssml += '</speak>';
  return ssml;
}

// Função auxiliar para converter base64 em blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
