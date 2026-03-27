import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { getWhatsAppConfig, saveWhatsAppConfig } from "@/lib/whatsapp-service";
import { useCompany } from "@/hooks/useCompany";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WhatsAppConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppConfigDialog({ open, onOpenChange }: WhatsAppConfigDialogProps) {
  const { toast } = useToast();
  const { data: company } = useCompany();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  
  const [config, setConfig] = useState({
    api_url: '',
    api_key: '',
    instance_name: '',
  });

  useEffect(() => {
    if (open && company) {
      loadConfig();
    }
  }, [open, company]);

  const loadConfig = async () => {
    if (!company) return;
    
    setLoading(true);
    const existingConfig = await getWhatsAppConfig(company.id);
    
    if (existingConfig) {
      setConfig({
        api_url: existingConfig.api_url,
        api_key: existingConfig.api_key,
        instance_name: existingConfig.instance_name,
      });
      setIsConfigured(true);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!company) return;
    
    if (!config.api_url || !config.api_key || !config.instance_name) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const success = await saveWhatsAppConfig({
      company_id: company.id,
      ...config,
      is_active: true,
    });

    if (success) {
      toast({
        title: "✅ Configuração salva",
        description: "WhatsApp configurado com sucesso!",
      });
      setIsConfigured(true);
      onOpenChange(false);
    } else {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleTest = async () => {
    if (!config.api_url || !config.api_key || !config.instance_name) {
      toast({
        title: "Configure primeiro",
        description: "Preencha todos os campos antes de testar",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const response = await fetch(`${config.api_url}/instance/connectionState/${config.instance_name}`, {
        headers: {
          'apikey': config.api_key,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.state === 'open') {
          toast({
            title: "✅ Conexão OK",
            description: "WhatsApp conectado com sucesso!",
          });
        } else {
          toast({
            title: "⚠️ WhatsApp desconectado",
            description: "Escaneie o QR Code na Evolution API",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "❌ Erro de conexão",
          description: "Verifique a URL e API Key",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro ao testar",
        description: "Não foi possível conectar à Evolution API",
        variant: "destructive",
      });
    }
    setTesting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Configurar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Configure a integração com WhatsApp usando Evolution API
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Como configurar:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Instale a Evolution API (https://doc.evolution-api.com)</li>
                  <li>Crie uma instância no painel</li>
                  <li>Copie a URL da API, API Key e nome da instância</li>
                  <li>Cole as informações abaixo</li>
                  <li>Teste a conexão</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="api_url">URL da API *</Label>
                <Input
                  id="api_url"
                  placeholder="https://sua-evolution-api.com"
                  value={config.api_url}
                  onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: https://evolution.seudominio.com ou http://localhost:8080
                </p>
              </div>

              <div>
                <Label htmlFor="api_key">API Key *</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="Sua chave de API"
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="instance_name">Nome da Instância *</Label>
                <Input
                  id="instance_name"
                  placeholder="minha-instancia"
                  value={config.instance_name}
                  onChange={(e) => setConfig({ ...config, instance_name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nome da instância criada na Evolution API
                </p>
              </div>
            </div>

            {isConfigured && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  WhatsApp já configurado
                </span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || loading}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  "Testar Conexão"
                )}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Configuração"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
