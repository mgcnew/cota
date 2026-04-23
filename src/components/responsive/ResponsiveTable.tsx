import * as React from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Column configuration for ResponsiveTable
 * 
 * @template T - The data type for each row
 */
export interface Column<T> {
  /**
   * Unique key for the column, must be a key of T
   */
  key: keyof T;
  /**
   * Header label to display
   */
  header: string;
  /**
   * Priority determines visibility at different breakpoints:
   * - 'high': Always visible
   * - 'medium': Visible on tablet and desktop
   * - 'low': Only visible on desktop
   */
  priority: 'high' | 'medium' | 'low';
  /**
   * Optional custom render function for the cell value
   */
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  /**
   * Optional label for mobile card display (defaults to header)
   */
  mobileLabel?: string;
  /**
   * Optional CSS class for the cell
   */
  className?: string;
}

/**
 * Action configuration for row actions menu
 */
export interface RowAction<T> {
  /**
   * Unique key for the action
   */
  key: string;
  /**
   * Display label
   */
  label: string;
  /**
   * Icon component
   */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Variant for styling
   */
  variant?: 'default' | 'destructive';
  /**
   * Callback when action is clicked
   */
  onAction: (row: T) => void;
}

/**
 * Props for ResponsiveTable component
 */
export interface ResponsiveTableProps<T> {
  /**
   * Array of data rows to display
   */
  data: T[];
  /**
   * Column configuration
   */
  columns: Column<T>[];
  /**
   * Row actions menu items
   */
  actions?: RowAction<T>[];
  /**
   * Optional empty state content
   */
  emptyState?: React.ReactNode;
  /**
   * Optional loading state
   */
  isLoading?: boolean;
  /**
   * Optional CSS class for the container
   */
  className?: string;
  /**
   * Optional key extractor for rows (defaults to index)
   */
  getRowKey?: (row: T, index: number) => string | number;
}

/**
 * Determines if a column should be visible at the current breakpoint
 */
function isColumnVisible(priority: 'high' | 'medium' | 'low', breakpoint: 'mobile' | 'tablet' | 'desktop'): boolean {
  if (priority === 'high') return true;
  if (priority === 'medium') return breakpoint !== 'mobile';
  if (priority === 'low') return breakpoint === 'desktop';
  return false;
}

/**
 * Mobile card view for a single row
 */
function MobileRowCard<T>({
  row,
  columns,
  actions,
}: {
  row: T;
  columns: Column<T>[];
  actions?: RowAction<T>[];
}): JSX.Element {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Display all high-priority columns in mobile card view */}
          {columns
            .filter(col => col.priority === 'high')
            .map((column) => (
              <div key={String(column.key)} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {column.mobileLabel || column.header}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] ?? '-')}
                </span>
              </div>
            ))}

          {/* Display medium-priority columns in mobile card view */}
          {columns
            .filter(col => col.priority === 'medium')
            .map((column) => (
              <div key={String(column.key)} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {column.mobileLabel || column.header}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] ?? '-')}
                </span>
              </div>
            ))}

          {/* Actions menu for mobile */}
          {actions && actions.length > 0 && (
            <div className="pt-2 border-t">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 justify-center"
                  >
                    <MoreVertical className="h-4 w-4 mr-2" />
                    Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {actions.map((action) => (
                    <DropdownMenuItem
                      key={action.key}
                      onClick={() => action.onAction(row)}
                      className={cn(
                        "cursor-pointer",
                        action.variant === 'destructive' && "text-red-600 focus:text-red-600 focus:bg-red-50"
                      )}
                    >
                      {action.icon && (
                        <action.icon className="h-4 w-4 mr-2" />
                      )}
                      <span>{action.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Desktop/Tablet table row
 */
function TableRowView<T>({
  row,
  columns,
  actions,
  breakpoint,
}: {
  row: T;
  columns: Column<T>[];
  actions?: RowAction<T>[];
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}): JSX.Element {
  const visibleColumns = columns.filter(col => isColumnVisible(col.priority, breakpoint));

  return (
    <TableRow className="hover:bg-accent/50 transition-colors">
      {visibleColumns.map((column) => (
        <TableCell key={String(column.key)} className={cn("py-4", column.className)}>
          {column.render
            ? column.render(row[column.key], row)
            : String(row[column.key] ?? '-')}
        </TableCell>
      ))}

      {/* Actions column */}
      {actions && actions.length > 0 && (
        <TableCell className="py-4 px-4">
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Abrir menu de ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {actions.map((action) => (
                  <DropdownMenuItem
                    key={action.key}
                    onClick={() => action.onAction(row)}
                    className={cn(
                      "cursor-pointer",
                      action.variant === 'destructive' && "text-red-600 focus:text-red-600 focus:bg-red-50"
                    )}
                  >
                    {action.icon && (
                      <action.icon className="h-4 w-4 mr-2" />
                    )}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

/**
 * ResponsiveTable - A table component that adapts to different screen sizes
 * 
 * Features:
 * - Renders as cards in mobile (width < 768px)
 * - Renders as table in tablet/desktop with column visibility based on priority
 * - Supports high/medium/low priority columns
 * - Includes row actions menu
 * - Responsive column visibility:
 *   - high: Always visible
 *   - medium: Visible on tablet and desktop
 *   - low: Only visible on desktop
 * 
 * @example
 * ```tsx
 * const columns: Column<Quote>[] = [
 *   { key: 'id', header: 'ID', priority: 'high' },
 *   { key: 'product', header: 'Product', priority: 'high' },
 *   { key: 'price', header: 'Price', priority: 'medium' },
 *   { key: 'supplier', header: 'Supplier', priority: 'low' },
 * ];
 * 
 * const actions: RowAction<Quote>[] = [
 *   { key: 'view', label: 'View', icon: Eye, onAction: handleView },
 *   { key: 'edit', label: 'Edit', icon: Edit, onAction: handleEdit },
 * ];
 * 
 * <ResponsiveTable
 *   data={quotes}
 *   columns={columns}
 *   actions={actions}
 *   emptyState={<p>No quotes found</p>}
 * />
 * ```
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export function ResponsiveTable<T>({
  data,
  columns,
  actions,
  emptyState,
  isLoading = false,
  className,
  getRowKey = (_, index) => index,
}: ResponsiveTableProps<T>): JSX.Element {
  const { current: breakpoint } = useBreakpoint();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("w-full h-24 animate-pulse bg-muted rounded-lg", className)} />;
  }

  // Show empty state
  if (!isLoading && data.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        {emptyState || (
          <div className="text-center py-8 text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    );
  }

  // Mobile: Render as cards
  if (breakpoint === 'mobile') {
    return (
      <div className={cn("w-full space-y-2", className)}>
        {data.map((row, index) => (
          <MobileRowCard
            key={getRowKey(row, index)}
            row={row}
            columns={columns}
            actions={actions}
          />
        ))}
      </div>
    );
  }

  // Desktop/Tablet: Render as table
  const visibleColumns = columns.filter(col => isColumnVisible(col.priority, breakpoint));

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead key={String(column.key)} className="font-semibold">
                {column.header}
              </TableHead>
            ))}
            {/* Actions column header */}
            {actions && actions.length > 0 && (
              <TableHead className="text-right">Ações</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRowView
              key={getRowKey(row, index)}
              row={row}
              columns={columns}
              actions={actions}
              breakpoint={breakpoint}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ResponsiveTable;
