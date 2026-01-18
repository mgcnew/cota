import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Trash2, 
  X, 
  Search, 
  Package, 
  ListTodo, 
  Save, 
  ChevronRight, 
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Info
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";

// Schema de validação com Zod
const listItemSchema = z.object({
  nome: z.string()
    .min(2, "O nome do item deve ter pelo menos 2 caracteres")
    .max(50, "O nome do item é muito longo"),
  quantidade: z.coerce.number()
    .min(0.01, "A quantidade deve ser maior que zero")
    .max(999999, "Quantidade excessiva"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
});

const listSchema = z.object({
  nome: z.string()
    .min(3, "O nome da lista deve ter pelo menos 3 caracteres")
    .max(40, "O nome da lista pode ter no máximo 40 caracteres"),
  itens: z.array(listItemSchema).min(1, "A lista precisa ter pelo menos um item"),
});

type ListFormValues = z.infer<typeof listSchema>;

const unidadesMedida = [
  { value: "un", label: "Unidade" },
  { value: "kg", label: "Kilograma" },
  { value: "cx", label: "Caixa" },
  { value: "pc", label: "Pacote" },
  { value: "L", label: "Litro" },
  { value: "dz", label: "Dúzia" },
  { value: "pct", label: "Pacotinho" },
  { value: "g", label: "Grama" },
  { value: "ml", label: "Mililitro" },
];

interface AddListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ListFormValues) => void;
}

