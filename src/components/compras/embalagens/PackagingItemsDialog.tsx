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
import { Package, Plus, Trash2, Loader2, Edit2, X, Check } from "lucide-react";
import { PACKAGING_CATEGORIES, PACKAGING_REFERENCE_UNITS, PACKAGE_SUB_UNITS } from "@/types/packaging";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PackagingItemsDialog({ open, onOpenChange }: Props) {
  const { items, isLoading, addItem, updateItem, deleteItem } = usePackagingItems();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    reference_unit: "un",
    package_sub_unit: "", // kg ou quantidade quando reference_unit é pacote
    package_quantity: "", // quantidade do pacote
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
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    // Se for pacote, precisa ter a subunidade e quantidade
    if (formData.reference_unit === "pacote" && !formData.package_sub_unit) return;
    if (formData.reference_unit === "pacote" && !formData.package_quantity) return;

    // Monta a unidade de referência final
    let finalReferenceUnit = formData.reference_unit;
    if (formData.reference_unit === "pacote" && formData.package_sub_unit) {
      finalReferenceUnit = `pacote_${formData.package_sub_unit}`; // pacote_kg ou pacote_quantidade
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
    // Parsear a unidade de referência
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
    setShowForm(true);
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
      return quantity ? `Pacote c/ ${quantity} un` : "Pacote (por quantidade)";
    }
    const found = PACKAGING_REFERENCE_UNITS.find(u => u.value === unit);
    return found?.label || unit;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Cadastro de Embalagens
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Formulário */}
          {showForm ? (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg mb-4">
              <div className="space-y-2">
                <Label>Nome da Embalagem *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Sacola Plástica 30x40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKAGING_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unidade de Referência</Label>
                  <Select 
                    value={formData.reference_unit} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, reference_unit: v, package_sub_unit: "" }))}
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
              </div>

              {/* Campo adicional quando pacote é selecionado */}
              {formData.reference_unit === "pacote" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Como o pacote é medido? *</Label>
                    <Select 
                      value={formData.package_sub_unit} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, package_sub_unit: v, package_quantity: "" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione como o pacote é medido" />
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
                      <Label>
                        {formData.package_sub_unit === "kg" 
                          ? "Peso do pacote (kg) *" 
                          : "Quantidade de unidades no pacote *"}
                      </Label>
                      <Input
                        type="number"
                        step={formData.package_sub_unit === "kg" ? "0.01" : "1"}
                        value={formData.package_quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, package_quantity: e.target.value }))}
                        placeholder={formData.package_sub_unit === "kg" ? "Ex: 5 (para 5kg)" : "Ex: 100 (para 100 unidades)"}
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.package_sub_unit === "kg" 
                          ? `O pacote tem ${formData.package_quantity || '?'} kg`
                          : `O pacote tem ${formData.package_quantity || '?'} unidades`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição detalhada da embalagem..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={
                    !formData.name.trim() || 
                    (formData.reference_unit === "pacote" && !formData.package_sub_unit) ||
                    (formData.reference_unit === "pacote" && !formData.package_quantity) ||
                    addItem.isPending || 
                    updateItem.isPending
                  }
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
          ) : (
            <Button 
              onClick={() => setShowForm(true)} 
              className="mb-4 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Embalagem
            </Button>
          )}

          {/* Lista de embalagens */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma embalagem cadastrada</p>
                <p className="text-sm">Clique em "Nova Embalagem" para começar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.category || "Sem categoria"} • {formatReferenceUnit(item.reference_unit, item.package_quantity)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
