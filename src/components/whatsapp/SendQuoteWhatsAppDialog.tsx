import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Send, CheckCircle2, XCircle, Settings } from "lucide-react";
import { sendQuoteViaWhatsApp, generateQuoteMessage, getWhatsAppConfig } from "@/lib/whatsapp";
import { useCompany } from "@/hooks/useCompany";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SendQuoteWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  suppliers: Array<{ id: string; name: string; phone?: string }>;
  onConfigClick: () => void;
}

export function SendQuoteWhatsAppDialog({
  open,
  onOpenChange,
  quoteId,
  suppliers,
  onConfigClick,
}: SendQuoteWhatsAppDialogProps) {
  const { toast } = useToast();
  const { data: company } = useCompany();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [sendResults, setSendResults] = useState<{
    sent: number;
    failed: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    if (open && company) {
      checkConfig();
      loadMessage();
      // Selecionar todos os fornecedores com telefone por padrão
      setSelectedSuppliers(
        suppliers.filter(s => s.phone).map(s => s.id)
      );
    }
  }, [open, company, quoteId]);

  const checkConfig = async () => {
    if (!company) return;
    const config = await getWhatsAppConfig(company.id);
    setIsConfigured(!!config);
  };

  const loadMessage = async () => {
    setLoading(true);
    try {
      const generatedMessage = await generateQuoteMessage(quoteId);
      setMessage(generatedMessage);
    } catch (error) {
      console.error('Erro ao gerar mensagem:', error);
    }
    setLoading(false);
  };

  const handleToggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleSelectAll = () => {
    const suppliersWithPhone = suppliers.filter(s => s.phone).map(s => s.id);
    setSelectedSuppliers(suppliersWithPhone);
  };

  const handleDeselectAll = () => {
    setSelectedSuppliers([]);
  };

  const handleSend = async () => {
    if (selectedSuppliers.length === 0) {
      toast({
        title: "Selecione fornecedores",
        description: "Selecione pelo menos um fornecedor",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem para enviar",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setSendResults(null);

    const result = await sendQuoteViaWhatsApp({
      quoteId,
      supplierIds: selectedSuppliers,
      customMessage: message,
    });

    setSendResults(result);

    if (result.success) {
      toast({
        title: "✅ Mensagens enviadas",
        description: `${result.sent} mensagem(ns) enviada(s) com sucesso!`,
      });
      
      // Fechar após 3 segundos se tudo foi enviado
      if (result.failed === 0) {
        setTimeout(() => {
          onOpenChange(false);
        }, 3000);
      }
    } else {
      toast({
        title: "❌ Erro ao enviar",
        description: "Não foi possível enviar as mensagens",
        variant: "destructive",
      });
    }

    setSending(false);
  };

  const suppliersWithPhone = suppliers.filter(s => s.phone);
  const suppliersWithoutPhone = suppliers.filter(s => !s.phone);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Enviar Cotação via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Envie a cotação automaticamente para os fornecedores via WhatsApp
          </DialogDescription>
        </DialogHeader>

        {!isConfigured ? (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>WhatsApp não configurado. Configure primeiro para enviar mensagens.</span>
              <Button size="sm" variant="outline" onClick={onConfigClick}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="space-y-4 pr-4">
              {/* Seleção de Fornecedores */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Fornecedores ({selectedSuppliers.length} selecionados)</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSelectAll}
                      disabled={suppliersWithPhone.length === 0}
                    >
                      Selecionar Todos
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDeselectAll}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {suppliersWithPhone.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum fornecedor com telefone cadastrado
                    </p>
                  ) : (
                    suppliersWithPhone.map((supplier) => (
                      <div key={supplier.id} className="flex items-center gap-2">
                        <Checkbox
                          id={supplier.id}
                          checked={selectedSuppliers.includes(supplier.id)}
                          onCheckedChange={() => handleToggleSupplier(supplier.id)}
                        />
                        <label
                          htmlFor={supplier.id}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {supplier.name}
                          <span className="text-muted-foreground ml-2">
                            ({supplier.phone})
                          </span>
                        </label>
                      </div>
                    ))
                  )}
                </div>

                {suppliersWithoutPhone.length > 0 && (
                  <Alert className="mt-2">
                    <AlertDescription className="text-xs">
                      ⚠️ {suppliersWithoutPhone.length} fornecedor(es) sem telefone:{" "}
                      {suppliersWithoutPhone.map(s => s.name).join(", ")}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Mensagem */}
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  rows={12}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite a mensagem..."
                  className="font-mono text-sm"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Personalize a mensagem antes de enviar
                </p>
              </div>

              {/* Resultados do Envio */}
              {sendResults && (
                <div className="space-y-2">
                  {sendResults.sent > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-400">
                        {sendResults.sent} mensagem(ns) enviada(s) com sucesso
                      </span>
                    </div>
                  )}

                  {sendResults.failed > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm text-red-700 dark:text-red-400">
                          {sendResults.failed} erro(s) ao enviar
                        </span>
                      </div>
                      {sendResults.errors.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-1 pl-4">
                          {sendResults.errors.map((error, i) => (
                            <div key={i}>• {error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={sending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || loading || selectedSuppliers.length === 0}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para {selectedSuppliers.length} fornecedor(es)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
