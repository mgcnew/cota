import * as React from "react";
import { memo, useState, useCallback } from "react";
import { Building2, DollarSign, FileText, TrendingUp, MoreVertical, Edit, Trash2, MessageCircle, ChevronDown, ChevronUp, Eye, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { capitalize } from "@/lib/text-utils";
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  contact: string;
  limit: string;
  activeQuotes: number;
  totalQuotes: number;
  avgPrice: string;
  lastOrder: string;
  rating: number;
  status: "active" | "inactive" | "pending";
  phone?: string;
  email?: string;
  address?: string;
}

interface ExpandableSupplierCardProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onWhatsApp: (supplier: Supplier) => void;
  onViewHistory?: (supplier: Supplier) => void;
  renderRating: (rating: number) => React.ReactNode;
}

/**
 * ExpandableSupplierCard - Mobile-optimized supplier card with expandable details
 * 
 * Features:
 * - Essential info visible by default (name, contact, status, rating)
 * - Expandable section for additional details (limit, quotes, avg price, contact info)
 * - Touch-optimized with 44x44px minimum touch targets
 * - Memoized for performance
 * 
 * Requirements: 4.2 - Info essencial visível, detalhes em accordion
 */
export const ExpandableSupplierCard = memo(function ExpandableSupplierCard({
  supplier,
  onEdit,
  onDelete,
  onWhatsApp,
  onViewHistory,
  renderRating,
}: ExpandableSupplierCardProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleEdit = useCallback(() => {
    onEdit(supplier);
  }, [onEdit, supplier]);

  const handleDelete = useCallback(() => {
    onDelete(supplier);
  }, [onDelete, supplier]);

  const handleWhatsApp = useCallback(() => {
    onWhatsApp(supplier);
  }, [onWhatsApp, supplier]);

  const handleViewHistory = useCallback(() => {
    onViewHistory?.(supplier);
  }, [onViewHistory, supplier]);

  return (
    <div 
      className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 shadow-sm overflow-hidden"
    >
      {/* Essential Info - Always visible */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {capitalize(supplier.name)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {capitalize(supplier.contact)}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* Touch target: 44x44px */}
              <Button variant="ghost" size="icon" className="h-11 w-11 flex-shrink-0 touch-target">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewHistory && (
                <DropdownMenuItem onClick={handleViewHistory}>
                  <Eye className="h-4 w-4 mr-2" /> Ver Histórico
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWhatsApp} className="text-green-600">
                <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Status and Rating */}
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={supplier.status} />
          {renderRating(supplier.rating)}
        </div>
        
        {/* Quick Stats - Always visible */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <span className="text-gray-500 dark:text-gray-400">Limite:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{supplier.limit}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <span className="text-gray-500 dark:text-gray-400">Cotações:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{supplier.activeQuotes}/{supplier.totalQuotes}</span>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700/30 text-xs text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors touch-target min-h-[44px]"
        aria-expanded={isExpanded}
        aria-controls={`supplier-details-${supplier.id}`}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            <span>Menos detalhes</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            <span>Mais detalhes</span>
          </>
        )}
      </button>

      {/* Expandable Details */}
      <div
        id={`supplier-details-${supplier.id}`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 pt-0 space-y-3 border-t border-gray-200 dark:border-gray-700/30">
          {/* Additional Stats */}
          <div className="grid grid-cols-1 gap-2 text-xs pt-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">Preço Médio:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{supplier.avgPrice}</span>
            </div>
            {supplier.lastOrder && (
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                <span className="text-gray-500 dark:text-gray-400">Último Pedido:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{supplier.lastOrder}</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          {(supplier.phone || supplier.email || supplier.address) && (
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/20">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Contato</p>
              {supplier.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400 truncate">{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">{supplier.address}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 h-10 touch-target"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
              WhatsApp
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 h-10 touch-target"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ExpandableSupplierCard;
