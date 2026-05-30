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
  MapPin,
  ShieldCheck,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
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
        const notifyMsg = `✅ *Pedido Confirmado!*\n\nO fornecedor *${supplier.name}* acaba de confirmar o pedido *#${orderNum}* no portal.\n\nAcompanhe o status no painel administrativo.`;
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

  const hasWeighedItems = order?.order_items?.some(
    (it: any) => (it.unidade || it.unit || '').toUpperCase().includes('CX')
  );

  // -- SPLASH SCREEN --
  if (showSplash || loading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center text-center animate-in fade-in duration-700">
          <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-white shadow-xl mb-6">
            <PackageSearch className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">CotaPro</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Portal de Confirmação</p>

          <div className="mt-10 w-32 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full animate-[progress_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  // -- ERROR STATE --
  if (!order) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-6 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h1 className="text-xl font-extrabold text-foreground">Pedido não encontrado</h1>
        <p className="text-sm text-muted-foreground mt-1">Este link expirou ou é inválido.</p>
      </div>
    );
  }

  // -- SUCCESS STATE --
  if (success || order.status === 'confirmado') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in slide-in-from-bottom-6 fade-in duration-700">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg border-4 border-background">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Pedido Confirmado</h1>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Confirmação processada</p>
            </div>
          </div>

          <Card className="border-border dark:border-white/5 bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border dark:border-white/5 space-y-5 text-left">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Empresa</span>
                  <p className="text-sm font-bold text-foreground">NOVO BOI JOÃO DIAS MERCADÃO LTDA</p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">CNPJ: 63.195.471/0001-12</p>
                </div>

                <div className="p-4 bg-muted/40 rounded-xl border border-border dark:border-white/5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-brand uppercase tracking-widest block mb-0.5">Local de Entrega</span>
                      <p className="text-xs font-medium text-foreground">Rua Itapaiuna 2919 - Jardim Morumbi</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-40 h-16 mb-5 opacity-50 dark:opacity-70">
                  <img src="/images/logo-joao-dias-transparent.png" alt="Novo Boi" className="w-full h-full object-contain" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-2">Muito obrigado pela confirmação!</h4>
                <p className="text-xs text-muted-foreground leading-relaxed px-4">
                  O setor logístico foi notificado e os itens estão aguardando o recebimento oficial.
                </p>
              </div>

              <div className="px-6 py-4 bg-muted/40 border-t border-border dark:border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Pedido #{order.id?.substring(0, 8)}</span>
                <span className="text-emerald-600 dark:text-emerald-400">Confirmado</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // -- MAIN PORTAL INTERFACE --
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-border dark:border-white/5 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-sm">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-bold tracking-tight text-foreground leading-none">
                Olá, {supplier?.name || "Fornecedor"}!
              </h1>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mt-1">Confirmação de Pedido</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand/10 text-brand rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand/20">
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">Portal Seguro</span>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-2xl mx-auto w-full px-4 py-8 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border dark:border-white/5 p-5 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-brand/30 transition-colors text-left">
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-brand transition-colors">
              <Hash className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Identificador</p>
              <p className="text-sm font-bold text-foreground tracking-tight">#{order.id?.substring(0, 8)}</p>
            </div>
          </div>

          <div className="bg-card border border-border dark:border-white/5 p-5 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-brand/30 transition-colors text-left">
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-brand transition-colors">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Previsão de Entrega</p>
              <p className="text-sm font-bold text-foreground">
                {order.delivery_date ? order.delivery_date.split('-').reverse().join('/') : "--/--/--"}
              </p>
            </div>
          </div>
        </div>

        {/* ITEMS LIST */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-foreground">Itens Solicitados</h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-md">
              {order.order_items?.length || 0} itens
            </span>
          </div>

          <div className="space-y-2">
            {order.order_items?.map((item: any, i: number) => {
              const qty = item.quantidade || item.quantity || 1;
              const price = Number(item.unit_price) || 0;
              const isBox = (item.unidade || item.unit || '').toUpperCase().includes('CX');
              const subtotal = qty * price;
              return (
                <div key={i} className="group relative bg-card border border-border dark:border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-brand/40 transition-all shadow-sm">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl" />

                  <div className="flex-1 min-w-0 pr-4 text-left">
                    <h4 className="text-sm font-bold text-foreground mb-1.5 truncate group-hover:text-brand transition-colors">
                      {item.product_name}
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 min-w-[50px] py-0.5 rounded-md text-center border border-border dark:border-white/5">
                        {qty} {item.unidade || item.unit || "un"}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
                        @ R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {isBox && <span className="text-brand font-bold text-[9px]">(Preço por KG/UN)</span>}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-0.5">
                      {isBox ? "Peso a confirmar" : "Subtotal"}
                    </p>
                    {isBox ? (
                      <p className="text-[11px] font-bold text-brand">A confirmar</p>
                    ) : (
                      <p className="text-sm font-bold text-foreground tabular-nums">
                        R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TOTAL SUMMARY */}
        <section className="mt-8 rounded-2xl border border-border dark:border-white/5 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">
                {hasWeighedItems ? "Montante Estimado" : "Montante do Pedido"}
              </p>
              <p className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                {hasWeighedItems
                  ? "Valor sob medida"
                  : `R$ ${(order.total_value || order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </p>
              {hasWeighedItems && (
                <p className="text-[10px] font-medium text-muted-foreground mt-2 uppercase tracking-widest">
                  * Itens por KG serão pesados no recebimento
                </p>
              )}
            </div>
            <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-7 w-7 text-brand" />
            </div>
          </div>
        </section>

        {/* OBSERVATIONS */}
        {order.observations && (
          <div className="mt-6 p-5 rounded-2xl border border-border dark:border-white/5 bg-muted/30 text-left">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              Observações do Comprador
            </h5>
            <p className="text-xs font-medium text-foreground leading-relaxed">"{order.observations}"</p>
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-12 mb-10 text-center">
          <div className="flex items-center justify-center gap-3 opacity-30 mb-4">
            <div className="h-px w-10 bg-border" />
            <Building className="h-3 w-3 text-muted-foreground" />
            <div className="h-px w-10 bg-border" />
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.3em]">CotaPro</p>
        </footer>
      </main>

      {/* FLOATING ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
        <div className="max-w-2xl mx-auto bg-background/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-border dark:border-white/10 pointer-events-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col pl-3 text-left">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Pedido</span>
            <span className="text-xs font-bold text-brand">#{order.id?.substring(0, 8)}</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="flex-1 h-12 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-brand/20"
                disabled={submitting}
              >
                {submitting ? (
                  <Clock className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                )}
                {submitting ? "Confirmando..." : "Confirmar Pedido"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ao confirmar, o pedido <strong>#{order.id?.substring(0, 8)}</strong> será marcado como confirmado e o comprador será notificado. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmOrder}
                  className="bg-brand hover:bg-brand/90 text-white"
                >
                  Confirmar Pedido
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
