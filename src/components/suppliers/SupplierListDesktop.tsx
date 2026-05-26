import { memo, useState, useCallback } from 'react';
import { Building2, MessageCircle, History, ChevronUp, ChevronDown, ChevronsUpDown, FileText } from 'lucide-react';
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActionGroup } from "@/components/ui/table-action-group";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
        case 'name':     cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR'); break;
        case 'status':   cmp = (a.status || '').localeCompare(b.status || '', 'pt-BR'); break;
        case 'limit':    cmp = extractPrice(a.limit || '') - extractPrice(b.limit || ''); break;
        case 'avgPrice': cmp = extractPrice(a.avgPrice || '') - extractPrice(b.avgPrice || ''); break;
        case 'quotes':   cmp = (a.totalQuotes || 0) - (b.totalQuotes || 0); break;
        case 'rating':   cmp = (a.rating || 0) - (b.rating || 0); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  })();

  const SortHeader = ({ label, sortId, className }: { label: string; sortId: SortKey; className?: string }) => {
    const isActive = sortKey === sortId;
    return (
      <TableHead
        className={cn("cursor-pointer select-none group/th", isActive && "text-foreground font-semibold", className)}
        onClick={() => handleSort(sortId)}
      >
        <div className={cn("flex items-center gap-1.5", className?.includes("text-center") && "justify-center", className?.includes("text-right") && "justify-end")}>
          {label}
          <div className="w-3 h-3 text-muted-foreground/30 transition-colors">
            {isActive ? (
              sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-brand" /> : <ChevronDown className="w-3 h-3 text-brand" />
            ) : (
              <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </TableHead>
    );
  };

  return (
    <>
      <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Fornecedor" sortId="name" className="pl-6 w-[28%]" />
              <SortHeader label="Status" sortId="status" className="w-[12%] text-center" />
              <SortHeader label="Limite" sortId="limit" className="w-[15%]" />
              <SortHeader label="Preço Médio" sortId="avgPrice" className="hidden lg:table-cell w-[15%]" />
              <SortHeader label="Cotações" sortId="quotes" className="hidden lg:table-cell w-[10%] text-center" />
              <SortHeader label="Avaliação" sortId="rating" className="hidden xl:table-cell w-[10%] text-center" />
              <TableHead className="text-right pr-6 w-[10%]">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedSuppliers.map((supplier) => (
              <TableRow key={supplier.id} className="group">
                {/* Fornecedor */}
                <TableCell className="pl-6 pr-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0 border border-border dark:border-white/5 shadow-sm">
                      <Building2 className="h-4 w-4 text-brand" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-[13px] text-foreground truncate">
                        {capitalize(supplier.name)}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70 truncate">
                        {supplier.contact || "Sem contato"}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell className="text-center">
                  <StatusBadge status={supplier.status} />
                </TableCell>

                {/* Limite */}
                <TableCell>
                  <span className="text-[13px] text-foreground tabular-nums">
                    {formatLimitBRL(supplier.limit)}
                  </span>
                </TableCell>

                {/* Preço Médio */}
                <TableCell className="hidden lg:table-cell">
                  <span className="text-[13px] text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {supplier.avgPrice}
                  </span>
                </TableCell>

                {/* Cotações */}
                <TableCell className="text-center hidden lg:table-cell">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="text-xs tabular-nums">{supplier.totalQuotes}</span>
                  </div>
                </TableCell>

                {/* Avaliação */}
                <TableCell className="text-center hidden xl:table-cell">
                  {renderRating(supplier.rating)}
                </TableCell>

                {/* Ações */}
                <TableCell className="pr-6 text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>

      {/* Footer */}
      <div className="border-t border-border dark:border-white/5 bg-muted/20 px-6 py-3 flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground font-medium">
          {sortedSuppliers.length} fornecedor{sortedSuppliers.length !== 1 ? 'es' : ''} exibido{sortedSuppliers.length !== 1 ? 's' : ''}
        </span>
        {sortKey && (
          <button
            onClick={() => { setSortKey(null); setSortDir('asc'); }}
            className="text-[12px] text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Limpar ordenação
          </button>
        )}
      </div>
    </>
  );
});
