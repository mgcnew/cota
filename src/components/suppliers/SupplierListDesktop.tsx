import { memo, useState, useCallback } from 'react';
import { Building2, MessageCircle, History, ChevronUp, ChevronDown, ChevronsUpDown, FileText } from 'lucide-react';
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActionGroup } from "@/components/ui/table-action-group";
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

interface SupplierListDesktopProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onHistory: (supplier: Supplier) => void;
  onWhatsApp: (supplier: Supplier) => void;
  renderRating: (rating: number) => React.ReactNode;
}

type SortKey = 'name' | 'status' | 'limit' | 'avgPrice' | 'quotes' | 'rating';
type SortDir = 'asc' | 'desc';

const extractPrice = (priceStr: string): number => {
  const cleaned = priceStr.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

export const SupplierListDesktop = memo(({ suppliers, onEdit, onDelete, onHistory, onWhatsApp, renderRating }: SupplierListDesktopProps) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const formatLimitBRL = (input: string) => {
    if (!input) return "R$ 0,00";
    const hasK = /k/i.test(input);
    const numeric = parseFloat(input.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const value = hasK ? numeric * 1000 : numeric;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const sortedSuppliers = (() => {
    if (!sortKey) return suppliers;
    return [...suppliers].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR');
          break;
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '', 'pt-BR');
          break;
        case 'limit':
          cmp = extractPrice(a.limit || '') - extractPrice(b.limit || '');
          break;
        case 'avgPrice':
          cmp = extractPrice(a.avgPrice || '') - extractPrice(b.avgPrice || '');
          break;
        case 'quotes':
          cmp = (a.totalQuotes || 0) - (b.totalQuotes || 0);
          break;
        case 'rating':
          cmp = (a.rating || 0) - (b.rating || 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  })();

  const SortHeader = ({ label, sortId, className }: { label: string; sortId: SortKey; className?: string }) => {
    const isActive = sortKey === sortId;
    return (
      <th
        className={cn(
          "h-11 px-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer select-none transition-colors group/th",
          "hover:text-zinc-800 dark:hover:text-zinc-200",
          isActive && "text-zinc-900 dark:text-zinc-100 font-semibold",
          className
        )}
        onClick={() => handleSort(sortId)}
      >
        <div className={cn("flex items-center gap-1.5", className?.includes("text-center") && "justify-center", className?.includes("text-right") && "justify-end")}>
          <span>{label}</span>
          {isActive ? (
            sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-0 group-hover/th:opacity-40 transition-opacity" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <SortHeader label="Fornecedor" sortId="name" className="pl-6 w-[28%]" />
              <SortHeader label="Status" sortId="status" className="w-[12%] text-center" />
              <SortHeader label="Limite" sortId="limit" className="w-[15%]" />
              <SortHeader label="Preço Médio" sortId="avgPrice" className="hidden lg:table-cell w-[15%]" />
              <SortHeader label="Cotações" sortId="quotes" className="hidden lg:table-cell w-[10%] text-center" />
              <SortHeader label="Avaliação" sortId="rating" className="hidden xl:table-cell w-[10%] text-center" />
              <th className="h-11 px-4 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 pr-6 w-[10%]">
                Ações
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {sortedSuppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className={cn(
                  "group transition-colors duration-150",
                  "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                )}
              >
                {/* Fornecedor */}
                <td className="pl-6 pr-4 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-200/80 dark:border-zinc-700 shadow-sm">
                      <Building2 className="h-4 w-4 text-brand" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {capitalize(supplier.name)}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium truncate">
                        {supplier.contact || "Sem contato"}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-4 text-center">
                  <StatusBadge status={supplier.status} />
                </td>

                {/* Limite */}
                <td className="px-4 py-4">
                  <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {formatLimitBRL(supplier.limit)}
                  </span>
                </td>

                {/* Preço Médio */}
                <td className="px-4 py-4 hidden lg:table-cell">
                  <span className="font-medium text-sm text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {supplier.avgPrice}
                  </span>
                </td>

                {/* Cotações */}
                <td className="px-4 py-4 text-center hidden lg:table-cell">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-700 dark:text-zinc-300">
                    <FileText className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span className="font-medium text-xs tabular-nums">
                      {supplier.totalQuotes}
                    </span>
                  </div>
                </td>

                {/* Avaliação */}
                <td className="px-4 py-4 text-center hidden xl:table-cell">
                  {renderRating(supplier.rating)}
                </td>

                {/* Ações */}
                <td className="px-4 py-4 pr-6 text-right">
                  <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer com info */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-6 py-3 flex items-center justify-between">
          <span className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium">
            {sortedSuppliers.length} fornecedor{sortedSuppliers.length !== 1 ? 'es' : ''} exibido{sortedSuppliers.length !== 1 ? 's' : ''}
          </span>
          {sortKey && (
            <button
              onClick={() => { setSortKey(null); setSortDir('asc'); }}
              className="text-[12px] text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium transition-colors"
            >
              Limpar ordenação
            </button>
          )}
        </div>
    </div>
  );
});
