import { ReactNode } from "react";
import { Eye, Edit, Trash2, CheckCircle, MoreVertical, Download, History, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface DropdownItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  hidden?: boolean;
  disabled?: boolean;
}

interface TableActionGroupProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onFinalize?: () => void;
  additionalActions?: DropdownItem[];
  dropdownItems?: DropdownItem[];
  dropdownLabel?: string;
  className?: string;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showFinalize?: boolean;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  finalizeLabel?: string;
}

export function TableActionGroup({
  onView,
  onEdit,
  onDelete,
  onFinalize,
  additionalActions = [],
  dropdownItems = [],
  dropdownLabel = "Ações",
  className,
  showView = true,
  showEdit = true,
  showDelete = true,
  showFinalize = false,
  viewLabel = "Ver",
  editLabel = "Editar",
  deleteLabel = "Excluir",
  finalizeLabel = "Finalizar",
}: TableActionGroupProps) {
  // Construir lista de ações do dropdown
  const allActions: DropdownItem[] = [];

  if (showView && onView) {
    allActions.push({
      icon: <Eye className="h-4 w-4" />,
      label: viewLabel,
      onClick: onView,
      variant: "default",
    });
  }

  if (showEdit && onEdit) {
    allActions.push({
      icon: <Edit className="h-4 w-4" />,
      label: editLabel,
      onClick: onEdit,
      variant: "default",
    });
  }

  if (showFinalize && onFinalize) {
    allActions.push({
      icon: <CheckCircle className="h-4 w-4" />,
      label: finalizeLabel,
      onClick: onFinalize,
      variant: "default",
    });
  }

  // Adicionar ações adicionais
  additionalActions.forEach((action) => {
    if (!action.hidden) {
      allActions.push(action);
    }
  });

  // Adicionar itens do dropdown
  dropdownItems.forEach((item) => {
    if (!item.hidden) {
      allActions.push(item);
    }
  });

  // Adicionar delete por último (destrutivo)
  if (showDelete && onDelete) {
    allActions.push({
      icon: <Trash2 className="h-4 w-4" />,
      label: deleteLabel,
      onClick: onDelete,
      variant: "destructive",
    });
  }

  if (allActions.length === 0) return null;

  return (
    <div className={cn("flex items-center justify-end", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50 w-48 shadow-lg"
        >
          <DropdownMenuLabel className="text-gray-600 dark:text-gray-300 font-medium text-xs">
            {dropdownLabel}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
          {allActions.map((item, index) => (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                "cursor-pointer transition-colors flex items-center gap-2 min-h-[40px]",
                item.variant === "destructive"
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Pre-configured action icons for common use cases
export const ActionIcons = {
  view: <Eye className="h-4 w-4" />,
  edit: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  finalize: <CheckCircle className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
  history: <History className="h-4 w-4" />,
  message: <MessageCircle className="h-4 w-4" />,
};
