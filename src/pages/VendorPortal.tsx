import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";

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
        setError("Link inválido.");
        setLoading(false);
        return;
      }

      try {
        const { data: result, error: rpcError } = await supabase.rpc('get_vendor_quote_data', { 
          p_token: token 
        });

        if (rpcError) throw rpcError;

        if (!result) {
          throw new Error("Cotação não encontrada ou link expirado.");
        }

        const quoteData = result as unknown as QuoteData;
        
        if (quoteData.status === 'finalizada') {
          setError("Esta cotação já foi finalizada e não aceita mais respostas.");
        } else {
          setData(quoteData);
          setItems(quoteData.items || []);
        }
      } catch (err: any) {
        console.error("Erro ao carregar cotação:", err);
        setError(err.message || "Erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  const handlePriceChange = (productId: string, value: string) => {
    // Permitir apenas números e vírgula/ponto
    const numericValue = value.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
    
    setItems(items.map(item => 
      item.product_id === productId 
        ? { ...item, valor_oferecido: numericValue } 
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
    
    // Validar se tem pelo menos um preço
    const hasAnyPrice = items.some(i => i.valor_oferecido !== null && i.valor_oferecido !== "" && Number(i.valor_oferecido) > 0);
    
    if (!hasAnyPrice) {
      toast({
        title: "Nenhum preço informado",
        description: "Por favor, preencha o valor de pelo menos um item.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Limpar os dados para enviar apenas o necessário
      const payload = items
        .filter(i => i.valor_oferecido !== null && i.valor_oferecido !== "")
        .map(i => ({
          product_id: i.product_id,
          valor_oferecido: Number(i.valor_oferecido),
          observacoes: i.observacoes || ""
        }));

      const { error: saveError } = await supabase.rpc('save_vendor_quote_items', {
        p_token: token,
        p_items: payload
      });

      if (saveError) throw saveError;

      setSuccess(true);
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast({
        title: "Erro ao enviar",
        description: err.message || "Não foi possível enviar sua resposta.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-slate-500 font-medium">Carregando cotação...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-rose-100 shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Acesso Indisponível</h2>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-emerald-100 shadow-lg animate-in zoom-in-95 duration-500">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Enviado com Sucesso!</h2>
            <p className="text-slate-600">
              Sua proposta foi registrada em nosso sistema. Obrigado pela participação!
            </p>
            <p className="text-sm text-slate-400 mt-8">
              Você já pode fechar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Mobile Otimizado */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Cotação Online
            </span>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Olá, {data.supplier_name}!
            </h1>
            <p className="text-sm text-slate-600">
              Por favor, insira os valores unitários abaixo.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {items.map((item, index) => (
          <Card key={item.product_id} className="overflow-hidden shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold text-slate-800 leading-tight">
                  {index + 1}. {item.product_name}
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600 font-medium">
                Quantidade solicitada: <span className="text-slate-900 font-bold">{item.quantidade} {item.unidade}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`val-${item.product_id}`} className="text-slate-700 font-medium">
                    Valor Unitário (R$)
                  </Label>
                  <Input
                    id={`val-${item.product_id}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="text-lg font-medium h-12"
                    value={item.valor_oferecido || ""}
                    onChange={(e) => handlePriceChange(item.product_id, e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`obs-${item.product_id}`} className="text-slate-600">
                    Observações (Opicional, ex: marca)
                  </Label>
                  <Input
                    id={`obs-${item.product_id}`}
                    placeholder="Ex: Friboi / Peça de 2kg..."
                    className="h-12 bg-slate-50"
                    value={item.observacoes || ""}
                    onChange={(e) => handleObsChange(item.product_id, e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Floating Action Block */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block text-sm text-slate-500">
            {items.filter(i => i.valor_oferecido).length} de {items.length} itens com preço
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={saving}
            size="lg"
            className="w-full sm:w-auto font-bold h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Send className="h-5 w-5 mr-2" />
            )}
            {saving ? "Enviando..." : "Enviar Cotação Final"}
          </Button>
        </div>
      </div>
    </div>
  );
}
