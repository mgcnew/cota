import { memo } from 'react';
import { Building2, CircleDot, DollarSign, TrendingUp, FileText, Star, MessageCircle, History } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActionGroup } from "@/components/ui/table-action-group";
import { capitalize } from "@/lib/text-utils";
import { designSystem } from "@/styles/design-system";
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
    <div className="hidden md:block overflow-x-auto w-full custom-scrollbar">
      <Table className={designSystem.components.table.root}>
        <TableHeader className={designSystem.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableHead colSpan={7} className="px-1 pb-3 pt-0 border-none">
              <div className={cn("flex items-center rounded-xl shadow-sm px-4 py-4 border border-border/40", designSystem.components.card.flat)}>
                <div className="w-[30%] flex items-center gap-3 pr-4 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Fornecedor</span>
                </div>
                <div className="w-[15%] px-2 flex justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Status</span>
                </div>
                <div className="w-[15%] px-2 flex justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Limite</span>
                </div>
                <div className="hidden lg:flex w-[15%] px-2 justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Preço Médio</span>
                </div>
                <div className="hidden lg:flex w-[10%] px-2 justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Cot.</span>
                </div>
                <div className="hidden xl:flex w-[10%] px-2 justify-center items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Avaliação</span>
                </div>
                <div className="w-[5%] flex justify-end items-center px-2">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500 dark:text-gray-400">Ações</span>
                </div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map(supplier => (
            <TableRow key={supplier.id} className="group border-none hover:bg-transparent">
              <TableCell colSpan={7} className={designSystem.components.table.cell}>
                <div className={cn(
                  "flex items-center px-4 py-3 mb-1",
                  designSystem.components.table.row
                )}>
                  <div className="w-[30%] flex items-center gap-3 pr-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-border/40">
                      <Building2 className="h-4 w-4 text-[#83E509]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={cn("font-semibold text-sm truncate", designSystem.colors.text.primary)}>{capitalize(supplier.name)}</div>
                      <div className={cn("text-xs truncate", designSystem.colors.text.secondary)}>{capitalize(supplier.contact)}</div>
                    </div>
                  </div>

                  <div className="w-[15%] px-2 flex justify-center items-center">
                    <StatusBadge status={supplier.status} />
                  </div>

                  <div className="w-[15%] px-2 flex justify-center items-center">
                    <span className={cn("text-sm font-medium", designSystem.colors.text.primary)}>{supplier.limit}</span>
                  </div>

                  <div className="hidden lg:flex w-[15%] px-2 justify-center items-center">
                    <span className={cn("text-sm font-medium", designSystem.colors.text.primary)}>{supplier.avgPrice}</span>
                  </div>

                  <div className="hidden lg:flex w-[10%] px-2 justify-center items-center">
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <FileText className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">{supplier.activeQuotes}</span>
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
                          variant: "default" as const,
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
