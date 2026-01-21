// EditProductDialog - Formulário de edição de produtos com upload de imagem e código de barras
import { useState, useEffect, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { useToast } from "@/hooks/use-toast";
import { Package, Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LazyImage } from "@/components/responsive/LazyImage";
import { compressImageForUpload, needsCompression, getCompressionInfo } from "@/utils/imageCompression";
import { BrandSelect } from "@/components/products/BrandSelect";
import { CategorySelectForm } from "@/components/products/CategorySelectForm";

const productSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  category: z.string()
    .min(1, "Categoria é obrigatória"),
  brand_id: z.string().optional(),
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
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  brand_id?: string;
  barcode?: string;
  image_url?: string;
  lastOrderPrice: string;
  bestSupplier: string;
  quotesCount: number;
  lastUpdate: string;
  trend: "up" | "down" | "stable";
}

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: (product: Product) => void;
  onCategoryAdded?: (category: string) => void;
  categories: string[];
  productId?: string | null; // Para lazy loading no mobile
}

function EditProductDialogInternal({ 
  product, 
  open, 
  onOpenChange, 
  onProductUpdated, 
  onCategoryAdded,
  categories,
  productId 
}: EditProductDialogProps) {
  const isMobile = useIsMobile();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  // Usar product prop diretamente (removida lógica de lazy loading mobile)
  const currentProduct: Product | null = product;
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      brand_id: "",
      unit: "un",
      barcode: "",
      newCategory: "",
    },
  });

  const availableCategories = categories.filter(cat => cat !== "all");

  // Atualizar form quando currentProduct mudar
  useEffect(() => {
    if (currentProduct && open) {
      form.reset({
        name: currentProduct.name,
        category: currentProduct.category,
        brand_id: currentProduct.brand_id || "",
        unit: currentProduct.unit || "un",
        barcode: currentProduct.barcode || "",
        newCategory: "",
      });
      if (currentProduct.image_url) {
        setNewImageUrl(currentProduct.image_url);
      } else {
        setNewImageUrl(null);
      }
    }
  }, [currentProduct, open, form]);

  // Cleanup quando o modal fecha
  useEffect(() => {
    if (!open) {
      // Limpar estados quando o modal fecha
      setImageFile(null);
      // Não resetar newImageUrl aqui para manter a imagem caso o usuário reabra
    }
  }, [open]);
  
  // Não renderizar nada se não estiver aberto
  if (!open) return null;
  
  // Verificar se está carregando (removida lógica de lazy loading mobile)
  const isLoading = false;
  
  // Se não tiver produto e não estiver carregando, não renderizar
  // (Isso evita renderizar o modal vazio)
  if (!currentProduct && !isLoading) return null;

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentProduct) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    // Allow larger files since we'll compress them (max 10MB input)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Compress image if needed (> 500KB)
      let processedFile: File = file;
      if (needsCompression(file)) {
        const originalSize = file.size;
        processedFile = await compressImageForUpload(file);
        const info = getCompressionInfo(originalSize, processedFile.size);
        
        toast({
          title: "Imagem comprimida",
          description: `${info.originalSizeKB}KB → ${info.compressedSizeKB}KB (${info.savedPercent}% menor)`,
        });
      }

      // Upload para o Supabase Storage
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${currentProduct.id}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setNewImageUrl(publicUrl);
      setImageFile(processedFile);
      
      toast({
        title: "Imagem carregada!",
        description: "A nova imagem foi enviada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível fazer upload da imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveNewImage = () => {
    setNewImageUrl(null);
    setImageFile(null);
  };

  const onSubmit = (data: ProductFormData) => {
    if (!currentProduct) return;

    // Determinar a categoria final
    const finalCategory = data.category === "nova" ? data.newCategory! : data.category;
    
    if (data.category === "nova" && !data.newCategory?.trim()) {
      form.setError("newCategory", { message: "Nome da nova categoria é obrigatório" });
      return;
    }

    const updatedProduct: Product = {
      ...currentProduct,
      name: data.name,
      category: finalCategory,
      brand_id: data.brand_id && data.brand_id !== 'none' ? data.brand_id : undefined,
      unit: data.unit,
      barcode: data.barcode || undefined,
      lastUpdate: new Date().toLocaleDateString('pt-BR'),
      image_url: newImageUrl || currentProduct.image_url,
    };

    // Chamar callback de atualização primeiro
    onProductUpdated(updatedProduct);
    
    // Adicionar nova categoria à lista se necessário
    if (data.category === "nova" && data.newCategory && onCategoryAdded) {
      onCategoryAdded(data.newCategory);
    }

    // Mostrar toast
    toast({
      title: "Produto atualizado",
      description: `${data.name} foi atualizado com sucesso.`,
    });

    // Fechar modal de forma síncrona após pequeno delay para garantir que o toast apareça
    // Usar setTimeout com delay mínimo para garantir que o estado seja atualizado
    setTimeout(() => {
      onOpenChange(false);
    }, 50);
  };

  // Conteúdo do formulário (compartilhado entre mobile e desktop)
  const formContent = (
    <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 bg-transparent">
      {/* Product Image Preview */}
      {(currentProduct?.image_url || newImageUrl) && (
            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-orange-200 dark:border-orange-800 shadow-md relative group bg-gray-50 dark:bg-gray-900">
                {isUploadingImage ? (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                  </div>
                ) : (
                  <>
                    <LazyImage 
                      src={newImageUrl || currentProduct.image_url} 
                      alt={currentProduct.name}
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                      showSkeleton={true}
                      enableBlurUp={true}
                    />
                    {newImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveNewImage}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <label htmlFor="image-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingImage}
                    className="text-xs border-orange-300 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-900/30 cursor-pointer"
                    asChild
                  >
                    <span>
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 mr-1.5" />
                          Trocar Imagem
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-sm">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">Nome do Produto</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Coxa com Sobrecoxa"
                      className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-400/20 dark:text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">Marca</FormLabel>
                  <FormControl>
                    <BrandSelect 
                      value={field.value} 
                      onChange={field.onChange} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">Categoria</FormLabel>
                  <FormControl>
                    <CategorySelectForm 
                      value={field.value}
                      onChange={field.onChange}
                      categories={categories}
                      onCategoryAdded={onCategoryAdded}
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
                  <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">Unidade de Medida *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-orange-400 dark:focus:border-orange-500 dark:text-white">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50 rounded-lg shadow-lg">
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
                  <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">Código de Barras (Opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        placeholder="EAN-13, EAN-8, UPC..."
                        className="pr-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-400/20 dark:text-white"
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

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploadingImage}
                className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900/70"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Salvar Alterações
              </Button>
            </div>
            </form>
          </Form>
    </div>
  );

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent 
        hideClose 
        className="w-[90vw] sm:w-[90vw] md:max-w-[520px] h-[90vh] sm:h-[85vh] max-h-[90vh] sm:max-h-[700px] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl rounded-t-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-950 [&>button]:hidden"
      >
        <ResponsiveDialogHeader className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl sm:rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white flex-shrink-0 shadow-lg sm:shadow-none">
                <Package className="h-5 w-5 sm:h-4 sm:w-4" />
              </div>
              <ResponsiveDialogTitle className="text-lg sm:text-base font-bold sm:font-semibold text-gray-900 dark:text-white truncate">
                {isLoading ? 'Carregando...' : 'Editar Produto'}
              </ResponsiveDialogTitle>
            </div>
            <Button
              type="button"
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              onClick={() => onOpenChange(false)}
              className={isMobile 
                ? "h-9 w-9 p-0 flex-shrink-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                : "h-6 w-6 text-gray-400 hover:text-gray-900 dark:hover:text-white !bg-transparent p-0 border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              }
            >
              <X className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              {!isMobile && <span className="sr-only">Fechar</span>}
            </Button>
          </div>
        </ResponsiveDialogHeader>
        <div className="flex flex-col flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 flex-1">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
              </div>
            ) : (
              formContent
            )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

// Memoizar componente para evitar re-renders desnecessários
export const EditProductDialog = memo(EditProductDialogInternal, (prevProps, nextProps) => {
  // Re-renderizar apenas se props relevantes mudarem
  return (
    prevProps.open === nextProps.open &&
    prevProps.product?.id === nextProps.product?.id &&
    prevProps.productId === nextProps.productId &&
    prevProps.categories?.length === nextProps.categories?.length
  );
});