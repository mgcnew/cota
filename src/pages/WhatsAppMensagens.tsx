import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Icon } from '@iconify/react';
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
  FileUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

export default function WhatsAppMensagens() {
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

    // Reset input
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
    const numero = contatoInput.trim().replace(/\D/g, ""); // Remove caracteres não numéricos
    
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
      
      // Processar o arquivo (suporta CSV e TXT)
      const linhas = text
        .split(/\r?\n/)
        .map(linha => linha.trim())
        .filter(linha => linha.length > 0);

      const novosContatos: string[] = [];
      const contatosInvalidos: string[] = [];
      const contatosDuplicados: string[] = [];

      linhas.forEach((linha, index) => {
        // Se for CSV, pegar a primeira coluna (assumindo que o número está na primeira coluna)
        const primeiraColuna = linha.split(/[,;]/)[0].trim();
        const numero = primeiraColuna.replace(/\D/g, ""); // Remove caracteres não numéricos

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
        
        // Reset input
        if (listaContatosRef.current) {
          listaContatosRef.current.value = "";
        }
        return;
      }

      // Adicionar novos contatos à lista
      setContatos((prev) => [...prev, ...novosContatos]);

      // Mensagem de sucesso com detalhes
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
      
      // Reset input
      if (listaContatosRef.current) {
        listaContatosRef.current.value = "";
      }
    }
  };

  const handleLimparTudo = () => {
    // Limpar imagens e liberar URLs
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
      // TODO: Implementar chamada à API do WhatsApp
      // Aqui será a integração com a API
      
      // Simulação de envio (remover quando conectar a API real)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast({
        title: "Mensagens enviadas",
        description: `${contatos.length} mensagem(ns) enviada(s) com sucesso`,
      });

      // Limpar após envio bem-sucedido
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

  // Cleanup das URLs ao desmontar
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
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Envio em Massa WhatsApp
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Envie mensagens e imagens para múltiplos contatos
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Painel Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Mensagem */}
            <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Mensagem
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
                    className="mt-2 min-h-[150px] dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                    maxLength={4096}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {totalCaracteres} / 4096 caracteres
                    </p>
                    {totalCaracteres > 3500 && (
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Próximo do limite
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Upload de Imagens */}
                <div>
                  <Label>Imagens</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
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
                    </div>

                    {imagens.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        {imagens.map((img) => (
                          <div
                            key={img.id}
                            className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                          >
                            <img
                              src={img.preview}
                              alt="Preview"
                              className="w-full h-32 object-cover"
                            />
                            <button
                              onClick={() => handleRemoveImage(img.id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">
                              {img.file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Você pode adicionar múltiplas imagens. O WhatsApp permite até 10 imagens por mensagem.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Contatos */}
            <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Contatos
                  {contatos.length > 0 && (
                    <Badge className="ml-2 bg-blue-600 dark:bg-blue-500">
                      {contatos.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Adicionar contato manual */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={contatoInput}
                    onChange={(e) => setContatoInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite o número (ex: 5511999999999)"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <Button
                    onClick={handleAddContato}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    Adicionar
                  </Button>
                </div>

                {/* Separador ou upload de lista */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-[#1C1F26] px-2 text-gray-500 dark:text-gray-400">
                      ou
                    </span>
                  </div>
                </div>

                {/* Upload de lista de contatos */}
                <div className="space-y-2">
                  <Label>Importar Lista de Contatos</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => listaContatosRef.current?.click()}
                      disabled={isCarregandoLista}
                      className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      {isCarregandoLista ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <FileUp className="h-4 w-4 mr-2" />
                          Carregar Arquivo
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
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Suporta arquivos TXT ou CSV. Um número por linha ou CSV com números na primeira coluna.
                  </p>
                </div>

                {contatos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Lista de Contatos</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setContatos([])}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 h-8"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Limpar Tudo
                      </Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      {contatos.map((contato, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-mono text-gray-900 dark:text-white">
                              {contato}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveContato(contato)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/30">
                  <p className="text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Formato:</strong> Digite o número completo com código do país e DDD (ex: 5511999999999). 
                      Não inclua espaços, parênteses ou hífens.
                      <br />
                      <strong>Arquivo:</strong> Para CSV, o número deve estar na primeira coluna. Para TXT, um número por linha.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botão de Envio */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Pronto para enviar
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contatos.length} contato(s) receberá(ão) a mensagem
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleLimparTudo}
                      disabled={isEnviando}
                      className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar Tudo
                    </Button>
                    <Button
                      onClick={handleEnviarMensagens}
                      disabled={!podeEnviar || isEnviando}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 h-12"
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

          {/* Painel Lateral */}
          <div className="space-y-6">
            {/* Card de Resumo */}
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">Imagens</span>
                    <Badge variant={imagens.length > 0 ? "default" : "outline"}>
                      {imagens.length} imagem(ns)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Contatos</span>
                    <Badge variant={contatos.length > 0 ? "default" : "outline"}>
                      {contatos.length} contato(s)
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Total de Envios
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {contatos.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Informações */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700/30">
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
                <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-700/30">
                  <p className="font-semibold">📱 Limitações do WhatsApp</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Máximo de 4096 caracteres por mensagem</li>
                    <li>Até 10 imagens por mensagem</li>
                    <li>Números devem estar no formato internacional</li>
                    <li>Evite enviar para números que não autorizaram</li>
                  </ul>
                </div>
                <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-700/30">
                  <p className="font-semibold">🔒 Boas Práticas</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Respeite horários comerciais</li>
                    <li>Evite spam e mensagens não solicitadas</li>
                    <li>Mantenha mensagens claras e objetivas</li>
                    <li>Personalize quando possível</li>
                  </ul>
                </div>
                <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-700/30">
                  <p className="font-semibold">📄 Formato de Arquivo</p>
                  <div className="text-xs space-y-1">
                    <p><strong>TXT:</strong> Um número por linha</p>
                    <code className="block bg-white dark:bg-gray-800 px-2 py-1 rounded mt-1 text-[10px]">
                      5511999999999<br />
                      5511888888888<br />
                      5511777777777
                    </code>
                    <p className="mt-2"><strong>CSV:</strong> Número na primeira coluna</p>
                    <code className="block bg-white dark:bg-gray-800 px-2 py-1 rounded mt-1 text-[10px]">
                      5511999999999,Nome Cliente<br />
                      5511888888888,Outro Cliente
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Integração Futura */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon icon="fluent:code-32-filled" width="16" height="16" className="text-blue-600 dark:text-blue-400" />
                  Integração com API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <p>
                  A função <code className="bg-white dark:bg-gray-800 px-1 rounded">handleEnviarMensagens</code> está preparada para receber a integração com a API do WhatsApp.
                </p>
                <p className="pt-2 border-t border-blue-200 dark:border-blue-700/30">
                  <strong>Estrutura de dados disponível:</strong>
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><code>mensagem</code> - Texto da mensagem</li>
                  <li><code>imagens</code> - Array de arquivos de imagem</li>
                  <li><code>contatos</code> - Array de números de telefone</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

