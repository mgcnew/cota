import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
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
  X,
  Plus,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const isMobile = useIsMobile();
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

  // Conteúdo interno do modal (compartilhado entre Dialog e Drawer)
  const modalInnerContent = (
    <>
      {/* Header com design semiglass */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-white/10 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
              <Edit3 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Editar Item
              </DialogTitle>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <DialogDescription className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em]">
                  Atualize as informações do produto
                </DialogDescription>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)} 
            className="h-12 w-12 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/20 shadow-sm"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Product Info Semiglass */}
      <div className="px-8 py-4 bg-white/40 dark:bg-gray-900/40 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20 shadow-sm">
            <Package className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg text-gray-900 dark:text-white truncate tracking-tight">
              {item.product_name}
            </p>
            {item.category && (
              <Badge variant="secondary" className="h-5 px-2 text-[9px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none rounded-md ring-1 ring-blue-500/20 mt-1">
                {item.category}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
          <ScrollArea className="flex-1 custom-scrollbar">
            <div className="p-8 space-y-8 relative z-10">
              {/* Quantity Semiglass */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <FormLabel className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Quantidade</FormLabel>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-white/20 bg-white/50 dark:bg-black/20 text-gray-400">
                        {item.unit || "unidades"}
                      </Badge>
                    </div>
                    <FormControl>
                      <div className="flex items-center justify-center gap-6 bg-white/40 dark:bg-gray-900/40 p-6 rounded-[2rem] border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-xl shadow-blue-500/5 ring-1 ring-white/20">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const currentVal = Number(field.value) || 0;
                            field.onChange(Math.max(0.5, currentVal - 1));
                          }}
                          className="h-14 w-14 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-white/10 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700 hover:border-blue-500/20 transition-all shadow-sm active:scale-90"
                        >
                          <Minus className="w-6 h-6" />
                        </Button>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="text-center text-4xl font-black h-20 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const currentVal = Number(field.value) || 0;
                            field.onChange(currentVal + 1);
                          }}
                          className="h-14 w-14 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-white/10 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700 hover:border-blue-500/20 transition-all shadow-sm active:scale-90"
                        >
                          <Plus className="w-6 h-6" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] font-black uppercase tracking-widest text-red-500 pl-2" />
                  </FormItem>
                )}
              />

              {/* Priority Semiglass */}
              <div className="space-y-4">
                <FormLabel className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Prioridade</FormLabel>
                <div className="grid grid-cols-4 gap-3">
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
                          "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group/prio",
                          isSelected
                            ? cn(config.bg, "border-current shadow-lg shadow-blue-500/5 ring-1 ring-white/20", config.color)
                            : "bg-white/40 dark:bg-gray-900/40 border-white/40 dark:border-white/10 hover:border-blue-500/40 text-gray-500"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                          isSelected ? "bg-white/20 shadow-inner" : "bg-gray-500/5 group-hover/prio:scale-110"
                        )}>
                          <Icon className={cn("w-5 h-5", isSelected ? config.color : "text-gray-400")} />
                        </div>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          isSelected ? config.color : "text-gray-400"
                        )}>
                          {config.label}
                        </span>
                        {isSelected && (
                          <div className="absolute right-1 top-1">
                            <Check className={cn("w-3 h-3", config.color)} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Price Semiglass */}
              <FormField
                control={form.control}
                name="estimated_price"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">
                      Preço Estimado <span className="text-[8px] opacity-50">(OPCIONAL)</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20 group-focus-within:scale-110 transition-transform">
                          <span className="text-[10px] font-black">R$</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value ?? ""}
                          className="h-14 pl-16 bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-black text-lg rounded-2xl focus:ring-emerald-500/20 transition-all shadow-sm"
                          placeholder="0,00"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes Semiglass */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <FormLabel className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                        Observações <span className="text-[8px] opacity-50">(OPCIONAL)</span>
                      </FormLabel>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{(field.value || "").length}/500</span>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Ex: Preferência por marca específica..."
                        rows={3}
                        maxLength={500}
                        className="resize-none bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-medium rounded-2xl p-5 focus:ring-blue-500/20 transition-all shadow-sm min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ScrollArea>

          {/* Footer Semiglass */}
          <div className="flex-shrink-0 px-8 py-6 border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl flex gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none"></div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-14 px-8 border-white/30 dark:border-white/10 bg-white/5 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all backdrop-blur-md shadow-sm relative z-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="flex-[2] h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 rounded-2xl transition-all active:scale-[0.98] ring-2 ring-white/20 relative overflow-hidden group z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-3" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh] overflow-hidden flex flex-col !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl border-t border-white/20 rounded-t-[2.5rem] shadow-2xl">
          {modalInnerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 flex flex-col shadow-2xl rounded-[2.5rem] [&>button]:hidden animate-in fade-in zoom-in-95 duration-300">
        {modalInnerContent}
      </DialogContent>
    </Dialog>
  );
}
