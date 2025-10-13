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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

interface Product {
  id: string;
  name: string;
  category: string;
  weight: string;
  lastQuotePrice: string;
  bestSupplier: string;
  quotesCount: number;
  lastUpdate: string;
  trend: "up" | "down" | "stable";
}

interface ImportProductsDialogProps {
  onProductsImported: (products: Product[]) => void;
  onCategoryAdded: (category: string) => void;
}

interface ParsedProduct {
  name: string;
  category: string;
  weight?: string;
  lastQuotePrice?: string;
  bestSupplier?: string;
  quotesCount?: number;
  lastUpdate?: string;
}

export function ImportProductsDialog({ onProductsImported, onCategoryAdded }: ImportProductsDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({
    total: 0,
    imported: 0,
    errors: 0,
    duplicates: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      {
        nome: "Coxa com Sobrecoxa",
        categoria: "Frango",
        peso: "500kg",
        ultimoPreco: "R$ 7.60",
        fornecedor: "Holambra",
        numCotacoes: 5,
        ultimaAtualizacao: "22/09/25"
      },
      {
        nome: "Filé de Frango",
        categoria: "Frango",
        peso: "300kg",
        ultimoPreco: "R$ 15.84",
        fornecedor: "Seara",
        numCotacoes: 3,
        ultimaAtualizacao: "22/09/25"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, "template_produtos.xlsx");

    toast({
      title: "Template baixado",
      description: "Use este arquivo como exemplo para importar seus produtos",
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

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Mapear colunas (flexível para diferentes formatos)
      const mapped = jsonData.map((row: any, index: number) => {
        const name = row.nome || row.name || row.produto || row.Nome || row.Name || row.Produto || '';
        const category = row.categoria || row.category || row.Categoria || row.Category || '';
        
        if (!name || !category) {
          validationErrors.push(`Linha ${index + 2}: Nome e categoria são obrigatórios`);
        }

        return {
          name: String(name).trim(),
          category: String(category).trim(),
          weight: row.peso || row.weight || row.Peso || row.Weight || 'N/A',
          lastQuotePrice: row.ultimoPreco || row.lastQuotePrice || row.preco || row.price || 'R$ 0.00',
          bestSupplier: row.fornecedor || row.supplier || row.bestSupplier || row.Fornecedor || 'N/A',
          quotesCount: parseInt(row.numCotacoes || row.quotesCount || row.cotacoes || '0') || 0,
          lastUpdate: row.ultimaAtualizacao || row.lastUpdate || row.data || new Date().toLocaleDateString('pt-BR')
        };
      });

      setParsedData(mapped.filter(p => p.name && p.category));
      
      if (mapped.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: "O arquivo não contém dados válidos",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Arquivo processado",
          description: `${mapped.filter(p => p.name && p.category).length} produtos encontrados`,
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
        title: "Nenhum produto para importar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);
    setImportStats({ total: parsedData.length, imported: 0, errors: 0, duplicates: 0 });

    try {
      console.log(`[IMPORT] Iniciando importação de ${parsedData.length} produtos`);

      // 1. Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // 2. Buscar produtos existentes para evitar duplicatas
      const { data: existingProducts } = await supabase
        .from('products')
        .select('name, category')
        .eq('user_id', user.id);

      const existingSet = new Set(
        existingProducts?.map(p => `${p.name.toLowerCase()}|${p.category.toLowerCase()}`) || []
      );

      // 3. Preparar dados para inserção (filtrar duplicatas)
      const productsToInsert = parsedData
        .filter(p => {
          const key = `${p.name.toLowerCase()}|${p.category.toLowerCase()}`;
          if (existingSet.has(key)) {
            setImportStats(prev => ({ ...prev, duplicates: prev.duplicates + 1 }));
            return false;
          }
          return true;
        })
        .map(p => ({
          name: p.name,
          category: p.category,
          weight: p.weight || null,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

      if (productsToInsert.length === 0) {
        toast({
          title: "Todos os produtos já existem",
          description: "Nenhum produto novo foi encontrado para importar",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // 4. Dividir em lotes
      const BATCH_SIZE = 100;
      const batches = [];
      for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
        batches.push(productsToInsert.slice(i, i + BATCH_SIZE));
      }

      console.log(`[IMPORT] Processando ${batches.length} lotes de até ${BATCH_SIZE} produtos`);

      // 5. Processar lotes sequencialmente
      let totalImported = 0;
      const errors: string[] = [];

      for (let i = 0; i < batches.length; i++) {
        try {
          const { data, error } = await supabase
            .from('products')
            .insert(batches[i])
            .select();

          if (error) throw error;

          totalImported += data?.length || 0;
          setImportStats(prev => ({ ...prev, imported: totalImported }));
          setImportProgress(((i + 1) / batches.length) * 100);

          console.log(`[IMPORT] Lote ${i + 1}/${batches.length} concluído: ${data?.length || 0} produtos`);

          // Pequeno delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error(`Erro no lote ${i + 1}:`, error);
          errors.push(`Lote ${i + 1} (${batches[i].length} produtos): ${error.message}`);
          setImportStats(prev => ({ ...prev, errors: prev.errors + batches[i].length }));
        }
      }

      console.log(`[IMPORT] Concluído: ${totalImported} importados, ${errors.length} erros, ${importStats.duplicates} duplicatas`);

    // 6. Invalidar queries para atualizar UI
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    await queryClient.invalidateQueries({ queryKey: ['product-categories'] });

    // Aguardar queries serem refetchadas
    await queryClient.refetchQueries({ queryKey: ['products'] });
    await queryClient.refetchQueries({ queryKey: ['product-categories'] });

    console.log('[IMPORT] Queries invalidadas e refetchadas');

      // 7. Feedback final
      if (errors.length === 0) {
        toast({
          title: "✅ Importação concluída com sucesso!",
          description: `${totalImported} produtos importados${importStats.duplicates > 0 ? ` (${importStats.duplicates} duplicatas ignoradas)` : ''}`,
        });
      } else {
        toast({
          title: "⚠️ Importação parcial",
          description: `${totalImported} produtos importados, ${errors.length} lotes com erro`,
          variant: "destructive"
        });
        console.error("Erros de importação:", errors);
      }

    // Reset e fechar com delay maior para garantir UI atualizada
    setTimeout(() => {
      setOpen(false);
      setFile(null);
      setParsedData([]);
      setValidationErrors([]);
      setImportProgress(0);
      setImportStats({ total: 0, imported: 0, errors: 0, duplicates: 0 });
    }, 3000);

    } catch (error: any) {
      console.error('Erro ao importar produtos:', error);
      toast({
        title: "❌ Erro na importação",
        description: error.message || "Não foi possível importar os produtos",
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] rounded-xl">
        <DialogHeader>
          <DialogTitle>Importar Produtos em Massa</DialogTitle>
          <DialogDescription>
            Importe múltiplos produtos de uma vez usando arquivos CSV ou Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
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
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
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
                            {parsedData.length} produtos prontos para importar
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {[...new Set(parsedData.map(p => p.category))].length} categorias
                        </Badge>
                      </div>

                      {parsedData.length > 1000 && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-amber-800 dark:text-amber-200">
                            <p className="font-medium">Grande volume detectado</p>
                            <p>Serão importados {parsedData.length} produtos em lotes de 100. Isso pode levar alguns minutos.</p>
                          </div>
                        </div>
                      )}

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
                          {parsedData.slice(0, 50).map((product, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-sm text-muted-foreground w-8">#{index + 1}</span>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                    {product.weight && product.weight !== 'N/A' && (
                                      <Badge variant="secondary" className="text-xs">{product.weight}</Badge>
                                    )}
                                  </div>
                                </div>
                                {product.lastQuotePrice && product.lastQuotePrice !== 'R$ 0.00' && (
                                  <span className="text-sm font-medium text-success">{product.lastQuotePrice}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {parsedData.length > 50 && (
                            <p className="text-center text-sm text-muted-foreground py-2">
                              e mais {parsedData.length - 50} produtos...
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
                <li>• <strong>nome</strong>: Nome do produto (obrigatório)</li>
                <li>• <strong>categoria</strong>: Categoria do produto (obrigatório)</li>
                <li>• <strong>peso</strong>: Peso/quantidade (opcional)</li>
                <li>• <strong>ultimoPreco</strong>: Último preço cotado (opcional)</li>
                <li>• <strong>fornecedor</strong>: Melhor fornecedor (opcional)</li>
                <li>• <strong>numCotacoes</strong>: Número de cotações (opcional)</li>
                <li>• <strong>ultimaAtualizacao</strong>: Data da última atualização (opcional)</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-4">
          {isProcessing && importProgress > 0 && (
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Importando produtos...</span>
                <span className="text-muted-foreground">
                  {importStats.imported}/{importStats.total} ({Math.round(importProgress)}%)
                </span>
              </div>
              <Progress value={importProgress} className="h-2" />
              {importStats.duplicates > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  ⚠️ {importStats.duplicates} produtos duplicados foram ignorados
                </p>
              )}
              {importStats.errors > 0 && (
                <p className="text-xs text-destructive">
                  ❌ {importStats.errors} produtos com erro
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={parsedData.length === 0 || isProcessing}
            >
              {isProcessing ? "Processando..." : `Importar ${parsedData.length} Produtos`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}