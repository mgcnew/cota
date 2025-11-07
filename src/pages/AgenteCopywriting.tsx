import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useProducts } from '@/hooks/useProducts';
import { useGemini } from '@/hooks/useGemini';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Sparkles, 
  Package, 
  Wand2, 
  Copy, 
  Download, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FolderOpen,
  Trash2,
  Search,
  Filter,
  X,
  Clock,
  FileText,
  BookOpen,
  Megaphone,
  Phone,
  ShoppingBag,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { capitalize } from '@/lib/text-utils';

type TipoLocucao = 'atendimento' | 'promocao' | 'institucional' | 'publicitario' | 'educacional' | 'jornalistico' | 'musical' | 'narrativo' | 'persuasivo' | 'informativo' | 'emocional' | 'tecnico';

type GatilhoMental = 'urgencia' | 'escassez' | 'autoridade' | 'prova_social' | 'reciprocidade' | 'compromisso' | 'afeicao' | 'novidade' | 'curiosidade' | 'beneficio' | 'garantia' | 'sem_gatilho';

type TemperaturaCopy = 'quente' | 'frio' | 'neutro';

interface CopywritingResult {
  id: string;
  productId: string;
  productName: string;
  productCategory?: string;
  copywriting: string;
  tipo: TipoLocucao;
  gatilhoMental?: GatilhoMental;
  temperatura?: TemperaturaCopy;
  createdAt: string;
  instrucoesAdicionais?: string;
}

interface SavedCopywriting extends CopywritingResult {
  savedAt: string;
}

const tipoLocucaoOptions = [
  { value: 'atendimento', label: 'Atendimento', icon: Phone, color: 'blue', description: 'Suporte e orientação' },
  { value: 'promocao', label: 'Promoção', icon: Megaphone, color: 'purple', description: 'Ofertas e vendas' },
  { value: 'institucional', label: 'Institucional', icon: BookOpen, color: 'orange', description: 'Comunicação empresarial' },
  { value: 'publicitario', label: 'Publicitário', icon: ShoppingBag, color: 'amber', description: 'Campanhas e marketing' },
  { value: 'educacional', label: 'Educacional', icon: BookOpen, color: 'green', description: 'Conteúdo educativo' },
  { value: 'jornalistico', label: 'Jornalístico', icon: FileText, color: 'slate', description: 'Notícias e reportagens' },
  { value: 'musical', label: 'Musical', icon: Sparkles, color: 'violet', description: 'Anúncios musicais' },
  { value: 'narrativo', label: 'Narrativo', icon: FileText, color: 'indigo', description: 'Histórias e casos' },
  { value: 'persuasivo', label: 'Persuasivo', icon: Wand2, color: 'pink', description: 'Foco em convencimento' },
  { value: 'informativo', label: 'Informativo', icon: FileText, color: 'gray', description: 'Dados e informações' },
  { value: 'emocional', label: 'Emocional', icon: Sparkles, color: 'rose', description: 'Apelo emocional' },
  { value: 'tecnico', label: 'Técnico', icon: Package, color: 'cyan', description: 'Especificações técnicas' },
];

const gatilhosMentaisOptions = [
  { value: 'sem_gatilho', label: 'Sem Gatilho', description: 'Copy neutro sem gatilhos' },
  { value: 'urgencia', label: 'Urgência', description: 'Criar senso de urgência' },
  { value: 'escassez', label: 'Escassez', description: 'Quantidade limitada' },
  { value: 'autoridade', label: 'Autoridade', description: 'Demonstrar expertise' },
  { value: 'prova_social', label: 'Prova Social', description: 'Testemunhos e avaliações' },
  { value: 'reciprocidade', label: 'Reciprocidade', description: 'Oferecer valor primeiro' },
  { value: 'compromisso', label: 'Compromisso', description: 'Gerar comprometimento' },
  { value: 'afeicao', label: 'Afeição', description: 'Criar conexão emocional' },
  { value: 'novidade', label: 'Novidade', description: 'Destacar inovação' },
  { value: 'curiosidade', label: 'Curiosidade', description: 'Despertar interesse' },
  { value: 'beneficio', label: 'Benefício', description: 'Focar em vantagens' },
  { value: 'garantia', label: 'Garantia', description: 'Reduzir risco' },
];

