import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ShoppingListItem } from "@/hooks/useShoppingList";

interface ShoppingListTableProps {
  items: ShoppingListItem[];
  isLoading: boolean;
  selectedItems: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (data: any) => Promise<void>;
}

const priorityConfig = {
  low: { label: "Baixa", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  medium: { label: "Média", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

export function ShoppingListTable({
  items,
  isLoading,
  selectedItems,
  onToggleSelection,
  onSelectAll,
  onDelete,
  onUpdate,
}: ShoppingListTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const handleStartEdit = (item: ShoppingListItem) => {
    setEditingId(item.id);
    setEditData({
      quantity: item.quantity,
      priority: item.priority,
      estimated_price: item.estimated_price || 0,
    });
  };

  const handleSaveEdit = async (id: string) => {
    await onUpdate({ id, ...editData });
    setEditingId(null);
    setEditData({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Nenhum produto na lista</p>
          <p className="text-sm">Adicione produtos para começar sua lista de compras</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedItems.size === items.length && items.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Preço Est.</TableHead>
            <TableHead>Observações</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isEditing = editingId === item.id;
            const config = priorityConfig[item.priority];

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => onToggleSelection(item.id)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    {item.category && (
                      <div className="text-xs text-muted-foreground">{item.category}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={editData.quantity}
                      onChange={(e) => setEditData({ ...editData, quantity: Number(e.target.value) })}
                      className="w-24"
                    />
                  ) : (
                    <span>
                      {item.quantity} {item.unit}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select
                      value={editData.priority}
                      onValueChange={(value) => setEditData({ ...editData, priority: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={config.color}>{config.label}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editData.estimated_price}
                      onChange={(e) => setEditData({ ...editData, estimated_price: Number(e.target.value) })}
                      className="w-28"
                      placeholder="R$ 0,00"
                    />
                  ) : (
                    item.estimated_price ? `R$ ${item.estimated_price.toFixed(2)}` : "-"
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate text-sm text-muted-foreground">
                    {item.notes || "-"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(item.id)}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Deseja remover este item?")) {
                            onDelete(item.id);
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
