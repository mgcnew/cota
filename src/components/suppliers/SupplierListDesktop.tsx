import { memo, useState, useCallback } from 'react';
import { MessageCircle, History, ChevronUp, ChevronDown, ChevronsUpDown, Star } from 'lucide-react';
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
  renderRating?: (rating: number) => React.ReactNode;
}

const AVATAR_COLORS = [
  { bg: "bg-violet-100 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-400" },
  { bg: "bg-sky-100 dark:bg-sky-950/40",    text: "text-sky-700 dark:text-sky-400" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" },
  { bg: "bg-orange-100 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-400" },
  { bg: "bg-rose-100 dark:bg-rose-950/40",  text: "text-rose-700 dark:text-rose-400" },
  { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
  { bg: "bg-teal-100 dark:bg-teal-950/40",  text: "text-teal-700 dark:text-teal-400" },
  { bg: "bg-pink-100 dark:bg-pink-950/40",  text: "text-pink-700 dark:text-pink-400" },
  { bg: "bg-indigo-100 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-400" },
  { bg: "bg-cyan-100 dark:bg-cyan-950/40",  text: "text-cyan-700 dark:text-cyan-400" },
];

const getAvatarColor = (name: string) => {
  const hash = (name || "").toLowerCase().split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const getInitials = (name: string): string => {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

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
              <TableHead className="text-right pr-6 w-[10%]">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedSuppliers.map((supplier) => (
              <TableRow key={supplier.id} className="group">
                {/* Fornecedor */}
                <TableCell className="pl-6 pr-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-[13px] select-none", getAvatarColor(supplier.name).bg, getAvatarColor(supplier.name).text)}>
                      {getInitials(supplier.name)}
                    </div>
                    <div className="flex flex-col min-w-0 gap-0.5">
                      <span className="font-medium text-[13px] text-foreground truncate">
                        {capitalize(supplier.name)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground/70 truncate">
                          {supplier.contact || "Sem contato"}
                        </span>
                        {supplier.rating > 0 && (
                          <div className="flex items-center gap-px flex-shrink-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={cn("h-2.5 w-2.5", i < Math.round(supplier.rating / 2) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20")} />
                            ))}
                          </div>
                        )}
                      </div>
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
                  {(supplier.totalQuotes || 0) === 0 ? (
                    <span className="text-[12px] text-muted-foreground/40 tabular-nums">—</span>
                  ) : (supplier.totalQuotes || 0) >= 3 ? (
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-[12px] tabular-nums font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
                      {supplier.totalQuotes}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-[12px] tabular-nums font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50">
                      {supplier.totalQuotes}
                    </span>
                  )}
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
