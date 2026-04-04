import { useState, useMemo, useCallback, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle, Send, Phone, Building2, Package,
  CheckCircle2, AlertCircle, Copy, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { sendWhatsApp } from "@/lib/whatsapp-service";
import { generateWhatsAppMessage } from "@/lib/gemini";
import { supabase } from "@/integrations/supabase/client";
import type { PackagingQuoteDisplay } from "@/types/packaging";
import type { Supplier } from "@/hooks/useSuppliers";

const CLIENT_NAME = "Novo Boi João Dias";
const CLIENT_RAZAO = "Novo Boi Dias Mercadão Ltda";
const CLIENT_CNPJ = "63.195.471/0001-12";

interface WhatsappTabProps {
  quote: PackagingQuoteDisplay;
  availableSuppliers: Supplier[];
}

/**
 * Helper to generate or retrieve a short link
 */
async function getShortLink(tokens: string): Promise<string | null> {
  try {
    const slug = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: existing } = await supabase
      .from('short_links')
      .select('short_id')
      .eq('original_tokens', tokens)
      .single();
    
    if (existing) return existing.short_id;

    const { error } = await supabase
      .from('short_links')
      .insert([{ short_id: slug, original_tokens: tokens }]);

    if (error) throw error;
    return slug;
  } catch (err) {
    console.error("Erro ao encurtar link:", err);
    return null;
  }
}

interface SupplierRowProps {
  supplier: { supplierId: string; supplierName: string };
  fullSupplierData?: Supplier;
  items: { packagingName: string }[];
  isSent: boolean;
  onMarkSent: (id: string) => void;
}

function SupplierRow({ supplier, fullSupplierData, items, isSent, onMarkSent }: SupplierRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);

  const phone = fullSupplierData?.phone;
  const contact = fullSupplierData?.contact || supplier.supplierName;
  const hasPhone = !!phone;

  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const gen = async () => {
      const accessToken = supplier.supplierId;
      let msg = await generateWhatsAppMessage(contact, items, !!accessToken, true);
      
      if (accessToken) {
        const baseUrl = "https://cotaja.vercel.app";
        const { data: existing } = await supabase
          .from('short_links')
          .select('short_id')
          .eq('original_tokens', accessToken)
          .maybeSingle();

        if (existing?.short_id) {
          msg += `\n${baseUrl}/r/${existing.short_id}\n\n`;
        } else {
          msg += `\n${baseUrl}/responder/${accessToken}\n\n`;
        }
      }
      setMessage(msg);
    };
    gen();
  }, [contact, items, supplier.supplierId]);

  const handleSendWhatsApp = useCallback(async () => {
    if (!phone) return;
    setSending(true);
    try {
      const accessToken = supplier.supplierId; // Usamos o ID do fornecedor como token se não houver um específico
      let msg = await generateWhatsAppMessage(contact, items, !!accessToken, true);

      if (accessToken) {
        const baseUrl = "https://cotaja.vercel.app";
        const shortId = await getShortLink(accessToken);
        
        if (shortId) {
          msg += `\n${baseUrl}/r/${shortId}\n\n`;
        } else {
          msg += `\n${baseUrl}/responder/${accessToken}\n\n`;
        }
      }

      const result = await sendWhatsApp(phone, msg) as any;
      if (result?.success) {
        toast({ title: "✅ Enviado via Evolution API!", description: `Mensagem enviada para ${supplier.supplierName}.` });
        onMarkSent(supplier.supplierId);
      } else {
        // Fallback: abre no navegador
        const cleanPhone = phone.replace(/\D/g, "");
        const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, "_blank");
        onMarkSent(supplier.supplierId);
      }
    } catch (err) {
      console.error("Erro ao enviar:", err);
      toast({ title: "Erro ao enviar", description: "Tentando abrir WhatsApp manual...", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }, [phone, contact, items, supplier, onMarkSent]);

  const handleOpenWa = useCallback(async () => {
    if (!phone) return;
    const accessToken = supplier.supplierId;
    let msg = await generateWhatsAppMessage(contact, items, !!accessToken, true);
    
    if (accessToken) {
      const baseUrl = "https://cotaja.vercel.app";
      const shortId = await getShortLink(accessToken);
      if (shortId) {
        msg += `\n${baseUrl}/r/${shortId}\n\n`;
      } else {
        msg += `\n${baseUrl}/responder/${accessToken}\n\n`;
      }
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
    onMarkSent(supplier.supplierId);
  }, [phone, contact, items, supplier.supplierId, onMarkSent]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message);
    toast({ title: "Copiado!", description: "Mensagem copiada para a área de transferência." });
  }, [message]);

  return (
    <Card className={cn(
      "overflow-hidden border transition-all duration-200 shadow-sm rounded-xl",
      isSent
        ? "border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-900/10"
        : "border-border bg-card"
    )}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border",
            isSent
              ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
              : "bg-muted border-border text-muted-foreground"
          )}>
            {isSent ? <CheckCircle2 className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[13px] text-foreground truncate">{supplier.supplierName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {hasPhone ? (
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <Phone className="h-2.5 w-2.5" />{phone}
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />Sem telefone cadastrado
                </span>
              )}
              {isSent && (
                <Badge className="h-4 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[9px] font-bold px-1.5">
                  Enviado
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
            onClick={() => setExpanded(p => !p)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
            onClick={handleCopy}
            title="Copiar mensagem"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {hasPhone ? (
            <Button
              size="sm"
              onClick={handleSendWhatsApp}
              disabled={sending}
              className={cn(
                "h-8 px-3 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                isSent
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-[#25D366] hover:bg-[#20BA5A] text-white"
              )}
            >
              {sending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : isSent ? (
                <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Reenviar</>
              ) : (
                <><Send className="h-3.5 w-3.5 mr-1" />Enviar</>
              )}
            </Button>
          ) : (
            <Button
              size="sm" variant="outline"
              onClick={handleOpenWa}
              className="h-8 px-3 text-[11px] font-bold uppercase tracking-wider rounded-lg border-border text-muted-foreground"
              title="Abrir WhatsApp Web manualmente"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" />Abrir
            </Button>
          )}
        </div>
      </div>

      {/* Expanded preview */}
      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 bg-muted/20 space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {items.length} {items.length === 1 ? "item" : "itens"} nesta cotação
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item, i) => (
              <Badge key={i} variant="outline" className="text-[10px] font-medium border-border bg-background">
                {item.packagingName}
              </Badge>
            ))}
          </div>
          <Textarea
            value={message}
            readOnly
            rows={10}
            className="text-[11px] font-mono bg-background border-border resize-none text-foreground leading-relaxed"
          />
        </div>
      )}
    </Card>
  );
}

