import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Package, Sparkles, Upload, Loader2, Trash2 } from "lucide-react";
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
  unit: z.string()
    .min(1, "Unidade é obrigatória"),
  barcode: z.string()
    .trim()
    .max(13, "Código de barras deve ter no máximo 13 caracteres")
    .optional()
    .or(z.literal("")),
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
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      unit: "un",
      barcode: "",
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

  const handleGenerateImage = async () => {
    const productName = form.getValues("name");
    const category = form.getValues("category");
    
    if (!productName) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do produto antes de gerar a imagem",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingImage(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-product-image", {
        body: { productName, category },
      });
      
      if (error) throw error;
      
      if (data.success) {
        setProductImage(data.imageUrl);
        toast({
          title: "✨ Imagem gerada!",
          description: "Imagem do produto criada com IA",
        });
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      toast({
        title: "Erro ao gerar imagem",
        description: "Tente novamente ou faça upload manual",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "Tamanho máximo: 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploadingImage(true);
    
    try {
      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user!.id)
        .single();
      
      if (!companyData) throw new Error("Empresa não encontrada");
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${companyData.company_id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);
      
      setProductImage(data.publicUrl);
      
      toast({
        title: "✅ Upload concluído",
        description: "Imagem do produto enviada com sucesso",
      });
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro no upload",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

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

      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Get company_id
      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) {
        throw new Error("Empresa não encontrada");
      }

      const { error } = await supabase
        .from('products')
        .insert({
          company_id: companyData.company_id,
          name: data.name,
          category: finalCategory,
          unit: data.unit,
          barcode: data.barcode || null,
          weight: data.weight || null,
          image_url: productImage || null,
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
      setProductImage(null);
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
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400">Unidade de Medida *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 rounded-lg border-gray-200 dark:border-gray-700 focus:border-orange-400 dark:focus:border-orange-500 dark:bg-gray-800 dark:text-white text-sm">
                              <SelectValue placeholder="Selecione a unidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border z-50 rounded-lg">
                            <SelectItem value="un">Unidade (un)</SelectItem>
                            <SelectItem value="kg">Quilograma (kg)</SelectItem>
                            <SelectItem value="g">Grama (g)</SelectItem>
                            <SelectItem value="lt">Litro (lt)</SelectItem>
                            <SelectItem value="ml">Mililitro (ml)</SelectItem>
                            <SelectItem value="cx">Caixa (cx)</SelectItem>
                            <SelectItem value="pc">Pacote (pc)</SelectItem>
                            <SelectItem value="dz">Dúzia (dz)</SelectItem>
                            <SelectItem value="m">Metro (m)</SelectItem>
                            <SelectItem value="m2">Metro² (m²)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400">Código de Barras (Opcional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              placeholder="EAN-13, EAN-8, UPC..."
                              className="h-9 pr-10 rounded-lg border-gray-200 dark:border-gray-700 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-400/20 dark:bg-gray-800 dark:text-white text-sm"
                              maxLength={13}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Seção de Foto do Produto */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></span>
                    Foto do Produto
                  </h3>
                  
                  <div className="space-y-4 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Imagem (Opcional)</Label>
                      {productImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setProductImage(null)}
                          className="h-7 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                    
                    {productImage && (
                      <div className="relative w-full h-48 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img 
                          src={productImage} 
                          alt="Preview do produto"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-9 text-sm"
                          disabled={isUploadingImage}
                          asChild
                        >
                          <div>
                            {isUploadingImage ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Fazer Upload da Imagem
                              </>
                            )}
                          </div>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Formatos aceitos: JPG, PNG, WEBP (máx. 5MB)
                    </p>
                  </div>
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