import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useQueryClient } from '@tanstack/react-query';

const productSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  category: z.string()
    .min(1, "Categoria é obrigatória"),
  newCategory: z.string()
    .trim()
    .max(50, "Categoria deve ter no máximo 50 caracteres")
    .optional(),
  weight: z.string()
    .trim()
    .max(50, "Peso deve ter no máximo 50 caracteres")
    .optional()
    .or(z.literal("")),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AddProductDialogProps {
  onProductAdded: (product: any) => void;
  onCategoryAdded?: (category: string) => void;
}

export function AddProductDialog({ onProductAdded, onCategoryAdded }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const queryClient = useQueryClient();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      newCategory: "",
      weight: "",
    },
  });

  // Carregar categorias dinamicamente do banco de dados
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const { data, error } = await supabase
          .from('products')
          .select('category');

        if (error) throw error;

        const uniqueCategories = Array.from(new Set(data.map(p => p.category)))
          .filter(category => category && category.trim() !== '') // Remove categorias vazias
          .sort(); // Ordena alfabeticamente

        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // Fallback para categorias padrão em caso de erro
        setCategories(["Frango", "Embutidos", "Frios", "Bovino", "Suíno"]);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  const onSubmit = async (data: ProductFormData, keepOpen = false) => {
    // Determinar a categoria final
    const finalCategory = data.category === "nova" ? data.newCategory! : data.category;
    
    if (data.category === "nova" && !data.newCategory?.trim()) {
      form.setError("newCategory", { message: "Nome da nova categoria é obrigatório" });
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado para adicionar produtos.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          category: finalCategory,
          weight: data.weight || null,
          user_id: userData.user.id,
        });

      if (error) throw error;

      // Log activity
      await logActivity({
        tipo: "produto",
        acao: "Produto adicionado",
        detalhes: `${data.name} - Categoria: ${finalCategory}${data.weight ? `, Peso: ${data.weight}` : ""}`
      });

      // Invalidar queries para atualizar dados em tempo real
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });

      // Adicionar nova categoria à lista local se necessário
      if (data.category === "nova" && data.newCategory) {
        setCategories(prev => {
          const newCategories = [...prev, data.newCategory!].sort();
          return Array.from(new Set(newCategories)); // Remove duplicatas
        });
        
        if (onCategoryAdded) {
          onCategoryAdded(data.newCategory);
        }
      }
      
      toast({
        title: "Produto adicionado",
        description: keepOpen 
          ? `${data.name} foi adicionado! Adicione outro produto.` 
          : `${data.name} foi adicionado com sucesso.`,
      });

      onProductAdded(null);
      form.reset();
      setShowNewCategory(false);
      
      if (!keepOpen) {
        setOpen(false);
      } else {
        // Focar no primeiro campo
        setTimeout(() => {
          document.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
        }, 100);
      }
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[520px] h-[85vh] max-h-[700px] overflow-hidden border-0 shadow-2xl rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-900">
        <DialogHeader className="flex-shrink-0 px-5 py-3 border-b border-gray-200/40 dark:border-gray-700/40 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md">
              <Plus className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
              Novo Produto
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col flex-1 overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Seção: Informações Básicas */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-orange-500 to-amber-600 rounded-full"></span>
                    Informações do Produto
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400">Nome do Produto *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Coxa com Sobrecoxa Congelada"
                            className="h-9 rounded-lg border-gray-200 dark:border-gray-700 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-400/20 dark:bg-gray-800 dark:text-white text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400">Peso/Quantidade Padrão</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: 500kg, 15 metades, 1 caixa com 20kg"
                            className="h-9 rounded-lg border-gray-200 dark:border-gray-700 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-400/20 dark:bg-gray-800 dark:text-white text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Seção: Categorização */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></span>
                    Categorização
                  </h3>

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400">Categoria do Produto *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setShowNewCategory(value === "nova");
                            if (value !== "nova") {
                              form.setValue("newCategory", "");
                            }
                          }} 
                          defaultValue={field.value}
                          disabled={loadingCategories}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 bg-background dark:bg-gray-800 rounded-lg border-gray-200 dark:border-gray-700 focus:border-orange-400 dark:focus:border-orange-500 dark:text-white text-sm">
                              <SelectValue placeholder={loadingCategories ? "Carregando categorias..." : "Selecione uma categoria existente"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border z-50 rounded-lg">
                            {loadingCategories ? (
                              <SelectItem value="loading" disabled className="rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                  Carregando categorias...
                                </div>
                              </SelectItem>
                            ) : (
                              <>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category} className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      {category}
                                    </div>
                                  </SelectItem>
                                ))}
                                <SelectItem value="nova" className="text-primary font-medium rounded-lg border-t mt-1 pt-2">
                                  <div className="flex items-center gap-2">
                                    <Plus className="h-3 w-3" />
                                    Criar nova categoria
                                  </div>
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showNewCategory && (
                    <FormField
                      control={form.control}
                      name="newCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400">Nome da Nova Categoria *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Peixes, Laticínios, Temperos"
                              className="h-9 rounded-lg border-orange-200 dark:border-orange-700 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-400/20 bg-orange-50/30 dark:bg-orange-900/20 dark:text-white text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Dica de preenchimento */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-200/50 dark:border-orange-800/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="text-lg">💡</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900 dark:text-orange-300 text-xs mb-1.5">Dicas Rápidas</h4>
                      <ul className="text-xs text-orange-800 dark:text-orange-400 space-y-0.5">
                        <li>• Use nomes descritivos</li>
                        <li>• Especifique peso/quantidade</li>
                        <li>• Categorias organizam cotações</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer com botões */}
              <div className="flex-shrink-0 px-5 py-3 border-t border-gray-200/40 dark:border-gray-700/40 bg-gray-50/30 dark:bg-gray-800/30">
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="h-9 rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm dark:text-white px-4"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => form.handleSubmit((data) => onSubmit(data, false))()}
                    className="h-9 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => form.handleSubmit((data) => onSubmit(data, true))()}
                    variant="outline"
                    className="h-9 rounded-lg border-orange-500 dark:border-orange-400 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-sm px-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Mais
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}