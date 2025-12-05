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

// Objeto estático - não recria a cada render
const statusConfig: Record<string, { label: string; className: string }> = {
  // Ativos
  active: { label: "Ativo", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  ativo: { label: "Ativo", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  ativa: { label: "Ativa", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  
  // Inativos
  inactive: { label: "Inativo", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
  inativo: { label: "Inativo", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
  
  // Pendentes
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  planejada: { label: "Planejada", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  
  // Concluídos
  completed: { label: "Concluído", className: "bg-primary/10 text-primary border-primary/20" },
  concluido: { label: "Concluído", className: "bg-primary/10 text-primary border-primary/20" },
  concluida: { label: "Concluída", className: "bg-primary/10 text-primary border-primary/20" },
  finalizada: { label: "Finalizada", className: "bg-primary/10 text-primary border-primary/20" },
  
  // Expirados/Cancelados
  expired: { label: "Expirado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  expirado: { label: "Expirado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  expirada: { label: "Expirada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  
  // Em andamento
  em_andamento: { label: "Em Andamento", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  
  // Estoque
  baixo_estoque: { label: "Baixo Estoque", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
  sem_estoque: { label: "Sem Estoque", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  
  // Pedidos
  entregue: { label: "Entregue", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  enviado: { label: "Enviado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  confirmado: { label: "Confirmado", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  
  // Produtos
  cotado: { label: "Cotado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  sem_cotacao: { label: "Sem Cotação", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
  
  // Pedidos
  processando: { label: "Processando", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
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
