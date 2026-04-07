import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { isWhatsAppConfigured, generatePackagingOrderMessage, sendWhatsAppMessage, getWhatsAppConfig } from "@/lib/whatsapp-service";
import { supabase } from "@/integrations/supabase/client";

interface ConfirmWhatsAppPackagingOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any | null; // Tipagem frouxa ou da sua interface de pedido
  onConfirm: () => void; // Dispara quando clica p/ alterar o status
}

export function ConfirmWhatsAppPackagingOrderDialog({
  open,
  onOpenChange,
  pedido,
  onConfirm,
}: ConfirmWhatsAppPackagingOrderDialogProps) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (open && pedido) {
      loadMessage();
    }
  }, [open, pedido]);

  const loadMessage = async () => {
    setLoading(true);
    try {
      if (!isWhatsAppConfigured()) {
        toast({ title: "Aviso", description: "O WhatsApp não está configurado. O pedido apenas mudará de status.", variant: "default" });
        onOpenChange(false);
        onConfirm(); // Só altera o status
        return;
      }
      
      const res = await generatePackagingOrderMessage(pedido!.id);
      setMessage(res.message);
      setPhone(res.phone || "");
    } catch (e: any) {
      toast({ title: "Erro ao gerar mensagem", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!phone) {
      toast({ title: "Erro", description: "Fornecedor sem telefone cadastrado", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: order } = await supabase.from('packaging_orders').select('company_id').eq('id', pedido!.id).single();
      const config = await getWhatsAppConfig(order!.company_id);
      
      const result = await sendWhatsAppMessage(config, phone, message, order!.company_id);
      if (result.success) {
        toast({ title: "✅ Pedido enviado pelo WhatsApp!" });
        onOpenChange(false);
        onConfirm(); // Status vira Enviado!
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Erro ao enviar via API", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Pedido de Embalagem p/ Fornecedor</DialogTitle>
          <DialogDescription>
            Ao enviar o pedido pelo WhatsApp, certifique-se de que o fornecedor confira os dados. O status mudará para <b>Confirmado</b> caso ele aceite no portal.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center flex-col items-center gap-2 p-6">
            <Loader2 className="animate-spin h-6 w-6 text-brand" />
            <span className="text-sm text-zinc-500">Gerando mensagem...</span>
          </div>
        ) : (
          <div className="py-4">
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[250px] resize-none text-sm font-mono whitespace-pre-wrap"
            />
            {!phone && (
              <p className="text-sm text-red-500 mt-2 font-medium">⚠️ O fornecedor deste pedido não tem telefone cadastrado.</p>
            )}
          </div>
        )}
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancelar</Button>
          <Button variant="secondary" onClick={() => { onOpenChange(false); onConfirm(); }} disabled={sending}>
            Apenas Mudar Status
          </Button>
          <Button onClick={handleSend} disabled={sending || loading || !phone}>
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
            Enviar WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
