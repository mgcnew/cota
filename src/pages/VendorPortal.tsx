import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Send, Quote, Mail, ShieldCheck, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendWhatsApp } from "@/lib/whatsapp-service";

// ... existing interfaces ... //
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
              const formattedItems = (qd.items || []).map(item => ({
                ...item,
                _token: tk,
                _quote_id: qd.quote_id,
                is_packaging: qd.is_packaging,
                valor_oferecido: item.valor_oferecido 
                  ? Number(item.valor_oferecido).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : "",
                quantidade_por_caixa: item.quantidade_por_caixa ? String(item.quantidade_por_caixa) : ""
              }));
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
            // Converte "1.250,50" -> 1250.5
            const numValue = parseFloat(i.valor_oferecido!.toString().replace(/\./g, "").replace(",", "."));
            const qtdCaixa = i.quantidade_por_caixa ? parseInt(i.quantidade_por_caixa, 10) : null;
            return {
              product_id: i.product_id,
              valor_oferecido: numValue,
              observacoes: i.observacoes || "",
              quantidade_por_caixa: (qtdCaixa && qtdCaixa > 0) ? qtdCaixa : null
            };
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
            {items.map((item, index) => (
              <div key={`${item.product_id}-${item._token}`} className="group bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 dark:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">
                    #{String(index + 1).padStart(2, '0')}
                  </span>
                  <Badge className="bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600 rounded-md px-2 h-6 text-[10px] font-bold shadow-none">
                    {item.quantidade} {item.unidade}
                  </Badge>
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
                        placeholder={item.unidade?.toUpperCase().startsWith('CX') ? "Preço do KG ou UN" : "Preço Unitário"}
                        className="w-full pl-9 h-10 text-sm font-bold bg-zinc-100/50 dark:bg-zinc-700/50 border-transparent rounded-lg focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-inner"
                        value={item.valor_oferecido || ""}
                        onChange={(e) => handlePriceChange(item.product_id, item._token, e.target.value)}
                      />
                    </div>
                    {item.unidade?.toUpperCase().startsWith('CX') && (
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
              </div>
            ))}
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
