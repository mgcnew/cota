import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = 
  | "active" | "inactive" | "pending" | "completed" | "expired" | "cancelled"
  | "ativo" | "inativo" | "pendente" | "concluido" | "expirado" | "cancelado"
  | "ativa" | "concluida" | "expirada" | "cancelada" | "planejada" | "finalizada"
  | "em_andamento" | "baixo_estoque" | "sem_estoque" | "entregue" | "enviado"
  | "cotado" | "sem_cotacao" | "confirmado" | "processando";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  customLabel?: string;
}

// Paleta sólida padronizada — pills com fundo cheio e texto branco, sem borda.
const SOLID = {
  green: "bg-emerald-600 text-white hover:bg-emerald-600",
  amber: "bg-amber-500 text-white hover:bg-amber-500",
  orange: "bg-orange-500 text-white hover:bg-orange-500",
  red: "bg-red-600 text-white hover:bg-red-600",
  blue: "bg-blue-600 text-white hover:bg-blue-600",
  gray: "bg-zinc-500 text-white hover:bg-zinc-500",
} as const;

const statusConfig: Record<string, { label: string; className: string }> = {
  // Ativos
  active: { label: "Ativo", className: SOLID.green },
  ativo: { label: "Ativo", className: SOLID.green },
  ativa: { label: "Ativa", className: SOLID.green },

  // Inativos
  inactive: { label: "Inativo", className: SOLID.gray },
  inativo: { label: "Inativo", className: SOLID.gray },

  // Pendentes
  pending: { label: "Pendente", className: SOLID.amber },
  pendente: { label: "Pendente", className: SOLID.amber },
  planejada: { label: "Planejada", className: SOLID.blue },

  // Concluídos
  completed: { label: "Concluído", className: SOLID.green },
  concluido: { label: "Concluído", className: SOLID.green },
  concluida: { label: "Concluída", className: SOLID.green },
  finalizada: { label: "Finalizada", className: SOLID.green },

  // Expirados/Cancelados
  expired: { label: "Expirado", className: SOLID.red },
  expirado: { label: "Expirado", className: SOLID.red },
  expirada: { label: "Expirada", className: SOLID.red },
  cancelled: { label: "Cancelado", className: SOLID.red },
  cancelado: { label: "Cancelado", className: SOLID.red },
  cancelada: { label: "Cancelada", className: SOLID.red },

  // Em andamento
  em_andamento: { label: "Em Andamento", className: SOLID.blue },

  // Estoque
  baixo_estoque: { label: "Baixo Estoque", className: SOLID.orange },
  sem_estoque: { label: "Sem Estoque", className: SOLID.red },

  // Pedidos
  entregue: { label: "Entregue", className: SOLID.green },
  enviado: { label: "Enviado", className: SOLID.blue },
  confirmado: { label: "Confirmado", className: SOLID.green },

  // Produtos
  cotado: { label: "Cotado", className: SOLID.blue },
  sem_cotacao: { label: "Sem Cotação", className: SOLID.orange },

  // Pedidos
  processando: { label: "Processando", className: SOLID.orange },
};

const defaultConfig = { label: "Desconhecido", className: SOLID.gray };

// Memoizado para evitar re-renders desnecessários
export const StatusBadge = memo(function StatusBadge({ status, className, customLabel }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase().trim() || "";
  const config = statusConfig[normalizedStatus] || defaultConfig;

  return (
    <Badge
      variant="outline"
      className={cn("font-bold text-xs border-transparent px-3 py-1", config.className, className)}
    >
      {customLabel || config.label}
    </Badge>
  );
});

