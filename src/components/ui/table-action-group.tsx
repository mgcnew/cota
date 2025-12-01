import { ReactNode } from "react";
import { Eye, Edit, Trash2, CheckCircle, MoreVertical, Download, History, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExpandableActionButton } from "./expandable-action-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ActionItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "view" | "edit" | "delete" | "success" | "default";
  hidden?: boolean;
  disabled?: boolean;
}

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
  additionalActions?: ActionItem[];
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
  dropdownLabel = "Mais Ações",
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
  const hasDropdownItems = dropdownItems.filter(item => !item.hidden).length > 0;

  return (
    <div className={cn("flex items-center justify-end gap-1.5", className)}>
      {/* View Button */}
      {showView && onView && (
        <ExpandableActionButton
          icon={<Eye className="h-3.5 w-3.5" />}
          label={viewLabel}
          onClick={onView}
          variant="view"
        />
      )}

      {/* Edit Button */}
      {showEdit && onEdit && (
        <ExpandableActionButton
          icon={<Edit className="h-3.5 w-3.5" />}
          label={editLabel}
          onClick={onEdit}
          variant="edit"
        />
      )}

      {/* Finalize Button */}
      {showFinalize && onFinalize && (
        <ExpandableActionButton
          icon={<CheckCircle className="h-3.5 w-3.5" />}
          label={finalizeLabel}
          onClick={onFinalize}
          variant="success"
        />
      )}

      {/* Delete Button */}
      {showDelete && onDelete && (
        <ExpandableActionButton
          icon={<Trash2 className="h-3.5 w-3.5" />}
          label={deleteLabel}
          onClick={onDelete}
          variant="delete"
        />
      )}

      {/* Additional Actions */}
      {additionalActions.map((action, index) => (
        !action.hidden && (
          <ExpandableActionButton
            key={index}
            icon={action.icon}
            label={action.label}
            onClick={action.onClick}
            variant={action.variant || "default"}
            disabled={action.disabled}
          />
        )
      ))}

      {/* Dropdown Menu for More Actions */}
      {hasDropdownItems && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border z-50 w-48 shadow-lg">
            <DropdownMenuLabel className="text-gray-600 dark:text-gray-400 font-medium">
              {dropdownLabel}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {dropdownItems.map((item, index) => (
              !item.hidden && (
                <DropdownMenuItem
                  key={index}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={cn(
                    "cursor-pointer transition-colors",
                    item.variant === "destructive"
                      ? "text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </DropdownMenuItem>
              )
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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

