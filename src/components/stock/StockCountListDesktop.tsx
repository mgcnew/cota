import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList, Eye, CheckCircle, Trash2, Clock, Activity, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ds } from "@/styles/design-system";

// Status configuration using Design System tokens
const statusConfig = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  em_andamento: {
    label: "Em Andamento",
    icon: Activity,
    badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  finalizada: {
    label: "Finalizada",
    icon: CheckCircle,
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  cancelada: {
    label: "Cancelada",
    icon: XCircle,
    badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
};

const getStatusBadge = (status: string) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-0.5", config.badge)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
};

interface StockCountListDesktopProps {
  counts: any[];
  onView: (id: string) => void;
  onFinalize: (id: string) => void;
  onDelete: (id: string) => void;
}

export const StockCountListDesktop = memo(({ counts, onView, onFinalize, onDelete }: StockCountListDesktopProps) => {
  return (
    <div className="hidden lg:block rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-12">Fornecedor</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-12">Data</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-12">Tipo</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-12">Status</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-12">Observações</TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground h-12">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {counts.map((count) => (
            <TableRow key={count.id} className="group hover:bg-muted/30 transition-colors">
              <TableCell className="py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                    <ClipboardList className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="font-medium text-foreground">
                    {count.order?.supplier_name || "Contagem Livre"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(count.count_date), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    count.order
                      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                      : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                  }
                >
                  {count.order ? "Pedido" : "Avulso"}
                </Badge>
              </TableCell>
              <TableCell>{getStatusBadge(count.status)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                {count.notes || "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(count.id)}
                    className="h-8 w-8 p-0 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    title="Ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {count.status !== "finalizada" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onFinalize(count.id)}
                      className="h-8 w-8 p-0 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      title="Finalizar contagem"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(count.id)}
                    className="h-8 w-8 p-0 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
