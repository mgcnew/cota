import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PackageSearch, CheckCircle2, ShoppingCart, Calendar, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { sendWhatsApp } from "@/lib/whatsapp-service";

export default function OrderPortal() {
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);

  useEffect(() => {
    // Hide splash screen after 2.5s minimum time
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      
      try {
        // Usa a RPC pública (SECURITY DEFINER) para contornar o RLS de usuários anônimos
        const { data: rawData, error: orderErr } = await supabase
          .rpc("get_public_order_data", { p_order_id: id });

        if (orderErr) throw orderErr;
        if (!rawData) {
          setOrder(null);
          return;
        }

        // A RPG retorna um JSON com as entidades
        const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        const orderData = parsed.order;
        const itemsData = parsed.order_items || [];
        const supplierData = parsed.supplier;

        if (orderData) {
          setOrder({ ...orderData, order_items: itemsData });
          if (supplierData) {
            setSupplier(supplierData);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar pedido:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadOrder();
  }, [id]);

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    try {
      // Usa a RPC pública
      const { data: successData, error } = await supabase
        .rpc("public_confirm_order", { p_order_id: id });
        
      if (error) throw error;
      if (!successData) throw new Error("Falha ao confirmar o pedido");
      
      // Notificar o setor de compras
      if (supplier?.name) {
        const orderNum = order.id?.substring(0, 8);
        const notifyMsg = `✅ *Pedido Confirmado!*\n\nO fornecedor *${supplier.name}* acaba de confirmar o recebimento do pedido *#${orderNum}* no portal.\n\nAcompanhe o status no painel administrativo.`;
        await sendWhatsApp("11966670314", notifyMsg, order.company_id);
      }

      setSuccess(true);
      toast.success("Pedido confirmado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao confirmar o pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  // Splash Screen Modal (Premium Feel)
  if (showSplash || loading) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
        <div className="flex flex-col items-center text-center max-w-sm px-6">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full scale-150 animate-pulse"></div>
            <div className="relative h-20 w-20 rounded-2xl bg-neutral-900 border border-brand/30 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(var(--brand-rgb),0.3)]">
              <PackageSearch className="h-10 w-10 text-brand" />
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">CotáJA</h1>
          <p className="text-sm text-neutral-400 font-medium mb-8">
             Caregando detalhes do seu pedido...
          </p>
          
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full animate-[progress_2s_ease-in-out_infinite]"></div>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
            <span>Ambiente Seguro</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-6 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pedido não encontrado</h1>
        <p className="text-muted-foreground">O link pode estar quebrado ou expirado.</p>
      </div>
    );
  }

  // Tela de Sucesso
  if (success || order.status === 'confirmado') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-brand/10 to-transparent dark:from-brand/5"></div>
          <div className="absolute -top-48 -right-48 w-96 h-96 bg-brand/20 blur-[120px] rounded-full"></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-700">
            {/* Header Success */}
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full scale-150"></div>
                <div className="h-20 w-20 rounded-full bg-brand shadow-[0_0_40px_-10px_rgba(var(--brand-rgb),0.5)] flex items-center justify-center relative z-10">
                  <CheckCircle2 className="h-10 w-10 text-brand-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  Pedido Confirmado
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                  {success ? "Recebemos sua confirmação!" : "Este pedido já foi confirmado."}
                </p>
              </div>
            </div>

            {/* Receipt Card */}
            <Card className="border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl relative overflow-hidden rounded-3xl">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand/80 via-brand to-brand/80"></div>
              <CardContent className="p-8">
                <div className="flex flex-col gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800/50 mb-6">
                  <div>
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Empresa</h3>
                    <p className="font-black text-zinc-900 dark:text-zinc-100">NOVO BOI JOÃO DIAS MERCADÃO LTDA</p>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">CNPJ: 63.195.471/0001-12</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                    <h3 className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Endereço de Entrega</h3>
                    <p className="text-sm font-bold text-orange-900 dark:text-orange-100">Rua Itapaiuna 2919 - Jardim Morumbi</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-500">Status</span>
                    <span className="text-sm font-black text-brand bg-brand/10 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Confirmado
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-500">Nº Pedido</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                      #{order.id?.substring(0, 8)}
                    </span>
                  </div>
                </div>

                <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-col items-center justify-center text-center">
                  <div className="w-48 h-auto mb-4 opacity-90 mix-blend-multiply dark:mix-blend-normal">
                    <img src="/images/logo-joao-dias-transparent.png" alt="Novo Boi João Dias" className="w-full h-auto object-contain" />
                  </div>
                  <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight mb-2">Muito obrigado pela parceria!</h4>
                  <p className="text-xs text-zinc-500 font-medium">Seu pedido foi registrado em nosso sistema e será processado para recebimento.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Lista de itens do Pedido
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-[250px] bg-gradient-to-b from-brand/10 to-transparent dark:from-brand/5"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 w-full max-w-2xl mx-auto pb-32">
        <div className="flex flex-col items-center text-center space-y-4 mb-8 pt-4">
          <div className="h-16 w-16 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-brand/10 border border-brand/20 flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Novo Pedido de Compra
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Novo Boi João Dias</p>
          </div>
        </div>

        <Card className="border-border/50 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl overflow-hidden rounded-[2rem]">
          <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-muted/20">
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Para o Fornecedor</p>
              <h3 className="font-bold text-lg">{supplier?.name || "Fornecedor"}</h3>
            </div>
            {order.delivery_date && (
               <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-xl border border-border/50">
                 <Calendar className="h-4 w-4 text-brand" />
                 <div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Entrega Solicitada</p>
                    <p className="text-xs font-bold">{order.delivery_date.split('-').reverse().join('/')}</p>
                 </div>
               </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-brand" />
              Itens do Pedido ({order.order_items?.length || 0})
            </h4>

            <div className="space-y-3">
              {order.order_items?.map((item: any, i: number) => {
                const qty = item.quantidade || item.quantity || 1;
                const price = Number(item.unit_price) || 0;
                const subtotal = qty * price;
                return (
                  <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-border/50 shadow-sm hover:border-brand/40 transition-all group">
                    <div className="min-w-0 pr-4 flex-1">
                      <p className="font-bold text-sm text-foreground truncate group-hover:text-brand transition-colors">{item.product_name}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          {qty} {item.unidade || item.unit || "un"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          x R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 opacity-60">Subtotal</p>
                      <p className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                        R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Summary */}
            <div className="mt-8 p-6 rounded-[2rem] bg-zinc-900 dark:bg-zinc-800 border-2 border-brand/20 shadow-2xl shadow-brand/10 group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-brand/20 transition-all duration-700"></div>
              <div className="relative z-10 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">Total do Pedido</p>
                  <p className="text-2xl font-black text-white tracking-tight">
                    R$ {(order.total_value || order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/40 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-6 w-6 text-brand-foreground" />
                </div>
              </div>
            </div>

            {order.observations && (
              <div className="mt-6 p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30">
                <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Observações do Comprador
                </p>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200 leading-relaxed">{order.observations}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20">
        <div className="max-w-2xl mx-auto">
          <Button 
            className="w-full h-14 rounded-2xl text-base font-black shadow-lg shadow-brand/20 transition-all uppercase tracking-wider"
            onClick={handleConfirmOrder}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Clock className="w-5 h-5 mr-3 animate-pulse" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-3" />
                Confirmar Pedido Recebido
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
