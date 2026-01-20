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

// Status configuration
const statusConfig = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  },
  em_andamento: {
    label: "Em Andamento",
    icon: Activity,
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  },
  finalizada: {
    label: "Finalizada",
    icon: CheckCircle,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  cancelada: {
    label: "Cancelada",
    icon: XCircle,
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  },
};

const getStatusBadge = (status: string) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
  return (
    <Badge variant="outline" className={cn("gap-1", config.badge)}>
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
    <div className="hidden lg:block rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-900/50">
            <TableHead className="font-semibold">Fornecedor</TableHead>
            <TableHead className="font-semibold">Data</TableHead>
            <TableHead className="font-semibold">Pedido</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Observações</TableHead>
            <TableHead className="text-right font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {counts.map((count) => (
            <TableRow key={count.id} className="group">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-medium">
                    {count.order?.supplier_name || "Contagem Livre"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-gray-600 dark:text-gray-400">
                {format(new Date(count.count_date), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    count.order
                      ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300"
                      : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  }
                >
                  {count.order ? "Sim" : "Não"}
                </Badge>
              </TableCell>
              <TableCell>{getStatusBadge(count.status)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-gray-500">
                {count.notes || "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(count.id)}
                    className="h-8 w-8 p-0 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {count.status !== "finalizada" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onFinalize(count.id)}
                      className="h-8 w-8 p-0 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(count.id)}
                    className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
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
