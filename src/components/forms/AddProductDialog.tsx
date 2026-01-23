import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { Plus, Package, Sparkles, Upload, Loader2, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useQueryClient } from '@tanstack/react-query';
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { LimitAlert } from "@/components/billing/LimitAlert";
import { useUserRole } from "@/hooks/useUserRole";
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
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";

export function AddProductDialog({ onProductAdded, onCategoryAdded, trigger, open: externalOpen, onOpenChange: externalOnOpenChange }: AddProductDialogProps) {
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const handleSetOpen = externalOnOpenChange || ((newOpen: boolean) => setInternalOpen(newOpen));
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionLimits = useSubscriptionLimits();
  const { isOwner } = useUserRole();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      brand_id: "",
      unit: "un",
      barcode: "",
      newCategory: "",
      weight: "",
    },
  });

  // Salvar posição de scroll quando abrir o modal
  useEffect(() => {
    if (open) {
      scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    } else {
      // Restaurar posição de scroll quando fechar o modal
      // Usar setTimeout para garantir que o DOM foi atualizado
      setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant' as ScrollBehavior
        });
      }, 0);
    }
  }, [open]);

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
    
    // Allow larger files since we'll compress them (max 10MB input)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "Tamanho máximo: 10MB",
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
      
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${companyData.company_id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, processedFile);
      
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
      const { data: companyData, error: companyError } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (companyError) {
        console.error("Erro ao buscar company_id:", companyError);
        throw new Error(`Erro ao buscar empresa: ${companyError.message}`);
      }

      if (!companyData || !companyData.company_id) {
        console.error("Company data não encontrada:", { user_id: user.id, companyData });
        throw new Error("Empresa não encontrada. Verifique se você está associado a uma empresa.");
      }

      // Verificar limite antes de inserir (validação adicional no frontend)
      const ownerEmails = ['mgc.info.new@gmail.com'];
      
      let userIsOwner = false;
      if (user.email && ownerEmails.includes(user.email.toLowerCase().trim())) {
        userIsOwner = true;
      } else {
        userIsOwner = isOwner === true;
        if (!userIsOwner) {
          try {
            const { data: isSuperAdmin, error: superAdminError } = await supabase
              .rpc('is_super_admin', { _user_id: user.id });
            
            if (!superAdminError && isSuperAdmin) {
              userIsOwner = true;
            } else {
              const { data: roleData, error: roleError } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .eq("company_id", companyData.company_id)
                .maybeSingle();
              
              if (!roleError && roleData?.role === 'owner') {
                userIsOwner = true;
              }
            }
          } catch (error) {
            console.error('Erro ao verificar owner:', error);
          }
        }
      }
      
      if (!userIsOwner && !subscriptionLimits.canAddProduct) {
        toast({
          title: "Limite atingido",
          description: `Você atingiu o limite de ${subscriptionLimits.maxProducts} produtos. Faça upgrade do plano para adicionar mais produtos.`,
          variant: "destructive",
        });
        return;
      }

      const productData = {
        company_id: companyData.company_id,
        name: data.name.trim(),
        category: finalCategory.trim(),
        brand_id: data.brand_id && data.brand_id !== 'none' ? data.brand_id : null,
        unit: data.unit || 'un',
        barcode: data.barcode && data.barcode.trim() ? data.barcode.trim() : null,
        weight: data.weight && data.weight.trim() ? data.weight.trim() : null,
        image_url: productImage && productImage.trim() ? productImage.trim() : null,
      };

      if (!productData.name || productData.name.length === 0) throw new Error("Nome do produto é obrigatório");
      if (!productData.category || productData.category.length === 0) throw new Error("Categoria do produto é obrigatória");
      if (!productData.unit || productData.unit.length === 0) throw new Error("Unidade de medida é obrigatória");
      if (!productData.company_id) throw new Error("Erro ao identificar a empresa");

      const { data: insertedProduct, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (insertError) throw insertError;

      await logActivity({
        tipo: "produto",
        acao: "Produto adicionado",
        detalhes: `${data.name} - Categoria: ${finalCategory}${data.weight ? `, Peso: ${data.weight}` : ""}`
      });

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-limits'] });

      if (data.category === "nova" && data.newCategory) {
        setCategories(prev => {
          const newCategories = [...prev, data.newCategory!].sort();
          return Array.from(new Set(newCategories));
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
      
      if (!keepOpen) {
        handleOpenChange(false);
      } else {
        setTimeout(() => {
          document.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
        }, 100);
      }
    } catch (error: any) {
      console.error("Erro ao adicionar produto:", error);
      
      let errorMessage = "Não foi possível adicionar o produto. Tente novamente.";
      
      if (error?.details) errorMessage = error.details;
      else if (error?.message) errorMessage = error.message;
      else if (error?.hint) errorMessage = error.hint;
      else if (error?.error_description) errorMessage = error.error_description;
      else if (typeof error === 'string') errorMessage = error;
      else if (error?.error) errorMessage = error.error;
      
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        errorMessage = "Já existe um produto com este nome e categoria.";
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy') || errorMessage.includes('RLS')) {
        errorMessage = "Você não tem permissão para adicionar produtos. Verifique sua conta.";
      } else if (errorMessage.includes('company_id') || errorMessage.includes('company')) {
        errorMessage = "Erro ao identificar a empresa. Faça login novamente.";
      }
      
      toast({
        title: "Erro ao adicionar produto",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    handleSetOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant' as ScrollBehavior
        });
      }, 0);
      form.reset();
      setProductImage(null);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!isMobile) return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // Shared Header Component
  const Header = (
    <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Package className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            {isMobile ? (
              <DrawerTitle className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                Novo Produto
              </DrawerTitle>
            ) : (
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                Novo Produto
              </DialogTitle>
            )}
          </div>
        </div>
        
        <Button type="button" variant="ghost" size="icon" onClick={() => handleOpenChange(false)}
          className="h-9 w-9 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const content = (
    <>
      {Header}
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-black">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
            {/* Alerta de limite de produtos */}
            <LimitAlert 
              resource="products"
              current={subscriptionLimits.currentProducts}
              max={subscriptionLimits.maxProducts}
            />
            {/* Seção: Informações Básicas */}
            <div className="space-y-3">
              <h3 className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2`}>
                <span className="w-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></span>
                Informações do Produto
              </h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Nome do Produto *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Coxa com Sobrecoxa Congelada"
                        className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
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
                    <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">Marca (Opcional)</FormLabel>
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
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Unidade de Medida *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 dark:text-white`}>
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
                    <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Código de Barras (Opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          placeholder="EAN-13, EAN-8, UPC..."
                          className={`${isMobile ? 'h-11 text-base pr-12' : 'h-9 text-sm pr-10'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                          maxLength={13}
                          onFocus={handleInputFocus}
                        />
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${isMobile ? 'right-4' : ''}`}>
                          <Package className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-400`} />
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
              <h3 className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2`}>
                <span className="w-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></span>
                Foto do Produto
              </h3>
              
              <div className={`space-y-4 ${isMobile ? 'p-3' : 'p-4'} border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900`}>
                <div className="flex items-center justify-between">
                  <Label className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Imagem (Opcional)</Label>
                  {productImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setProductImage(null)}
                      className={`${isMobile ? 'h-8 text-xs' : 'h-7 text-xs'}`}
                    >
                      <Trash2 className={`${isMobile ? 'h-3.5 w-3.5' : 'h-3 w-3'} mr-1`} />
                      Remover
                    </Button>
                  )}
                </div>
                
                {productImage && (
                  <div className={`relative w-full ${isMobile ? 'h-40' : 'h-48'} bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700`}>
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
                      className={`w-full ${isMobile ? 'h-11 text-base' : 'h-9 text-sm'}`}
                      disabled={isUploadingImage}
                      asChild
                    >
                      <div>
                        {isUploadingImage ? (
                          <>
                            <Loader2 className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2 animate-spin`} />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
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
                
                <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400 text-center`}>
                  Formatos aceitos: JPG, PNG, WEBP (máx. 5MB)
                </p>
              </div>
            </div>

            {/* Seção: Categorização */}
            <div className="space-y-3">
              <h3 className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2`}>
                <span className="w-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></span>
                Categorização
              </h3>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-semibold text-gray-600 dark:text-gray-400`}>Categoria do Produto *</FormLabel>
                    <FormControl>
                      <CategorySelectForm 
                        value={field.value}
                        onChange={field.onChange}
                        categories={categories}
                        isLoading={loadingCategories}
                        onCategoryAdded={(newCat) => {
                          setCategories(prev => {
                            const newCategories = [...prev, newCat].sort();
                            return Array.from(new Set(newCategories));
                          });
                          if (onCategoryAdded) onCategoryAdded(newCat);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dica de preenchimento - ocultar no mobile para economizar espaço */}
            {!isMobile && (
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-lg p-3">
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
            )}
          </div>

          {/* Footer com botões */}
          <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-3' : 'px-4 sm:px-5 py-3 sm:py-4'} border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900`}>
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2 justify-end'}`}>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className={`${isMobile ? 'h-11 w-full text-base' : 'h-9 text-sm px-4'} rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white`}
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={() => form.handleSubmit((data) => onSubmit(data, false))()}
                className={`${isMobile ? 'h-11 w-full text-base' : 'h-9 text-sm px-6'} bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm transition-colors duration-200`}
              >
                <Plus className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                Adicionar
              </Button>
              {!isMobile && (
                <Button 
                  type="button"
                  onClick={() => form.handleSubmit((data) => onSubmit(data, true))()}
                  variant="outline"
                  className="h-9 rounded-lg border-orange-500 dark:border-orange-400 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-sm px-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Mais
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        {trigger && (
          <DrawerTrigger asChild>
            {trigger}
          </DrawerTrigger>
        )}
        <DrawerContent 
          className="flex flex-col p-0 gap-0 overflow-hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 transition-all duration-200"
          style={{ 
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            paddingBottom: keyboardOffset > 0 ? 0 : 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleSetOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent hideClose className="w-[90vw] max-w-[520px] h-[85vh] max-h-[700px] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md rounded-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-950 [&>button]:hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
}
