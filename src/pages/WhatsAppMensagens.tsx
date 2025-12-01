import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  Upload,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Trash2,
  FileUp,
  Image as ImageIcon,
  Sparkles,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

export default function WhatsAppMensagens() {
  const isMobile = false; // Removida dependência mobile
  const [mensagem, setMensagem] = useState("");
  const [imagens, setImagens] = useState<UploadedImage[]>([]);
  const [contatos, setContatos] = useState<string[]>([]);
  const [isEnviando, setIsEnviando] = useState(false);
  const [contatoInput, setContatoInput] = useState("");
  const [isCarregandoLista, setIsCarregandoLista] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listaContatosRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
    }));

    setImagens((prev) => [...prev, ...newImages]);
    
    toast({
      title: "Imagens adicionadas",
      description: `${newImages.length} imagem(ns) carregada(s) com sucesso`,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (id: string) => {
    const imageToRemove = imagens.find((img) => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setImagens((prev) => prev.filter((img) => img.id !== id));
    
    toast({
      title: "Imagem removida",
      description: "Imagem removida da lista",
    });
  };

  const handleAddContato = () => {
    const numero = contatoInput.trim().replace(/\D/g, "");
    
    if (!numero) {
      toast({
        title: "Número inválido",
        description: "Digite um número de telefone válido",
        variant: "destructive",
      });
      return;
    }

    if (contatos.includes(numero)) {
      toast({
        title: "Contato já adicionado",
        description: "Este número já está na lista",
        variant: "destructive",
      });
      return;
    }

    setContatos((prev) => [...prev, numero]);
    setContatoInput("");
    
    toast({
      title: "Contato adicionado",
      description: `Número ${numero} adicionado à lista`,
    });
  };

  const handleRemoveContato = (numero: string) => {
    setContatos((prev) => prev.filter((c) => c !== numero));
    
    toast({
      title: "Contato removido",
      description: "Contato removido da lista",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddContato();
    }
  };

  const handleListaContatosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCarregandoLista(true);

    try {
      const text = await file.text();
      
      const linhas = text
        .split(/\r?\n/)
        .map(linha => linha.trim())
        .filter(linha => linha.length > 0);

      const novosContatos: string[] = [];
      const contatosInvalidos: string[] = [];
      const contatosDuplicados: string[] = [];

      linhas.forEach((linha, index) => {
        const primeiraColuna = linha.split(/[,;]/)[0].trim();
        const numero = primeiraColuna.replace(/\D/g, "");

        if (!numero || numero.length < 10) {
          contatosInvalidos.push(`Linha ${index + 1}: ${primeiraColuna}`);
          return;
        }

        if (contatos.includes(numero) || novosContatos.includes(numero)) {
          contatosDuplicados.push(numero);
          return;
        }

        novosContatos.push(numero);
      });

      if (novosContatos.length === 0) {
        toast({
          title: "Nenhum contato válido",
          description: "Não foram encontrados números válidos no arquivo",
          variant: "destructive",
        });
        setIsCarregandoLista(false);
        
        if (listaContatosRef.current) {
          listaContatosRef.current.value = "";
        }
        return;
      }

      setContatos((prev) => [...prev, ...novosContatos]);

      const mensagens: string[] = [];
      mensagens.push(`${novosContatos.length} contato(s) adicionado(s)`);
      
      if (contatosDuplicados.length > 0) {
        mensagens.push(`${contatosDuplicados.length} duplicado(s) ignorado(s)`);
      }
      
      if (contatosInvalidos.length > 0) {
        mensagens.push(`${contatosInvalidos.length} inválido(s) ignorado(s)`);
      }

      toast({
        title: "Lista carregada",
        description: mensagens.join(", "),
      });

    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: "Não foi possível ler o arquivo. Verifique o formato.",
        variant: "destructive",
      });
    } finally {
      setIsCarregandoLista(false);
      
      if (listaContatosRef.current) {
        listaContatosRef.current.value = "";
      }
    }
  };

  const handleLimparTudo = () => {
    imagens.forEach((img) => URL.revokeObjectURL(img.preview));
    setImagens([]);
    setMensagem("");
    setContatos([]);
    
    toast({
      title: "Limpeza concluída",
      description: "Todos os dados foram limpos",
    });
  };

  const handleEnviarMensagens = async () => {
    if (!mensagem.trim() && imagens.length === 0) {
      toast({
        title: "Conteúdo vazio",
        description: "Adicione uma mensagem ou imagem antes de enviar",
        variant: "destructive",
      });
      return;
    }

    if (contatos.length === 0) {
      toast({
        title: "Nenhum contato",
        description: "Adicione pelo menos um contato antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setIsEnviando(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast({
        title: "Mensagens enviadas",
        description: `${contatos.length} mensagem(ns) enviada(s) com sucesso`,
      });

      handleLimparTudo();
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar as mensagens. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsEnviando(false);
    }
  };

  useEffect(() => {
    return () => {
      imagens.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [imagens]);

  const totalCaracteres = mensagem.length;
  const podeEnviar = (mensagem.trim() || imagens.length > 0) && contatos.length > 0;

  return (
    <PageWrapper>
      <div className="page-container">
        {/* Header */}
        {isMobile ? (
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-[#1C1F26] flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Envio em Massa WhatsApp
            </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Envie mensagens e imagens para múltiplos contatos de forma profissional
            </p>
          </div>
        </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-[#1C1F26] flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Envio em Massa WhatsApp
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Envie mensagens e imagens para múltiplos contatos de forma profissional
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Painel Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview da Mensagem - Estilo WhatsApp */}
            {(mensagem.trim() || imagens.length > 0) && (
              isMobile ? (
                <div>
                  <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200/50 dark:border-green-700/30">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Preview da Mensagem
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="bg-[#ECE5DD] dark:bg-[#0B1419] min-h-[200px] p-6">
                        {/* Simulação de chat WhatsApp */}
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-3 justify-end">
                            <div className="max-w-[70%]">
                              <div className="bg-[#DCF8C6] dark:bg-green-900/30 rounded-lg px-4 py-2.5 shadow-sm">
                                {imagens.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                    {imagens.slice(0, 4).map((img) => (
                                      <div
                                        key={img.id}
                                        className="relative rounded-lg overflow-hidden aspect-square"
                                      >
                                        <img
                                          src={img.preview}
                                          alt="Preview"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {mensagem.trim() && (
                                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                    {mensagem}
                                  </p>
                                )}
                                {!mensagem.trim() && imagens.length > 0 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    Mensagem de imagem
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block text-right">
                                Agora
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              V
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200/50 dark:border-green-700/30">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Preview da Mensagem
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="bg-[#ECE5DD] dark:bg-[#0B1419] min-h-[200px] p-6">
                        {/* Simulação de chat WhatsApp */}
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-3 justify-end">
                            <div className="max-w-[70%]">
                              <div className="bg-[#DCF8C6] dark:bg-green-900/30 rounded-lg px-4 py-2.5 shadow-sm">
                                {imagens.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                    {imagens.slice(0, 4).map((img) => (
                                      <div
                                        key={img.id}
                                        className="relative rounded-lg overflow-hidden aspect-square"
                                      >
                                        <img
                                          src={img.preview}
                                          alt="Preview"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {mensagem.trim() && (
                                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                    {mensagem}
                                  </p>
                                )}
                                {!mensagem.trim() && imagens.length > 0 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    Mensagem de imagem
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block text-right">
                                Agora
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              V
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            )}

            {/* Card de Composição */}
            {isMobile ? (
              <div>
            <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Composição da Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mensagem">Texto da Mensagem</Label>
                  <Textarea
                    id="mensagem"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Digite sua mensagem aqui... Você pode enviar apenas imagens ou combinar texto com imagens."
                      className="mt-2 min-h-[150px] resize-none"
                    maxLength={4096}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {totalCaracteres} / 4096 caracteres
                    </p>
                    {totalCaracteres > 3500 && (
                        <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-600/50">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Próximo do limite
                      </Badge>
                    )}
                  </div>
                </div>

                  <Separator />

                {/* Upload de Imagens */}
                <div>
                  <Label>Imagens</Label>
                  <div className="mt-2 space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Imagens
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      {isMobile ? (
                        imagens.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {imagens.map((img) => (
                          <div
                            key={img.id}
                                className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 aspect-square"
                          >
                            <img
                              src={img.preview}
                              alt="Preview"
                                  className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => handleRemoveImage(img.id)}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            >
                              <X className="h-3 w-3" />
                            </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 truncate">
                              {img.file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                        )
                      ) : (
                        <AnimatePresence>
                          {imagens.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="grid grid-cols-2 md:grid-cols-3 gap-3"
                            >
                              {imagens.map((img) => (
                                <motion.div
                                  key={img.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 aspect-square"
                                >
                                  <img
                                    src={img.preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={() => handleRemoveImage(img.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 truncate">
                                    {img.file.name}
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Máximo de 10 imagens por mensagem
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Composição da Mensagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="mensagem">Texto da Mensagem</Label>
                      <Textarea
                        id="mensagem"
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                        placeholder="Digite sua mensagem aqui... Você pode enviar apenas imagens ou combinar texto com imagens."
                        className="mt-2 min-h-[150px] resize-none"
                        maxLength={4096}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {totalCaracteres} / 4096 caracteres
                        </p>
                        {totalCaracteres > 3500 && (
                          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-600/50">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Próximo do limite
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Upload de Imagens */}
                    <div>
                      <Label>Imagens</Label>
                      <div className="mt-2 space-y-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Adicionar Imagens
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />

                        <AnimatePresence>
                          {imagens.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="grid grid-cols-2 md:grid-cols-3 gap-3"
                            >
                              {imagens.map((img) => (
                                <motion.div
                                  key={img.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 aspect-square"
                                >
                                  <img
                                    src={img.preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={() => handleRemoveImage(img.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 truncate">
                                    {img.file.name}
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Máximo de 10 imagens por mensagem
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Card de Contatos */}
            {isMobile ? (
              <div>
                <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Lista de Contatos
                      {contatos.length > 0 && (
                        <Badge className="ml-2 bg-primary dark:bg-primary">
                          {contatos.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Adicionar contato manual */}
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={contatoInput}
                        onChange={(e) => setContatoInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite o número (ex: 5511999999999)"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddContato}
                        className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                      >
                        Adicionar
                      </Button>
                    </div>

                    <Separator />

                    {/* Upload de lista de contatos */}
                    <div className="space-y-2">
                      <Label>Importar Lista de Contatos</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => listaContatosRef.current?.click()}
                        disabled={isCarregandoLista}
                        className="w-full"
                      >
                        {isCarregandoLista ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            <FileUp className="h-4 w-4 mr-2" />
                            Carregar Arquivo (TXT ou CSV)
                          </>
                        )}
                      </Button>
                      <input
                        ref={listaContatosRef}
                        type="file"
                        accept=".txt,.csv"
                        onChange={handleListaContatosUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Suporta arquivos TXT ou CSV. Um número por linha ou CSV com números na primeira coluna.
                      </p>
                    </div>

                    {contatos.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Contatos Adicionados</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setContatos([])}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 h-8"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Limpar
                          </Button>
                        </div>
                        <ScrollArea className="h-[300px] rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                          <div className="space-y-2">
                            {contatos.map((contato, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                                    {contato}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleRemoveContato(contato)}
                                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-600 dark:text-red-400 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20 dark:border-primary/30">
                      <p className="text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Formato:</strong> Digite o número completo com código do país e DDD (ex: 5511999999999). 
                          Não inclua espaços, parênteses ou hífens.
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Lista de Contatos
                      {contatos.length > 0 && (
                        <Badge className="ml-2 bg-primary dark:bg-primary">
                          {contatos.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Adicionar contato manual */}
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={contatoInput}
                        onChange={(e) => setContatoInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite o número (ex: 5511999999999)"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddContato}
                        className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                      >
                        Adicionar
                      </Button>
                    </div>

                    <Separator />

                    {/* Upload de lista de contatos */}
                    <div className="space-y-2">
                      <Label>Importar Lista de Contatos</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => listaContatosRef.current?.click()}
                        disabled={isCarregandoLista}
                        className="w-full"
                      >
                        {isCarregandoLista ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            <FileUp className="h-4 w-4 mr-2" />
                            Carregar Arquivo (TXT ou CSV)
                          </>
                        )}
                      </Button>
                      <input
                        ref={listaContatosRef}
                        type="file"
                        accept=".txt,.csv"
                        onChange={handleListaContatosUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Suporta arquivos TXT ou CSV. Um número por linha ou CSV com números na primeira coluna.
                      </p>
                    </div>

                    {contatos.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Contatos Adicionados</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setContatos([])}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 h-8"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Limpar
                          </Button>
                        </div>
                        <ScrollArea className="h-[300px] rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                          <div className="space-y-2">
                            {contatos.map((contato, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                                    {contato}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleRemoveContato(contato)}
                                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-600 dark:text-red-400 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20 dark:border-primary/30">
                      <p className="text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Formato:</strong> Digite o número completo com código do país e DDD (ex: 5511999999999). 
                          Não inclua espaços, parênteses ou hífens.
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Botão de Envio */}
            {isMobile ? (
              <div>
                <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-700/30">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Pronto para enviar
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {contatos.length} contato(s) receberá(ão) a mensagem
                        </p>
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          onClick={handleLimparTudo}
                          disabled={isEnviando}
                          className="flex-1 sm:flex-initial"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar
                        </Button>
                        <Button
                          onClick={handleEnviarMensagens}
                          disabled={!podeEnviar || isEnviando}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 flex-1 sm:flex-initial"
                          size="lg"
                        >
                          {isEnviando ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="h-5 w-5 mr-2" />
                              Enviar Mensagens
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-700/30">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Pronto para enviar
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {contatos.length} contato(s) receberá(ão) a mensagem
                        </p>
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          onClick={handleLimparTudo}
                          disabled={isEnviando}
                          className="flex-1 sm:flex-initial"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar
                        </Button>
                        <Button
                          onClick={handleEnviarMensagens}
                          disabled={!podeEnviar || isEnviando}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 flex-1 sm:flex-initial"
                          size="lg"
                        >
                          {isEnviando ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="h-5 w-5 mr-2" />
                              Enviar Mensagens
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Painel Lateral */}
          <div className="space-y-6">
            {/* Card de Resumo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
            <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Mensagem</span>
                    <Badge variant={mensagem.trim() ? "default" : "outline"}>
                      {mensagem.trim() ? "Configurada" : "Vazia"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <ImageIcon className="h-3 w-3" />
                        Imagens
                      </span>
                    <Badge variant={imagens.length > 0 ? "default" : "outline"}>
                        {imagens.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        Contatos
                      </span>
                    <Badge variant={contatos.length > 0 ? "default" : "outline"}>
                        {contatos.length}
                    </Badge>
                  </div>
                </div>

                  <Separator />

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700/30">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Total de Envios
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {contatos.length}
                    </span>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Card de Informações */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
            <Card className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Informações Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="space-y-2">
                  <p className="font-semibold">⚠️ API não conectada</p>
                  <p className="text-xs">
                    Esta página está preparada para conectar com a API do WhatsApp. 
                    Atualmente, os envios são apenas simulações.
                  </p>
                </div>
                  <Separator className="bg-primary/20 dark:bg-primary/30" />
                  <div className="space-y-2">
                  <p className="font-semibold">📱 Limitações do WhatsApp</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Máximo de 4096 caracteres por mensagem</li>
                    <li>Até 10 imagens por mensagem</li>
                    <li>Números devem estar no formato internacional</li>
                    <li>Evite enviar para números que não autorizaram</li>
                  </ul>
                </div>
                  <Separator className="bg-primary/20 dark:bg-primary/30" />
                  <div className="space-y-2">
                  <p className="font-semibold">🔒 Boas Práticas</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Respeite horários comerciais</li>
                    <li>Evite spam e mensagens não solicitadas</li>
                    <li>Mantenha mensagens claras e objetivas</li>
                    <li>Personalize quando possível</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}