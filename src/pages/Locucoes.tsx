import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mic, Sparkles, Copy, Trash2, Settings, History, Loader2, Volume2, Info, Play, Pause, Download } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useGemini } from "@/hooks/useGemini";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useToast } from "@/hooks/use-toast";

const tiposLocucao = [
  { value: "atendimento", label: "Atendimento ao Cliente", icon: "📞" },
  { value: "promocao", label: "Promoção/Oferta", icon: "🎉" },
  { value: "institucional", label: "Institucional", icon: "🏢" },
  { value: "espera", label: "Música de Espera", icon: "⏳" },
  { value: "saudacao", label: "Saudação", icon: "👋" },
  { value: "despedida", label: "Despedida", icon: "👋" },
  { value: "informativo", label: "Informativo", icon: "ℹ️" },
  { value: "personalizado", label: "Personalizado", icon: "✨" }
];

export default function Locucoes() {
  const [apiKey, setApiKey] = useState("");
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("atendimento");
  const [resultado, setResultado] = useState("");
  const [showHistorico, setShowHistorico] = useState(false);
  
  // Controles de voz
  const [voz, setVoz] = useState("feminina-padrao");
  const [velocidade, setVelocidade] = useState(1.0);
  const [tom, setTom] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  const { loading, historico, generateLocucao, carregarHistorico, limparHistorico } = useGemini();
  const { loading: loadingAudio, audioUrl, generateAudio, downloadAudio } = useTextToSpeech();
  const { toast } = useToast();

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

    const tipoInfo = tiposLocucao.find(t => t.value === tipoSelecionado);
    const promptCompleto = `Crie uma locução profissional do tipo "${tipoInfo?.label}" com o seguinte contexto: ${prompt}. 
    
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
    setShowHistorico(false);
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
      tom,
      volume
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

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/20 dark:to-pink-400/20">
              <Mic className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
            Locuções AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Crie locuções profissionais com inteligência artificial
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistorico(!showHistorico)}
            className="bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30"
          >
            <History className="h-4 w-4 mr-2" />
            Histórico
          </Button>
          
          <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-[#1C1F26] border-gray-300/80 dark:border-gray-700/30"
              >
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Painel de Criação */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Criar Nova Locução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Locução</Label>
                <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                  <SelectTrigger className="mt-2 dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposLocucao.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <span className="flex items-center gap-2">
                          <span>{tipo.icon}</span>
                          <span>{tipo.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descreva sua Locução</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Locução para atendimento telefônico da empresa de cotações, informando horário de funcionamento das 8h às 18h..."
                  className="mt-2 min-h-[120px] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Seja específico sobre o contexto, tom e informações que deseja incluir
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !apiKey}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Gerando Locução...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Gerar Locução com AI
                  </>
                )}
              </Button>

              {!apiKey && (
                <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                  Configure sua API Key do Gemini para começar
                </p>
              )}
            </CardContent>
          </Card>

          {/* Resultado */}
          {resultado && (
            <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-green-600 dark:text-green-400" />
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
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/60 dark:border-green-700/30">
                  <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                    {resultado}
                  </p>
                </div>

                {/* Controles de Voz */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/30 space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Mic className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Configurações de Voz
                  </h4>
                  
                  <div className="grid gap-4 md:grid-cols-2">
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

                  {!apiKey && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                      Configure sua API Key para gerar áudio
                    </p>
                  )}
                </div>

                {/* Player de Áudio */}
                {audioUrl && (
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/60 dark:border-blue-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handlePlayPause}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {isPlaying ? 'Reproduzindo...' : 'Áudio Pronto'}
                        </span>
                      </div>
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        size="sm"
                        className="dark:bg-gray-800 dark:border-gray-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar MP3
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Painel Lateral - Histórico */}
        <div className="space-y-6">
          {showHistorico && (
            <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Histórico
                  </span>
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historico.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Nenhuma locução gerada ainda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {historico.map((item) => {
                      const tipoInfo = tiposLocucao.find(t => t.value === item.tipo);
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200/60 dark:border-gray-700/30 hover:border-purple-300 dark:hover:border-purple-600/50 transition-all cursor-pointer"
                          onClick={() => handleUseFromHistory(item.resposta)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              {tipoInfo?.icon} {tipoInfo?.label}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(item.timestamp).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                            {item.resposta}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card de Marcações */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/60 dark:border-blue-700/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Marcações de Ênfase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[enfase]texto[/enfase]</code> - Ênfase forte</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[suave]texto[/suave]</code> - Ênfase moderada</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[pausa]</code> - Pausa curta (500ms)</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[pausa-longa]</code> - Pausa longa (1s)</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[rapido]texto[/rapido]</code> - Fala rápida</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[lento]texto[/lento]</code> - Fala lenta</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[feliz]texto[/feliz]</code> - Tom alegre</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[triste]texto[/triste]</code> - Tom melancólico</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[animado]texto[/animado]</code> - Tom empolgado</p>
              <p><code className="bg-white dark:bg-gray-800 px-1 rounded">[calmo]texto[/calmo]</code> - Tom tranquilo</p>
            </CardContent>
          </Card>

          {/* Card de Dicas */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/60 dark:border-purple-700/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Dicas para Melhores Resultados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>• Seja específico sobre o contexto</p>
              <p>• Mencione o tom desejado (formal, casual, etc)</p>
              <p>• Inclua informações importantes</p>
              <p>• Defina o público-alvo</p>
              <p>• Use marcações de ênfase no texto</p>
              <p>• Teste diferentes configurações de voz</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
