import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { Package, Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  barcode?: string;
  image_url?: string;
  lastQuotePrice: string;
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
}

export function EditProductDialog({ 
  product, 
  open, 
  onOpenChange, 
  onProductUpdated, 
  onCategoryAdded,
  categories 
}: EditProductDialogProps) {
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      unit: "un",
      barcode: "",
      newCategory: "",
    },
  });

  const availableCategories = categories.filter(cat => cat !== "all");

  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        category: product.category,
        unit: product.unit || "un",
        barcode: product.barcode || "",
        newCategory: "",
      });
      setShowNewCategory(false);
      setNewImageUrl(null);
    }
  }, [product, open, form]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !product) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Upload para o Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${product.id}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setNewImageUrl(publicUrl);
      setImageFile(file);
      
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
    if (!product) return;

    // Determinar a categoria final
    const finalCategory = data.category === "nova" ? data.newCategory! : data.category;
    
    if (data.category === "nova" && !data.newCategory?.trim()) {
      form.setError("newCategory", { message: "Nome da nova categoria é obrigatório" });
      return;
    }

    const updatedProduct: Product = {
      ...product,
      name: data.name,
      category: finalCategory,
      unit: data.unit,
      barcode: data.barcode || undefined,
      lastUpdate: new Date().toLocaleDateString('pt-BR'),
      image_url: newImageUrl || product.image_url,
    };

    onProductUpdated(updatedProduct);
    
    // Adicionar nova categoria à lista se necessário
    if (data.category === "nova" && data.newCategory && onCategoryAdded) {
      onCategoryAdded(data.newCategory);
    }
    
    toast({
      title: "Produto atualizado",
      description: `${data.name} foi atualizado com sucesso.`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-md overflow-hidden border border-orange-200/60 dark:border-orange-900/60 shadow-xl rounded-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-[#111827]">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-5 py-4 border-b border-orange-100/70 dark:border-orange-900/50 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 dark:from-orange-900/20 dark:via-orange-900/10 dark:to-amber-900/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Editar Produto
              </DialogTitle>
              <p className="text-xs text-orange-600/80 dark:text-orange-300/80 mt-0.5">
                Atualize as informações do item selecionado
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 bg-white dark:bg-[#0f1729]">
          {/* Product Image Preview */}
          {(product?.image_url || newImageUrl) && (
            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-orange-200 dark:border-orange-800 shadow-md relative group">
                {isUploadingImage ? (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                  </div>
                ) : (
                  <>
                    <img 
                      src={newImageUrl || product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {newImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveNewImage}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <FormLabel className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Nome do Produto</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Coxa com Sobrecoxa"
                      className="bg-white dark:bg-gray-900/40 dark:border-gray-700/60 dark:text-gray-200"
                      {...field}
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
                  <FormLabel className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Categoria</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setShowNewCategory(value === "nova");
                      if (value !== "nova") {
                        form.setValue("newCategory", "");
                      }
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background border z-50">
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="nova" className="text-primary font-medium">
                        + Adicionar nova categoria
                      </SelectItem>
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
                    <FormLabel>Nome da Nova Categoria</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Peixes, Laticínios"
                        className="bg-white dark:bg-gray-900/40 dark:border-gray-700/60 dark:text-gray-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Unidade de Medida *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
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
                  <FormLabel className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Código de Barras (Opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        placeholder="EAN-13, EAN-8, UPC..."
                        className="pr-10 bg-white dark:bg-gray-900/40 dark:border-gray-700/60 dark:text-gray-200"
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
      </DialogContent>
    </Dialog>
  );
}