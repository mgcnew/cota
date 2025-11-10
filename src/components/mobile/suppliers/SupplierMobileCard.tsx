import { memo } from 'react';
import { Edit, Trash2, Building2, Phone, Mail, MapPin, MoreVertical } from 'lucide-react';
import type { SupplierMobile } from '@/hooks/mobile/useSuppliersMobile';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SupplierMobileCardProps {
  supplier: SupplierMobile;
  onEdit: (supplier: SupplierMobile) => void;
  onDelete: (supplier: SupplierMobile) => void;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  inactive: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
  pending: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
};

/**
 * Card de fornecedor mobile otimizado
 * - Design compacto e responsivo
 * - Ações rápidas (editar/deletar)
 * - Informações essenciais destacadas
 * - Memoizado para performance
 */
export const SupplierMobileCard = memo<SupplierMobileCardProps>(
  function SupplierMobileCard({ supplier, onEdit, onDelete }) {
    const handleEdit = () => onEdit(supplier);
    const handleDelete = () => onDelete(supplier);

    const statusColor = statusColors[supplier.status] || statusColors.active;

    return (
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200"
        style={{
          contain: 'layout style paint',
          willChange: 'transform',
        }}
      >
        <div className="flex items-start gap-3">
          {/* Ícone do fornecedor */}
          <div className={cn(
            "flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center border-2 transition-colors",
            statusColor.bg,
            statusColor.border
          )}>
            <Building2 className={cn("h-7 w-7", statusColor.text)} />
          </div>

          {/* Informações do fornecedor */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-base text-gray-900 dark:text-white line-clamp-1 leading-tight">
                  {supplier.name}
                </h3>
                <Badge className={cn(
                  "text-xs shrink-0",
                  statusColor.bg,
                  statusColor.text,
                  statusColor.border
                )}>
                  {supplier.status === 'active' ? 'Ativo' : supplier.status === 'inactive' ? 'Inativo' : 'Pendente'}
                </Badge>
              </div>
              {supplier.contact && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                  {supplier.contact}
                </p>
              )}
            </div>

            {/* Detalhes de contato */}
            <div className="flex flex-col gap-1.5 text-xs">
              {supplier.phone && (
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="truncate">{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex-shrink-0 flex flex-col gap-2">
            <button
              onClick={handleEdit}
              className="p-2.5 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all duration-200 active:scale-95"
              aria-label="Editar fornecedor"
            >
              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all duration-200 active:scale-95"
              aria-label="Excluir fornecedor"
            >
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);
