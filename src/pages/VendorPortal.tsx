import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Send, Quote, Mail, ShieldCheck, Box, ChevronDown, ChevronUp, Scale, Hash, Info, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendWhatsApp } from "@/lib/whatsapp-service";

interface HistoryVariant {
  quantidade_venda: number;
  quantidade_unidades_estimada: number;
  unidade_venda: string;
  gramatura: number | null;
  dimensoes: string | null;
  valor_total: number;
}

interface QuoteItem {
  product_id: string;
  product_name: string;
  quantidade: number;
  unidade: string;
  valor_oferecido: string | number | null;
  observacoes: string | null;
  quantidade_por_caixa: string;
  _token?: string;
  _quote_id?: string;
  is_packaging?: boolean;
  quantidade_venda?: number | string | null;
  quantidade_unidades_estimada?: number | string | null;
  unidade_venda?: string | null;
  gramatura?: number | string | null;
  dimensoes?: string | null;
  last_spec?: HistoryVariant | null;
  history_variants?: HistoryVariant[];
  _spec_confirmed?: boolean; // true = confirmou dados antigos, false = quer alterar
  _spec_expanded?: boolean;
}

interface QuoteData {
  quote_id: string;
  supplier_id: string;
  status: string;
  supplier_name: string;
  company_id: string;
  items: QuoteItem[];
  deadline?: string;
  created_at?: string;
  is_packaging?: boolean;
}

function parseTokensDefensively(token: string | undefined): string[] {
  if (!token) return [];
  let decodedToken = token;
  try { decodedToken = decodeURIComponent(token); } catch (e) {}
  decodedToken = decodedToken.replace(/%2C/gi, ',');
  return decodedToken.split(',').map(t => t.trim()).filter(Boolean);
}

