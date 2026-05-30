import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePackagingItems } from "@/hooks/usePackagingItems";
import { Package, Plus, Trash2, Loader2, Pencil, X, Check, ArrowLeft, Search, Box } from "lucide-react";
import { PACKAGING_CATEGORIES, PACKAGING_REFERENCE_UNITS, type PackagingItem } from "@/types/packaging";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormStep = "list" | "form";

const SEARCH_THRESHOLD = 6;

const emptyForm = { name: "", category: "", description: "", reference_unit: "un" };

export function PackagingItemsDialog({ open, onOpenChange }: Props) {
  const { items, isLoading, addItem, updateItem, deleteItem } = usePackagingItems();
  const [step, setStep] = useState<FormStep>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Foco automático no campo nome ao abrir o formulário
  useEffect(() => {
    if (step === "form" && open) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [step, open]);

  const formatReferenceUnit = (unit: string) =>
    PACKAGING_REFERENCE_UNITS.find((u) => u.value === unit)?.label || unit;

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.category?.toLowerCase().includes(q) ?? false)
    );
  }, [items, search]);

  const showSearch = items.length > SEARCH_THRESHOLD;
  const canSubmit = formData.name.trim().length > 0;
  const isSaving = addItem.isPending || updateItem.isPending;

  const resetForm = () => {
    setFormData(emptyForm);
    setStep("list");
    setEditingId(null);
  };

  const handleSubmit = async (createMore = false) => {
    if (!canSubmit) return;

    const payload = {
      name: formData.name.trim(),
      category: formData.category || null,
      description: formData.description || null,
      reference_unit: formData.reference_unit,
    };

    if (editingId) {
      await updateItem.mutateAsync({ id: editingId, ...payload });
      resetForm();
    } else {
      await addItem.mutateAsync(payload);
      if (createMore) {
        setFormData(emptyForm);
        setTimeout(() => nameInputRef.current?.focus(), 100);
      } else {
        resetForm();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (canSubmit) handleSubmit(false);
    } else if (e.key === "Escape" && step === "form") {
      e.preventDefault();
      resetForm();
    }
  };

  const handleEdit = (item: PackagingItem) => {
    setFormData({
      name: item.name,
      category: item.category || "",
      description: item.description || "",
      reference_unit: item.reference_unit,
    });
    setEditingId(item.id);
    setStep("form");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); setSearch(""); } onOpenChange(v); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden max-h-[88vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border dark:border-white/5 space-y-0">
          <div className="flex items-center gap-3">
            {step === "form" && (
              <button
                onClick={resetForm}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex-shrink-0"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
              <Package className="h-[18px] w-[18px] text-brand" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-base font-bold text-foreground">
                {step === "list" ? "Gestão de Itens" : editingId ? "Editar Embalagem" : "Nova Embalagem"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === "list"
                  ? "Gerencie os itens de embalagem disponíveis"
                  : "Preencha os dados da embalagem"}
              </p>
            </div>
            {step === "list" && !isLoading && items.length > 0 && (
              <span className="flex-shrink-0 inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground tabular-nums">
                {items.length}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* ─── LIST ─── */}
        {step === "list" && (
          <>
            <div className="px-5 pt-4 space-y-3 flex-shrink-0">
              <Button onClick={() => setStep("form")} className="w-full bg-brand hover:bg-brand/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nova Embalagem
              </Button>

              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou categoria..."
                    className="pl-9 pr-9"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0 space-y-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border dark:border-white/5">
                    <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : filteredItems.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Box className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {search ? "Nenhum item encontrado" : "Nenhuma embalagem cadastrada"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {search ? `Sem resultados para "${search}"` : "Use o botão acima para adicionar a primeira"}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-border dark:border-white/5 bg-card hover:border-brand/30 hover:shadow-sm transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-[18px] w-[18px] text-brand" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate leading-tight">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-flex items-center rounded-full bg-brand/10 text-brand text-[10px] font-bold px-2 py-0.5">
                          {formatReferenceUnit(item.reference_unit)}
                        </span>
                        {item.category && (
                          <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5">
                            {item.category}
                          </span>
                        )}
                        {item.description && (
                          <span className="text-[11px] text-muted-foreground/80 truncate">{item.description}</span>
                        )}
                      </div>
                    </div>

                    {/* Ações: sempre visíveis no mobile, hover no desktop */}
                    <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-brand hover:bg-brand/10"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir embalagem?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir "{item.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteItem.mutateAsync(item.id)}
                              className="bg-destructive hover:bg-destructive/90 text-white"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border dark:border-white/5 bg-muted/20 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-muted-foreground">
                {showSearch && search
                  ? `${filteredItems.length} de ${items.length} ${items.length === 1 ? "item" : "itens"}`
                  : `${items.length} ${items.length === 1 ? "item cadastrado" : "itens cadastrados"}`}
              </span>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
            </div>
          </>
        )}

        {/* ─── FORM ─── */}
        {step === "form" && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0" onKeyDown={handleKeyDown}>
            <div className="space-y-1.5">
              <Label>Nome da Embalagem <span className="text-brand">*</span></Label>
              <Input
                ref={nameInputRef}
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Sacola Plástica 30x40"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unidade de Referência <span className="text-brand">*</span></Label>
                <Select value={formData.reference_unit} onValueChange={(v) => setFormData((p) => ({ ...p, reference_unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[220px]">
                    {PACKAGING_REFERENCE_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {PACKAGING_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descrição detalhada..."
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={!canSubmit || isSaving}
                  className="flex-1 bg-brand hover:bg-brand/90 text-white"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {editingId ? "Atualizar" : "Salvar"}
                </Button>
              </div>

              {!editingId && (
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={!canSubmit || isSaving}
                  className="w-full border-brand/20 text-brand hover:bg-brand/5 hover:text-brand"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Salvar e Criar Mais
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground pt-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+Enter</kbd> salvar
                {" · "}
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd> cancelar
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
