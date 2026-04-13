import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

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

const ds = designSystem.components;

const statusConfig: Record<string, { label: string; className: string }> = {
  // Ativos
  active: { label: "Ativo", className: ds.badge.success },
  ativo: { label: "Ativo", className: ds.badge.success },
  ativa: { label: "Ativa", className: ds.badge.success },
  
  // Inativos
  inactive: { label: "Inativo", className: ds.badge.outline },
  inativo: { label: "Inativo", className: ds.badge.outline },
  
  // Pendentes
  pending: { label: "Pendente", className: ds.badge.secondary },
  pendente: { label: "Pendente", className: ds.badge.secondary },
  planejada: { label: "Planejada", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200" },
  
  // Concluídos
  completed: { label: "Concluído", className: ds.badge.active },
  concluido: { label: "Concluído", className: ds.badge.active },
  concluida: { label: "Concluída", className: ds.badge.active },
  finalizada: { label: "Finalizada", className: ds.badge.active },
  
  // Expirados/Cancelados
  expired: { label: "Expirado", className: ds.badge.destructive },
  expirado: { label: "Expirado", className: ds.badge.destructive },
  expirada: { label: "Expirada", className: ds.badge.destructive },
  cancelled: { label: "Cancelado", className: ds.badge.destructive },
  cancelado: { label: "Cancelado", className: ds.badge.destructive },
  cancelada: { label: "Cancelada", className: ds.badge.destructive },
  
  // Em andamento
  em_andamento: { label: "Em Andamento", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200" },
  
  // Estoque
  baixo_estoque: { label: "Baixo Estoque", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200" },
  sem_estoque: { label: "Sem Estoque", className: ds.badge.destructive },
  
  // Pedidos
  entregue: { label: "Entregue", className: ds.badge.success },
  enviado: { label: "Enviado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200" },
  confirmado: { label: "Confirmado", className: ds.badge.success },
  
  // Produtos
  cotado: { label: "Cotado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200" },
  sem_cotacao: { label: "Sem Cotação", className: ds.badge.outline },
  
  // Pedidos
  processando: { label: "Processando", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200" },
};

const defaultConfig = { label: "Desconhecido", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };

// Memoizado para evitar re-renders desnecessários
export const StatusBadge = memo(function StatusBadge({ status, className, customLabel }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase().trim() || "";
  const config = statusConfig[normalizedStatus] || defaultConfig;

  return (
    <Badge 
      variant="outline"
      className={cn("font-medium text-xs", config.className, className)}
    >
      {customLabel || config.label}
    </Badge>
  );
});