export default function VendorPortal() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<QuoteData | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [isDark, setIsDark] = useState(false);

  // Helpers para packaging detail fields
  const updateItemField = useCallback((productId: string, itemToken: string | undefined, field: string, value: any) => {
    setItems(prev => prev.map(item =>
      (item.product_id === productId && item._token === itemToken)
        ? { ...item, [field]: value }
        : item
    ));
  }, []);

  const applyVariant = useCallback((productId: string, itemToken: string | undefined, variant: HistoryVariant) => {
    setItems(prev => prev.map(item =>
      (item.product_id === productId && item._token === itemToken)
        ? {
            ...item,
            quantidade_venda: variant.quantidade_venda || '',
            quantidade_unidades_estimada: variant.quantidade_unidades_estimada || '',
            unidade_venda: variant.unidade_venda || 'kg',
            gramatura: variant.gramatura || '',
            dimensoes: variant.dimensoes || '',
            _spec_confirmed: true,
          }
        : item
    ));
  }, []);

  const confirmSpec = useCallback((productId: string, itemToken: string | undefined, confirmed: boolean) => {
    setItems(prev => prev.map(item =>
      (item.product_id === productId && item._token === itemToken)
        ? { ...item, _spec_confirmed: confirmed, _spec_expanded: !confirmed }
        : item
    ));
  }, []);

  const toggleSpecExpanded = useCallback((productId: string, itemToken: string | undefined) => {
    setItems(prev => prev.map(item =>
      (item.product_id === productId && item._token === itemToken)
        ? { ...item, _spec_expanded: !item._spec_expanded }
        : item
    ));
  }, []);

  // Manipular timer do Splash
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Detect browser dark mode preference and react to changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);
  
  // Helper para formatar string de digitação para Real (ex: "1250" -> "12,50")
  const formatInputToBRL = (value: string) => {
    const digitOnly = value.replace(/\D/g, "");
    if (!digitOnly) return "";
    const numericValue = parseInt(digitOnly, 10) / 100;
    return numericValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setError("Link de acesso inválido ou expirado.");
        setLoading(false);
        return;
      }

      try {
        const tokens = parseTokensDefensively(token);
        const allItems: QuoteItem[] = [];
        let anyOpen = false;
        let mainQuoteData: QuoteData | null = null;
        let hasErrors = false;
        let lastError: any = null;

        await Promise.all(tokens.map(async (tk) => {
          try {
            // Defensive check for valid UUID format before sending to Postgres
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(tk)) {
              console.error("Invalid UUID token format:", tk);
              hasErrors = true;
              return;
            }

            console.log("Iniciando busca do token:", tk);
            
            let { data: result, error: tokenError } = await supabase.rpc('get_vendor_quote_data', { p_token: tk });
            
            if (tokenError) console.log("Erro na cotação padrão (possível redirecionamento para embalagens):", tokenError.message);

            // Tentativa backup: Se não achou na cotação normal (ou deu erro), tenta na de embalagens
            if (tokenError || !result) {
              const { data: pkgResult, error: pkgError } = await supabase.rpc('get_packaging_vendor_quote_data', { p_token: tk });
              
              if (pkgResult) {
                console.log("Cotação de embalagens carregada com sucesso!");
                result = pkgResult;
                tokenError = null; // Limpa o erro da cotação padrão já que achamos a de embalagens
              } else if (pkgError) {
                console.error("Erro ao buscar embalagens:", pkgError);
                // Se o erro for de token inválido em ambos, mantemos o primeiro erro ou o mais descritivo
                lastError = pkgError || tokenError;
              }
            }

            if (!result) {
              console.error("Falha final no token", tk, { result, tokenError, lastError });
              lastError = lastError || tokenError || { message: 'Token não encontrado ou inválido' };
              hasErrors = true;
              return;
            }

            const qd = result as unknown as QuoteData;
            if (!mainQuoteData) {
              mainQuoteData = { ...qd }; // Shallow copy para permitir mutação do deadline
            } else {
              // Assume sempre o menor prazo (a data mais próxima/menor)
              if (qd.deadline) {
                if (
                  !mainQuoteData.deadline || 
                  new Date(qd.deadline).getTime() < new Date(mainQuoteData.deadline).getTime()
                ) {
                  mainQuoteData.deadline = qd.deadline;
                }
              }

              // Assume a data de criação mais antiga
              if ((qd as any).created_at) {
                if (
                  !mainQuoteData.created_at ||
                  new Date((qd as any).created_at).getTime() < new Date(mainQuoteData.created_at).getTime()
                ) {
                  mainQuoteData.created_at = (qd as any).created_at;
                }
              }
            }

            if (qd.status === 'ativa' || qd.status === 'ativo' || qd.status === 'pendente') {
              anyOpen = true;
              const formattedItems = (qd.items || []).map(item => {
                // Para itens de embalagem com histórico, pré-preencher com last_spec
                const spec = item.last_spec as HistoryVariant | null;
                const hasCurrentData = item.quantidade_venda || item.quantidade_unidades_estimada;
                return {
                  ...item,
                  _token: tk,
                  _quote_id: qd.quote_id,
                  is_packaging: qd.is_packaging || item.is_packaging, // Try both root and item level
                  valor_oferecido: item.valor_oferecido 
                    ? Number(item.valor_oferecido).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : "",
                  quantidade_por_caixa: item.quantidade_por_caixa ? String(item.quantidade_por_caixa) : "",
                  // Pré-preencher com dados já salvos nesta cotação, ou do last_spec
                  quantidade_venda: hasCurrentData ? (item.quantidade_venda || '') : (spec?.quantidade_venda || ''),
                  quantidade_unidades_estimada: hasCurrentData ? (item.quantidade_unidades_estimada || '') : (spec?.quantidade_unidades_estimada || ''),
                  unidade_venda: hasCurrentData ? (item.unidade_venda || 'kg') : (spec?.unidade_venda || 'kg'),
                  gramatura: hasCurrentData ? (item.gramatura || '') : (spec?.gramatura || ''),
                  dimensoes: hasCurrentData ? (item.dimensoes || '') : (spec?.dimensoes || ''),
                  _spec_confirmed: hasCurrentData ? true : (spec ? undefined : undefined), // undefined = never asked
                  _spec_expanded: !spec && !hasCurrentData, // auto-expand if no history
                };
              });
              allItems.push(...formattedItems);
            }
          } catch (e) {
            console.error("Erro processando token", tk, e);
            hasErrors = true;
          }
        }));

        if (!mainQuoteData && hasErrors) {
          const rawError = lastError ? JSON.stringify(lastError) : "Nenhum dado retornado";
          throw new Error("Erro no Banco: " + rawError);
        }

        if (!anyOpen) {
          setError("Todas as cotações deste link já foram encerradas e não aceitam mais propostas.");
        } else {
          setData(mainQuoteData);
          setItems(allItems);
        }
      } catch (err: any) {
        console.error("Erro ao carregar cotações:", err);
        setError(err.message || "Erro ao carregar os dados. Tente novamente.");
        toast({
          title: "Erro Técnico",
          description: err.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // ==========================================
    // REALTIME SUBSCRIPTION
    // Listen for changes in THIS specific quote
    // ==========================================
    if (token) {
      const tokens = parseTokensDefensively(token);
      const channels = tokens.map(tk => {
        return supabase
          .channel(`vendor-portal-${tk}`)
          .on('postgres_changes' as any, 
            { 
              event: 'UPDATE', 
              table: 'quotes'
            }, 
            (payload: any) => {
              if (payload.new && (payload.new as any).status === 'finalizada') {
                // If it's closed, we could remove just those items, or just warn. 
                // For simplicity, we warn if ALL are closed, but here let's just trigger a reload to clean the list
                location.reload();
              }
            }
          )
          .subscribe();
      });

      return () => {
        channels.forEach(ch => supabase.removeChannel(ch));
      };
    }
  }, [token]);

  const handlePriceChange = (productId: string, itemToken: string | undefined, value: string) => {
    const formatted = formatInputToBRL(value);
    setItems(items.map(item => 
      (item.product_id === productId && item._token === itemToken)
        ? { ...item, valor_oferecido: formatted } 
        : item
    ));
  };

  const handleObsChange = (productId: string, itemToken: string | undefined, value: string) => {
    setItems(items.map(item => 
      (item.product_id === productId && item._token === itemToken)
        ? { ...item, observacoes: value } 
        : item
    ));
  };

  const handleReview = () => {
    if (!token) return;
    
    const hasAnyPrice = items.some(i => i.valor_oferecido !== null && i.valor_oferecido !== "" && Number(i.valor_oferecido?.toString().replace(",", ".")) > 0);
    
    if (!hasAnyPrice) {
      toast({
        title: "Cotação vazia",
        description: "Por favor, informe o preço de pelo menos um produto.",
        variant: "destructive"
      });
      return;
    }

    setIsConfirming(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!token) return;
    
    setSaving(true);
    try {
      const tokens = parseTokensDefensively(token);

      await Promise.all(tokens.map(async (tk) => {
        const payload = items
          .filter(i => i._token === tk && i.valor_oferecido !== null && i.valor_oferecido !== "")
          .map(i => {
            const numValue = parseFloat(i.valor_oferecido!.toString().replace(/\./g, "").replace(",", "."));
            const qtdCaixa = i.quantidade_por_caixa ? parseInt(i.quantidade_por_caixa, 10) : null;

            // Base payload (cotação geral)
            const base: any = {
              product_id: i.product_id,
              valor_oferecido: numValue,
              observacoes: i.observacoes || "",
              quantidade_por_caixa: (qtdCaixa && qtdCaixa > 0) ? qtdCaixa : null
            };

            // Campos extras para embalagens
            if (i.is_packaging) {
              base.product_name = i.product_name;
              base.unidade = i.unidade_venda || 'kg';
              base.quantidade_venda = i.quantidade_venda ? parseFloat(String(i.quantidade_venda).replace(",", ".")) : null;
              base.quantidade_unidades_estimada = (i.quantidade_unidades_estimada && !isNaN(parseInt(String(i.quantidade_unidades_estimada)))) 
                ? parseInt(String(i.quantidade_unidades_estimada), 10) 
                : null;
              base.gramatura = (i.gramatura && !isNaN(parseFloat(String(i.gramatura).replace(",", ".")))) 
                ? parseFloat(String(i.gramatura).replace(",", ".")) 
                : null;
              base.dimensoes = i.dimensoes || null;
            }

            return base;
          });

        if (payload.length > 0) {
          const isPkg = items.find(i => i._token === tk)?.is_packaging;
          const rpcName = isPkg ? 'save_packaging_vendor_quote_items' : 'save_vendor_quote_items';

          const { error: saveError } = await supabase.rpc(rpcName, {
            p_token: tk,
            p_items: payload
          });

          if (saveError) throw saveError;
        }
      }));

      // Notificar o setor de compras
      if (data?.supplier_name) {
        const notifyMsg = `🔔 *Nova Resposta de Cotação!*\n\nO fornecedor *${data.supplier_name}* acaba de preencher uma cotação no portal.\n\nOs preços já estão disponíveis no sistema para conferência.`;
        await sendWhatsApp("11966670314", notifyMsg, data.company_id);
      }

      // Evita conflito de DOM: primeiro para o loading, depois transiciona para sucesso
      setSaving(false);
      // Fecha a tela de confirmação para permitir que a tela de sucesso apareça
      setIsConfirming(false);
      
      // Aguarda o React finalizar o render antes de trocar a tela inteira
      requestAnimationFrame(() => {
        setSuccess(true);
        // Scroll somente após o React montar a tela de sucesso
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      setSaving(false);
      toast({
        title: "Falha ao enviar",
        description: "Não foi possível processar sua proposta no momento.",
        variant: "destructive"
      });
    }
  };

  // Wrapper class: applies dark class when browser is in dark mode
  const rootClasses = cn(
    "min-h-screen font-sans antialiased transition-colors duration-300",
    isDark ? "dark" : ""
  );

  if (showSplash || loading) {
    return (
      <div className={rootClasses}>
        <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4 transition-colors relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
            {/* Logo */}
            <div className="flex z-10 items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                <Box className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">
                Cotá<span className="text-blue-500">JA</span>
              </h1>
            </div>

            <p className="text-zinc-400 font-medium tracking-wide text-sm uppercase text-center mb-10">
              Módulo Fornecedor
            </p>

            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] animate-pulse">
                Preparando Ambiente Seguro
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={rootClasses}>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-6 transition-colors">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-3xl p-10 text-center shadow-xl shadow-zinc-200/50 dark:shadow-black/30 space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Acesso Indisponível</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{error}</p>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 h-12 rounded-xl font-bold transition-all active:scale-95">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isConfirming) {
    return (
      <div className={rootClasses}>
        <div className="relative min-h-screen w-full bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-6 md:p-12 transition-colors animate-in fade-in duration-500 overflow-hidden">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-3xl p-8 md:p-10 text-center shadow-xl shadow-zinc-200/50 dark:shadow-black/30 space-y-8 relative z-10">
            
            <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Confirme as Informações
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
                Antes de enviar sua cotação, verifique os dados de faturamento para os quais os pedidos serão emitidos.
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-700/50 text-left space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Dados para Faturamento</p>
                <p className="text-base font-bold text-zinc-800 dark:text-zinc-200">Novo Boi João Dias Mercadão LTDA</p>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">CNPJ: 63.195.471/0001-12</p>
              </div>

              <div className="h-px w-full bg-zinc-200/60 dark:bg-zinc-700/60" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Data da Cotação</p>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    {data?.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Prazo de Resposta</p>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    {data?.deadline ? new Date(data.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsConfirming(false)} 
                disabled={saving}
                className="w-full h-12 rounded-xl text-zinc-600 dark:text-zinc-300 font-bold border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Voltar e Editar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={saving}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" /> Confirmar e Enviar
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={rootClasses}>
        <div className="relative min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 md:p-12 transition-colors animate-in fade-in duration-500 overflow-hidden">
          
          {/* Top thick red brand accent directly on the screen edge */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-red-500 to-red-700" />

          {/* Main Content wrapper */}
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-10 relative z-10 -mt-16">
            
            {/* The Logo Container */}
            <div className="relative mx-auto w-56 sm:w-64 drop-shadow-2xl">
               <img 
                 src="/images/logo-joao-dias-transparent.png" 
                 alt="Logo Novo Boi João Dias" 
                 className="w-full h-auto object-contain mix-blend-multiply" 
               />
            </div>

            <div className="space-y-8 w-full">
              <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[15px] border border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Cotação Enviada com Sucesso</span>
              </div>

              <div className="space-y-6 px-4">
                <p className="text-zinc-700 font-medium text-lg leading-relaxed">
                  O <strong className="text-zinc-900 font-black text-xl block mt-1">Mercadão Novo Boi João Dias</strong> agradece a sua participação. 
                </p>
                <div className="w-12 h-1.5 bg-zinc-100 mx-auto rounded-full" />
                <p className="text-zinc-500 font-medium text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
                  Sua proposta foi registrada de forma segura no nosso sistema e a equipe de compras já foi notificada.
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer absolute to bottom */}
          <div className="absolute bottom-8 left-0 w-full px-6 flex flex-col items-center space-y-3">
             <div className="flex items-center justify-center gap-2 opacity-30">
               <div className="h-px w-8 bg-zinc-900" />
               <ShieldCheck className="h-4 w-4 text-zinc-900" />
               <div className="h-px w-8 bg-zinc-900" />
             </div>
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
               Desenvolvido por Marcelo
             </p>
             <a href="mailto:mgc.info.new@gmail.com" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
               mgc.info.new@gmail.com
             </a>
          </div>

        </div>
      </div>
    );
  }

  const itemsFilled = items.filter(i => {
    const val = i.valor_oferecido?.toString().replace(",", ".");
    return val && Number(val) > 0;
  }).length;

  return (
    <div className={rootClasses}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 transition-colors">
        {/* -- TOPBAR PREMIUM CLEAN -- */}
        <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 transition-colors">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                 <Quote className="h-4 w-4 fill-current" />
               </div>
               <div>
                 <h1 className="text-base font-extrabold leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
                   Olá, {data.supplier_name}!
                 </h1>
                 <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 block">Portal de Cotações</span>
               </div>
            </div>
            <div className="hidden sm:block">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/40">
                 <ShieldCheck className="h-3 w-3" />
                 Seguro
               </div>
            </div>
          </div>
        </header>

        {/* -- MAIN CONTENT -- */}
        <main className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
              Resumo dos Itens
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">
              Insira seus melhores preços abaixo.
            </p>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const isPkg = !!item.is_packaging;
              const hasHistory = isPkg && !!item.last_spec;
              const variants = (item.history_variants || []) as HistoryVariant[];
              const isExpanded = item._spec_expanded;
              const specConfirmed = item._spec_confirmed;

              // Custo por unidade em tempo real
              const pkgPrice = item.valor_oferecido ? parseFloat(String(item.valor_oferecido).replace(/\./g, '').replace(',', '.')) : 0;
              const pkgUnits = item.quantidade_unidades_estimada ? parseInt(String(item.quantidade_unidades_estimada), 10) : 0;
              const costPerUnit = pkgPrice > 0 && pkgUnits > 0 ? pkgPrice / pkgUnits : null;

              return (
              <div key={`${item.product_id}-${item._token}`} className="group bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 dark:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">
                    #{String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isPkg && <Badge className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 rounded-md px-1.5 h-5 text-[9px] font-black shadow-none">EMBALAGEM</Badge>}
                    <Badge className="bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600 rounded-md px-2 h-6 text-[10px] font-bold shadow-none">
                      {item.quantidade} {item.unidade}
                    </Badge>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 mb-3 leading-tight">
                  {item.product_name}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <div className="flex flex-col gap-1.5">
                    <div className="relative group/field">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 font-black text-sm group-focus-within/field:text-blue-600 dark:group-focus-within/field:text-blue-400 transition-colors">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={isPkg ? "Preço do Pacote/Fardo" : (item.unidade?.toUpperCase().startsWith('CX') ? "Preço do KG ou UN" : "Preço Unitário")}
                        className="w-full pl-9 h-10 text-sm font-bold bg-zinc-100/50 dark:bg-zinc-700/50 border-transparent rounded-lg focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-inner"
                        value={item.valor_oferecido || ""}
                        onChange={(e) => handlePriceChange(item.product_id, item._token, e.target.value)}
                      />
                    </div>
                    {!isPkg && item.unidade?.toUpperCase().startsWith('CX') && (
                      <>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-1">
                          * Informe o valor do QUILO ou da UNIDADE
                        </span>
                        <div className="relative group/qty">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 font-bold text-[10px] group-focus-within/qty:text-blue-600 dark:group-focus-within/qty:text-blue-400 transition-colors">QTD</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Qtd por caixa (opcional)"
                            className="w-full pl-11 h-9 text-xs font-bold bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 dark:focus:border-amber-400 transition-all outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            value={item.quantidade_por_caixa || ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setItems(items.map(it =>
                                (it.product_id === item.product_id && it._token === item._token)
                                  ? { ...it, quantidade_por_caixa: val }
                                  : it
                              ));
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    placeholder="Obs / Marca"
                    className="w-full h-10 px-3 bg-zinc-100/50 dark:bg-zinc-700/50 border-transparent rounded-lg focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-200 dark:focus:border-zinc-600 transition-all outline-none text-xs font-medium text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-inner"
                    value={item.observacoes || ""}
                    onChange={(e) => handleObsChange(item.product_id, item._token, e.target.value)}
                  />
                </div>

                {/* ==================== SEÇÃO EMBALAGEM: Detalhes + Smart Memory ==================== */}
                {isPkg && (
                  <div className="mt-3 border-t border-zinc-100 dark:border-zinc-700/50 pt-3">
                    {/* Botão de expandir/colapsar */}
                    <button
                      type="button"
                      onClick={() => toggleSpecExpanded(item.product_id, item._token)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors group/expand"
                    >
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Scale className="h-3 w-3" />
                        Detalhes da Embalagem
                        <span className="text-zinc-400 dark:text-zinc-500 font-medium normal-case tracking-normal">(recomendado)</span>
                      </span>
                      {isExpanded 
                        ? <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
                        : <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Banner de memória: dados da última cotação */}
                        {hasHistory && specConfirmed === undefined && (
                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                  Dados da última cotação preenchidos automaticamente
                                </p>
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                  Peso: {item.last_spec?.quantidade_venda || '—'}{item.last_spec?.unidade_venda || 'kg'} · 
                                  Qtd: {item.last_spec?.quantidade_unidades_estimada || '—'} unidades
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => confirmSpec(item.product_id, item._token, true)}
                                className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Continua igual
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmSpec(item.product_id, item._token, false)}
                                className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-1"
                              >
                                <RefreshCw className="h-3 w-3" /> Mudou
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Chips de variantes históricas (quando clicou "Mudou") */}
                        {specConfirmed === false && variants.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">Valores anteriores:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {variants.map((v, vi) => (
                                <button
                                  key={vi}
                                  type="button"
                                  onClick={() => applyVariant(item.product_id, item._token, v)}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors"
                                >
                                  {v.quantidade_venda}{v.unidade_venda} · {v.quantidade_unidades_estimada}un
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Campos editáveis (sempre visíveis quando expandido, editáveis quando não confirmado) */}
                        {(specConfirmed !== true || !hasHistory) && (
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* Peso do Pacote */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-1">
                                <Scale className="h-2.5 w-2.5" /> Peso (kg)
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Ex: 2.5"
                                className="w-full h-9 px-3 text-xs font-bold bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/40 dark:border-blue-800/30 rounded-lg focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400"
                                value={item.quantidade_venda || ''}
                                onChange={(e) => updateItemField(item.product_id, item._token, 'quantidade_venda', e.target.value)}
                              />
                            </div>
                            {/* Qtd de Unidades */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-1">
                                <Hash className="h-2.5 w-2.5" /> Qtd Unidades
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Ex: 800"
                                className="w-full h-9 px-3 text-xs font-bold bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/40 dark:border-blue-800/30 rounded-lg focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400"
                                value={item.quantidade_unidades_estimada || ''}
                                onChange={(e) => updateItemField(item.product_id, item._token, 'quantidade_unidades_estimada', e.target.value.replace(/\D/g, ''))}
                              />
                            </div>
                            {/* Unidade de Venda */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">Vende como</label>
                              <select
                                className="w-full h-9 px-2 text-xs font-bold bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/40 dark:border-blue-800/30 rounded-lg focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-zinc-900 dark:text-zinc-50 appearance-none"
                                value={item.unidade_venda || 'kg'}
                                onChange={(e) => updateItemField(item.product_id, item._token, 'unidade_venda', e.target.value)}
                              >
                                <option value="kg">KG</option>
                                <option value="un">Unidade</option>
                                <option value="fardo">Fardo</option>
                                <option value="pacote">Pacote</option>
                                <option value="bobina">Bobina</option>
                                <option value="rolo">Rolo</option>
                                <option value="caixa">Caixa</option>
                              </select>
                            </div>
                            {/* Espessura */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">Espessura (mm)</label>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Ex: 0.08"
                                className="w-full h-9 px-3 text-xs font-bold bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/40 dark:border-blue-800/30 rounded-lg focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400"
                                value={item.gramatura || ''}
                                onChange={(e) => updateItemField(item.product_id, item._token, 'gramatura', e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {/* Resumo quando confirmou "continua igual" */}
                        {specConfirmed === true && hasHistory && (
                          <div className="flex items-center justify-between px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {item.quantidade_venda}{item.unidade_venda} · {item.quantidade_unidades_estimada} unidades
                            </span>
                            <button
                              type="button"
                              onClick={() => confirmSpec(item.product_id, item._token, false)}
                              className="text-[9px] font-bold text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800"
                            >
                              Alterar
                            </button>
                          </div>
                        )}

                        {/* Cálculo de custo por unidade em tempo real */}
                        {costPerUnit !== null && (
                          <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 dark:bg-zinc-950 rounded-xl">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Custo por Unidade</span>
                              <span className="text-[9px] text-zinc-500 font-medium">R$ {pkgPrice.toFixed(2)} ÷ {pkgUnits} un</span>
                            </div>
                            <span className="text-lg font-black text-white tracking-tight">
                              R$ {costPerUnit.toFixed(4)}
                              <span className="text-[9px] font-black text-zinc-500 ml-0.5">/un</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>

          {/* -- FOOTER -- */}
          <footer className="pt-8 pb-10 text-center space-y-4">
             <div className="flex items-center justify-center gap-4 opacity-30">
                <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-700" />
                <Quote className="h-3 w-3 text-zinc-200 dark:text-zinc-700" />
                <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-700" />
             </div>
             <div>
               <p className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.3em]">Desenvolvido por Marcelo</p>
             </div>
             <a href="mailto:mgc.info.new@gmail.com" className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-blue-600 transition-colors">
                mgc.info.new@gmail.com
             </a>
          </footer>
        </main>

        {/* -- FLOATING ACTION BAR -- */}
        <div className="fixed bottom-0 left-0 right-0 p-3 z-50 pointer-events-none">
          <div className="max-w-2xl mx-auto bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-xl text-white p-2.5 rounded-2xl shadow-xl border border-white/5 pointer-events-auto flex items-center justify-between gap-3 animate-in slide-in-from-bottom-10">
            <div className="pl-3 hidden sm:flex flex-col">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Progresso</span>
              <span className="text-sm font-black text-blue-400">{itemsFilled} / {items.length} itens</span>
            </div>
            <Button 
              onClick={handleReview} 
              disabled={saving}
              className="flex-1 sm:flex-none h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {saving ? "Enviando..." : "Enviar Cotação"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
