import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePackagingItems } from "@/hooks/usePackagingItems";
import { Package, Plus, Trash2, Loader2, Edit2, X, Check, ArrowLeft } from "lucide-react";
import { PACKAGING_CATEGORIES, PACKAGING_REFERENCE_UNITS } from "@/types/packaging";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormStep = "list" | "form";

export function PackagingItemsDialog({ open, onOpenChange }: Props) {
  const { items, isLoading, addItem, updateItem, deleteItem } = usePackagingItems();
  const [step, setStep] = useState<FormStep>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    reference_unit: "un",
  });
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Foco automático no campo nome quando abrir o formulário
  useEffect(() => {
    if (step === "form" && open) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [step, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      reference_unit: "un",
    });
    setStep("list");
    setEditingId(null);
  };

  const handleSubmit = async (createMore: boolean = false) => {
    if (!formData.name.trim()) return;

    if (editingId) {
      await updateItem.mutateAsync({
        id: editingId,
        name: formData.name,
        category: formData.category || null,
        description: formData.description || null,
        reference_unit: formData.reference_unit,
      });
      resetForm();
    } else {
      await addItem.mutateAsync({
        name: formData.name,
        category: formData.category || null,
        description: formData.description || null,
        reference_unit: formData.reference_unit,
      });
      
      if (createMore) {
        // Limpa apenas o formulário, mantém na tela de criação
        setFormData({
          name: "",
          category: "",
          description: "",
          reference_unit: "un",
        });
        // Foca no campo nome novamente
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 100);
      } else {
        resetForm();
      }
    }
  };

  // Atalho de teclado: Enter para salvar, Esc para cancelar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (canSubmit) {
        handleSubmit(false);
      }
    } else if (e.key === "Escape" && step === "form") {
      e.preventDefault();
      resetForm();
    }
  };

  const handleEdit = (item: typeof items[0]) => {
    setFormData({
      name: item.name,
      category: item.category || "",
      description: item.description || "",
      reference_unit: item.reference_unit,
    });
    setEditingId(item.id);
    setStep("form");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta embalagem?")) {
      await deleteItem.mutateAsync(id);
    }
  };

  const formatReferenceUnit = (unit: string) => {
    const found = PACKAGING_REFERENCE_UNITS.find(u => u.value === unit);
    return found?.label || unit;
  };

  const canSubmit = formData.name.trim().length > 0;

  const renderStep = () => {
    switch (step) {
      case "list":
        return (
          <>
            <Button 
              onClick={() => setStep("form")} 
              className="w-full mb-4 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Embalagem
            </Button>

            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma embalagem cadastrada</p>
                </div>
              ) : (
                <div className="space-y-3 pr-2 pb-2">
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "group relative overflow-hidden transition-all duration-300",
                        "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md",
                        "rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50",
                        "shadow-sm hover:shadow-md hover:border-purple-500/30",
                        "p-4 flex flex-col gap-3"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 text-purple-600">
                            <Package className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[14px] text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50" 
                            onClick={() => handleEdit(item)}
                          >
                            <Edit2 className="h-4 w-4 text-zinc-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl border-zinc-200 dark:border-zinc-800 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 bg-white/50 dark:bg-zinc-900/50" 
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                        <Badge 
                          variant="secondary" 
                          className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full border-none"
                        >
                          {formatReferenceUnit(item.reference_unit)}
                        </Badge>
                        {item.category && (
                          <Badge 
                            variant="secondary" 
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border-none"
                          >
                            {item.category}
                          </Badge>
                        )}
                        <span className="ml-auto text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                          Ref: {item.id.slice(0, 4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        );

      case "form":
        return (
          <div className="space-y-4" onKeyDown={handleKeyDown}>
            <div className="space-y-2">
              <Label>Nome da Embalagem *</Label>
              <Input
                ref={nameInputRef}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Sacola Plástica 30x40"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Unidade de Referência *</Label>
                <Select 
                  value={formData.reference_unit} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, reference_unit: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {PACKAGING_REFERENCE_UNITS.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGING_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição detalhada..."
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={() => handleSubmit(false)} 
                  disabled={!canSubmit || addItem.isPending || updateItem.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {(addItem.isPending || updateItem.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {editingId ? "Atualizar" : "Salvar"}
                </Button>
              </div>
              
              {!editingId && (
                <Button 
                  onClick={() => handleSubmit(true)} 
                  disabled={!canSubmit || addItem.isPending || updateItem.isPending}
                  variant="outline"
                  className="w-full border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Salvar e Criar Mais
                </Button>
              )}
              
              <p className="text-xs text-center text-muted-foreground">
                Atalhos: <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+Enter</kbd> para salvar • <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd> para cancelar
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            {step === "list" ? "Embalagens" : editingId ? "Editar Embalagem" : "Nova Embalagem"}
          </DialogTitle>
        </DialogHeader>

        {renderStep()}

        {step === "list" && (
          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
