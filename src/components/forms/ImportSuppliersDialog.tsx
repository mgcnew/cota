import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Download,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

interface Supplier {
  id: string;
  name: string;
  contact: string;
  limit: string;
  activeQuotes: number;
  totalQuotes: number;
  avgPrice: string;
  lastOrder: string;
  rating: number;
  status: "active" | "inactive" | "pending";
  phone?: string;
  email?: string;
  address?: string;
}

interface ImportSuppliersDialogProps {
  onSuppliersImported: (suppliers: Supplier[]) => void;
  trigger?: React.ReactNode;
}

interface ParsedSupplier {
  name: string;
  contact: string;
  limit?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: "active" | "inactive" | "pending";
  rating?: number;
}

export function ImportSuppliersDialog({ onSuppliersImported, trigger }: ImportSuppliersDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSupplier[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      {
        nome: "Holambra",
        contato: "João Silva",
        telefone: "(11) 99999-9999",
        email: "contato@holambra.com.br",
        endereco: "Av. Principal, 123 - São Paulo/SP",
        limite: "R$ 25.000",
        status: "active",
        avaliacao: 4.8
      },
      {
        nome: "Seara",
        contato: "Maria Santos",
        telefone: "(11) 88888-8888",
        email: "vendas@seara.com.br",
        endereco: "Rua Comercial, 456 - São Paulo/SP",
        limite: "R$ 50.000",
        status: "active",
        avaliacao: 4.6
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fornecedores");
    XLSX.writeFile(wb, "template_fornecedores.xlsx");

    toast({
      title: "Template baixado",
      description: "Use este arquivo como exemplo para importar seus fornecedores",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.csv') && 
        !selectedFile.name.endsWith('.xlsx') && 
        !selectedFile.name.endsWith('.xls')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo CSV ou Excel (.xlsx, .xls)",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    setIsProcessing(true);
    setValidationErrors([]);
    const errors: string[] = [];

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Mapear colunas (flexível para diferentes formatos)
      const mapped = jsonData.map((row: any, index: number) => {
        const name = row.nome || row.name || row.fornecedor || row.Nome || row.Name || row.Fornecedor || '';
        const contact = row.contato || row.contact || row.responsavel || row.Contato || row.Contact || row.Responsavel || '';
        
        if (!name) {
          errors.push(`Linha ${index + 2}: Nome é obrigatório`);
        }
        if (!contact) {
          errors.push(`Linha ${index + 2}: Contato/Responsável é obrigatório`);
        }

        // Processar status
        let status: "active" | "inactive" | "pending" = "active";
        const statusRaw = row.status || row.Status || row.situacao || row.Situacao || '';
        if (statusRaw) {
          const statusLower = String(statusRaw).toLowerCase();
          if (statusLower.includes('inativ') || statusLower === 'inactive') {
            status = 'inactive';
          } else if (statusLower.includes('pend') || statusLower === 'pending') {
            status = 'pending';
          }
        }

        // Processar rating
        const rating = parseFloat(row.avaliacao || row.rating || row.nota || row.Avaliacao || row.Rating || row.Nota || '0') || 0;

        return {
          name: String(name).trim(),
          contact: String(contact).trim(),
          phone: row.telefone || row.phone || row.tel || row.Telefone || row.Phone || '',
          email: row.email || row.Email || row['e-mail'] || row['E-mail'] || '',
          address: row.endereco || row.address || row.Endereco || row.Address || '',
          limit: row.limite || row.limit || row.Limite || row.Limit || 'R$ 0',
          status,
          rating: Math.min(Math.max(rating, 0), 5) // Entre 0 e 5
        };
      });

      setValidationErrors(errors);
      setParsedData(mapped.filter(p => p.name && p.contact));
      
      if (mapped.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: "O arquivo não contém dados válidos",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Arquivo processado",
          description: `${mapped.filter(p => p.name && p.contact).length} fornecedores encontrados`,
        });
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique se o arquivo está no formato correto",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "Nenhum fornecedor para importar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // 2. Get company_id
      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) {
        throw new Error("Empresa não encontrada");
      }

      // 3. Preparar dados para inserção
      const suppliersToInsert = parsedData.map(s => ({
        company_id: companyData.company_id,
        name: s.name,
        contact: s.contact,
        phone: s.phone || null,
        email: s.email || null,
        address: s.address || null,
        cnpj: null, // CNPJ não está no template, mas pode ser adicionado
      }));

      // 4. Inserir fornecedores no banco de dados
      const { data, error } = await supabase
        .from('suppliers')
        .insert(suppliersToInsert)
        .select();

      if (error) throw error;

      // 4. Invalidar queries para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });

      toast({
        title: "Importação concluída",
        description: `${data?.length || parsedData.length} fornecedores importados com sucesso`,
      });

      // Reset e fechar
      setOpen(false);
      setFile(null);
      setParsedData([]);
      setValidationErrors([]);
    } catch (error: any) {
      console.error('Erro ao importar fornecedores:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Não foi possível importar os fornecedores",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: "Ativo",
      inactive: "Inativo",
      pending: "Pendente"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      pending: "outline"
    };
    return variants[status as keyof typeof variants] || "outline";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] rounded-xl p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Importar Fornecedores</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                Importe múltiplos fornecedores usando arquivos CSV ou Excel
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Download Template */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <FileSpreadsheet className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">Precisa de um template?</p>
                    <p className="text-sm text-muted-foreground">
                      Baixe um arquivo de exemplo para facilitar a importação
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardContent className="p-6">
              {!file ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Selecione um arquivo</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Formatos aceitos: CSV, XLSX, XLS (máx. 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="supplier-file-upload"
                  />
                  <label htmlFor="supplier-file-upload">
                    <Button asChild>
                      <span>Selecionar Arquivo</span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetImport}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Preview */}
                  {parsedData.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                          <span className="font-medium">
                            {parsedData.length} fornecedores prontos para importar
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {parsedData.filter(s => s.status === 'active').length} ativos
                        </Badge>
                      </div>

                      {validationErrors.length > 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-medium text-destructive">Avisos de validação:</p>
                              {validationErrors.slice(0, 3).map((error, i) => (
                                <p key={i} className="text-sm text-destructive">{error}</p>
                              ))}
                              {validationErrors.length > 3 && (
                                <p className="text-sm text-destructive">
                                  e mais {validationErrors.length - 3} avisos...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <ScrollArea className="h-[200px] border rounded-lg">
                        <div className="p-3 space-y-2">
                          {parsedData.slice(0, 50).map((supplier, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-sm text-muted-foreground w-8">#{index + 1}</span>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{supplier.name}</p>
                                  <p className="text-xs text-muted-foreground">{supplier.contact}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant={getStatusVariant(supplier.status || 'active') as any} className="text-xs">
                                      {getStatusLabel(supplier.status || 'active')}
                                    </Badge>
                                    {supplier.phone && (
                                      <span className="text-xs text-muted-foreground">{supplier.phone}</span>
                                    )}
                                  </div>
                                </div>
                                {supplier.limit && supplier.limit !== 'R$ 0' && (
                                  <span className="text-sm font-medium">{supplier.limit}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {parsedData.length > 50 && (
                            <p className="text-center text-sm text-muted-foreground py-2">
                              e mais {parsedData.length - 50} fornecedores...
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 text-sm">Formato do arquivo:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>nome</strong>: Nome do fornecedor (obrigatório)</li>
                <li>• <strong>contato</strong>: Nome do responsável (obrigatório)</li>
                <li>• <strong>telefone</strong>: Telefone de contato (opcional)</li>
                <li>• <strong>email</strong>: E-mail de contato (opcional)</li>
                <li>• <strong>endereco</strong>: Endereço completo (opcional)</li>
                <li>• <strong>limite</strong>: Limite de crédito (opcional)</li>
                <li>• <strong>status</strong>: active, inactive ou pending (opcional)</li>
                <li>• <strong>avaliacao</strong>: Nota de 0 a 5 (opcional)</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-gray-200/60 dark:border-gray-700/40">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport}
            disabled={parsedData.length === 0 || isProcessing}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
          >
            {isProcessing ? "Processando..." : `Importar ${parsedData.length} Fornecedores`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}