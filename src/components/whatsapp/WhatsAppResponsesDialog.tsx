import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppResponsesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
}

interface Response {
  id: string;
  supplier_id: string;
  phone_number: string;
  response_text: string;
  parsed_data: any;
  is_processed: boolean;
  received_at: string;
  supplier?: {
    name: string;
  };
}

export function WhatsAppResponsesDialog({
  open,
  onOpenChange,
  quoteId,
}: WhatsAppResponsesDialogProps) {
  const { toast } = useToast();
  const { data: company } = useCompany();
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);

  useEffect(() => {
    if (open && company) {
      loadResponses();
    }
  }, [open, company, quoteId]);

  const loadResponses = async () => {
    if (!company) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_responses')
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .eq('company_id', company.id)
      .eq('quote_id', quoteId)
      .order('received_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar respostas:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as respostas",
        variant: "destructive",
      });
    } else {
      setResponses(data || []);
    }
    setLoading(false);
  };

  const handleProcessResponse = async (response: Response) => {
    if (!response.parsed_data?.prices) {
      toast({
        title: "Sem preços detectados",
        description: "Não foi possível extrair preços desta mensagem",
        variant: "destructive",
      });
      return;
    }

    // Aqui você pode implementar a lógica para atualizar os preços na cotação
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de processamento automático em breve",
    });
  };

  const handleMarkAsProcessed = async (responseId: string) => {
    const { error } = await supabase
      .from('whatsapp_responses')
      .update({ is_processed: true, processed_at: new Date().toISOString() })
      .eq('id', responseId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar como processado",
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ Marcado como processado",
      });
      loadResponses();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Respostas do WhatsApp
          </DialogTitle>
          <DialogDescription>
            Respostas recebidas dos fornecedores para esta cotação
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma resposta recebida ainda
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              As respostas dos fornecedores aparecerão aqui automaticamente
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="space-y-4 pr-4">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">
                        {response.supplier?.name || "Fornecedor"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {response.phone_number}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {response.is_processed ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Processado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(response.received_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Mensagem */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">
                      {response.response_text}
                    </p>
                  </div>

                  {/* Preços Detectados */}
                  {response.parsed_data?.prices && response.parsed_data.prices.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                        Preços detectados:
                      </p>
                      <div className="space-y-1">
                        {response.parsed_data.prices.map((item: any, i: number) => (
                          <div key={i} className="text-sm text-green-700 dark:text-green-400">
                            {item.product && <span className="font-medium">{item.product}: </span>}
                            <span>R$ {item.price?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 justify-end">
                    {!response.is_processed && (
                      <>
                        {response.parsed_data?.prices && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessResponse(response)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Aplicar Preços
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsProcessed(response.id)}
                        >
                          Marcar como Processado
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
