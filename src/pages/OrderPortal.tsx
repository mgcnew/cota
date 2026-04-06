import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  PackageSearch, 
  CheckCircle2, 
  ShoppingCart, 
  Calendar, 
  Clock, 
  AlertCircle,
  Hash,
  Truck,
  Building2,
  MapPin,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { designSystem as ds } from "@/styles/design-system";
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
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      
      try {
        const { data: rawData, error: orderErr } = await supabase
          .rpc("get_public_order_data", { p_order_id: id });

        if (orderErr) throw orderErr;
        if (!rawData) {
          setOrder(null);
          return;
        }

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
      const { data: successData, error } = await supabase
        .rpc("public_confirm_order", { p_order_id: id });
        
      if (error) throw error;
      if (!successData) throw new Error("Falha ao confirmar o pedido");
      
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

  // Splash Screen - Premium Minimalist Entry
  if (showSplash || loading) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-50 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full animate-pulse"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 backdrop-blur-sm">
            <PackageSearch className="h-10 w-10 text-brand animate-bounce" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest mb-2 uppercase">CotáJá</h1>
          <p className="text-zinc-500 font-medium text-sm tracking-wide">AUTENTICANDO PORTAL DO FORNECEDOR</p>
          
          <div className="mt-12 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full animate-[progress_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (!order) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">PEDIDO NÃO LOCALIZADO</h1>
        <p className="text-zinc-500 max-w-xs leading-relaxed">Este link pode ter expirado ou o pedido foi removido do sistema.</p>
        <Button className="mt-8 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl h-12 px-8 font-bold">
          Contatar Suporte
        </Button>
      </div>
    );
  }

  // Success Screen - Premium Achievement
  if (success || order.status === 'confirmado') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-brand/30">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="w-full max-w-md relative z-10 animate-in slide-in-from-bottom-12 fade-in duration-1000">
          <div className="flex flex-col items-center text-center space-y-6 mb-10">
            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(16,185,129,0.5)] border-4 border-zinc-950">
              <CheckCircle2 className="h-12 w-12 text-zinc-950" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                Confirmado
              </h1>
              <p className="text-zinc-400 font-medium tracking-wide">
                {success ? "Sua resposta foi enviada com sucesso!" : "Este pedido já foi processado."}
              </p>
            </div>
          </div>

          <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              {/* Header Info */}
              <div className="p-8 border-b border-zinc-800/50 bg-zinc-800/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20 text-brand">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest">Responsável</p>
                    <p className="text-sm font-bold text-white uppercase">Novo Boi João Dias</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-zinc-500 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Endereço de Entrega</p>
                      <p className="text-xs font-bold text-zinc-300">Rua Itapaiuna 2919 - Jardim Morumbi</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Branding */}
              <div className="p-10 flex flex-col items-center text-center bg-gradient-to-b from-transparent to-zinc-950/30">
                <div className="w-40 h-16 mb-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  <img src="/images/logo-joao-dias-transparent.png" alt="Novo Boi João Dias" className="w-full h-full object-contain" />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-3">Obrigado pela Parceria</h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">O registro de confirmação foi anexado ao fluxo logístico. Aguardamos o recebimento.</p>
              </div>

              {/* Status Footer */}
              <div className="px-8 py-5 bg-brand text-zinc-950 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest">Protocolo de Operação</span>
                <span className="text-xs font-black">#{order.id?.substring(0, 8).toUpperCase()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Order Details Interface - Premium Minimalist List
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden selection:bg-brand/30">
      {/* Background Textures */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-brand/5 to-transparent"></div>
        <div className="absolute top-[10%] left-[5%] w-px h-64 bg-gradient-to-b from-transparent via-brand/20 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 pt-10 pb-40">
        {/* Top Navigation / Brand */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <ShoppingCart className="h-6 w-6 text-brand relative z-10" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-1">Requisição de Compra</h3>
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tight">Novo Boi João Dias</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-800">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Portal Conectado</span>
          </div>
        </div>

        {/* Order Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-zinc-900/40 border-zinc-800/40 backdrop-blur-md rounded-3xl p-5 hover:border-brand/30 transition-all">
            <div className="space-y-4">
              <Hash className="w-4 h-4 text-brand" />
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nº do Pedido</p>
                <p className="text-xl font-black text-white lowercase">#{order.id?.substring(0, 8)}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/40 backdrop-blur-md rounded-3xl p-5 hover:border-brand/30 transition-all">
            <div className="space-y-4">
              <Truck className="w-4 h-4 text-brand" />
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Entrega Solicitada</p>
                <p className="text-xl font-black text-white">
                  {order.delivery_date ? order.delivery_date.split('-').reverse().join('/') : "--/--/--"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/40 backdrop-blur-md rounded-3xl p-5 hover:border-brand/30 transition-all">
            <div className="space-y-4">
              <Building2 className="w-4 h-4 text-brand" />
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Fornecedor</p>
                <p className="text-sm font-black text-white uppercase truncate">{supplier?.name || "CARREGANDO..."}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Items Section */}
        <div className="space-y-4 mb-12">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-4 mb-6 flex items-center gap-2">
            <ArrowRight className="w-3 h-3 text-brand" />
            Discriminação de Itens ({order.order_items?.length || 0})
          </h4>

          <div className="space-y-3">
            {order.order_items?.map((item: any, i: number) => {
              const qty = item.quantidade || item.quantity || 1;
              const price = Number(item.unit_price) || 0;
              const subtotal = qty * price;
              
              return (
                <div 
                  key={i} 
                  className="group relative flex items-center justify-between p-6 rounded-[2rem] bg-zinc-900/20 border border-zinc-800/40 hover:bg-zinc-900/40 hover:border-brand/30 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500"></div>
                  
                  <div className="flex-1 pr-6">
                    <p className="text-base font-black text-white uppercase italic group-hover:text-brand transition-colors duration-300">
                      {item.product_name}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700">
                        <span className="text-[10px] font-black text-zinc-400 uppercase">Qtd:</span>
                        <span className="text-xs font-black text-white">{qty} {item.unidade || item.unit || "un"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">UNITÁRIO:</span>
                        <span className="text-xs font-bold text-zinc-400">R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Subtotal Item</p>
                    <p className={cn(ds.typography.weight.extrabold, "text-lg text-white tabular-nums tracking-tighter")}>
                      R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Summary - Mega Card */}
        <div className="group relative rounded-[2.5rem] bg-brand p-10 shadow-[0_0_80px_-15px_rgba(var(--brand-rgb),0.3)] overflow-hidden transition-all duration-700 hover:scale-[1.01]">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 blur-[80px] rounded-full animate-pulse"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-2">
              <p className="text-[11px] font-black text-zinc-950 uppercase tracking-[0.4em]">Montante Total do Pedido</p>
              <h2 className="text-5xl font-black text-zinc-950 tracking-tighter italic">
                R$ {(order.total_value || order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="w-20 h-20 rounded-[1.5rem] bg-zinc-950 text-brand flex items-center justify-center shadow-xl">
              <ShoppingCart className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Observations */}
        {order.observations && (
          <div className="mt-8 p-8 rounded-[2rem] bg-zinc-900/60 border border-zinc-800 border-dashed relative">
            <div className="absolute -top-3 left-8 bg-zinc-950 px-3 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-brand" />
              <span className="text-[10px] font-black text-brand uppercase tracking-widest">Instruções Adicionais</span>
            </div>
            <p className="text-sm font-medium text-zinc-400 leading-relaxed italic">"{order.observations}"</p>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent z-40">
        <div className="max-w-xl mx-auto animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <Button 
            className="w-full h-16 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-black text-base shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] group transition-all duration-500 active:scale-95 space-x-3 uppercase tracking-tighter"
            onClick={handleConfirmOrder}
            disabled={submitting}
          >
            {submitting ? (
              <Clock className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
            )}
            <span>{submitting ? "SINCRONIZANDO..." : "Confirmar Recebimento do Pedido"}</span>
          </Button>
          <p className="text-[10px] text-center text-zinc-500 font-bold mt-4 uppercase tracking-widest opacity-60">Operação criptografada pela CotáJá</p>
        </div>
      </div>
    </div>
  );
}
