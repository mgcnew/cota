import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "completed" | "expired" | "ativa" | "concluida" | "expirada";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status === "ativa" ? "active" : 
                           status === "concluida" ? "completed" : 
                           status === "expirada" ? "expired" : status;

  const config = {
    active: {
      variant: "default" as const,
      label: "Ativo",
      className: "bg-gradient-success border-none text-white shadow-sm"
    },
    inactive: {
      variant: "secondary" as const,
      label: "Inativo",
      className: "bg-muted text-muted-foreground"
    },
    pending: {
      variant: "outline" as const,
      label: "Pendente",
      className: "bg-gradient-warning border-none text-white shadow-sm"
    },
    completed: {
      variant: "secondary" as const,
      label: "Concluído",
      className: "bg-primary/10 text-primary border-primary/20"
    },
    expired: {
      variant: "destructive" as const,
      label: "Expirado",
      className: "bg-gradient-error border-none text-white shadow-sm"
    }
  };

  const { variant, label, className: statusClass } = config[normalizedStatus] || config.pending;

  return (
    <Badge 
      variant={variant}
      className={cn(statusClass, "font-medium", className)}
    >
      {label}
    </Badge>
  );
}
