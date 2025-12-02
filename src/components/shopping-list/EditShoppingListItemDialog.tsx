import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Package,
  Edit3,
  Clock,
  Minus,
  ArrowUp,
  Zap,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  quantity: z.coerce.number().min(0.01, "Quantidade deve ser maior que 0"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  notes: z.string().optional(),
  estimated_price: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;
type Priority = "low" | "medium" | "high" | "urgent";

interface EditShoppingListItemDialogProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: any) => Promise<void>;
}

const priorityConfig: Record<Priority, { label: string; icon: any; color: string; bg: string }> = {
  low: {
    label: "Baixa",
    icon: Clock,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600",
  },
  medium: {
    label: "Média",
    icon: Minus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-300 dark:border-blue-700",
  },
  high: {
    label: "Alta",
    icon: ArrowUp,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-orange-300 dark:border-orange-700",
  },
  urgent: {
    label: "Urgente",
    icon: Zap,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-300 dark:border-red-700",
  },
};

export function EditShoppingListItemDialog({
  item,
  open,
  onOpenChange,
  onUpdate,
}: EditShoppingListItemDialogProps) {
  const [selectedPriority, setSelectedPriority] = useState<Priority>("medium");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: item?.quantity || 1,
      priority: item?.priority || "medium",
      notes: item?.notes || "",
      estimated_price: item?.estimated_price || 0,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        quantity: item.quantity || 1,
        priority: item.priority || "medium",
        notes: item.notes || "",
        estimated_price: item.estimated_price || 0,
      });
      setSelectedPriority(item.priority || "medium");
    }
  }, [item, form]);

  const onSubmit = async (data: FormData) => {
    try {
      await onUpdate({
        id: item.id,
        ...data,
        priority: selectedPriority,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <DialogHeader className="p-0 space-y-1">
                <DialogTitle className="text-xl font-bold text-white">
                  Editar Item
                </DialogTitle>
                <DialogDescription className="text-blue-100">
                  Atualize as informações do produto
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {item.product_name}
              </p>
              {item.category && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {item.category}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Quantidade</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? "" : e.target.value)
                        }
                        className="flex-1 text-lg font-semibold"
                      />
                      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
                        {item.unit}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <div className="space-y-3">
              <FormLabel className="text-sm font-medium">Prioridade</FormLabel>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(priorityConfig) as Priority[]).map((key) => {
                  const config = priorityConfig[key];
                  const Icon = config.icon;
                  const isSelected = selectedPriority === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPriority(key)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                        isSelected
                          ? cn(config.bg, "border-current ring-2 ring-offset-2", config.color)
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isSelected ? config.color : "text-gray-400")} />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isSelected ? config.color : "text-gray-500"
                        )}
                      >
                        {config.label}
                      </span>
                      {isSelected && <Check className={cn("w-3 h-3", config.color)} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estimated Price */}
            <FormField
              control={form.control}
              name="estimated_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Preço Estimado (opcional)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        R$
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : e.target.value)
                        }
                        className="pl-10"
                        placeholder="0,00"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Observações (opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ex: Preferência por marca específica..."
                      rows={2}
                      maxLength={500}
                      className="resize-none"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-400 text-right">
                    {(field.value || "").length}/500
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
