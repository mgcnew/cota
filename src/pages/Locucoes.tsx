import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobile } from '@/contexts/MobileProvider';
import { 
  Mic, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  Gauge, 
  Music, 
  Sparkles,
  Clock,
  Trash2,
  Copy,
  Settings,
  Zap,
  Radio,
  Podcast,
  MessageSquare,
  BookOpen,
  Megaphone,
  Film,
  History,
  Loader2,
  Info,
  Save,
  ShoppingBag,
  Phone,
  Headphones,
  Tv,
  Music2,
  Newspaper,
  Video,
  FileAudio,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useGemini } from '@/hooks/useGemini';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';

interface VoiceType {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const tiposLocucao: VoiceType[] = [
  {
    id: 'atendimento',
    name: 'Atendimento',
    icon: <Phone className="w-5 h-5" />,
    description: 'Atendimento ao cliente e suporte',
    color: 'from-primary to-primary-light'
  },
  {
    id: 'promocao',
    name: 'Promoção',
    icon: <Megaphone className="w-5 h-5" />,
    description: 'Ofertas, promoções e vendas',
    color: 'from-primary to-primary-light'
  },
  {
    id: 'institucional',
    name: 'Institucional',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Comunicados e mensagens corporativas',
    color: 'from-primary to-primary-light'
  },
  {
    id: 'publicitario',
    name: 'Publicitário',
    icon: <ShoppingBag className="w-5 h-5" />,
    description: 'Campanhas publicitárias e marketing',
    color: 'from-amber-500 to-yellow-500'
  },
  {
    id: 'educacional',
    name: 'Educacional',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Conteúdo educativo e explicativo',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'espera',
    name: 'Espera',
    icon: <Headphones className="w-5 h-5" />,
    description: 'Mensagens de espera e retenção',
    color: 'from-teal-500 to-cyan-500'
  },
  {
    id: 'podcast',
    name: 'Podcast',
    icon: <Podcast className="w-5 h-5" />,
    description: 'Episódios e entrevistas',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'video',
    name: 'Vídeo',
    icon: <Video className="w-5 h-5" />,
    description: 'Narração para vídeos e documentários',
    color: 'from-red-500 to-pink-500'
  },
  {
    id: 'jornalistico',
    name: 'Jornalístico',
    icon: <Newspaper className="w-5 h-5" />,
    description: 'Notícias e reportagens',
    color: 'from-slate-500 to-gray-500'
  },
  {
    id: 'musical',
    name: 'Musical',
    icon: <Music2 className="w-5 h-5" />,
    description: 'Introduções e anúncios musicais',
    color: 'from-violet-500 to-purple-500'
  }
];

export default function Locucoes() {
  const isMobile = useMobile();
  // API Key padrão configurada
  const DEFAULT_API_KEY = 'AIzaSyAuLwffF13_0aHKc8X5LEhw5-wp4kQmj0c';

  const [apiKey, setApiKey] = useState(() => {
    // Tentar carregar do localStorage primeiro, senão usar a padrão
    const saved = localStorage.getItem('geminiApiKey');
    return saved || DEFAULT_API_KEY;
  });
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("atendimento");
  const [resultado, setResultado] = useState("");
  
  // Controles de voz
  const [voz, setVoz] = useState("feminina-padrao");
  const [velocidade, setVelocidade] = useState(1.0);
  const [tom, setTom] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const { loading, historico, generateLocucao, carregarHistorico, limparHistorico } = useGemini();
  const { loading: loadingAudio, audioUrl, generateAudio, downloadAudio } = useTextToSpeech();
  const { toast } = useToast();
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prioridade: 1. Variável de ambiente, 2. localStorage, 3. API key padrão
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    const savedKey = localStorage.getItem('geminiApiKey');
    
    if (envKey) {
      setApiKey(envKey);
      if (!savedKey) {
        localStorage.setItem('geminiApiKey', envKey);
      }
    } else if (!savedKey) {
      // Se não houver nenhuma configurada, usar e salvar a padrão
      setApiKey(DEFAULT_API_KEY);
      localStorage.setItem('geminiApiKey', DEFAULT_API_KEY);
    }
    carregarHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregarHistorico]);

  useEffect(() => {
    if (audioUrl && audioElement) {
      audioElement.pause();
    }
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      setAudioElement(audio);
    }
  }, [audioUrl]);

  const handleSaveApiKey = () => {
    localStorage.setItem('geminiApiKey', apiKey);
    setShowApiDialog(false);
    toast({
      title: "API Key salva",
      description: "Sua chave foi configurada com sucesso"
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "Digite uma descrição para sua locução",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key necessária",
        description: "Configure sua chave da API do Gemini",
        variant: "destructive"
      });
      return;
    }

    try {
      const tipoInfo = tiposLocucao.find(t => t.id === tipoSelecionado);
      
      // Prompt específico baseado no tipo de locução
      let tipoInstructions = '';
      switch (tipoSelecionado) {
        case 'atendimento':
          tipoInstructions = 'Use um tom acolhedor, prestativo e empático. Seja claro e direto, mas sempre respeitoso.';
          break;
        case 'promocao':
          tipoInstructions = 'Use um tom entusiasmado, persuasivo e convincente. Destaque benefícios e crie urgência.';
          break;
        case 'institucional':
          tipoInstructions = 'Use um tom formal, profissional e confiável. Transmita credibilidade e seriedade.';
          break;
        case 'publicitario':
          tipoInstructions = 'Use um tom dinâmico, criativo e envolvente. Seja impactante e memorável.';
          break;
        case 'educacional':
          tipoInstructions = 'Use um tom didático, claro e didático. Seja explicativo e fácil de entender.';
          break;
        case 'espera':
          tipoInstructions = 'Use um tom tranquilo, informativo e calmante. Mantenha o ouvinte engajado enquanto espera.';
          break;
        case 'podcast':
          tipoInstructions = 'Use um tom conversacional, natural e envolvente. Seja interessante e descontraído.';
          break;
        case 'video':
          tipoInstructions = 'Use um tom narrativo, descritivo e envolvente. Complemente as imagens com clareza.';
          break;
        case 'jornalistico':
          tipoInstructions = 'Use um tom neutro, informativo e objetivo. Apresente fatos de forma clara e imparcial.';
          break;
        case 'musical':
          tipoInstructions = 'Use um tom animado, rítmico e expressivo. Integre-se harmoniosamente com a música.';
          break;
        default:
          tipoInstructions = 'Use um tom profissional e adequado ao contexto.';
      }
      
      const promptCompleto = `Crie uma locução profissional do tipo "${tipoInfo?.name || tipoSelecionado}"${tipoInfo?.description ? ` (${tipoInfo.description})` : ''} com o seguinte contexto: ${prompt}. 
      
INSTRUÇÕES ESPECÍFICAS PARA ESTE TIPO:
${tipoInstructions}

REQUISITOS GERAIS:
- Texto claro, objetivo e profissional
- Tom adequado ao tipo escolhido
- Pronto para ser gravado
- Em português brasileiro
- Linguagem natural e fluida

Retorne apenas o texto da locução, sem explicações adicionais ou formatação especial.`;

      const response = await generateLocucao(promptCompleto, tipoSelecionado, apiKey);
      
      if (response?.text && !response.error) {
        setResultado(response.text.trim());
        toast({
          title: "Locução gerada!",
          description: "Sua locução foi criada com sucesso"
        });
      } else {
        toast({
          title: "Erro ao gerar locução",
          description: response?.error || "Não foi possível gerar a locução. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao gerar locução:', error);
      toast({
        title: "Erro ao gerar locução",
        description: error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleCopy = () => {
    if (!resultado?.trim()) {
      toast({
        title: "Nada para copiar",
        description: "Gere uma locução primeiro",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(resultado.trim()).then(() => {
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência"
      });
    }).catch(() => {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto",
        variant: "destructive"
      });
    });
  };

  const handleUseFromHistory = (text: string) => {
    setResultado(text);
    toast({
      title: "Locução carregada",
      description: "Texto carregado do histórico"
    });
  };

  const handleGenerateAudio = async () => {
    if (!resultado.trim()) {
      toast({
        title: "Nenhum texto",
        description: "Gere uma locução primeiro",
        variant: "destructive"
      });
      return;
    }

    await generateAudio(resultado, apiKey, {
      voz,
      velocidade,
      tom: tom / 10, // Converter para escala 0-1
      volume: (volume + 10) / 20 // Converter de -10 a 10 para 0-1
    });
  };

  const handlePlayPause = () => {
    if (!audioElement) return;
    
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const tipoInfo = tiposLocucao.find(t => t.id === tipoSelecionado);
      const filename = `locucao_${tipoInfo?.name || 'audio'}_${new Date().getTime()}.mp3`;
      downloadAudio(audioUrl, filename);
    }
  };

  const handleSaveAudio = async () => {
    if (!audioUrl || !resultado?.trim()) {
      toast({
        title: "Nenhum áudio para salvar",
        description: "Gere um áudio primeiro",
        variant: "destructive"
      });
      return;
    }

    try {
      // Buscar áudio como blob
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error('Erro ao buscar áudio');
      }
      const blob = await response.blob();
      
      // Converter blob para base64
      const reader = new FileReader();
      
      reader.onerror = () => {
        throw new Error('Erro ao ler arquivo de áudio');
      };
      
      reader.onloadend = () => {
        try {
          const base64Audio = reader.result as string;
          if (!base64Audio) {
            throw new Error('Arquivo de áudio vazio');
          }
          
          const audioData = base64Audio.includes(',') 
            ? base64Audio.split(',')[1] 
            : base64Audio;
          
          // Salvar no localStorage
          const savedAudios = JSON.parse(localStorage.getItem('savedLocucoes') || '[]');
          const tipoInfo = tiposLocucao.find(t => t.id === tipoSelecionado);
          const newAudio = {
            id: Date.now().toString(),
            texto: resultado.trim(),
            tipo: tipoSelecionado,
            tipoName: tipoInfo?.name || tipoSelecionado,
            audioData: audioData,
            createdAt: new Date().toISOString(),
            duracao: formatTime(duration || 0)
          };
          
          savedAudios.unshift(newAudio);
          // Limitar a 50 áudios salvos
          const trimmedAudios = savedAudios.slice(0, 50);
          
          localStorage.setItem('savedLocucoes', JSON.stringify(trimmedAudios));
          
          toast({
            title: "Áudio salvo!",
            description: "Seu áudio foi salvo com sucesso",
          });
        } catch (error) {
          console.error('Erro ao processar áudio:', error);
          toast({
            title: "Erro ao salvar",
            description: error instanceof Error ? error.message : "Não foi possível salvar o áudio",
            variant: "destructive"
          });
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Erro ao salvar áudio:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar o áudio",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const WaveformVisualizer = () => {
    const bars = 60;
    return (
      <div className="flex items-center justify-center gap-1 h-24" ref={waveformRef}>
        {Array.from({ length: bars }).map((_, i) => {
          const height = isPlaying && audioElement
            ? Math.sin((currentTime * 5 + i * 0.3) * 0.5) * 30 + 40
            : Math.random() * 20 + 20;
          return (
            <motion.div
              key={i}
              className="w-1 bg-gradient-to-t from-primary/50 to-primary rounded-full"
              animate={{
                height: `${height}%`,
                opacity: isPlaying && audioElement ? 1 : 0.3
              }}
              transition={{
                duration: 0.3,
                repeat: isPlaying && audioElement ? Infinity : 0,
                repeatType: 'reverse'
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <PageWrapper>
      <div className="page-container">
      {/* Header */}
          {isMobile ? (
            <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary-light flex-shrink-0">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                  AI Voice Studio
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Crie locuções profissionais com inteligência artificial
              </p>
              
              {/* Botões de ação no header */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Configurar API do Google Cloud
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Google Cloud API Key</Label>
                        <Input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Cole sua API Key aqui"
                          className="mt-2 dark:bg-gray-800 dark:border-gray-700"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <strong>Projeto:</strong> gen-lang-client-0669553039
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Obtenha sua chave em: <a href="https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0669553039" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Google Cloud Console</a>
                        </p>
                        <div className="mt-3 p-2 bg-primary/10 dark:bg-primary/20 rounded border border-primary/20 dark:border-primary/30">
                          <p className="text-xs text-blue-900 dark:text-blue-300">
                            💡 <strong>Uma única chave</strong> funciona para gerar texto E áudio!
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleSaveApiKey} className="w-full bg-primary hover:bg-primary/90">
                        Salvar Configuração
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8"
            >
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 flex-shrink-0"
                >
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                  AI Voice Studio
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Crie locuções profissionais com inteligência artificial
              </p>
              
              {/* Botões de ação no header */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Configurar API do Google Cloud
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Google Cloud API Key</Label>
                        <Input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Cole sua API Key aqui"
                          className="mt-2 dark:bg-gray-800 dark:border-gray-700"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <strong>Projeto:</strong> gen-lang-client-0669553039
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Obtenha sua chave em: <a href="https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0669553039" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Google Cloud Console</a>
                        </p>
                        <div className="mt-3 p-2 bg-primary/10 dark:bg-primary/20 rounded border border-primary/20 dark:border-primary/30">
                          <p className="text-xs text-blue-900 dark:text-blue-300">
                            💡 <strong>Uma única chave</strong> funciona para gerar texto E áudio!
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleSaveApiKey} className="w-full bg-primary hover:bg-primary/90">
                        Salvar Configuração
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Text Input */}
              {isMobile ? (
                <div>
                  <Card className="p-4 sm:p-6 border-2 hover:border-purple-500/50 dark:hover:border-purple-500/30 transition-colors bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                          <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                          Texto para Locução
                        </h2>
                        <Badge variant="secondary" className="gap-1">
                          <Zap className="w-3 h-3" />
                          {prompt.length} caracteres
                        </Badge>
                      </div>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[150px] text-base resize-none dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Digite ou cole seu texto aqui para gerar uma locução profissional..."
                      />
                      {!apiKey && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                          Configure sua API Key do Gemini para começar
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-4 sm:p-6 border-2 hover:border-purple-500/50 dark:hover:border-purple-500/30 transition-colors bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                          <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                          Texto para Locução
                        </h2>
                        <Badge variant="secondary" className="gap-1">
                          <Zap className="w-3 h-3" />
                          {prompt.length} caracteres
                        </Badge>
                      </div>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[150px] text-base resize-none dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Digite ou cole seu texto aqui para gerar uma locução profissional..."
                      />
                      {!apiKey && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                          Configure sua API Key do Gemini para começar
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Voice Types */}
              {isMobile ? (
                <div>
                  <Card className="p-4 sm:p-6 bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                      Tipo de Locução
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                      {tiposLocucao.map((type) => {
                        const isSelected = tipoSelecionado === type.id;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setTipoSelecionado(type.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-sm'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="space-y-2 text-center">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center text-white mx-auto shadow-md`}>
                                {type.icon}
                              </div>
                              <div className={`text-xs font-semibold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                {type.name}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="p-4 sm:p-6 bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                      Tipo de Locução
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {tiposLocucao.map((type) => {
                        const isSelected = tipoSelecionado === type.id;
                        return (
                          <motion.button
                            key={type.id}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setTipoSelecionado(type.id)}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
                            }`}
                          >
                            <div className="space-y-2.5 text-center">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-white mx-auto shadow-lg`}>
                                {type.icon}
                              </div>
                              <div className={`text-sm font-semibold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                {type.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                {type.description}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Voice Controls */}
          {resultado && (
                isMobile ? (
                  <div>
                    <Card className="p-4 sm:p-6 bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                      <CardHeader className="p-0 pb-4">
                        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                          <span className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                            Locução Gerada
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className="dark:bg-gray-800 dark:border-gray-700"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 p-0 pt-4">
                        <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/60 dark:border-green-700/30">
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                            {resultado}
                          </p>
                        </div>

                        {/* Controles de Voz */}
                        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/30 space-y-3 sm:space-y-4">
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                            Configurações de Voz
                          </h4>
                          
                          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                            <div>
                              <Label className="text-sm">Tipo de Voz</Label>
                              <Select value={voz} onValueChange={setVoz}>
                                <SelectTrigger className="mt-2 dark:bg-gray-800 dark:border-gray-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="feminina-padrao">👩 Feminina Padrão</SelectItem>
                                  <SelectItem value="feminina-suave">👩 Feminina Suave</SelectItem>
                                  <SelectItem value="masculina-padrao">👨 Masculina Padrão</SelectItem>
                                  <SelectItem value="masculina-grave">👨 Masculina Grave</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm">Velocidade: {velocidade.toFixed(1)}x</Label>
                              <Slider
                                value={[velocidade]}
                                onValueChange={(v) => setVelocidade(v[0])}
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Tom: {tom > 0 ? '+' : ''}{tom}</Label>
                              <Slider
                                value={[tom]}
                                onValueChange={(v) => setTom(v[0])}
                                min={-5}
                                max={5}
                                step={1}
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Volume: {volume > 0 ? '+' : ''}{volume} dB</Label>
                              <Slider
                                value={[volume]}
                                onValueChange={(v) => setVolume(v[0])}
                                min={-10}
                                max={10}
                                step={1}
                                className="mt-2"
                              />
                            </div>
                          </div>

                          <Button
                            onClick={handleGenerateAudio}
                            disabled={loadingAudio || !apiKey}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            {loadingAudio ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Gerando Áudio...
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-4 w-4 mr-2" />
                                Gerar Áudio
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Player de Áudio */}
                        {audioUrl && (
                          <Card className="border-2 border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-primary">
                                    <FileAudio className="w-5 h-5 text-white" />
                                  </div>
                                  <CardTitle className="text-lg">Áudio Gerado</CardTitle>
                                </div>
                                <Badge variant="outline" className="gap-1.5 bg-white/50 dark:bg-gray-800/50">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="font-medium">{formatTime(currentTime)} / {formatTime(duration)}</span>
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <WaveformVisualizer />

                              <div className="space-y-4">
                                <Slider
                                  value={[currentTime]}
                                  onValueChange={([value]) => {
                                    setCurrentTime(value);
                                    if (audioElement) {
                                      audioElement.currentTime = value;
                                    }
                                  }}
                                  min={0}
                                  max={duration || 100}
                                  step={0.1}
                                  className="w-full"
                                />

                                <div className="flex items-center justify-center gap-3">
                                  <Button
                                    size="lg"
                                    onClick={handlePlayPause}
                                    className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                                  >
                                    {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                                  </Button>
                                </div>

                                <Separator />

                                <div className="flex flex-col sm:flex-row gap-3">
                                  <Button
                                    size="lg" 
                                    variant="default"
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
                                    onClick={handleSaveAudio}
                                  >
                                    <Save className="w-5 h-5 mr-2" />
                                    Salvar Áudio
                                  </Button>
                                  <Button
                                    size="lg" 
                                    variant="default"
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-md"
                                    onClick={handleDownload}
                                  >
                                    <Download className="w-5 h-5 mr-2" />
                                    Baixar Áudio
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                  <Card className="p-4 sm:p-6 bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <span className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    Locução Gerada
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-0 pt-4">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/60 dark:border-green-700/30">
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                    {resultado}
                  </p>
                </div>

                {/* Controles de Voz */}
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/30 space-y-3 sm:space-y-4">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                    Configurações de Voz
                  </h4>
                  
                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm">Tipo de Voz</Label>
                      <Select value={voz} onValueChange={setVoz}>
                        <SelectTrigger className="mt-2 dark:bg-gray-800 dark:border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feminina-padrao">👩 Feminina Padrão</SelectItem>
                          <SelectItem value="feminina-suave">👩 Feminina Suave</SelectItem>
                          <SelectItem value="masculina-padrao">👨 Masculina Padrão</SelectItem>
                          <SelectItem value="masculina-grave">👨 Masculina Grave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Velocidade: {velocidade.toFixed(1)}x</Label>
                      <Slider
                        value={[velocidade]}
                        onValueChange={(v) => setVelocidade(v[0])}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Tom: {tom > 0 ? '+' : ''}{tom}</Label>
                      <Slider
                        value={[tom]}
                        onValueChange={(v) => setTom(v[0])}
                        min={-5}
                        max={5}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Volume: {volume > 0 ? '+' : ''}{volume} dB</Label>
                      <Slider
                        value={[volume]}
                        onValueChange={(v) => setVolume(v[0])}
                        min={-10}
                        max={10}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateAudio}
                    disabled={loadingAudio || !apiKey}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {loadingAudio ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando Áudio...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Gerar Áudio
                      </>
                    )}
                  </Button>
                </div>

                {/* Player de Áudio */}
                {audioUrl && (
                  <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-purple-600 dark:bg-purple-500">
                            <FileAudio className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle className="text-lg">Áudio Gerado</CardTitle>
                        </div>
                        <Badge variant="outline" className="gap-1.5 bg-white/50 dark:bg-gray-800/50">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <WaveformVisualizer />

                      <div className="space-y-4">
                        <Slider
                          value={[currentTime]}
                          onValueChange={([value]) => {
                            setCurrentTime(value);
                            if (audioElement) {
                              audioElement.currentTime = value;
                            }
                          }}
                          min={0}
                          max={duration || 100}
                          step={0.1}
                          className="w-full"
                        />

                        <div className="flex items-center justify-center gap-3">
                          <Button
                            size="lg"
                            onClick={handlePlayPause}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                          >
                            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                          </Button>
                        </div>

                        <Separator />

                        <div className="flex flex-col gap-3">
                          <Button
                            size="lg" 
                            variant="default"
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
                            onClick={handleSaveAudio}
                          >
                            <Save className="w-5 h-5 mr-2" />
                            Salvar Áudio
                          </Button>
                          <Button
                            size="lg" 
                            variant="default"
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md"
                            onClick={handleDownload}
                          >
                            <Download className="w-5 h-5 mr-2" />
                            Baixar Áudio
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
                </motion.div>
                )
              )}

              {/* Generate Button */}
              {isMobile ? (
                <div>
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !apiKey}
                    className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gerando Locução...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Gerar Locução com AI
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !apiKey}
                    className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                        </motion.div>
                        Gerando Locução...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Gerar Locução com AI
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>

            {/* History Sidebar */}
            {isMobile ? (
              <div className="space-y-4 sm:space-y-6">
                <Card className="p-4 sm:p-6 bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                      <History className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      Histórico
                    </h2>
                    {historico.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={limparHistorico}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[calc(100vh-200px)] sm:h-[calc(100vh-300px)]">
                    <div className="space-y-2 sm:space-y-3">
                      {historico.length === 0 ? (
                        <div className="text-center py-8">
                          <History className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Nenhuma locução gerada ainda
                          </p>
                        </div>
                      ) : (
                        historico.map((item) => {
                          const tipoInfo = tiposLocucao.find(t => t.id === item.tipo);
                          return (
                            <Card key={item.id} className="p-3 sm:p-4 hover:border-purple-500/50 dark:hover:border-purple-500/30 transition-colors cursor-pointer group bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                              <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate dark:text-white">{item.resposta.substring(0, 50)}...</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {tipoInfo?.icon} {tipoInfo?.name}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleUseFromHistory(item.resposta)}
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                                  <div className="flex gap-1">
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6"
                                      onClick={() => {
                                        navigator.clipboard.writeText(item.resposta);
                                        toast({ title: "Copiado!", description: "Texto copiado para a área de transferência" });
                                      }}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => {
                                        toast({ title: "Funcionalidade em desenvolvimento", variant: "destructive" });
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </Card>

                {/* Info Card */}
                <Card className="p-4 sm:p-6 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30">
                  <CardHeader className="p-0 pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                      Marcações de Ênfase
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 sm:space-y-2 text-xs text-gray-700 dark:text-gray-300 p-0">
                    <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[enfase]texto[/enfase]</code> - Ênfase forte</p>
                    <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[suave]texto[/suave]</code> - Ênfase moderada</p>
                    <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[pausa]</code> - Pausa curta (500ms)</p>
                    <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[pausa-longa]</code> - Pausa longa (1s)</p>
                    <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[rapido]texto[/rapido]</code> - Fala rápida</p>
                    <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[lento]texto[/lento]</code> - Fala lenta</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4 sm:space-y-6"
              >
              <Card className="p-4 sm:p-6 bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                    <History className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    Histórico
                  </h2>
                  {historico.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={limparHistorico}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[calc(100vh-200px)] sm:h-[calc(100vh-300px)]">
                  <div className="space-y-2 sm:space-y-3">
                {historico.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                      Nenhuma locução gerada ainda
                    </p>
                  </div>
                ) : (
                      <AnimatePresence>
                        {historico.map((item, index) => {
                          const tipoInfo = tiposLocucao.find(t => t.id === item.tipo);
                      return (
                            <motion.div
                          key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card className="p-3 sm:p-4 hover:border-purple-500/50 dark:hover:border-purple-500/30 transition-colors cursor-pointer group bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30">
                                <div className="space-y-2 sm:space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate dark:text-white">{item.resposta.substring(0, 50)}...</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="text-xs">
                                          {tipoInfo?.icon} {tipoInfo?.name}
                                        </Badge>
                                      </div>
                                    </div>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleUseFromHistory(item.resposta)}
                        >
                                      <Play className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <Separator />
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                                    <div className="flex gap-1">
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-6 w-6"
                                        onClick={() => {
                                          navigator.clipboard.writeText(item.resposta);
                                          toast({ title: "Copiado!", description: "Texto copiado para a área de transferência" });
                                        }}
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-6 w-6 text-destructive"
                                        onClick={() => {
                                          // Implementar remoção individual do histórico
                                          toast({ title: "Funcionalidade em desenvolvimento", variant: "destructive" });
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                          </div>
                        </div>
                              </Card>
                            </motion.div>
                      );
                    })}
                      </AnimatePresence>
                    )}
                  </div>
                </ScrollArea>
            </Card>

              {/* Info Card */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/60 dark:border-blue-700/30">
            <CardHeader className="p-0 pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                Marcações de Ênfase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2 text-xs text-gray-700 dark:text-gray-300 p-0">
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[enfase]texto[/enfase]</code> - Ênfase forte</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[suave]texto[/suave]</code> - Ênfase moderada</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[pausa]</code> - Pausa curta (500ms)</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[pausa-longa]</code> - Pausa longa (1s)</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[rapido]texto[/rapido]</code> - Fala rápida</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[lento]texto[/lento]</code> - Fala lenta</p>
            </CardContent>
          </Card>
            </motion.div>
          )}
          </div>
      </div>
    </PageWrapper>
  );
}