const temperaturaOptions = [
  { value: 'quente', label: 'Quente', description: 'Emocional, persuasivo, envolvente', color: 'red' },
  { value: 'frio', label: 'Frio', description: 'Racional, objetivo, informativo', color: 'blue' },
  { value: 'neutro', label: 'Neutro', description: 'Equilibrado entre emocional e racional', color: 'gray' },
];

export default function AgenteCopywriting() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const { generateLocucao } = useGemini();
  const { toast } = useToast();
  
  // API Key padrão configurada
  const DEFAULT_API_KEY = 'AIzaSyAuLwffF13_0aHKc8X5LEhw5-wp4kQmj0c';

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    // Tentar carregar do localStorage primeiro, senão usar a padrão
    const saved = localStorage.getItem('geminiApiKey');
    return saved || DEFAULT_API_KEY;
  });
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [tipoLocucao, setTipoLocucao] = useState<TipoLocucao>('promocao');
  const [gatilhoMental, setGatilhoMental] = useState<GatilhoMental>('sem_gatilho');
  const [temperatura, setTemperatura] = useState<TemperaturaCopy>('neutro');
  const [instrucoesAdicionais, setInstrucoesAdicionais] = useState('');
  const [results, setResults] = useState<CopywritingResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedCopies, setSavedCopies] = useState<SavedCopywriting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const safeProducts = useMemo(() => products || [], [products]);

  // Produtos filtrados por busca (definido cedo para ser usado em selectAll)
  const displayedProducts = useMemo(() => {
    if (!productSearchQuery.trim()) {
      // Se não houver busca, não mostrar nenhum produto (página mais leve)
      return [];
    }
    
    const query = productSearchQuery.toLowerCase().trim();
    return safeProducts.filter(product => {
      const name = product?.name?.toLowerCase() || '';
      const category = product?.category?.toLowerCase() || '';
      return name.includes(query) || category.includes(query);
    });
  }, [safeProducts, productSearchQuery]);

  // Carregar dados salvos e garantir API key
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

    const saved = localStorage.getItem('savedCopywritings');
    if (saved) {
      try {
        setSavedCopies(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar copies salvos:', e);
      }
    }
  }, []);

  // Salvar API Key
  const saveApiKey = useCallback(() => {
    localStorage.setItem('geminiApiKey', apiKey);
    toast({
      title: "API Key salva",
      description: "Sua chave foi salva com sucesso",
    });
  }, [apiKey, toast]);

  // Toggle produto
  const toggleProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  // Selecionar todos (apenas os produtos exibidos)
  const selectAll = useCallback(() => {
    if (displayedProducts.length === 0) return;
    
    setSelectedProducts(prev => {
      const displayedIds = new Set(displayedProducts.map(p => p.id));
      const allDisplayedSelected = displayedIds.size > 0 && Array.from(displayedIds).every(id => prev.has(id));
      
      if (allDisplayedSelected) {
        // Desmarcar apenas os exibidos
        const newSet = new Set(prev);
        displayedIds.forEach(id => newSet.delete(id));
        return newSet;
      } else {
        // Selecionar todos os exibidos
        const newSet = new Set(prev);
        displayedIds.forEach(id => newSet.add(id));
        return newSet;
      }
    });
  }, [displayedProducts]);

  // Gerar copywriting
  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      toast({
        title: "API Key necessária",
        description: "Configure sua chave da API do Gemini",
        variant: "destructive"
      });
      return;
    }

    if (selectedProducts.size === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    const newResults: CopywritingResult[] = [];

    try {
      const tipoInfo = tipoLocucaoOptions.find(t => t.value === tipoLocucao);
      const gatilhoInfo = gatilhosMentaisOptions.find(g => g.value === gatilhoMental);
      const tempInfo = temperaturaOptions.find(t => t.value === temperatura);
      
      for (const productId of selectedProducts) {
        const product = safeProducts.find(p => p.id === productId);
        if (!product) continue;

        // Construir prompt avançado com todas as opções
        const productName = product.name || 'Produto';
        const productCategory = product.category || '';
        let prompt = `Crie um copywriting profissional em texto para o produto "${productName}"${productCategory ? ` da categoria "${productCategory}"` : ''}.\n\n`;

        // Tipo de copywriting
        prompt += `TIPO DE COPYWRITING: ${tipoInfo?.label}\n`;
        prompt += `${tipoInfo?.description || ''}\n\n`;

        // Temperatura (Quente/Frio/Neutro)
        prompt += `TEMPERATURA DO COPY: ${tempInfo?.label.toUpperCase()}\n`;
        if (temperatura === 'quente') {
          prompt += `O copy deve ser QUENTE: emocional, persuasivo, envolvente, usar linguagem que desperte sentimentos, criar conexão emocional com o leitor, ser mais subjetivo e apelar para desejos e emoções.\n\n`;
        } else if (temperatura === 'frio') {
          prompt += `O copy deve ser FRIO: racional, objetivo, informativo, usar dados e fatos, ser direto e claro, focar em especificações técnicas e benefícios mensuráveis, ser mais lógico e analítico.\n\n`;
        } else {
          prompt += `O copy deve ser NEUTRO: equilibrar aspectos emocionais e racionais, ser profissional mas acessível, combinar persuasão com informação.\n\n`;
        }

        // Gatilho mental
        if (gatilhoMental !== 'sem_gatilho') {
          prompt += `GATILHO MENTAL: ${gatilhoInfo?.label}\n`;
          prompt += `${gatilhoInfo?.description || ''}\n`;
          
          // Instruções específicas por gatilho
          const gatilhoInstructions: Record<GatilhoMental, string> = {
            urgencia: 'Crie urgência usando palavras como "agora", "hoje", "limitado", "última chance", "não perca". Use tempo limitado ou oferta por tempo determinado.',
            escassez: 'Enfatize quantidade limitada, estoque reduzido, edição limitada. Use frases como "apenas X unidades", "últimos itens", "exclusivo para poucos".',
            autoridade: 'Demonstre expertise, credibilidade, certificações, anos de experiência, reconhecimentos, dados e estatísticas que provem autoridade no assunto.',
            prova_social: 'Use testemunhos, avaliações, número de clientes, casos de sucesso, depoimentos reais, número de vendas, reviews positivos.',
            reciprocidade: 'Ofereça valor primeiro, dicas úteis, informações gratuitas, conteúdo educativo antes de pedir algo em troca.',
            compromisso: 'Crie pequenos compromissos, perguntas que gerem "sim", leve o leitor a concordar passo a passo, construa comprometimento gradual.',
            afeicao: 'Crie conexão emocional, use histórias, humanize a marca, mostre valores compartilhados, cause identificação pessoal.',
            novidade: 'Destaque inovação, lançamento, tecnologia exclusiva, diferencial único, algo nunca visto antes, pioneirismo.',
            curiosidade: 'Desperte curiosidade, use perguntas intrigantes, informações incompletas que gerem interesse, mistério que convide a descobrir mais.',
            beneficio: 'Foque intensamente nos benefícios transformadores, resultados, mudanças positivas, impacto na vida do cliente, valor entregue.',
            garantia: 'Reduza risco com garantias, política de devolução, compromisso de qualidade, selos de confiança, certificações, segurança na compra.',
            sem_gatilho: '',
          };
          
          prompt += gatilhoInstructions[gatilhoMental] + '\n\n';
        }

        // Instruções adicionais
        if (instrucoesAdicionais.trim()) {
          prompt += `INSTRUÇÕES ADICIONAIS:\n${instrucoesAdicionais}\n\n`;
        }

        // Requisitos gerais
        prompt += `REQUISITOS GERAIS:
- Texto profissional e bem escrito
- Entre 150-250 palavras
- Claro, objetivo e impactante
- Em português brasileiro
- Apenas texto, sem formatação especial ou markdown
- Foque em resultados e transformação
- Seja persuasivo mas autêntico

Retorne APENAS o texto do copywriting, sem explicações, sem título, sem formatação.`;

        try {
          const response = await generateLocucao(prompt, tipoLocucao, apiKey);

          if (response?.text && !response.error) {
            newResults.push({
              id: `${productId}-${Date.now()}`,
              productId: product.id,
              productName: product.name || 'Produto sem nome',
              productCategory: product.category || undefined,
              copywriting: response.text.trim(),
              tipo: tipoLocucao,
              gatilhoMental: gatilhoMental !== 'sem_gatilho' ? gatilhoMental : undefined,
              temperatura: temperatura !== 'neutro' ? temperatura : undefined,
              createdAt: new Date().toISOString(),
              instrucoesAdicionais: instrucoesAdicionais.trim() || undefined
            });
          } else {
            console.error(`Erro ao gerar copy para ${productName}:`, response?.error || 'Erro desconhecido');
          }
        } catch (error) {
          console.error(`Erro ao gerar copy para ${productName}:`, error);
          // Continua para o próximo produto mesmo se um falhar
        }
      }

      setResults(newResults);
      
      if (newResults.length > 0) {
        const failed = selectedProducts.size - newResults.length;
        toast({
          title: "Copywriting gerado!",
          description: `${newResults.length} copywriting(s) criado(s)${failed > 0 ? ` (${failed} falharam)` : ''}`,
        });
      } else {
        toast({
          title: "Nenhum copywriting gerado",
          description: "Não foi possível gerar nenhum copywriting. Verifique sua API Key e tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro geral ao gerar copywritings:', error);
      toast({
        title: "Erro ao gerar",
        description: error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, selectedProducts, tipoLocucao, gatilhoMental, temperatura, instrucoesAdicionais, safeProducts, generateLocucao, toast]);

  // Salvar copy
  const saveCopy = useCallback((copy: CopywritingResult) => {
    const savedCopy: SavedCopywriting = {
      ...copy,
      savedAt: new Date().toISOString()
    };

    setSavedCopies(prev => {
      const updated = [savedCopy, ...prev].slice(0, 100);
      localStorage.setItem('savedCopywritings', JSON.stringify(updated));
      return updated;
    });

    toast({
      title: "Salvo!",
      description: "Copywriting salvo com sucesso",
    });
  }, [toast]);

  // Deletar copy salvo
  const deleteSavedCopy = useCallback((id: string) => {
    setSavedCopies(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('savedCopywritings', JSON.stringify(updated));
      return updated;
    });

    toast({
      title: "Removido",
      description: "Copywriting removido",
    });
  }, [toast]);

  // Copiar para clipboard
  const copyToClipboard = useCallback((text: string, productName: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `Copywriting de ${productName} copiado`,
    });
  }, [toast]);

  // Exportar todos
  const exportAll = useCallback(() => {
    const content = results.map(r => {
      const tipoInfo = tipoLocucaoOptions.find(t => t.value === r.tipo);
      let exportText = `=== ${r.productName} ===\n`;
      exportText += `Tipo: ${tipoInfo?.label || r.tipo}\n`;
      if (r.productCategory) {
        exportText += `Categoria: ${r.productCategory}\n`;
      }
      if (r.temperatura) {
        exportText += `Temperatura: ${r.temperatura === 'quente' ? 'Quente' : r.temperatura === 'frio' ? 'Frio' : 'Neutro'}\n`;
      }
      if (r.gatilhoMental) {
        const gatilhoInfo = gatilhosMentaisOptions.find(g => g.value === r.gatilhoMental);
        exportText += `Gatilho Mental: ${gatilhoInfo?.label || r.gatilhoMental}\n`;
      }
      exportText += `\n${r.copywriting}\n\n`;
      return exportText;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copywriting-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado!",
      description: "Todos os copywritings foram exportados",
    });
  }, [results, toast]);

  // Filtrar copies salvos
  const filteredSavedCopies = useMemo(() => {
    let filtered = savedCopies;

    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.tipo === filterType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.productName.toLowerCase().includes(query) ||
        c.copywriting.toLowerCase().includes(query) ||
        (c.productCategory && c.productCategory.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [savedCopies, filterType, searchQuery]);

  if (loading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthDialog 
        open={true} 
        onOpenChange={(open) => {
          setAuthDialogOpen(open);
          if (!open) navigate('/dashboard/extra');
        }} 
      />
    );
  }

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className="max-w-7xl mx-auto">
          {/* Header Minimalista */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/extra')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Agente de Copywriting
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gere copywriting em texto para seus produtos
                  </p>
                </div>
              </div>
            </div>
            {savedCopies.length > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {savedCopies.length} salvo{savedCopies.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <Tabs defaultValue="gerar" className="space-y-4">
            <TabsList>
              <TabsTrigger value="gerar">
                <Wand2 className="w-4 h-4 mr-2" />
                Gerar
              </TabsTrigger>
              <TabsTrigger value="salvos">
                <FolderOpen className="w-4 h-4 mr-2" />
                Salvos ({savedCopies.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gerar" className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                {/* Sidebar - Configuração */}
                <div className="col-span-3 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Configuração</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                          API Key
                        </label>
                        <div className="flex gap-1.5">
                          <Input
                            type="password"
                            placeholder="API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="h-9 text-sm"
                          />
                          <Button
                            onClick={saveApiKey}
                            size="sm"
                            variant="outline"
                            className="h-9 px-3"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                          Tipo
                        </label>
                        <Select value={tipoLocucao} onValueChange={(v) => setTipoLocucao(v as TipoLocucao)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tipoLocucaoOptions.map((tipo) => {
                              const Icon = tipo.icon;
                              return (
                                <SelectItem key={tipo.value} value={tipo.value}>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-4 h-4" />
                                      {tipo.label}
                                    </div>
                                    <div className="text-xs text-gray-500 ml-6">{tipo.description}</div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div>
                        <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                          Temperatura
                        </label>
                        <Select value={temperatura} onValueChange={(v) => setTemperatura(v as TemperaturaCopy)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {temperaturaOptions.map((temp) => (
                              <SelectItem key={temp.value} value={temp.value}>
                                <div>
                                  <div className="font-medium">{temp.label}</div>
                                  <div className="text-xs text-gray-500">{temp.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                          Gatilho Mental
                        </label>
                        <Select value={gatilhoMental} onValueChange={(v) => setGatilhoMental(v as GatilhoMental)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {gatilhosMentaisOptions.map((gatilho) => (
                              <SelectItem key={gatilho.value} value={gatilho.value}>
                                <div>
                                  <div className="font-medium">{gatilho.label}</div>
                                  <div className="text-xs text-gray-500">{gatilho.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div>
                        <label className="text-xs font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                          Instruções (Opcional)
                        </label>
                        <Textarea
                          placeholder="Ex: tom mais divertido..."
                          value={instrucoesAdicionais}
                          onChange={(e) => setInstrucoesAdicionais(e.target.value)}
                          rows={3}
                          className="text-sm resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Produtos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Barra de busca */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Buscar produtos..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          className="pl-8 h-9 text-sm"
                        />
                      </div>

                      {/* Contador e ações */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-gray-600 dark:text-gray-400">
                          {productSearchQuery.trim() 
                            ? `${displayedProducts.length} encontrado${displayedProducts.length !== 1 ? 's' : ''}`
                            : 'Digite para buscar produtos'
                          }
                        </div>
                        {displayedProducts.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={selectAll}
                            className="h-6 text-xs px-2"
                          >
                            {(() => {
                              const displayedIds = new Set(displayedProducts.map(p => p.id));
                              const allSelected = displayedIds.size > 0 && Array.from(displayedIds).every(id => selectedProducts.has(id));
                              return allSelected ? 'Desmarcar' : 'Selecionar Todos';
                            })()}
                          </Button>
                        )}
                      </div>

                      {/* Lista de produtos */}
                      {productSearchQuery.trim() ? (
                        <ScrollArea className="h-[450px]">
                          <div className="space-y-1 pr-2">
                            {displayedProducts.length === 0 ? (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                Nenhum produto encontrado
                              </div>
                            ) : (
                              displayedProducts.map((product) => (
                                <label
                                  key={product.id}
                                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={selectedProducts.has(product.id)}
                                    onCheckedChange={() => toggleProduct(product.id)}
                                    className="h-4 w-4"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {capitalize(product.name)}
                                    </div>
                                    {product.category && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {capitalize(product.category)}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Digite na busca para encontrar produtos</p>
                        </div>
                      )}

                      {/* Contador de selecionados */}
                      {selectedProducts.size > 0 && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {selectedProducts.size} produto{selectedProducts.size !== 1 ? 's' : ''} selecionado{selectedProducts.size !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !apiKey || selectedProducts.size === 0}
                    className="w-full h-10 bg-primary hover:bg-primary/90 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Gerar
                      </>
                    )}
                  </Button>
                </div>

                {/* Resultados */}
                <div className="col-span-9">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Resultados {results.length > 0 && `(${results.length})`}
                        </CardTitle>
                        {results.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportAll}
                            className="h-8 text-xs"
                          >
                            <Download className="w-3 h-3 mr-1.5" />
                            Exportar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {results.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Os resultados aparecerão aqui</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {results.map((result) => {
                            const tipoInfo = tipoLocucaoOptions.find(t => t.value === result.tipo);
                            const Icon = tipoInfo?.icon || Sparkles;
                            const isSaved = savedCopies.some(c => c.id === result.id);

                            return (
                              <div
                                key={result.id}
                                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Package className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {capitalize(result.productName)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="secondary" className="text-xs">
                                        <Icon className="w-3 h-3 mr-1" />
                                        {tipoInfo?.label}
                                      </Badge>
                                      {result.temperatura && (
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            result.temperatura === 'quente' ? 'border-red-300 text-red-700 dark:text-red-400' :
                                            result.temperatura === 'frio' ? 'border-blue-300 text-blue-700 dark:text-blue-400' :
                                            ''
                                          }`}
                                        >
                                          {result.temperatura === 'quente' ? '🔥 Quente' : result.temperatura === 'frio' ? '❄️ Frio' : '⚖️ Neutro'}
                                        </Badge>
                                      )}
                                      {result.gatilhoMental && (
                                        <Badge variant="outline" className="text-xs">
                                          🎯 {gatilhosMentaisOptions.find(g => g.value === result.gatilhoMental)?.label}
                                        </Badge>
                                      )}
                                      {result.productCategory && (
                                        <Badge variant="outline" className="text-xs">
                                          {capitalize(result.productCategory)}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {result.copywriting}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(result.copywriting, result.productName)}
                                    className="h-8 text-xs"
                                  >
                                    <Copy className="w-3 h-3 mr-1.5" />
                                    Copiar
                                  </Button>
                                  <Button
                                    variant={isSaved ? "secondary" : "default"}
                                    size="sm"
                                    onClick={() => !isSaved && saveCopy(result)}
                                    disabled={isSaved}
                                    className={`h-8 text-xs ${isSaved ? '' : 'bg-success hover:bg-success/90 text-white'}`}
                                  >
                                    {isSaved ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                        Salvo
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-3 h-3 mr-1.5" />
                                        Salvar
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const blob = new Blob([result.copywriting], { type: 'text/plain' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `copy-${result.productName}-${Date.now()}.txt`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="h-8 text-xs"
                                  >
                                    <Download className="w-3 h-3 mr-1.5" />
                                    Baixar
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="salvos" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Copies Salvos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filtros */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[180px] h-9 text-sm">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {tipoLocucaoOptions.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(searchQuery || filterType !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterType('all');
                        }}
                        className="h-9 px-3"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Lista */}
                  {filteredSavedCopies.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {savedCopies.length === 0 
                          ? 'Nenhum copywriting salvo'
                          : 'Nenhum resultado encontrado'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSavedCopies.map((copy) => {
                        const tipoInfo = tipoLocucaoOptions.find(t => t.value === copy.tipo);
                        const Icon = tipoInfo?.icon || Sparkles;

                        return (
                          <div
                            key={copy.id}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Package className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {capitalize(copy.productName)}
                                  </span>
                                </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="secondary" className="text-xs">
                                        <Icon className="w-3 h-3 mr-1" />
                                        {tipoInfo?.label}
                                      </Badge>
                                      {copy.temperatura && (
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            copy.temperatura === 'quente' ? 'border-red-300 text-red-700 dark:text-red-400' :
                                            copy.temperatura === 'frio' ? 'border-blue-300 text-blue-700 dark:text-blue-400' :
                                            ''
                                          }`}
                                        >
                                          {copy.temperatura === 'quente' ? '🔥 Quente' : copy.temperatura === 'frio' ? '❄️ Frio' : '⚖️ Neutro'}
                                        </Badge>
                                      )}
                                      {copy.gatilhoMental && (
                                        <Badge variant="outline" className="text-xs">
                                          🎯 {gatilhosMentaisOptions.find(g => g.value === copy.gatilhoMental)?.label}
                                        </Badge>
                                      )}
                                      {copy.productCategory && (
                                        <Badge variant="outline" className="text-xs">
                                          {capitalize(copy.productCategory)}
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(copy.savedAt).toLocaleDateString('pt-BR')}
                                      </Badge>
                                    </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSavedCopy(copy.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="mb-3">
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {copy.copywriting}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(copy.copywriting, copy.productName)}
                                className="h-8 text-xs"
                              >
                                <Copy className="w-3 h-3 mr-1.5" />
                                Copiar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const blob = new Blob([copy.copywriting], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `copy-${copy.productName}-${Date.now()}.txt`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                                className="h-8 text-xs"
                              >
                                <Download className="w-3 h-3 mr-1.5" />
                                Baixar
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageWrapper>
    </>
  );
}