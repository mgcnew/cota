import * as React from "react";
import { cn } from "@/lib/utils";

import { designSystem as ds } from "@/styles/design-system";

interface DataTableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isHeader?: boolean;
  accentColor?: keyof typeof ds.components.table.accents;
}

export function DataTableRow({
  children,
  isHeader = false,
  accentColor = "orange",
  className,
  ...props
}: DataTableRowProps) {
  const tableStyles = ds.components.table;
  const accent = tableStyles.accents[accentColor as keyof typeof tableStyles.accents] || tableStyles.accents.orange;

  if (isHeader) {
    return (
      <div
        className={cn(
          tableStyles.headerWrapper,
          accent.bg,
          accent.border,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        tableStyles.row,
        tableStyles.rowWrapper,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface DataTableHeaderCellProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  accentColor?: "orange" | "blue" | "green" | "purple" | "indigo";
  align?: "left" | "center" | "right";
}

export function DataTableHeaderCell({
  children,
  icon,
  accentColor = "orange",
  align = "left",
  className,
  ...props
}: DataTableHeaderCellProps) {
  const tableStyles = ds.components.table;
  const accent = tableStyles.accents[accentColor as keyof typeof tableStyles.accents] || tableStyles.accents.orange;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
        className
      )}
      {...props}
    >
      {icon && <span className={cn("flex-shrink-0", accent.icon)}>{icon}</span>}
      <span className={cn(tableStyles.headerLabel, accent.text)}>
        {children}
      </span>
    </div>
  );
}

interface DataTableCellProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "left" | "center" | "right";
}

export function DataTableCell({
  children,
  align = "left",
  className,
  ...props
}: DataTableCellProps) {
  return (
    <div
      className={cn(
        "flex items-center",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Action button styles for consistency
export const actionButtonStyles = {
  view: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30",
  edit: "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30",
  delete: "text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30",
  default: "text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/50",
};
