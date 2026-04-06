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
  ShieldCheck,
  Building
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

  // -- SPLASH SCREEN (SYNC WITH VENDOR PORTAL) --
  if (showSplash || loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center z-50 transition-colors">
        <div className="flex flex-col items-center text-center animate-in fade-in duration-700 font-sans">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6">
            <PackageSearch className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase italic">CotáJá</h1>
          <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mt-2">Portal de Confirmação</p>
          
          <div className="mt-10 w-32 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-[progress_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  // -- ERROR STATE --
  if (!order) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center font-sans">
        <AlertCircle className="h-12 w-12 text-zinc-300 mb-4" />
        <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">Pedido não encontrado</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Este link expirou ou é inválido.</p>
      </div>
    );
  }

  // -- SUCCESS STATE (PREMIUM CLEAN) --
  if (success || order.status === 'confirmado') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md animate-in slide-in-from-bottom-6 fade-in duration-700">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg overflow-hidden border-4 border-white dark:border-zinc-900">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 italic uppercase tracking-tighter">Logística Sincronizada</h1>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Confirmação Processada</p>
            </div>
          </div>

          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-[2rem] overflow-hidden">
            <CardContent className="p-0">
               <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 space-y-6 text-left">
                  <div>
                    <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Empresa</span>
                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">NOVO BOI JOÃO DIAS MERCADÃO LTDA</p>
                    <p className="text-[10px] font-bold text-zinc-500 mt-0.5">CNPJ: 63.195.471/0001-12</p>
                  </div>
                  
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-0.5">Local de Entrega</span>
                        <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Rua Itapaiuna 2919 - Jardim Morumbi</p>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="p-10 flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-900">
                  <div className="w-40 h-16 mb-6 opacity-40 mix-blend-multiply dark:mix-blend-normal hover:opacity-100 transition-opacity">
                    <img src="/images/logo-joao-dias-transparent.png" alt="Novo Boi" className="w-full h-full object-contain" />
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest mb-2">Muito obrigado pela confirmação!</h4>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed px-4">O setor logístico foi notificado e os itens estão aguardando o recebimento oficial.</p>
               </div>

               <div className="px-8 py-4 bg-zinc-900 text-white flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span>Pedido #{order.id?.substring(0, 8)}</span>
                  <span className="text-blue-400">Status: OK</span>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // -- MAIN PORTAL INTERFACE --
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col transition-colors font-sans">
      {/* HEADER PREMIUM (SYNC WITH VENDORPORTAL) */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
               <ShoppingCart className="h-4 w-4" />
             </div>
             <div className="text-left">
               <h1 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                 Olá, {supplier?.name || "Fornecedor"}!
               </h1>
               <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mt-1">Confirmação de Pedido</span>
             </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/40">
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">Portal Seguro</span>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="max-w-2xl mx-auto w-full px-4 py-8 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
           <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-blue-500/30 transition-colors text-left">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                <Hash className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Identificador</p>
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 lowercase tracking-tight">#{order.id?.substring(0, 8)}</p>
              </div>
           </div>
           
           <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-blue-500/30 transition-colors text-left">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Previsão Entrega</p>
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                  {order.delivery_date ? order.delivery_date.split('-').reverse().join('/') : "--/--/--"}
                </p>
              </div>
           </div>
        </div>

        {/* ITEMS LIST */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight italic">Itens Solicitados</h3>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                {order.order_items?.length || 0} Itens
              </span>
           </div>

           <div className="space-y-2">
             {order.order_items?.map((item: any, i: number) => {
               const qty = item.quantidade || item.quantity || 1;
               const price = Number(item.unit_price) || 0;
               const subtotal = qty * price;
               return (
                 <div key={i} className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-blue-500/40 transition-all shadow-sm">
                   <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                   
                   <div className="flex-1 min-w-0 pr-4 text-left">
                     <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mb-1.5 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.product_name}
                     </h4>
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 min-w-[50px] py-0.5 rounded-md text-center border border-zinc-200 dark:border-zinc-700">
                          {qty} {item.unidade || item.unit || "un"}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">
                          @ R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                     </div>
                   </div>

                   <div className="text-right">
                      <p className="text-[9px] font-black text-zinc-200 dark:text-zinc-700 uppercase tracking-widest mb-0.5">Subtotal</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 tabular-nums font-sans">
                        R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                   </div>
                 </div>
               );
             })}
           </div>
        </section>

        {/* TOTAL SUMMARY CARD */}
        <section className="mt-10 bg-zinc-900 dark:bg-zinc-800 rounded-[1.5rem] p-8 text-white relative overflow-hidden group border border-white/5 shadow-xl">
           <div className="relative z-10 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-1">Montante do Pedido</p>
                <p className="text-3xl font-black italic tracking-tighter font-sans">
                  R$ {(order.total_value || order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
           </div>
        </section>

        {/* OBSERVATIONS (CONSISTENT STYLE) */}
        {order.observations && (
          <div className="mt-6 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 text-left">
            <h5 className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              Observações do Comprador
            </h5>
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 leading-relaxed italic">"{order.observations}"</p>
          </div>
        )}

        {/* FOOTER BRanding */}
        <footer className="mt-12 mb-10 text-center">
            <div className="flex items-center justify-center gap-3 opacity-20 mb-4">
              <div className="h-px w-10 bg-zinc-400" />
              <Building className="h-3 w-3 text-zinc-500" />
              <div className="h-px w-10 bg-zinc-400" />
            </div>
            <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]">Desenvolvido por Marcelo</p>
        </footer>
      </main>

      {/* FLOATING ACTION BAR (SYNC WITH VENDORPORTAL) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
        <div className="max-w-2xl mx-auto bg-zinc-950 dark:bg-zinc-900 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-white/5 pointer-events-auto flex items-center justify-between gap-4">
           <div className="hidden sm:flex flex-col pl-4 text-left">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Sinal de Recebimento</span>
              <span className="text-xs font-bold text-blue-400 italic">#{order.id?.substring(0, 8)}</span>
           </div>
           
           <Button 
             className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-tight transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
             onClick={handleConfirmOrder}
             disabled={submitting}
           >
             {submitting ? (
               <Clock className="w-5 h-5 animate-spin mr-2" />
             ) : (
               <CheckCircle2 className="w-5 h-5 mr-2" />
             )}
             {submitting ? "Confirmando..." : "Confirmar Recebimento do Pedido"}
           </Button>
        </div>
      </div>
    </div>
  );
}
