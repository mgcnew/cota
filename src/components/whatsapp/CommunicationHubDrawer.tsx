import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, AlertTriangle, CheckCircle2, ArrowRight, ClipboardCheck, MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UrgentCotacao, SupplierResponse } from "@/hooks/useNotificationHub";

interface CommunicationHubDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urgentCotacoes?: UrgentCotacao[];
  recentResponses?: SupplierResponse[];
  onSelectNotification?: (quoteId: string) => void;
}

export function CommunicationHubDrawer({
  open,
  onOpenChange,
  urgentCotacoes = [],
  recentResponses = [],
  onSelectNotification,
}: CommunicationHubDrawerProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cotacoes' | 'respostas'>('cotacoes');

  // Auto-select the tab with content when opening
  useEffect(() => {
    if (open) {
      setActiveTab(urgentCotacoes.length > 0 ? 'cotacoes' : 'respostas');
    }
  }, [open]);

  const handleNavigateToCotacao = (quoteId: string) => {
    navigate(`/dashboard/compras?tab=cotacoes&manageQuote=${quoteId}`);
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
            Alertas de cotações e respostas de fornecedores.
          </SheetDescription>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b shrink-0">
          <button
            onClick={() => setActiveTab('cotacoes')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === 'cotacoes' ? "text-brand" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Cotações
            {urgentCotacoes.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-brand text-white text-[10px] font-bold">
                {urgentCotacoes.length}
              </span>
            )}
            {activeTab === 'cotacoes' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />}
          </button>

          <button
            onClick={() => setActiveTab('respostas')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === 'respostas' ? "text-brand" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Respostas
            {recentResponses.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-brand text-white text-[10px] font-bold">
                {recentResponses.length}
              </span>
            )}
            {activeTab === 'respostas' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />}
          </button>
        </div>

        <ScrollArea className="flex-1">

          {/* Cotações Tab */}
          {activeTab === 'cotacoes' && (
            <div className="p-4 space-y-4">
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
                          onClick={() => handleNavigateToCotacao(c.id)}
                          className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900 cursor-pointer hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground line-clamp-1">{c.produto}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 flex-shrink-0">
                              Pronta
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
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
                          onClick={() => handleNavigateToCotacao(c.id)}
                          className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900 cursor-pointer hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground line-clamp-1">{c.produto}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 flex-shrink-0">
                              Vencendo
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
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

          {/* Respostas Tab */}
          {activeTab === 'respostas' && (
            <div className="p-4 space-y-3">
              {recentResponses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Nenhuma resposta recente</p>
                  <p className="text-xs text-muted-foreground">Respostas dos fornecedores nas últimas 48h aparecem aqui.</p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1 pb-1">
                    Últimas 48h — {recentResponses.length} resposta{recentResponses.length !== 1 ? 's' : ''}
                  </p>
                  {recentResponses.map(r => (
                    <div
                      key={r.id}
                      onClick={() => handleNavigateToCotacao(r.quoteId)}
                      className="p-4 rounded-xl border border-border bg-card hover:shadow-sm cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="h-3.5 w-3.5 text-brand" />
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">{r.supplierName}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(r.updatedAt), { locale: ptBR, addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pl-9">
                        <span className="text-[11px] text-muted-foreground truncate">{r.produto}</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 text-brand px-2 flex-shrink-0">
                          Ver <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
