import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { MessageSquare, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  quote_id: string;
  supplier_id: string;
  phone_number: string;
  response_text: string;
  is_processed: boolean;
  received_at: string;
  supplier?: {
    name: string;
  };
}

interface CommunicationHubDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNotification?: (quoteId: string) => void;
}

export function CommunicationHubDrawer({
  open,
  onOpenChange,
  onSelectNotification
}: CommunicationHubDrawerProps) {
  const navigate = useNavigate();
  const { data: company } = useCompany();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && company) {
      loadNotifications();
    }
  }, [open, company]);

  const loadNotifications = async () => {
    if (!company) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('whatsapp_responses')
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .eq('company_id', company.id)
      .order('received_at', { ascending: false })
      .limit(20);

    if (!error) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  };

  const handleMarkAsProcessed = async (id: string) => {
    await supabase
      .from('whatsapp_responses')
      .update({ is_processed: true, processed_at: new Date().toISOString() })
      .eq('id', id);
    
    loadNotifications();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Central de WhatsApp
          </SheetTitle>
          <SheetDescription>
            Histórico recente de interações e respostas dos fornecedores.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Clock className="animate-spin h-6 w-6 text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nenhuma interação registrada ainda.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                    notif.is_processed 
                      ? "bg-background border-border" 
                      : "bg-green-50/30 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                  )}
                  onClick={() => {
                    if (onSelectNotification) {
                      onSelectNotification(notif.quote_id);
                    } else {
                      navigate(`/dashboard/compras?manageQuote=${notif.quote_id}`);
                      onOpenChange(false);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={notif.is_processed ? "secondary" : "outline"} className="gap-1">
                      {notif.is_processed ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {notif.is_processed ? "Processado" : "Pendente"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(notif.received_at), "HH:mm 'de' dd/MM", { locale: ptBR })}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-foreground">
                    {notif.supplier?.name || "Fornecedor Desconhecido"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    Respondeu à sua solicitação de cotação via WhatsApp.
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNotification?.(notif.quote_id);
                      }}
                    >
                      Ver Cotação
                      <ArrowRight className="h-3 w-3" />
                    </Button>

                    {!notif.is_processed && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-green-600 hover:text-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsProcessed(notif.id);
                        }}
                      >
                        Marcar como Visto
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
