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
import { Package } from "lucide-react";

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
  const { toast } = useToast();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      newCategory: "",
      weight: "",
    },
  });

  const availableCategories = categories.filter(cat => cat !== "all");

  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        category: product.category,
        newCategory: "",
        weight: product.weight === "N/A" ? "" : product.weight,
      });
      setShowNewCategory(false);
    }
  }, [product, open, form]);

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
      weight: data.weight || "N/A",
      lastUpdate: new Date().toLocaleDateString('pt-BR'),
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
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Peso/Quantidade (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: 500kg, 15 metades"
                      className="bg-white dark:bg-gray-900/40 dark:border-gray-700/60 dark:text-gray-200"
                      {...field}
                    />
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