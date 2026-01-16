import * as React from "react";
import { cn } from "@/lib/utils";

interface DataTableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isHeader?: boolean;
  accentColor?: "orange" | "blue" | "green" | "purple" | "indigo";
}

const accentColors = {
  orange: {
    headerBg: "bg-orange-50/80 dark:bg-orange-950/30",
    headerBorder: "border-orange-200/60 dark:border-orange-800/40",
    headerText: "text-orange-800 dark:text-orange-200",
    headerIcon: "text-orange-500 dark:text-orange-400",
    rowBorder: "border-gray-200 dark:border-gray-700/50",
    rowHover: "hover:bg-gray-50 dark:hover:bg-gray-800/70",
  },
  blue: {
    headerBg: "bg-blue-50/80 dark:bg-blue-950/30",
    headerBorder: "border-blue-200/60 dark:border-blue-800/40",
    headerText: "text-blue-800 dark:text-blue-200",
    headerIcon: "text-blue-500 dark:text-blue-400",
    rowBorder: "border-gray-200 dark:border-gray-700/50",
    rowHover: "hover:bg-gray-50 dark:hover:bg-gray-800/70",
  },
  green: {
    headerBg: "bg-green-50/80 dark:bg-green-950/30",
    headerBorder: "border-green-200/60 dark:border-green-800/40",
    headerText: "text-green-800 dark:text-green-200",
    headerIcon: "text-green-500 dark:text-green-400",
    rowBorder: "border-gray-200 dark:border-gray-700/50",
    rowHover: "hover:bg-gray-50 dark:hover:bg-gray-800/70",
  },
  purple: {
    headerBg: "bg-purple-50/80 dark:bg-purple-950/30",
    headerBorder: "border-purple-200/60 dark:border-purple-800/40",
    headerText: "text-purple-800 dark:text-purple-200",
    headerIcon: "text-purple-500 dark:text-purple-400",
    rowBorder: "border-gray-200 dark:border-gray-700/50",
    rowHover: "hover:bg-gray-50 dark:hover:bg-gray-800/70",
  },
  indigo: {
    headerBg: "bg-indigo-50/80 dark:bg-indigo-950/30",
    headerBorder: "border-indigo-200/60 dark:border-indigo-800/40",
    headerText: "text-indigo-800 dark:text-indigo-200",
    headerIcon: "text-indigo-500 dark:text-indigo-400",
    rowBorder: "border-gray-200 dark:border-gray-700/50",
    rowHover: "hover:bg-gray-50 dark:hover:bg-gray-800/70",
  },
};

export function DataTableRow({
  children,
  isHeader = false,
  accentColor = "orange",
  className,
  ...props
}: DataTableRowProps) {
  const colors = accentColors[accentColor];

  if (isHeader) {
    return (
      <div
        className={cn(
          "flex items-center px-4 py-3 rounded-xl border shadow-sm",
          colors.headerBg,
          colors.headerBorder,
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
        "flex items-center px-4 py-3 rounded-xl border bg-white dark:bg-gray-800/50 transition-colors duration-150",
        colors.rowBorder,
        colors.rowHover,
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
  const colors = accentColors[accentColor];

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
      {icon && <span className={cn("flex-shrink-0", colors.headerIcon)}>{icon}</span>}
      <span className={cn("uppercase tracking-wide text-[11px] font-semibold", colors.headerText)}>
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
