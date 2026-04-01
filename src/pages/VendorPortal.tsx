import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Send, Quote, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteItem {
  product_id: string;
  product_name: string;
  quantidade: number;
  unidade: string;
  valor_oferecido: string | number | null;
  observacoes: string | null;
  _token?: string;
  _quote_id?: string;
}

interface QuoteData {
  quote_id: string;
  supplier_id: string;
  status: string;
  supplier_name: string;
  company_id: string;
  items: QuoteItem[];
}

export default function VendorPortal() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<QuoteData | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [isDark, setIsDark] = useState(false);

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
        const tokens = token.split(',');
        const allItems: QuoteItem[] = [];
        let anyOpen = false;
        let mainQuoteData: QuoteData | null = null;
        let hasErrors = false;

        await Promise.all(tokens.map(async (tk) => {
          const { data: result, error: rpcError } = await supabase.rpc('get_vendor_quote_data', { p_token: tk });
          
          if (rpcError || !result) {
            console.error("Erro no token", tk, rpcError);
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
          }

          if (qd.status !== 'finalizada') {
            anyOpen = true;
            const formattedItems = (qd.items || []).map(item => ({
              ...item,
              _token: tk,
              _quote_id: qd.quote_id,
              valor_oferecido: item.valor_oferecido 
                ? Number(item.valor_oferecido).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : ""
            }));
            allItems.push(...formattedItems);
          }
        }));

        if (!mainQuoteData && hasErrors) {
          throw new Error("Cotações não encontradas. Verifique se o link está correto.");
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
      const tokens = token.split(',');
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

  const handleSubmit = async () => {
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

    setSaving(true);
    try {
      const tokens = token.split(',');

      await Promise.all(tokens.map(async (tk) => {
        const payload = items
          .filter(i => i._token === tk && i.valor_oferecido !== null && i.valor_oferecido !== "")
          .map(i => {
            // Converte "1.250,50" -> 1250.5
            const numValue = parseFloat(i.valor_oferecido!.toString().replace(/\./g, "").replace(",", "."));
            return {
              product_id: i.product_id,
              valor_oferecido: numValue,
              observacoes: i.observacoes || ""
            };
          });

        if (payload.length > 0) {
          const { error: saveError } = await supabase.rpc('save_vendor_quote_items', {
            p_token: tk,
            p_items: payload
          });

          if (saveError) throw saveError;
        }
      }));

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast({
        title: "Falha ao enviar",
        description: "Não foi possível processar sua proposta no momento.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Wrapper class: applies dark class when browser is in dark mode
  const rootClasses = cn(
    "min-h-screen font-sans antialiased transition-colors duration-300",
    isDark ? "dark" : ""
  );

  if (loading) {
    return (
      <div className={rootClasses}>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-4 transition-colors">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Carregando cotação segura...</p>
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
                        placeholder={item.unidade?.toUpperCase().startsWith('CX') ? "Preço do KG" : "Preço Unitário"}
                        className="w-full pl-9 h-10 text-sm font-bold bg-zinc-100/50 dark:bg-zinc-700/50 border-transparent rounded-lg focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-inner"
                        value={item.valor_oferecido || ""}
                        onChange={(e) => handlePriceChange(item.product_id, item._token, e.target.value)}
                      />
                    </div>
                    {item.unidade?.toUpperCase().startsWith('CX') && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-1">
                        * Informe o valor do QUILO
                      </span>
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
              onClick={handleSubmit} 
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
