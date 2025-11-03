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
  Info
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
    icon: <MessageSquare className="w-5 h-5" />,
    description: 'Atendimento ao Cliente',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'promocao',
    name: 'Promoção',
    icon: <Megaphone className="w-5 h-5" />,
    description: 'Propaganda e Ofertas',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'institucional',
    name: 'Institucional',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Comunicados Empresariais',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'espera',
    name: 'Espera',
    icon: <Radio className="w-5 h-5" />,
    description: 'Música de Espera',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'podcast',
    name: 'Podcast',
    icon: <Podcast className="w-5 h-5" />,
    description: 'Episódios e Entrevistas',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'video',
    name: 'Vídeo',
    icon: <Film className="w-5 h-5" />,
    description: 'Narração para Vídeos',
    color: 'from-yellow-500 to-orange-500'
  }
];

export default function Locucoes() {
  const isMobile = useMobile();
  const [apiKey, setApiKey] = useState("");
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
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
      setApiKey(savedKey);
    }
    carregarHistorico();
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

    const tipoInfo = tiposLocucao.find(t => t.id === tipoSelecionado);
    const promptCompleto = `Crie uma locução profissional do tipo "${tipoInfo?.name}" com o seguinte contexto: ${prompt}. 
    
A locução deve ser:
- Clara e objetiva
- Profissional e amigável
- Com tom adequado ao tipo escolhido
- Pronta para ser gravada
- Em português brasileiro

Retorne apenas o texto da locução, sem explicações adicionais.`;

    const response = await generateLocucao(promptCompleto, tipoSelecionado, apiKey);
    if (response.text) {
      setResultado(response.text);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultado);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência"
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
      const filename = `locucao_${new Date().getTime()}.mp3`;
      downloadAudio(audioUrl, filename);
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
              className="w-1 bg-gradient-to-t from-purple-500/50 to-purple-600 rounded-full"
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
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 flex-shrink-0">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent dark:from-purple-400 dark:via-pink-400 dark:to-orange-400">
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
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200/60 dark:border-blue-700/30">
                          <p className="text-xs text-blue-900 dark:text-blue-300">
                            💡 <strong>Uma única chave</strong> funciona para gerar texto E áudio!
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleSaveApiKey} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent dark:from-purple-400 dark:via-pink-400 dark:to-orange-400">
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
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200/60 dark:border-blue-700/30">
                          <p className="text-xs text-blue-900 dark:text-blue-300">
                            💡 <strong>Uma única chave</strong> funciona para gerar texto E áudio!
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleSaveApiKey} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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
                      {tiposLocucao.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setTipoSelecionado(type.id)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            tipoSelecionado === type.id
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-500/50 dark:hover:border-purple-500/30'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center text-white mx-auto`}>
                              {type.icon}
                            </div>
                            <div className="text-sm font-medium dark:text-white">{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </button>
                      ))}
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                      {tiposLocucao.map((type) => (
                        <motion.button
                          key={type.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setTipoSelecionado(type.id)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            tipoSelecionado === type.id
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-500/50 dark:hover:border-purple-500/30'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center text-white mx-auto`}>
                              {type.icon}
                            </div>
                            <div className="text-sm font-medium dark:text-white">{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </motion.button>
                      ))}
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
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/60 dark:border-blue-700/30">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold">Player de Áudio</h4>
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(currentTime)} / {formatTime(duration)}
                                </Badge>
                              </div>

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

                                <div className="flex items-center justify-center gap-4">
                                  <Button
                                    size="lg"
                                    onClick={handlePlayPause}
                                    className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700"
                                  >
                                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                                  </Button>
                                  <Button
                                    size="lg" 
                                    variant="outline" 
                                    className="rounded-full"
                                    onClick={handleDownload}
                                  >
                                    <Download className="w-5 h-5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
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
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/60 dark:border-blue-700/30">
                          <div className="space-y-6">
                    <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold">Player de Áudio</h4>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(currentTime)} / {formatTime(duration)}
                              </Badge>
                            </div>

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

                              <div className="flex items-center justify-center gap-4">
                        <Button
                                  size="lg"
                          onClick={handlePlayPause}
                                  className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700"
                                >
                                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                        </Button>
                      <Button
                                  size="lg" 
                                  variant="outline" 
                                  className="rounded-full"
                        onClick={handleDownload}
                      >
                                  <Download className="w-5 h-5" />
                      </Button>
                              </div>
                            </div>
                    </div>
                  </div>
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
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
