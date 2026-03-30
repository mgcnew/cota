import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setError("Link de acesso inválido ou expirado.");
        setLoading(false);
        return;
      }

      try {
        const { data: result, error: rpcError } = await supabase.rpc('get_vendor_quote_data', { 
          p_token: token 
        });

        if (rpcError) throw rpcError;

        if (!result) {
          throw new Error("Cotação não encontrada. Verifique se o link está correto.");
        }

        const quoteData = result as unknown as QuoteData;
        
        if (quoteData.status === 'finalizada') {
          setError("Esta cotação já foi encerrada e não aceita mais propostas.");
        } else {
          setData(quoteData);
          setItems(quoteData.items || []);
        }
      } catch (err: any) {
        console.error("Erro ao carregar cotação:", err);
        setError(err.message || "Erro ao carregar os dados da cotação.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  const handlePriceChange = (productId: string, value: string) => {
    const cleanValue = value.replace(/[^0-9.,]/g, "");
    setItems(items.map(item => 
      item.product_id === productId 
        ? { ...item, valor_oferecido: cleanValue } 
        : item
    ));
  };

  const handleObsChange = (productId: string, value: string) => {
    setItems(items.map(item => 
      item.product_id === productId 
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
      const payload = items
        .filter(i => i.valor_oferecido !== null && i.valor_oferecido !== "")
        .map(i => ({
          product_id: i.product_id,
          valor_oferecido: Number(i.valor_oferecido?.toString().replace(",", ".")),
          observacoes: i.observacoes || ""
        }));

      const { error: saveError } = await supabase.rpc('save_vendor_quote_items', {
        p_token: token,
        p_items: payload
      });

      if (saveError) throw saveError;

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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-6 transition-colors">
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-3xl p-12 text-center shadow-2xl shadow-zinc-200/40 dark:shadow-black/40 space-y-8 animate-in zoom-in-95 duration-500">
            <div className="relative mx-auto w-24 h-24">
               <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/5 blur-2xl rounded-full" />
               <div className="relative w-full h-full bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-6">
                 <CheckCircle2 className="h-12 w-12" />
               </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50">
                Enviado!
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-lg leading-snug">
                Obrigado! Sua proposta foi enviada e o comprador ja foi notificado. 
              </p>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
              Aba segura - Brazil
            </p>
          </div>

          {/* Footer Credit for Success State */}
          <div className="mt-16 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 opacity-20">
              <div className="h-px w-8 bg-zinc-900 dark:bg-zinc-100" />
              <ShieldCheck className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
              <div className="h-px w-8 bg-zinc-900 dark:bg-zinc-100" />
            </div>
            <p className="text-[11px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.2em]">
              Desenvolvido por Marcelo
            </p>
            <a href="mailto:mgc.info.new@gmail.com" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
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
        <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 transition-colors">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-11 h-11 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20 dark:shadow-blue-500/10">
                 <Quote className="h-5 w-5 fill-current" />
               </div>
               <div>
                 <h1 className="text-lg font-extrabold leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
                   Olá, {data.supplier_name}!
                 </h1>
                 <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em] mt-1 block">Portal de Cotações</span>
               </div>
            </div>
            <div className="hidden sm:block">
               <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/40">
                 <ShieldCheck className="h-3.5 w-3.5" />
                 Acesso Seguro
               </div>
            </div>
          </div>
        </header>

        {/* -- MAIN CONTENT -- */}
        <main className="max-w-2xl mx-auto px-6 py-12 space-y-16">
          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
              Resumo dos Itens
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-lg">
              Insira seus melhores preços para os itens abaixo.
            </p>
          </div>

          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={item.product_id} className="group bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:shadow-zinc-200/40 dark:hover:shadow-black/30 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 dark:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.3em]">
                    Item #{String(index + 1).padStart(2, '0')}
                  </span>
                  <Badge className="bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600 rounded-full px-4 h-7 text-[11px] font-black uppercase shadow-none">
                    {item.quantidade} {item.unidade}
                  </Badge>
                </div>

                <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-10 leading-tight">
                  {item.product_name}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                      Valor Unitário (R$)
                    </Label>
                    <div className="relative group/field">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 font-black text-lg group-focus-within/field:text-blue-600 dark:group-focus-within/field:text-blue-400 transition-colors">R$</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        className="pl-14 h-16 text-2xl font-black bg-zinc-100/50 dark:bg-zinc-700/50 border-transparent rounded-3xl focus:bg-white dark:focus:bg-zinc-800 focus:ring-8 focus:ring-blue-600/5 dark:focus:ring-blue-400/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all shadow-inner shadow-zinc-100/50 dark:shadow-black/20 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                        value={item.valor_oferecido || ""}
                        onChange={(e) => handlePriceChange(item.product_id, e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                      Observações / Marca
                    </Label>
                    <Input
                      placeholder="Ex: Friboi"
                      className="h-16 px-6 bg-zinc-100/50 dark:bg-zinc-700/50 border-transparent rounded-3xl focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-200 dark:focus:border-zinc-600 transition-all shadow-inner shadow-zinc-100/50 dark:shadow-black/20 text-zinc-700 dark:text-zinc-200 font-semibold placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                      value={item.observacoes || ""}
                      onChange={(e) => handleObsChange(item.product_id, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* -- FOOTER -- */}
          <footer className="pt-24 pb-48 text-center space-y-8">
             <div className="flex items-center justify-center gap-6">
                <div className="h-px w-full max-w-[40px] bg-zinc-200 dark:bg-zinc-700" />
                <Quote className="h-4 w-4 text-zinc-200 dark:text-zinc-700" />
                <div className="h-px w-full max-w-[40px] bg-zinc-200 dark:bg-zinc-700" />
             </div>
             
             <div className="space-y-2">
               <p className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.4em]">DESENVOLVIDO POR</p>
               <h4 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter">Marcelo</h4>
             </div>

             <div className="flex flex-col items-center gap-6">
               <a href="mailto:mgc.info.new@gmail.com" className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-xs font-black text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600/20 dark:hover:border-blue-500/30 hover:shadow-2xl transition-all duration-300 group">
                  <Mail className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  mgc.info.new@gmail.com
               </a>
               <p className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">
                 &copy; {new Date().getFullYear()} CotaPro - Operação Segura
               </p>
             </div>
          </footer>
        </main>

        {/* -- FLOATING ACTION BAR -- */}
        <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
          <div className="max-w-2xl mx-auto bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-3xl text-white p-5 rounded-[40px] shadow-2xl shadow-zinc-900/40 dark:shadow-black/60 flex items-center justify-between gap-6 border border-white/10 dark:border-zinc-700/50 pointer-events-auto animate-in slide-in-from-bottom-20 duration-1000">
            <div className="pl-6 hidden sm:flex flex-col">
              <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Seu Progresso</span>
              <span className="text-lg font-black text-blue-400 dark:text-blue-300">{itemsFilled} de {items.length} itens</span>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={saving}
              className="flex-1 sm:flex-none h-16 px-12 bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-[28px] font-black tracking-tight text-lg shadow-xl shadow-blue-600/30 dark:shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {saving ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Send className="h-7 w-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              )}
              {saving ? "Enviando..." : "Enviar Cotação"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
