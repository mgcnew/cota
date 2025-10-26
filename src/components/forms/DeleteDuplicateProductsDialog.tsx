import { useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DuplicateGroup {
  name: string;
  products: Array<{
    id: string;
    name: string;
    category: string;
    created_at: string;
  }>;
}

interface DeleteDuplicateProductsDialogProps {
  onDuplicatesDeleted: () => void;
}

export function DeleteDuplicateProductsDialog({ onDuplicatesDeleted }: DeleteDuplicateProductsDialogProps) {
  const [open, setOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const findDuplicates = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar TODOS os produtos do usuário (com paginação)
      const pageSize = 1000;
      let allProducts: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: pageData, error } = await supabase
          .from('products')
          .select('id, name, category, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .range(from, to);

        if (error) throw error;

        if (pageData && pageData.length > 0) {
          allProducts.push(...pageData);
          console.log(`[DUPLICATES] Loaded page ${page + 1}: ${pageData.length} products`);
          
          // Se retornou menos que o tamanho da página, não há mais dados
          if (pageData.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      const products = allProducts;
      console.log('[DUPLICATES] Total products fetched:', products?.length);
      
      // Mostrar TODOS os produtos no console para debug
      console.table(products?.map(p => ({
        id: p.id.substring(0, 8),
        name: p.name,
        category: p.category,
        created: new Date(p.created_at).toLocaleString('pt-BR')
      })));

      // Função para normalizar nome do produto
      const normalizeName = (name: string) => {
        return name
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ') // Substituir múltiplos espaços por um único
          .normalize('NFD') // Normalizar caracteres acentuados
          .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
      };

      // Agrupar produtos por nome normalizado
      const groupedByName = new Map<string, typeof products>();
      
      products?.forEach(product => {
        const normalizedName = normalizeName(product.name);
        
        if (!groupedByName.has(normalizedName)) {
          groupedByName.set(normalizedName, []);
        }
        groupedByName.get(normalizedName)!.push(product);
      });
      
      // Log de produtos com mais de 1 ocorrência
      console.log('[DUPLICATES] Checking for duplicates...');
      let duplicateCount = 0;
      groupedByName.forEach((products, normalizedName) => {
        if (products.length > 1) {
          duplicateCount++;
          console.log(`[DUPLICATES FOUND] "${normalizedName}" - ${products.length} ocorrências:`, 
            products.map(p => ({ id: p.id.substring(0, 8), name: p.name, created: p.created_at }))
          );
        }
      });
      console.log(`[DUPLICATES] Total de grupos duplicados: ${duplicateCount}`);

      console.log('[DUPLICATES] Groups found:', groupedByName.size);

      // Filtrar apenas grupos com duplicatas (mais de 1 produto)
      const duplicateGroups: DuplicateGroup[] = [];
      groupedByName.forEach((products, normalizedName) => {
        console.log('[DUPLICATES] Group:', normalizedName, 'Count:', products.length);
        if (products.length > 1) {
          duplicateGroups.push({
            name: products[0].name, // Nome original do primeiro produto
            products: products
          });
        }
      });

      console.log('[DUPLICATES] Duplicate groups found:', duplicateGroups.length);
      
      // Se não encontrou duplicatas exatas, mostrar os 20 primeiros produtos para debug
      if (duplicateGroups.length === 0) {
        console.log('[DUPLICATES] Primeiros 20 produtos para análise:');
        console.table(products?.slice(0, 20).map(p => ({
          name: p.name,
          normalized: normalizeName(p.name),
          category: p.category
        })));
      } else {
        console.log('[DUPLICATES] Details:', duplicateGroups.map(g => ({
          name: g.name,
          count: g.products.length,
          ids: g.products.map(p => p.id)
        })));
      }

      setDuplicates(duplicateGroups);

      if (duplicateGroups.length === 0) {
        toast({
          title: "Nenhuma duplicata encontrada",
          description: "Não há produtos com nomes idênticos. Verifique o console para mais detalhes.",
          duration: 5000,
        });
      } else {
        toast({
          title: "Duplicatas encontradas",
          description: `${duplicateGroups.length} grupo(s) de produtos duplicados encontrados.`,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar duplicatas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar produtos duplicados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDuplicates = async () => {
    setDeleting(true);
    try {
      let totalDeleted = 0;

      // Para cada grupo de duplicatas, manter o mais antigo e deletar os demais
      for (const group of duplicates) {
        // Ordenar por data de criação (mais antigo primeiro)
        const sortedProducts = [...group.products].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Manter o primeiro (mais antigo) e deletar os demais
        const toDelete = sortedProducts.slice(1);

        for (const product of toDelete) {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', product.id);

          if (error) {
            console.error(`Erro ao deletar produto ${product.id}:`, error);
          } else {
            totalDeleted++;
          }
        }
      }

      toast({
        title: "Duplicatas removidas",
        description: `${totalDeleted} produto(s) duplicado(s) foram removidos com sucesso.`,
      });

      onDuplicatesDeleted();
      setOpen(false);
      setShowConfirmDialog(false);
      setDuplicates([]);
    } catch (error) {
      console.error('Erro ao deletar duplicatas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover todos os produtos duplicados.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const totalDuplicates = duplicates.reduce((sum, group) => sum + (group.products.length - 1), 0);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={findDuplicates}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Duplicatas
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Produtos Duplicados
            </DialogTitle>
            <DialogDescription>
              Produtos com o mesmo nome serão agrupados. O produto mais antigo será mantido e os demais serão excluídos.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : duplicates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma duplicata encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Todos os produtos têm nomes únicos.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-shrink-0 mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  <strong>{duplicates.length}</strong> grupo(s) de duplicatas encontrado(s)
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  <strong>{totalDuplicates}</strong> produto(s) serão excluídos
                </p>
              </div>

              <ScrollArea className="flex-1 min-h-0 pr-4">
                <div className="space-y-4 pb-4">
                  {duplicates.map((group, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm">{group.name}</h4>
                        <Badge variant="destructive">
                          {group.products.length} duplicatas
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {group.products.map((product, prodIdx) => (
                          <div
                            key={product.id}
                            className={`flex items-center justify-between p-2 rounded ${
                              prodIdx === 0
                                ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {product.category} • {new Date(product.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <Badge
                              variant={prodIdx === 0 ? "outline" : "destructive"}
                              className="text-xs"
                            >
                              {prodIdx === 0 ? 'Manter' : 'Excluir'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir {totalDuplicates} Duplicata(s)
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão de duplicatas</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. {totalDuplicates} produto(s) duplicado(s) serão excluídos permanentemente.
              <br /><br />
              Os produtos mais antigos serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDuplicates}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
