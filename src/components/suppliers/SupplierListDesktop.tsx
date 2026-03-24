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
  const formatLimitBRL = (input: string) => {
    if (!input) return "R$ 0,00";
    const hasK = /k/i.test(input);
    const numeric = parseFloat(input.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const value = hasK ? numeric * 1000 : numeric;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  return (
    <div className="hidden md:block overflow-x-auto w-full custom-scrollbar">
      <Table className={designSystem.components.table.root}>
        <TableHeader className={designSystem.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableHead colSpan={7} className="px-1 pb-0 pt-0 border-none">
              <div className={cn(designSystem.components.table.headerWrapper, designSystem.components.table.accents.brand.bg, designSystem.components.table.accents.brand.border)}>
                <div className="w-[30%] flex items-center gap-3 pr-4 min-w-0">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", designSystem.components.table.accents.brand.bg)}>
                    <Building2 className={cn("h-4 w-4", designSystem.components.table.accents.brand.icon)} />
                  </div>
                  <span className={cn(designSystem.components.table.headerLabel, designSystem.components.table.accents.brand.text)}>Fornecedor</span>
                </div>
                <div className="w-[15%] px-2 flex justify-center items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Status</span>
                </div>
                <div className="w-[15%] px-2 flex justify-center items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Limite</span>
                </div>
                <div className="hidden lg:flex w-[15%] px-2 justify-center items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Preço Médio</span>
                </div>
                <div className="hidden lg:flex w-[10%] px-2 justify-center items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Cot.</span>
                </div>
                <div className="hidden xl:flex w-[10%] px-2 justify-center items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Avaliação</span>
                </div>
                <div className="w-[5%] flex justify-end items-center px-2">
                  <span className={designSystem.components.table.headerLabel}>Ações</span>
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
                  designSystem.components.table.row,
                  designSystem.components.table.rowWrapper
                )}>
                  <div className="w-[30%] flex items-center gap-3 pr-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-border/40">
                      <Building2 className="h-4 w-4 text-brand" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={designSystem.components.dataDisplay.highlight}>{capitalize(supplier.name)}</span>
                      <span className={designSystem.components.dataDisplay.secondary}>{supplier.contact || "Sem contato"}</span>
                    </div>
                  </div>

                  <div className="w-[15%] px-2 flex justify-center items-center">
                    <StatusBadge status={supplier.status === 'ativo' ? 'active' : supplier.status === 'inativo' ? 'inactive' : supplier.status as any} />
                  </div>

                  <div className="w-[15%] px-2 flex justify-center items-center">
                    <span className={cn("text-sm font-medium", designSystem.colors.text.primary)}>{formatLimitBRL(supplier.limit)}</span>
                  </div>

                  <div className="hidden lg:flex w-[15%] px-2 justify-center items-center">
                    <span className={cn("text-sm font-medium", designSystem.colors.text.primary)}>{supplier.avgPrice}</span>
                  </div>

                  <div className="hidden lg:flex w-[10%] px-2 justify-center items-center">
                    <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg border", designSystem.components.dataDisplay.badge.quotes.root)}>
                      <FileText className={designSystem.components.dataDisplay.badge.quotes.icon} />
                      <span className={designSystem.components.dataDisplay.badge.quotes.text}>{supplier.totalQuotes}</span>
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
