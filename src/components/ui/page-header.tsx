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
            {/* Header principal com tÃ­tulo e aÃ§Ãµes */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                    {Icon && (
                        <div className="relative p-3 md:p-3.5 rounded-2xl bg-foreground/90 shadow-lg text-background">
                            <Icon className="h-6 w-6 md:h-7 md:w-7" />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm md:text-base text-muted-foreground mt-1 font-medium">
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

            {/* Ãrea de filtros e busca com card elevado */}
            {children && (
                <div className="bg-card rounded-xl border border-border dark:border-white/5 shadow-sm p-4 md:p-5">
                    <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

