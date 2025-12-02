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
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando lista...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-12">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
            <ShoppingBasket className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Lista vazia
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Adicione produtos para começar sua lista de compras
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedItems.size === items.length && items.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="font-semibold">Produto</TableHead>
            <TableHead className="font-semibold">Quantidade</TableHead>
            <TableHead className="font-semibold">Prioridade</TableHead>
            <TableHead className="font-semibold">Preço Est.</TableHead>
            <TableHead className="font-semibold">Observações</TableHead>
            <TableHead className="text-right font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isEditing = editingId === item.id;
            const config = priorityConfig[item.priority];
            const PriorityIcon = config.icon;

            return (
              <TableRow
                key={item.id}
                className={cn(
                  "group transition-colors",
                  selectedItems.has(item.id) && "bg-blue-50/50 dark:bg-blue-950/20"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => onToggleSelection(item.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {item.product_name}
                      </p>
                      {item.category && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.category}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={editData.quantity}
                      onChange={(e) =>
                        setEditData({ ...editData, quantity: Number(e.target.value) })
                      }
                      className="w-24 h-8"
                    />
                  ) : (
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {item.quantity}{" "}
                      <span className="text-gray-400 font-normal">{item.unit}</span>
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select
                      value={editData.priority}
                      onValueChange={(value) =>
                        setEditData({ ...editData, priority: value })
                      }
                    >
                      <SelectTrigger className="w-32 h-8">
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
                      className={cn("gap-1.5 font-medium", config.badge)}
                    >
                      <PriorityIcon className="w-3 h-3" />
                      {config.label}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
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
                      className="w-28 h-8"
                      placeholder="R$ 0,00"
                    />
                  ) : item.estimated_price ? (
                    <span className="font-medium text-green-600 dark:text-green-400">
                      R$ {item.estimated_price.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <p className="max-w-[200px] truncate text-sm text-gray-500 dark:text-gray-400">
                    {item.notes || "-"}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEdit(item.id)}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(item)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
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
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
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
    </div>
  );
}
