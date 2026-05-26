import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { MessageSquare, Clock, CheckCircle2, ArrowRight, Bell, AlertTriangle, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UrgentCotacao } from "@/hooks/useNotificationHub";

interface Notification {
  id: string;
  quote_id: string;
  supplier_id: string;
  phone_number: string;
  response_text: string;
  is_processed: boolean;
  received_at: string;
  supplier?: { name: string };
}

interface CommunicationHubDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappUnread?: number;
  urgentCotacoes?: UrgentCotacao[];
  onSelectNotification?: (quoteId: string) => void;
}

export function CommunicationHubDrawer({
  open,
  onOpenChange,
  whatsappUnread = 0,
  urgentCotacoes = [],
  onSelectNotification,
}: CommunicationHubDrawerProps) {
  const navigate = useNavigate();
  const { data: company } = useCompany();
  const [activeTab, setActiveTab] = useState<'cotacoes' | 'whatsapp'>('cotacoes');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && company && activeTab === 'whatsapp') {
      loadNotifications();
    }
  }, [open, company, activeTab]);

  // Default to cotacoes tab if there are urgent items, otherwise whatsapp
  useEffect(() => {
    if (open) {
      setActiveTab(urgentCotacoes.length > 0 ? 'cotacoes' : 'whatsapp');
    }
  }, [open]);

  const loadNotifications = async () => {
    if (!company) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_responses')
      .select('*, supplier:suppliers(name)')
      .eq('company_id', company.id)
      .order('received_at', { ascending: false })
      .limit(20);
    if (!error) setNotifications(data as Notification[]);
    setLoading(false);
  };

  const handleMarkAsProcessed = async (id: string) => {
    await supabase
      .from('whatsapp_responses')
      .update({ is_processed: true, processed_at: new Date().toISOString() })
      .eq('id', id);
    loadNotifications();
  };

  const handleNavigateToCotacao = (cotacaoId: string) => {
    navigate(`/dashboard/compras?tab=cotacoes&manageQuote=${cotacaoId}`);
    onOpenChange(false);
  };

  const prontas = urgentCotacoes.filter(c => c.urgencyType === 'pronta');
  const vencendo = urgentCotacoes.filter(c => c.urgencyType === 'vencendo');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[460px] p-0 flex flex-col">
        <SheetHeader className="p-5 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand" />
            Notificações
          </SheetTitle>
          <SheetDescription>
            Alertas de cotações e interações de fornecedores.
          </SheetDescription>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('cotacoes')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === 'cotacoes'
                ? "text-brand"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Cotações
            {urgentCotacoes.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-brand text-white text-[10px] font-bold">
                {urgentCotacoes.length}
              </span>
            )}
            {activeTab === 'cotacoes' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab('whatsapp'); if (!notifications.length) loadNotifications(); }}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === 'whatsapp'
                ? "text-brand"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            WhatsApp
            {whatsappUnread > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {whatsappUnread}
              </span>
            )}
            {activeTab === 'whatsapp' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
          </button>
        </div>

        <ScrollArea className="flex-1">
          {/* Cotações Tab */}
          {activeTab === 'cotacoes' && (
            <div className="p-4 space-y-3">
              {urgentCotacoes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhuma cotação precisa de atenção agora.</p>
                </div>
              ) : (
                <>
                  {prontas.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
                        Prontas para decisão — {prontas.length}
                      </p>
                      {prontas.map(c => (
                        <div
                          key={c.id}
                          className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900 cursor-pointer hover:shadow-sm transition-all"
                          onClick={() => handleNavigateToCotacao(c.id)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground line-clamp-1">{c.produto}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 flex-shrink-0">
                              Pronta
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] text-muted-foreground">Todos fornecedores responderam</span>
                            <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 text-emerald-600 hover:text-emerald-700 px-2">
                              Decidir <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {vencendo.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
                        Vencendo em 48h — {vencendo.length}
                      </p>
                      {vencendo.map(c => (
                        <div
                          key={c.id}
                          className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900 cursor-pointer hover:shadow-sm transition-all"
                          onClick={() => handleNavigateToCotacao(c.id)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground line-clamp-1">{c.produto}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 flex-shrink-0">
                              Vencendo
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] text-muted-foreground">Prazo: {c.dataFim}</span>
                            <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 text-amber-600 hover:text-amber-700 px-2">
                              Ver <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* WhatsApp Tab */}
          {activeTab === 'whatsapp' && (
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Clock className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhuma interação registrada ainda.</p>
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
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
