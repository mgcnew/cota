import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Send, Quote, Mail, ExternalLink } from "lucide-react";
import { designSystem as ds } from "@/styles/design-system";
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
    // Permite apenas números, vírgula e ponto para facilitar a digitação brasileira
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
    
    const hasAnyPrice = items.some(i => i.valor_oferecido !== null && i.valor_oferecido !== "" && Number(i.valor_oferecido) > 0);
    
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
        .map(i => {
          // Converte o formato BR (10,50) para Number internacional (10.50) antes de salvar no banco
          const numericValue = typeof i.valor_oferecido === "string" 
            ? Number(i.valor_oferecido.replace(",", ".")) 
            : Number(i.valor_oferecido);

          return {
            product_id: i.product_id,
            valor_oferecido: numericValue,
            observacoes: i.observacoes || ""
          };
        });

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
        description: err.message || "Não foi possível processar sua resposta no momento.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Forçar sempre Modo Claro para clareza absoluta no link do WhatsApp
  const themeClasses = "light bg-[#F8FAFC] min-h-screen font-sans antialiased text-zinc-900";

  if (loading) {
    return (
      <div className={cn(themeClasses, "flex items-center justify-center p-4")}>
        <div className="text-center space-y-6 animate-in fade-in duration-700">
          <div className="relative">
             <div className="absolute inset-0 bg-brand/20 blur-2xl animate-pulse rounded-full" />
             <Loader2 className="h-12 w-12 animate-spin text-brand relative mx-auto" />
          </div>
          <p className="text-zinc-500 font-semibold tracking-tight">Preparando sua cotação segura...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn(themeClasses, "flex flex-col items-center justify-center p-6")}>
        <Card className="w-full max-w-sm border-red-100 shadow-2xl animate-in zoom-in-95 duration-300">
          <CardContent className="pt-10 pb-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className={cn("text-xl tracking-tighter", ds.typography.weight.bold)}>Acesso Indisponível</h2>
              <p className="text-zinc-500 text-sm">{error}</p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className={cn(themeClasses, "flex flex-col items-center justify-center p-6")}>
        <Card className="w-full max-w-md border-emerald-100 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <CardContent className="pt-12 pb-10 text-center space-y-8">
            <div className="relative mx-auto w-24 h-24">
               <div className="absolute inset-0 bg-emerald-500/20 blur-xl animate-pulse rounded-full" />
               <div className="relative w-full h-full bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                 <CheckCircle2 className="h-12 w-12" />
               </div>
            </div>
            <div className="space-y-3">
              <h2 className={cn("text-3xl tracking-tighter", ds.typography.weight.extrabold)}>
                Enviado com Sucesso!
              </h2>
              <p className="text-zinc-500 font-medium">
                Sua proposta foi registrada e já está disponível para o comprador. 
              </p>
            </div>
            <div className="pt-4">
              <p className="text-xs text-zinc-400">
                Você pode fechar esta aba agora. Obrigado!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Credit for Success State */}
        <div className="mt-12 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            Desenvolvido por Marcelo
          </p>
          <a 
            href="mailto:mgc.info.new@gmail.com" 
            className="inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline"
          >
            <Mail className="h-3 w-3" />
            mgc.info.new@gmail.com
          </a>
        </div>
      </div>
    );
  }

  const itemsWithPrice = items.filter(i => i.valor_oferecido && Number(i.valor_oferecido) > 0).length;

  return (
    <div className={themeClasses}>
      {/* ── HEADER PREMIUM ── */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
               <Quote className="h-5 w-5 fill-current" />
             </div>
             <div>
               <h1 className={cn("text-lg leading-tight tracking-tighter", ds.typography.weight.extrabold)}>
                 Olá, {data.supplier_name}!
               </h1>
               <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                 Portal de Cotações Online
               </p>
             </div>
          </div>
          <div className="hidden sm:block text-right">
             <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
               Link Seguro Ativo
             </Badge>
          </div>
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        
        <div className="space-y-2">
          <h2 className={cn("text-2xl tracking-tighter", ds.typography.weight.bold)}>
            Resumo dos Itens
          </h2>
          <p className="text-zinc-500 text-sm font-medium">
            Por favor, insira o valor unitário e marca dos itens abaixo.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <Card key={item.product_id} className={cn(ds.components.card.root, "overflow-hidden border-zinc-200")}>
              <div className="bg-zinc-50/80 px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Item #{index + 1}
                </span>
                <span className="text-xs font-bold text-brand bg-white border border-brand/10 px-2 py-0.5 rounded-md shadow-sm">
                  {item.quantidade} {item.unidade}
                </span>
              </div>
              <CardContent className="p-5 space-y-6">
                <h3 className={cn("text-lg leading-snug", ds.typography.weight.semibold)}>
                  {item.product_name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Valor Unitário (R$)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">R$</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        className="pl-10 h-12 text-lg font-bold border-zinc-200 focus:border-brand focus:ring-brand/20 transition-all rounded-xl"
                        value={item.valor_oferecido || ""}
                        onChange={(e) => handlePriceChange(item.product_id, e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Observações / Marca
                    </Label>
                    <Input
                      placeholder="Ex: Friboi / Maturatta"
                      className="h-12 bg-zinc-50/50 border-zinc-200 focus:bg-white transition-all rounded-xl"
                      value={item.observacoes || ""}
                      onChange={(e) => handleObsChange(item.product_id, e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── FOOTER DE CRÉDITOS ── */}
        <footer className="pt-16 pb-32 text-center space-y-4">
           <div className="w-12 h-px bg-zinc-200 mx-auto" />
           <div className="space-y-1">
             <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">
               Desenvolvido por
             </p>
             <h4 className="text-sm font-bold text-zinc-500 tracking-tight">
               Marcelo
             </h4>
           </div>
           <div className="flex flex-col items-center gap-3">
             <a 
               href="mailto:mgc.info.new@gmail.com" 
               className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-100 rounded-full text-xs font-semibold text-zinc-500 hover:text-brand hover:border-brand/20 hover:shadow-lg transition-all duration-300"
             >
               <Mail className="h-3.5 w-3.5" />
               mgc.info.new@gmail.com
             </a>
             <div className="flex items-center gap-4 text-zinc-300">
               <span className="text-[10px] font-medium uppercase tracking-widest">CotaJá System v2.0</span>
             </div>
           </div>
           
           <div className="pt-8">
              <p className="text-[10px] text-zinc-400 font-medium max-w-xs mx-auto leading-relaxed">
                Este é um sistema de uso restrito. Gosta do que vê? Entre em contato com o desenvolvedor acima.
              </p>
           </div>
        </footer>
      </main>

      {/* ── BOTÃO FLUTUANTE DE ENVIO ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-zinc-100 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-40 animate-in slide-in-from-bottom-full duration-500">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-6">
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Progresso</span>
            <span className="text-sm font-extrabold text-brand">
              {itemsWithPrice} de {items.length} itens preenchidos
            </span>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={saving}
            size="lg"
            className="w-full sm:w-auto font-bold h-14 px-10 bg-brand hover:bg-brand/90 text-white rounded-2xl shadow-xl shadow-brand/20 active:scale-95 transition-all text-lg gap-3"
          >
            {saving ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Send className="h-6 w-6" />
            )}
            {saving ? "Processando..." : "Enviar Cotação Final"}
          </Button>
        </div>
      </div>
    </div>
  );
}
