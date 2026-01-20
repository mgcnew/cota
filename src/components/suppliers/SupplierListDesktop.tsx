import { memo } from 'react';
import { Building2, CircleDot, DollarSign, TrendingUp, FileText, Star, MessageCircle, History, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActionGroup } from "@/components/ui/table-action-group";
import { capitalize } from "@/lib/text-utils";

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

interface SupplierListDesktopProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onHistory: (supplier: Supplier) => void;
  onWhatsApp: (supplier: Supplier) => void;
  renderRating: (rating: number) => React.ReactNode;
}

export const SupplierListDesktop = memo(({ suppliers, onEdit, onDelete, onHistory, onWhatsApp, renderRating }: SupplierListDesktopProps) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={7} className="px-1 pb-3 pt-0 border-none">
              <div className="flex items-center bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-sm px-4 py-4">
                <div className="w-[30%] flex items-center gap-3 pr-4 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Fornecedor</span>
                </div>
                <div className="w-[15%] px-2 flex justify-center items-center gap-2">
                  <CircleDot className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Status</span>
                </div>
                <div className="w-[15%] px-2 flex justify-center items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Limite</span>
                </div>
                <div className="hidden lg:flex w-[15%] px-2 justify-center items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Preço Médio</span>
                </div>
                <div className="hidden lg:flex w-[10%] px-2 justify-center items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Cot.</span>
                </div>
                <div className="hidden xl:flex w-[10%] px-2 justify-center items-center gap-2">
                  <Star className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Avaliação</span>
                </div>
                <div className="w-[5%] flex justify-end items-center px-2">
                  <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Ações</span>
                </div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map(supplier => (
            <TableRow key={supplier.id} className="group border-none">
              <TableCell colSpan={7} className="px-1 py-1.5">
                <div className="flex items-center px-4 py-3 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-smooth hover:scale-[1.005] hover:shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/70">
                  <div className="w-[30%] flex items-center gap-3 pr-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600/30">
                      <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{capitalize(supplier.name)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{capitalize(supplier.contact)}</div>
                    </div>
                  </div>

                  <div className="w-[15%] px-2 flex justify-center items-center">
                    <StatusBadge status={supplier.status} />
                  </div>

                  <div className="w-[15%] px-2 flex justify-center items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{supplier.limit}</span>
                  </div>

                  <div className="hidden lg:flex w-[15%] px-2 justify-center items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{supplier.avgPrice}</span>
                  </div>

                  <div className="hidden lg:flex w-[10%] px-2 justify-center items-center">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                      <FileText className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs">{supplier.activeQuotes}</span>
                    </div>
                  </div>

                  <div className="hidden xl:flex w-[10%] px-2 justify-center items-center">
                    {renderRating(supplier.rating)}
                  </div>

                  <div className="w-[10%] flex justify-end items-center px-2">
                    <TableActionGroup
                      showView={false}
                      onEdit={() => onEdit(supplier)}
                      onDelete={() => onDelete(supplier)}
                      additionalActions={[
                        {
                          icon: <MessageCircle className="h-3.5 w-3.5" />,
                          label: "WhatsApp",
                          onClick: () => onWhatsApp(supplier),
                          variant: "success" as const,
                        },
                        {
                          icon: <History className="h-4 w-4" />,
                          label: "Ver Histórico",
                          onClick: () => onHistory(supplier),
                          variant: "view" as const,
                        }
                      ]}
                      dropdownLabel="Ações"
                    />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
