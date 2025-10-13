/**
 * =====================================================
 * COMPONENTE DE GERENCIAMENTO DE DUPLICATAS
 * =====================================================
 * Interface administrativa para detectar e remover
 * registros duplicados do sistema
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Trash2, 
  Eye, 
  BarChart3,
  Database,
  Users,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DuplicateRemover, 
  DuplicateStats, 
  ProductDuplicate, 
  SupplierDuplicate, 
  CleanupResult,
  createDuplicateRemover 
} from '@/utils/duplicateRemover';

export function DuplicateManager() {
  const { toast } = useToast();
  const [remover, setRemover] = useState<DuplicateRemover | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DuplicateStats[]>([]);
  const [productDuplicates, setProductDuplicates] = useState<ProductDuplicate[]>([]);
  const [supplierDuplicates, setSupplierDuplicates] = useState<SupplierDuplicate[]>([]);
  const [cleanupResults, setCleanupResults] = useState<CleanupResult[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Inicializar o remover
  useEffect(() => {
    const initRemover = async () => {
      try {
        const duplicateRemover = await createDuplicateRemover();
        setRemover(duplicateRemover);
        await loadData(duplicateRemover);
      } catch (error) {
        console.error('Erro ao inicializar remover:', error);
        toast({
          title: "Erro",
          description: "Não foi possível inicializar o sistema de duplicatas",
          variant: "destructive",
        });
      }
    };

    initRemover();
  }, []);

  const loadData = async (duplicateRemover?: DuplicateRemover) => {
    if (!duplicateRemover && !remover) return;
    
    const activeRemover = duplicateRemover || remover!;
    setLoading(true);

    try {
      const [statsData, productData, supplierData] = await Promise.all([
        activeRemover.getStats(),
        activeRemover.detectProductDuplicates(),
        activeRemover.detectSupplierDuplicates()
      ]);

      setStats(statsData);
      setProductDuplicates(productData);
      setSupplierDuplicates(supplierData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de duplicatas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDryRun = async () => {
    if (!remover) return;

    setLoading(true);
    try {
      const results = await remover.cleanupAllDuplicates(true);
      setCleanupResults(results);
      
      toast({
        title: "Simulação concluída",
        description: "Verifique os resultados na aba 'Resultados'",
      });
    } catch (error) {
      console.error('Erro na simulação:', error);
      toast({
        title: "Erro",
        description: "Erro durante a simulação de limpeza",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActualCleanup = async () => {
    if (!remover) return;

    const confirmed = window.confirm(
      '⚠️ ATENÇÃO: Esta ação irá remover permanentemente os registros duplicados. ' +
      'Certifique-se de ter executado a simulação primeiro. Continuar?'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const results = await remover.cleanupAllDuplicates(false);
      setCleanupResults(results);
      
      // Recarregar dados após limpeza
      await loadData();
      
      toast({
        title: "Limpeza concluída",
        description: "Duplicatas removidas com sucesso",
      });
    } catch (error) {
      console.error('Erro na limpeza:', error);
      toast({
        title: "Erro",
        description: "Erro durante a limpeza real",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalIssues = () => {
    return stats.reduce((sum, stat) => sum + stat.potential_removals, 0);
  };

  const getStatusColor = (count: number) => {
    if (count === 0) return "bg-green-500";
    if (count < 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!remover) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Carregando sistema de duplicatas...
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalIssues = getTotalIssues();

  return (
    <div className="space-y-6">
      {/* Header com estatísticas gerais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gerenciador de Duplicatas
              </CardTitle>
              <CardDescription>
                Detecte e remova registros duplicados do sistema
                {lastUpdate && (
                  <span className="block text-xs mt-1">
                    Última atualização: {lastUpdate.toLocaleString('pt-BR')}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button 
              onClick={() => loadData()} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.table_name} className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {stat.table_name === 'products' ? (
                    <Package className="h-5 w-5 mr-2" />
                  ) : (
                    <Users className="h-5 w-5 mr-2" />
                  )}
                  <h3 className="font-medium capitalize">{stat.table_name}</h3>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{stat.total_records}</div>
                  <div className="text-sm text-muted-foreground">Total de registros</div>
                  <Badge 
                    className={`${getStatusColor(stat.potential_removals)} text-white`}
                  >
                    {stat.potential_removals} duplicatas
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {totalIssues > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{totalIssues} registros duplicados</strong> encontrados no sistema.
                Execute uma simulação para ver o que será removido.
              </AlertDescription>
            </Alert>
          )}

          {totalIssues === 0 && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sistema limpo!</strong> Nenhuma duplicata encontrada.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Ações principais */}
      <Card>
        <CardHeader>
          <CardTitle>Ações de Limpeza</CardTitle>
          <CardDescription>
            Execute sempre uma simulação antes da limpeza real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={handleDryRun}
              disabled={loading}
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Simular Limpeza
            </Button>
            
            <Button 
              onClick={handleActualCleanup}
              disabled={loading || totalIssues === 0}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Executar Limpeza Real
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes em abas */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">
            Produtos ({productDuplicates.length})
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            Fornecedores ({supplierDuplicates.length})
          </TabsTrigger>
          <TabsTrigger value="results">
            Resultados ({cleanupResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Duplicados</CardTitle>
              <CardDescription>
                Produtos com mesmo nome e categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productDuplicates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  Nenhum produto duplicado encontrado
                </div>
              ) : (
                <div className="space-y-4">
                  {productDuplicates.map((duplicate, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{duplicate.name}</h4>
                        <Badge variant="destructive">
                          {duplicate.duplicate_count} duplicatas
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <strong>Categoria:</strong> {duplicate.category}
                        </div>
                        <div>
                          <strong>Mais antigo:</strong> {formatDate(duplicate.oldest_created_at)}
                        </div>
                        <div>
                          <strong>Mais recente:</strong> {formatDate(duplicate.newest_created_at)}
                        </div>
                        <div>
                          <strong>Será mantido:</strong> {duplicate.newest_id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fornecedores Duplicados</CardTitle>
              <CardDescription>
                Fornecedores com mesmo nome e CNPJ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supplierDuplicates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  Nenhum fornecedor duplicado encontrado
                </div>
              ) : (
                <div className="space-y-4">
                  {supplierDuplicates.map((duplicate, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{duplicate.name}</h4>
                        <Badge variant="destructive">
                          {duplicate.duplicate_count} duplicatas
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <strong>CNPJ:</strong> {duplicate.cnpj || 'N/A'}
                        </div>
                        <div>
                          <strong>Mais antigo:</strong> {formatDate(duplicate.oldest_created_at)}
                        </div>
                        <div>
                          <strong>Mais recente:</strong> {formatDate(duplicate.newest_created_at)}
                        </div>
                        <div>
                          <strong>Será mantido:</strong> {duplicate.newest_id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados da Limpeza</CardTitle>
              <CardDescription>
                Resultados da última operação executada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cleanupResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  Nenhuma operação executada ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {cleanupResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">
                          {result.table_name} - {result.item_name}
                        </h4>
                        <div className="flex gap-2">
                          <Badge 
                            variant={result.action.includes('DRY_RUN') ? 'secondary' : 'default'}
                          >
                            {result.action}
                          </Badge>
                          {result.removed_count > 0 && (
                            <Badge variant="destructive">
                              {result.removed_count} removidos
                            </Badge>
                          )}
                        </div>
                      </div>
                      {result.details && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}