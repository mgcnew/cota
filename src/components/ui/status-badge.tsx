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
      className: "bg-success text-white border-success shadow-sm"
    },
    inactive: {
      variant: "secondary" as const,
      label: "Inativo",
      className: "bg-muted text-muted-foreground"
    },
    pending: {
      variant: "outline" as const,
      label: "Pendente",
      className: "bg-warning text-white border-warning shadow-sm"
    },
    completed: {
      variant: "secondary" as const,
      label: "Concluído",
      className: "bg-primary/10 text-primary border-primary/20"
    },
    expired: {
      variant: "destructive" as const,
      label: "Expirado",
      className: "bg-error text-white border-error shadow-sm"
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
