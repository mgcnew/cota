import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: ReactNode;
    children?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    actions,
    children,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-5 md:gap-6 pb-5 md:pb-6", className)}>
            {/* Header principal com título e ações */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                    {Icon && (
                        <div className="relative p-2.5 md:p-3 rounded-xl bg-gradient-to-br from-primary/90 to-primary shadow-lg shadow-primary/25 dark:shadow-primary/20 text-white transition-transform hover:scale-105 duration-200">
                            <Icon className="h-6 w-6 md:h-7 md:w-7" />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm md:text-base text-muted-foreground mt-1.5 font-medium">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        {actions}
                    </div>
                )}
            </div>

            {/* Área de filtros e busca com card elevado */}
            {children && (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 md:p-5">
                    <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}
