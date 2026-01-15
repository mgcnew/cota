import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Upload, 
  Database, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileJson,
  HardDrive
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";

interface BackupData {
  version: string;
  exportedAt: string;
  companyId: string;
  companyName: string;
  data: {
    suppliers: any[];
    products: any[];
    quotes: any[];
    quote_items: any[];
    quote_suppliers: any[];
    quote_supplier_items: any[];
    orders: any[];
    order_items: any[];
    packaging_items: any[];
    packaging_quotes: any[];
    packaging_quote_items: any[];
    packaging_quote_suppliers: any[];
    packaging_supplier_items: any[];
    packaging_orders: any[];
    packaging_order_items: any[];
    activity_log: any[];
    notes: any[];
    shopping_list: any[];
    stock_sectors: any[];
    stock_counts: any[];
    stock_count_items: any[];
    whatsapp_config: any[];
    whatsapp_templates: any[];
  };
}

export function BackupRestore() {
  const companyQuery = useCompany();
  const company = companyQuery.data;
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tables = [
    { name: "suppliers", label: "Fornecedores" },
    { name: "products", label: "Produtos" },
    { name: "quotes", label: "Cotações" },
    { name: "quote_items", label: "Itens de Cotação" },
    { name: "quote_suppliers", label: "Fornecedores de Cotação" },
    { name: "quote_supplier_items", label: "Itens por Fornecedor" },
    { name: "orders", label: "Pedidos" },
    { name: "order_items", label: "Itens de Pedido" },
    { name: "packaging_items", label: "Itens de Embalagem" },
    { name: "packaging_quotes", label: "Cotações de Embalagem" },
    { name: "packaging_quote_items", label: "Itens Cotação Embalagem" },
    { name: "packaging_quote_suppliers", label: "Fornecedores Cotação Embalagem" },
    { name: "packaging_supplier_items", label: "Itens Fornecedor Embalagem" },
    { name: "packaging_orders", label: "Pedidos de Embalagem" },
    { name: "packaging_order_items", label: "Itens Pedido Embalagem" },
    { name: "activity_log", label: "Log de Atividades" },
    { name: "notes", label: "Notas" },
    { name: "shopping_list", label: "Lista de Compras" },
    { name: "stock_sectors", label: "Setores de Estoque" },
    { name: "stock_counts", label: "Contagens de Estoque" },
    { name: "stock_count_items", label: "Itens de Contagem" },
    { name: "whatsapp_config", label: "Config WhatsApp" },
    { name: "whatsapp_templates", label: "Templates WhatsApp" },
  ];

  const handleExport = async () => {
    if (!company?.id) {
      toast.error("Empresa não encontrada");
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      const backupData: BackupData = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        companyId: company.id,
        companyName: company.name,
        data: {
          suppliers: [],
          products: [],
          quotes: [],
          quote_items: [],
          quote_suppliers: [],
          quote_supplier_items: [],
          orders: [],
          order_items: [],
          packaging_items: [],
          packaging_quotes: [],
          packaging_quote_items: [],
          packaging_quote_suppliers: [],
          packaging_supplier_items: [],
          packaging_orders: [],
          packaging_order_items: [],
          activity_log: [],
          notes: [],
          shopping_list: [],
          stock_sectors: [],
          stock_counts: [],
          stock_count_items: [],
          whatsapp_config: [],
          whatsapp_templates: [],
        },
      };

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        setCurrentStep(`Exportando ${table.label}...`);
        setProgress(Math.round(((i + 1) / tables.length) * 100));

        try {
          const { data, error } = await supabase
            .from(table.name as any)
            .select("*");

          if (error) {
            console.warn(`Erro ao exportar ${table.name}:`, error);
          } else if (data) {
            (backupData.data as any)[table.name] = data;
          }
        } catch (err) {
          console.warn(`Tabela ${table.name} não acessível:`, err);
        }
      }

      // Criar e baixar arquivo
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-cotaja-${company.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setCurrentStep("Backup concluído!");
      toast.success("Backup exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar backup");
    } finally {
      setIsExporting(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!company?.id) {
      toast.error("Empresa não encontrada");
      return;
    }

    setIsImporting(true);
    setProgress(0);

    try {
      setCurrentStep("Lendo arquivo...");
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);

      // Validar estrutura do backup
      if (!backupData.version || !backupData.data) {
        throw new Error("Arquivo de backup inválido");
      }

      setCurrentStep("Validando dados...");
      setProgress(10);

      // Ordem de importação (respeitando foreign keys)
      const importOrder = [
        "suppliers",
        "products",
        "quotes",
        "quote_items",
        "quote_suppliers",
        "quote_supplier_items",
        "orders",
        "order_items",
        "packaging_items",
        "packaging_quotes",
        "packaging_quote_items",
        "packaging_quote_suppliers",
        "packaging_supplier_items",
        "packaging_orders",
        "packaging_order_items",
        "stock_sectors",
        "stock_counts",
        "stock_count_items",
        "notes",
        "shopping_list",
        "activity_log",
        "whatsapp_config",
        "whatsapp_templates",
      ];

      let imported = 0;
      let errors = 0;
      const errorDetails: { table: string; error: string }[] = [];

      for (let i = 0; i < importOrder.length; i++) {
        const tableName = importOrder[i];
        const tableData = (backupData.data as any)[tableName];
        const tableInfo = tables.find(t => t.name === tableName);

        if (!tableData || tableData.length === 0) {
          console.log(`[IMPORT] Tabela ${tableName} vazia, pulando...`);
          continue;
        }

        setCurrentStep(`Importando ${tableInfo?.label || tableName}...`);
        setProgress(10 + Math.round(((i + 1) / importOrder.length) * 85));

        // Atualizar company_id para a empresa atual e validar dados
        const dataToImport = tableData
          .map((item: any) => {
            const newItem = { ...item };
            
            // Garantir que company_id está correto
            if (newItem.company_id !== undefined) {
              newItem.company_id = company.id;
            }
            
            // Remover campos que podem causar conflito
            delete newItem.created_at;
            delete newItem.updated_at;
            
            return newItem;
          })
          .filter((item: any) => {
            // Filtrar itens sem ID (não podem ser inseridos)
            if (!item.id) {
              console.warn(`[IMPORT] Item sem ID em ${tableName}, removendo:`, item);
              return false;
            }
            return true;
          });

        if (dataToImport.length === 0) {
          console.log(`[IMPORT] Nenhum item válido em ${tableName}`);
          continue;
        }

        try {
          console.log(`[IMPORT] Iniciando importação de ${tableName} com ${dataToImport.length} registros`);
          
          // Dividir em batches de 100 registros para evitar timeout
          const batchSize = 100;
          let successCount = 0;
          
          for (let batchIndex = 0; batchIndex < dataToImport.length; batchIndex += batchSize) {
            const batch = dataToImport.slice(batchIndex, batchIndex + batchSize);
            console.log(`[IMPORT] Processando batch ${Math.floor(batchIndex / batchSize) + 1}/${Math.ceil(dataToImport.length / batchSize)} de ${tableName}`);
            
            // Tentar insert primeiro (mais rápido)
            const { error: insertError, data: insertData } = await supabase
              .from(tableName as any)
              .insert(batch, { 
                ignoreDuplicates: true 
              });

            if (insertError) {
              console.warn(`[IMPORT] Insert falhou para batch de ${tableName}, tentando upsert:`, insertError);
              
              // Se insert falhar, tentar upsert
              const { error: upsertError, data: upsertData } = await supabase
                .from(tableName as any)
                .upsert(batch, { 
                  onConflict: "id"
                });

              if (upsertError) {
                console.error(`[IMPORT] Erro ao importar batch de ${tableName}:`, upsertError);
                errorDetails.push({ 
                  table: `${tableName} (batch ${Math.floor(batchIndex / batchSize) + 1})`, 
                  error: upsertError.message || JSON.stringify(upsertError) 
                });
                errors++;
              } else {
                console.log(`[IMPORT] Upsert bem-sucedido para batch de ${tableName}: ${upsertData?.length || 0} registros`);
                successCount += batch.length;
              }
            } else {
              console.log(`[IMPORT] Insert bem-sucedido para batch de ${tableName}: ${insertData?.length || 0} registros`);
              successCount += batch.length;
            }
          }
          
          imported += successCount;
        } catch (err) {
          console.error(`[IMPORT] Erro ao importar ${tableName}:`, err);
          errorDetails.push({ 
            table: tableName, 
            error: err instanceof Error ? err.message : JSON.stringify(err) 
          });
          errors++;
        }
      }

      setProgress(100);
      setCurrentStep("Importação concluída!");

      if (errors > 0) {
        console.error("[IMPORT] Detalhes dos erros:", errorDetails);
        toast.warning(`Importação concluída com ${errors} erros. ${imported} registros importados.`);
      } else {
        toast.success(`Backup restaurado! ${imported} registros importados.`);
      }

      // Recarregar página para atualizar dados
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error("Erro ao importar backup. Verifique se o arquivo é válido.");
    } finally {
      setIsImporting(false);
      setProgress(0);
      setCurrentStep("");
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isProcessing = isExporting || isImporting;

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle>Backup e Restauração</CardTitle>
        </div>
        <CardDescription>
          Exporte seus dados para backup ou restaure de um arquivo anterior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status de progresso */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{currentStep}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
          </div>
        )}

        {/* Exportar */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Exportar Backup</h4>
              <p className="text-sm text-muted-foreground">
                Baixe todos os dados da sua empresa em um arquivo JSON
              </p>
            </div>
          </div>
          <Button 
            onClick={handleExport} 
            disabled={isProcessing}
            className="w-full"
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileJson className="mr-2 h-4 w-4" />
                Exportar Dados
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Importar */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Restaurar Backup</h4>
              <p className="text-sm text-muted-foreground">
                Importe dados de um arquivo de backup anterior
              </p>
            </div>
          </div>
          
          <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              A importação pode sobrescrever dados existentes. Faça um backup antes de continuar.
            </AlertDescription>
          </Alert>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button 
            onClick={handleImportClick} 
            disabled={isProcessing}
            className="w-full"
            variant="outline"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <HardDrive className="mr-2 h-4 w-4" />
                Selecionar Arquivo
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Dados incluídos no backup
          </h4>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>• Fornecedores</span>
            <span>• Produtos</span>
            <span>• Cotações</span>
            <span>• Pedidos</span>
            <span>• Embalagens</span>
            <span>• Estoque</span>
            <span>• Notas</span>
            <span>• Lista de Compras</span>
            <span>• Config WhatsApp</span>
            <span>• Log de Atividades</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BackupRestore;
