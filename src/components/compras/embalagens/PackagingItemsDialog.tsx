import { useState } from "react";
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
import { Package, Plus, Trash2, Loader2, Edit2, X, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { PACKAGING_CATEGORIES, PACKAGING_REFERENCE_UNITS, PACKAGE_SUB_UNITS } from "@/types/packaging";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormStep = "list" | "basic" | "unit" | "details";

export function PackagingItemsDialog({ open, onOpenChange }: Props) {
  const { items, isLoading, addItem, updateItem, deleteItem } = usePackagingItems();
  const [step, setStep] = useState<FormStep>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    reference_unit: "un",
    package_sub_unit: "",
    package_quantity: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      reference_unit: "un",
      package_sub_unit: "",
      package_quantity: "",
    });
    setStep("list");
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    let finalReferenceUnit = formData.reference_unit;
    if (formData.reference_unit === "pacote" && formData.package_sub_unit) {
      finalReferenceUnit = `pacote_${formData.package_sub_unit}`;
    }

    const packageQty = formData.package_quantity ? parseFloat(formData.package_quantity) : null;

    if (editingId) {
      await updateItem.mutateAsync({
        id: editingId,
        name: formData.name,
        category: formData.category || null,
        description: formData.description || null,
        reference_unit: finalReferenceUnit,
        package_quantity: packageQty,
      });
    } else {
      await addItem.mutateAsync({
        name: formData.name,
        category: formData.category || null,
        description: formData.description || null,
        reference_unit: finalReferenceUnit,
        package_quantity: packageQty,
      });
    }

    resetForm();
  };

  const handleEdit = (item: typeof items[0]) => {
    let refUnit = item.reference_unit;
    let subUnit = "";
    
    if (item.reference_unit.startsWith("pacote_")) {
      refUnit = "pacote";
      subUnit = item.reference_unit.replace("pacote_", "");
    }

    setFormData({
      name: item.name,
      category: item.category || "",
      description: item.description || "",
      reference_unit: refUnit,
      package_sub_unit: subUnit,
      package_quantity: item.package_quantity?.toString() || "",
    });
    setEditingId(item.id);
    setStep("basic");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta embalagem?")) {
      await deleteItem.mutateAsync(id);
    }
  };

  const formatReferenceUnit = (unit: string, quantity?: number | null) => {
    if (unit === "pacote_kg") {
      return quantity ? `Pacote de ${quantity}kg` : "Pacote (por kg)";
    }
    if (unit === "pacote_quantidade") {
      return quantity ? `Pacote c/ ${quantity} un` : "Pacote (por qtd)";
    }
    const found = PACKAGING_REFERENCE_UNITS.find(u => u.value === unit);
    return found?.label || unit;
  };

  const canProceedFromBasic = formData.name.trim().length > 0;
  const canProceedFromUnit = formData.reference_unit !== "pacote" || 
    (formData.package_sub_unit && formData.package_quantity);

  // Renderiza a etapa atual
  const renderStep = () => {
    switch (step) {
      case "list":
        return (
          <>
            <Button 
              onClick={() => setStep("basic")} 
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
                <div className="space-y-2 pr-4">
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatReferenceUnit(item.reference_unit, item.package_quantity)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        );

      case "basic":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="flex justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-purple-600" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              </div>
              <p className="text-sm text-muted-foreground">Etapa 1 de 3 - Informações básicas</p>
            </div>

            <div className="space-y-2">
              <Label>Nome da Embalagem *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Sacola Plástica 30x40"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGING_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={resetForm} className="flex-1">
                <X className="h-4 w-4 mr-2" />Cancelar
              </Button>
              <Button onClick={() => setStep("unit")} disabled={!canProceedFromBasic} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Próximo<ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case "unit":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="flex justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-purple-600" />
                <div className="w-3 h-3 rounded-full bg-purple-600" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              </div>
              <p className="text-sm text-muted-foreground">Etapa 2 de 3 - Unidade de medida</p>
            </div>

            <div className="space-y-2">
              <Label>Unidade de Referência *</Label>
              <Select 
                value={formData.reference_unit} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, reference_unit: v, package_sub_unit: "", package_quantity: "" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGING_REFERENCE_UNITS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.reference_unit === "pacote" && (
              <>
                <div className="space-y-2">
                  <Label>Como o pacote é medido? *</Label>
                  <Select 
                    value={formData.package_sub_unit} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, package_sub_unit: v, package_quantity: "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKAGE_SUB_UNITS.map(u => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.package_sub_unit && (
                  <div className="space-y-2">
                    <Label>{formData.package_sub_unit === "kg" ? "Peso do pacote (kg) *" : "Quantidade no pacote *"}</Label>
                    <Input
                      type="number"
                      step={formData.package_sub_unit === "kg" ? "0.01" : "1"}
                      value={formData.package_quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, package_quantity: e.target.value }))}
                      placeholder={formData.package_sub_unit === "kg" ? "Ex: 5" : "Ex: 100"}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("basic")} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />Voltar
              </Button>
              <Button onClick={() => setStep("details")} disabled={!canProceedFromUnit} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Próximo<ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case "details":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="flex justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-purple-600" />
                <div className="w-3 h-3 rounded-full bg-purple-600" />
                <div className="w-3 h-3 rounded-full bg-purple-600" />
              </div>
              <p className="text-sm text-muted-foreground">Etapa 3 de 3 - Finalizar</p>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="font-medium">{formData.name}</p>
              <p className="text-sm text-muted-foreground">
                {formData.category || "Sem categoria"} • {formatReferenceUnit(
                  formData.reference_unit === "pacote" ? `pacote_${formData.package_sub_unit}` : formData.reference_unit,
                  formData.package_quantity ? parseFloat(formData.package_quantity) : null
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição detalhada..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("unit")} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />Voltar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={addItem.isPending || updateItem.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {(addItem.isPending || updateItem.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {editingId ? "Atualizar" : "Cadastrar"}
              </Button>
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
