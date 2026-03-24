import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Loader2,
  Package,
  ShoppingBasket,
  Clock,
  Minus,
  ArrowUp,
  Zap,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem } from "@/styles/design-system";
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
  low: {
    label: "Baixa",
    icon: Clock,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  },
  medium: {
    label: "Média",
    icon: Minus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  high: {
    label: "Alta",
    icon: ArrowUp,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  },
  urgent: {
    label: "Urgente",
    icon: Zap,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    badge: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800",
  },
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
      <div className="rounded-xl border border-border bg-card p-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Carregando lista...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <ShoppingBasket className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              Lista vazia
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione produtos para começar sua lista de compras
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="overflow-hidden custom-scrollbar">
      <Table className={designSystem.components.table.root}>
        <TableHeader className={designSystem.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={7} className="px-1 pb-3 pt-0 border-none">
              <div className={designSystem.components.table.headerContainer}>
                <div className="w-[5%] flex items-center">
                  <Checkbox
                    checked={selectedItems.size === items.length && items.length > 0}
                    onCheckedChange={onSelectAll}
                  />
                </div>
                <div className="w-[25%] flex items-center gap-3">
                  <div className={designSystem.components.table.headerIcon}>
                    <Package className="h-4 w-4" />
                  </div>
                  <span className={designSystem.components.table.headerLabel}>Produto</span>
                </div>
                <div className="w-[12%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Qtd</span>
                </div>
                <div className="w-[15%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Prioridade</span>
                </div>
                <div className="w-[13%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Preço Est.</span>
                </div>
                <div className="w-[20%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Observações</span>
                </div>
                <div className="w-[10%] px-2 flex justify-end items-center">
                  <span className={designSystem.components.table.headerLabel}>Ações</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isEditing = editingId === item.id;
            const config = priorityConfig[item.priority];
            const PriorityIcon = config.icon;

            return (
              <TableRow key={item.id} className="group border-none hover:bg-transparent">
                <TableCell colSpan={7} className={designSystem.components.table.cell}>
                  <div className={cn(
                    "flex items-center px-4 py-3 mb-1",
                    designSystem.components.table.row,
                    selectedItems.has(item.id) ? designSystem.components.table.rowActive : ""
                  )}>
                    <div className="w-[5%] flex items-center">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => onToggleSelection(item.id)}
                      />
                    </div>
                    <div className="w-[25%] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">
                          {item.product_name}
                        </p>
                        {item.category && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.category}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="w-[12%] pl-2">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editData.quantity}
                          onChange={(e) =>
                            setEditData({ ...editData, quantity: Number(e.target.value) })
                          }
                          className="w-20 h-8 bg-background"
                        />
                      ) : (
                        <span className="font-medium text-sm text-foreground">
                          {item.quantity}{" "}
                          <span className="text-muted-foreground font-normal">{item.unit}</span>
                        </span>
                      )}
                    </div>
                    <div className="w-[15%] pl-2">
                      {isEditing ? (
                        <Select
                          value={editData.priority}
                          onValueChange={(value) =>
                            setEditData({ ...editData, priority: value })
                          }
                        >
                          <SelectTrigger className="w-28 h-8 bg-background">
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
                        <Badge
                          variant="outline"
                          className={cn("gap-1.5 font-medium text-xs", config.badge)}
                        >
                          <PriorityIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      )}
                    </div>
                    <div className="w-[13%] pl-2">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editData.estimated_price}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              estimated_price: Number(e.target.value),
                            })
                          }
                          className="w-24 h-8 bg-background"
                          placeholder="R$ 0,00"
                        />
                      ) : item.estimated_price ? (
                        <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                          R$ {item.estimated_price.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                    <div className="w-[20%] pl-2">
                      <p className="max-w-[180px] truncate text-sm text-muted-foreground">
                        {item.notes || "-"}
                      </p>
                    </div>
                    <div className="w-[10%] pl-2 flex justify-end">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveEdit(item.id)}
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(item)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg"
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
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
