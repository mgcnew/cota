// EditProductDialog - Formulário de edição de produtos com upload de imagem e código de barras
import { useState, useEffect, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { Package, Upload, Loader2, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LazyImage } from "@/components/responsive/LazyImage";
import { compressImageForUpload, needsCompression, getCompressionInfo } from "@/utils/imageCompression";
import { BrandSelect } from "@/components/products/BrandSelect";
import { CategorySelectForm } from "@/components/products/CategorySelectForm";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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
  productId?: string | null;
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
  const keyboardOffset = useKeyboardOffset();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

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

  useEffect(() => {
    if (!open) {
      setImageFile(null);
    }
  }, [open]);

  if (!open) return null;

  const isLoading = false;

  if (!currentProduct && !isLoading) return null;

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentProduct) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem válida.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 10MB.", variant: "destructive" });
      return;
    }

    setIsUploadingImage(true);
    try {
      let processedFile: File = file;
      if (needsCompression(file)) {
        processedFile = await compressImageForUpload(file);
      }

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${currentProduct.id}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, processedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setNewImageUrl(publicUrl);
      setImageFile(processedFile);

      toast({ title: "Imagem carregada!", description: "Imagem enviada com sucesso." });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({ title: "Erro", description: "Falha no upload.", variant: "destructive" });
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

    onProductUpdated(updatedProduct);

    if (data.category === "nova" && data.newCategory && onCategoryAdded) {
      onCategoryAdded(data.newCategory);
    }

    toast({ title: "Produto atualizado", description: `${data.name} atualizado.` });
    setTimeout(() => onOpenChange(false), 50);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isMobile) return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // Header Component
  const Header = (
    <div className={designSystem.components.modal.header}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg border", designSystem.colors.surface.card, designSystem.colors.border.subtle)}>
          <Package className={cn("h-4 w-4", designSystem.colors.text.primary)} />
        </div>
        <DialogTitle className={cn(designSystem.typography.size.lg, designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
          {isLoading ? 'Carregando...' : 'Editar Produto'}
        </DialogTitle>
      </div>

      <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)}
        className={cn(designSystem.components.button.ghost, "h-8 w-8")}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  const formContent = (
    <>
      <div className={cn("flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4", designSystem.colors.surface.page)}>
        {/* Imagem */}
        <div className={cn(designSystem.components.card.flat, "p-4")}>
          <div className="flex items-center justify-between mb-3">
            <Label className={designSystem.typography.size.sm}>Foto do Produto</Label>
            {(newImageUrl || currentProduct?.image_url) && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemoveNewImage} className={cn(designSystem.components.button.ghost, "h-6 px-2 text-xs")}>
                <Trash2 className="h-3 w-3 mr-1" /> Remover
              </Button>
            )}
          </div>

          {(newImageUrl || currentProduct?.image_url) ? (
            <div className="relative w-full h-32 bg-white rounded-lg overflow-hidden border border-zinc-200 flex items-center justify-center">
              {isUploadingImage ? (
                <div className="flex items-center justify-center w-full h-full bg-zinc-50">
                  <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
                </div>
              ) : (
                <LazyImage
                  src={newImageUrl || currentProduct?.image_url}
                  alt={currentProduct?.name || "Produto"}
                  className="h-full object-contain"
                  containerClassName="w-full h-full flex items-center justify-center"
                />
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploadingImage ? (
                  <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-2" />
                ) : (
                  <Upload className="w-8 h-8 text-zinc-400 mb-2" />
                )}
                <p className="text-xs text-zinc-500">Clique para selecionar</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={isUploadingImage} />
            </label>
          )}
        </div>

        {/* Form Fields */}
        <Form {...form}>
          <form id="edit-product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className={cn(designSystem.components.card.flat, "p-4 space-y-4")}>
              <h3 className={cn(designSystem.typography.size.xs, designSystem.typography.weight.bold, "uppercase tracking-wider mb-2 flex items-center gap-2", designSystem.colors.text.muted)}>
                Detalhes
              </h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={designSystem.typography.size.sm}>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Coxa com Sobrecoxa" className={designSystem.components.input.root} onFocus={handleInputFocus} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>Unidade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={designSystem.components.input.root}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="un">Unidade (un)</SelectItem>
                          <SelectItem value="kg">Quilograma (kg)</SelectItem>
                          <SelectItem value="cx">Caixa (cx)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>Categoria</FormLabel>
                      <CategorySelectForm
                        value={field.value}
                        onChange={field.onChange}
                        categories={categories}
                        onCategoryAdded={onCategoryAdded}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="brand_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>Marca</FormLabel>
                      <BrandSelect value={field.value} onChange={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>Cód. Barras</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="EAN-13..." className={designSystem.components.input.root} maxLength={13} onFocus={handleInputFocus} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Footer */}
      <div className={designSystem.components.modal.footer}>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isUploadingImage}
          className={designSystem.components.button.secondary}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="edit-product-form"
          className={designSystem.components.button.primary}
        >
          Salvar Alterações
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn(designSystem.components.modal.content, "flex flex-col p-0 gap-0 overflow-hidden h-[90vh]")}>
          {Header}
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className={cn(designSystem.components.modal.content, "max-h-[85vh] p-0 overflow-hidden flex flex-col")}>
        {Header}
        {formContent}
      </DialogContent>
    </Dialog>
  );
}

export const EditProductDialog = memo(EditProductDialogInternal, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.product?.id === nextProps.product?.id &&
    prevProps.productId === nextProps.productId &&
    prevProps.categories?.length === nextProps.categories?.length
  );
});