export function WhatsappTab({ quote, availableSuppliers }: WhatsappTabProps) {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleMarkSent = useCallback((id: string) => {
    setSentIds(prev => new Set(prev).add(id));
  }, []);

  const suppliersWithData = useMemo(() => {
    return quote.fornecedores.map(f => ({
      supplier: f,
      fullData: availableSuppliers.find(s => s.id === f.supplierId),
    }));
  }, [quote.fornecedores, availableSuppliers]);

  const sentCount = sentIds.size;
  const totalCount = quote.fornecedores.length;
  const progress = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  if (quote.fornecedores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-bold text-foreground">Nenhum fornecedor cadastrado</p>
        <p className="text-xs text-muted-foreground mt-1">Adicione fornecedores na aba "Editar" para enviar cotações.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="text-center pt-2 pb-1">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
            <MessageCircle className="h-7 w-7 text-[#25D366]" />
          </div>
          <h3 className="text-base font-black text-foreground tracking-tight">Enviar por WhatsApp</h3>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Solicite cotações de embalagens direto para cada fornecedor via WhatsApp.
          </p>
        </div>

        {/* Progress */}
        <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <div className="p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                sentCount === totalCount ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted"
              )}>
                <Send className={cn("h-4 w-4", sentCount === totalCount ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-foreground">
                  {sentCount} de {totalCount} enviados
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {sentCount === totalCount ? "Todos os fornecedores notificados" : `${totalCount - sentCount} aguardando envio`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-foreground">{progress}%</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-muted/50">
            <div
              className="h-1 bg-[#25D366] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>

        {/* Supplier list */}
        <div className="space-y-3">
          {suppliersWithData.map(({ supplier, fullData }) => (
            <SupplierRow
              key={supplier.supplierId}
              supplier={supplier}
              fullSupplierData={fullData}
              items={quote.itens}
              isSent={sentIds.has(supplier.supplierId)}
              onMarkSent={handleMarkSent}
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-muted-foreground pb-2">
          Fornecedores sem telefone cadastrado podem ser abertos manualmente no WhatsApp Web.
        </p>
      </div>
    </ScrollArea>
  );
}