export default function AddListDialog({ open, onOpenChange, onSave }: AddListDialogProps) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<1 | 2>(1);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const itemInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ListFormValues>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      nome: "",
      itens: [],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens",
  });

  // Estado para o novo item que está sendo digitado
  const [newItem, setNewItem] = useState({ nome: "", quantidade: 1, unidade: "un" });

  const isDirty = form.formState.isDirty || fields.length > 0;

  const handleClose = () => {
    if (isDirty) {
      setShowConfirmCancel(true);
    } else {
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    form.reset();
    setStep(1);
    setNewItem({ nome: "", quantidade: 1, unidade: "un" });
  };

  const handleSave = (data: ListFormValues) => {
    onSave(data);
    toast({
      title: "Lista criada com sucesso!",
      description: `A lista "${data.nome}" com ${data.itens.length} itens foi salva.`,
    });
    onOpenChange(false);
    resetForm();
  };

  const handleAddItem = () => {
    if (newItem.nome.trim().length < 2) {
      toast({
        variant: "destructive",
        title: "Nome do item inválido",
        description: "O item precisa de pelo menos 2 caracteres.",
      });
      return;
    }
    append({ ...newItem });
    setNewItem({ nome: "", quantidade: 1, unidade: "un" });
    itemInputRef.current?.focus();
  };

  // Auto-foco ao abrir ou mudar de etapa
  useEffect(() => {
    if (open) {
      if (step === 1) {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      } else {
        setTimeout(() => itemInputRef.current?.focus(), 100);
      }
    }
  }, [open, step]);

  const headerContent = (
    <div className="flex items-center gap-5 relative z-10">
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-500 ring-1 ring-white/20",
        step === 1 
          ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20" 
          : "bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/20"
      )}>
        {step === 1 ? <ListTodo className="h-7 w-7" /> : <ClipboardList className="h-7 w-7" />}
      </div>
      <div className="space-y-1">
        <DialogTitle className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {step === 1 ? "Nova Lista de Compras" : "Adicionar Itens"}
        </DialogTitle>
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-1.5 w-1.5 rounded-full animate-pulse",
            step === 1 ? "bg-blue-500" : "bg-teal-500"
          )} />
          <DialogDescription className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em]">
            {step === 1 ? "Defina o nome da sua lista" : `Lista: ${form.getValues("nome")}`}
          </DialogDescription>
        </div>
      </div>
    </div>
  );

  const footerContent = (
    <div className="flex items-center justify-between w-full gap-4">
      <Button 
        variant="outline" 
        onClick={handleClose}
        className="h-12 px-6 border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/5 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all rounded-2xl backdrop-blur-md shadow-sm"
      >
        Cancelar
      </Button>
      
      {step === 1 ? (
        <Button 
          onClick={async () => {
            const isValid = await form.trigger("nome");
            if (isValid) setStep(2);
          }}
          className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] rounded-2xl ring-1 ring-white/20"
        >
          Próximo Passo
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button 
          onClick={form.handleSubmit(handleSave)}
          disabled={fields.length === 0}
          className="h-12 px-8 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98] rounded-2xl ring-1 ring-white/20 disabled:opacity-50 disabled:grayscale"
        >
          <Save className="h-4 w-4 mr-2" />
          Finalizar Lista
        </Button>
      )}
    </div>
  );

  const mainContent = (
    <Form {...form}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {step === 1 ? (
          <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem className="space-y-5">
                  <div className="flex items-center justify-between px-1">
                    <FormLabel className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Nome da Lista</FormLabel>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black tracking-widest px-2.5 py-1 rounded-lg border-white/20 shadow-sm",
                      field.value.length > 35 ? "text-red-500 bg-red-500/5 border-red-500/20" : "text-gray-400 bg-white/50 dark:bg-black/20"
                    )}>
                      {field.value.length}/40
                    </Badge>
                  </div>
                  <FormControl>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20 group-focus-within:scale-110 group-focus-within:shadow-lg group-focus-within:shadow-blue-500/20 transition-all duration-500">
                        <ListTodo className="h-6 w-6" />
                      </div>
                      <Input 
                        {...field} 
                        ref={nameInputRef}
                        placeholder="Ex: Rancho Mensal, Churrasco Fim de Ano..." 
                        className="h-20 pl-20 text-xl bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-black rounded-[2rem] focus:ring-blue-500/20 focus:border-blue-500/40 transition-all shadow-2xl shadow-blue-500/5 placeholder:text-gray-400/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            form.trigger("nome").then(isValid => isValid && setStep(2));
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 pl-2" />
                  
                  <div className="relative group overflow-hidden rounded-[2rem] p-0.5">
                    <div className="absolute inset-0 bg-blue-500/20 opacity-40"></div>
                    <div className="relative flex items-start gap-4 p-6 bg-blue-500/5 dark:bg-blue-950/10 border border-blue-500/30 dark:border-blue-500/10 backdrop-blur-2xl rounded-[1.9rem]">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-sm">
                        <Info className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-1">Dica de Organização</p>
                        <p className="text-xs text-blue-600 dark:text-blue-500/70 font-bold leading-relaxed uppercase tracking-tight">
                          Escolha um nome que ajude a identificar rapidamente o propósito desta lista para futuras consultas.
                        </p>
                      </div>
                    </div>
                  </div>
                </FormItem>
              )}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700 relative z-10">
            {/* Input de Adicionar Item Semiglass */}
            <div className="px-8 py-8 bg-white/40 dark:bg-black/30 border-b border-white/10 backdrop-blur-xl">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 sm:col-span-7">
                  <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Produto</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 transition-transform group-focus-within:scale-110">
                      <Package className="h-4 w-4" />
                    </div>
                    <Input 
                      ref={itemInputRef}
                      placeholder="Nome do produto..." 
                      value={newItem.nome}
                      onChange={e => setNewItem(prev => ({ ...prev, nome: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                      className="h-12 pl-14 bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-bold rounded-2xl focus:ring-teal-500/20 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Qtd</label>
                  <Input 
                    type="number"
                    value={newItem.quantidade}
                    onChange={e => setNewItem(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                    className="h-12 bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-black rounded-2xl text-center focus:ring-teal-500/20 shadow-sm"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3 flex items-end">
                  <Button 
                    onClick={handleAddItem}
                    className="w-full h-12 bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl shadow-teal-500/20 transition-all active:scale-95 ring-1 ring-white/20"
                  >
                    <Plus className="h-5 w-5 mr-2" /> Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Itens com Scroll e Preview Semiglass */}
            <ScrollArea className="flex-1 custom-scrollbar">
              <div className="p-8 space-y-4">
                {fields.length === 0 ? (
                  <div className="py-24 text-center flex flex-col items-center justify-center border-2 border-dashed border-white/30 dark:border-white/10 rounded-[3rem] bg-white/10 backdrop-blur-xl group hover:border-teal-500/40 transition-all duration-700 shadow-inner">
                    <div className="w-24 h-24 rounded-[2rem] bg-gray-500/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 group-hover:bg-teal-500/10 group-hover:shadow-2xl group-hover:shadow-teal-500/5 transition-all duration-700">
                      <ListTodo className="h-12 w-12 opacity-10 group-hover:opacity-60 group-hover:text-teal-500 transition-all duration-500" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-gray-400 dark:text-gray-500 opacity-60">Sua lista está vazia</p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 mt-3 uppercase tracking-[0.2em] opacity-40">Adicione produtos acima para começar a montar sua lista</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="group animate-in zoom-in-95 duration-500 hover:scale-[1.01] transition-all">
                        <div className="flex items-center justify-between p-5 bg-white/50 dark:bg-gray-900/50 rounded-3xl border border-white/40 dark:border-white/10 backdrop-blur-2xl shadow-sm group-hover:border-teal-500/40 group-hover:shadow-xl group-hover:shadow-teal-500/5 transition-all duration-300 ring-1 ring-transparent hover:ring-white/20">
                          <div className="flex items-center gap-5 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 group-hover:scale-110 group-hover:shadow-lg transition-all flex-shrink-0">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-black text-base text-gray-900 dark:text-white truncate block tracking-tight">{field.nome}</span>
                              <div className="flex items-center gap-3 mt-1.5">
                                <Badge variant="secondary" className="h-6 px-3 text-[10px] font-black bg-teal-500/10 text-teal-600 dark:text-teal-400 border-none rounded-lg ring-1 ring-teal-500/20 shadow-sm">
                                  {field.quantidade} {field.unidade}
                                </Badge>
                                <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Item #{fields.length - index}</span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => remove(index)}
                            className="h-12 w-12 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20 shadow-sm"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    )).reverse()}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Resumo no rodapé da lista Semiglass */}
            <div className="px-8 py-5 bg-white/30 dark:bg-black/30 border-t border-white/10 backdrop-blur-xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent pointer-events-none"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-white/5 rounded-full border border-white/20 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Total de Itens: {fields.length}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep(1)}
                className="h-10 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-500/10 rounded-xl transition-all border border-transparent hover:border-blue-500/20 relative z-10"
              >
                Voltar ao Nome
              </Button>
            </div>
          </div>
        )}
      </div>
    </Form>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={handleClose}>
          <DrawerContent className="max-h-[95vh] overflow-hidden flex flex-col !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl border-t border-white/20 rounded-t-[2.5rem] shadow-2xl">
            <DrawerHeader className="text-left border-b border-white/10 bg-white/30 dark:bg-white/5 px-6 py-5 backdrop-blur-md">
              {headerContent}
            </DrawerHeader>
            <div className="flex-1 overflow-hidden flex flex-col">
              {mainContent}
            </div>
            <DrawerFooter className="border-t border-white/10 bg-white/40 dark:bg-gray-950/40 px-6 py-5 backdrop-blur-2xl">
              {footerContent}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <ConfirmCancelDialog 
          open={showConfirmCancel} 
          onOpenChange={setShowConfirmCancel} 
          onConfirm={() => {
            setShowConfirmCancel(false);
            onOpenChange(false);
            resetForm();
          }} 
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[650px] w-[95vw] h-[80vh] max-h-[600px] p-0 overflow-hidden !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 flex flex-col shadow-2xl rounded-[2.5rem] [&>button]:hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="flex-shrink-0 px-8 py-6 border-b border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md flex items-center justify-between">
            {headerContent}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              className="h-10 w-10 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {mainContent}
          </div>

          <div className="flex-shrink-0 px-8 py-5 border-t border-white/20 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl">
            {footerContent}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmCancelDialog 
        open={showConfirmCancel} 
        onOpenChange={setShowConfirmCancel} 
        onConfirm={() => {
          setShowConfirmCancel(false);
          onOpenChange(false);
          resetForm();
        }} 
      />
    </>
  );
}

function ConfirmCancelDialog({ open, onOpenChange, onConfirm }: { open: boolean, onOpenChange: (o: boolean) => void, onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[450px] rounded-[2.5rem] border-white/30 dark:border-white/10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
        <AlertDialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <AlertDialogTitle className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Descartar Alterações?
              </AlertDialogTitle>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Ação Irreversível</span>
              </div>
            </div>
          </div>
          <AlertDialogDescription className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-tight pt-2">
            Você tem dados inseridos nesta lista. Se fechar agora, todas as informações serão perdidas permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-4 pt-8">
          <AlertDialogCancel className="h-14 px-8 border-white/30 dark:border-white/10 bg-white/5 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all backdrop-blur-md shadow-sm">
            Continuar Editando
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="h-14 px-10 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-500/20 transition-all active:scale-95 ring-1 ring-white/20"
          >
            Descartar e Sair
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
