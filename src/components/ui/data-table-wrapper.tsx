import { ReactNode } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

export interface Column<T> {
    header: string | ReactNode;
    accessorKey?: keyof T;
    cell?: (item: T) => ReactNode;
    className?: string;
    hiddenOnMobile?: boolean;
    hiddenOnTablet?: boolean;
}

interface DataTableWrapperProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    emptyIcon?: ReactNode;
    onRowClick?: (item: T) => void;
    pagination?: ReactNode;
    className?: string;
}

export function DataTableWrapper<T extends { id?: string | number }>({
    data,
    columns,
    isLoading,
    emptyMessage = "Nenhum registro encontrado.",
    emptyIcon,
    onRowClick,
    pagination,
    className,
}: DataTableWrapperProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full py-12 flex flex-col items-center justify-center text-center border rounded-lg bg-background/50">
                <div className="p-4 rounded-full bg-muted mb-4">
                    {emptyIcon || <Package className="h-8 w-8 text-muted-foreground" />}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                    {emptyMessage}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Não há dados para exibir no momento. Tente ajustar seus filtros.
                </p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            {columns.map((column, index) => (
                                <TableHead
                                    key={index}
                                    className={cn(
                                        column.className,
                                        column.hiddenOnMobile && "hidden md:table-cell",
                                        column.hiddenOnTablet && "hidden lg:table-cell"
                                    )}
                                >
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, rowIndex) => (
                            <TableRow
                                key={item.id || rowIndex}
                                className={cn(
                                    "transition-colors",
                                    onRowClick && "cursor-pointer hover:bg-muted/50"
                                )}
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((column, colIndex) => (
                                    <TableCell
                                        key={colIndex}
                                        className={cn(
                                            column.className,
                                            column.hiddenOnMobile && "hidden md:table-cell",
                                            column.hiddenOnTablet && "hidden lg:table-cell"
                                        )}
                                    >
                                        {column.cell
                                            ? column.cell(item)
                                            : column.accessorKey
                                                ? (item[column.accessorKey] as ReactNode)
                                                : null}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {pagination && <div className="py-2">{pagination}</div>}
        </div>
    );
}
