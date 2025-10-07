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

  const onSubmit = async (data: ProductFormData) => {
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
        description: `${data.name} foi adicionado com sucesso.`,
      });

      onProductAdded(null);
      form.reset();
      setShowNewCategory(false);
      setOpen(false);
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
      <DialogContent className="w-[95vw] max-w-[600px] h-[95vh] max-h-[800px] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 flex flex-col">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/40 backdrop-blur-sm relative overflow-hidden">
          {/* Efeitos decorativos de fundo */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-yellow-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-amber-400/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-400/10 to-orange-400/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 text-white shadow-lg shadow-orange-500/25 ring-2 ring-white/20 backdrop-blur-sm flex-shrink-0">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-900 via-amber-800 to-yellow-800 bg-clip-text text-transparent">
                Novo Produto
              </DialogTitle>
              <p className="text-gray-600/80 text-sm font-medium mt-1">
                Cadastre um novo produto no sistema
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col flex-1 overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Seção: Informações Básicas */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 pb-2 sm:pb-3 border-b border-gray-200/60">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md text-sm">
                      📦
                    </div>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">Informações do Produto</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">Nome do Produto *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Coxa com Sobrecoxa Congelada"
                            className="rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
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
                        <FormLabel className="text-sm font-semibold text-gray-700">Peso/Quantidade Padrão</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: 500kg, 15 metades, 1 caixa com 20kg"
                            className="rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Seção: Categorização */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 pb-2 sm:pb-3 border-b border-gray-200/60">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md text-sm">
                      🏷️
                    </div>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">Categorização</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">Categoria do Produto *</FormLabel>
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
                            <SelectTrigger className="bg-background rounded-xl border-gray-200 focus:border-orange-400">
                              <SelectValue placeholder={loadingCategories ? "Carregando categorias..." : "Selecione uma categoria existente"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border z-50 rounded-xl">
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
                          <FormLabel className="text-sm font-semibold text-gray-700">Nome da Nova Categoria *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Peixes, Laticínios, Temperos"
                              className="rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 bg-orange-50/30"
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
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 rounded-xl p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                      💡
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-1 text-sm sm:text-base">Dicas de Cadastro</h4>
                      <ul className="text-xs sm:text-sm text-orange-800 space-y-0.5 sm:space-y-1">
                        <li>• Use nomes descritivos para facilitar a busca</li>
                        <li>• Especifique peso/quantidade quando relevante</li>
                        <li>• Categorias ajudam na organização das cotações</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer com botões */}
              <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100/60 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border-gray-200 hover:bg-gray-50 text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Adicionar Produto
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