import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Building2, Package, Calendar, DollarSign, Eye, Edit, Trash2, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { capitalize } from "@/lib/text-utils";

interface Pedido {
  id: string;
  fornecedor: string;
  produtos: string[];
  itens: number;
  dataPedido: string;
  dataEntrega: string;
  status: string;
  total: string;
}

interface PedidosTableProps {
  pedidos: Pedido[];
  onView: (pedido: Pedido) => void;
  onEdit: (pedido: Pedido) => void;
  onDelete: (pedido: Pedido) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function PedidosTable({ pedidos, onView, onEdit, onDelete, getStatusBadge }: PedidosTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted dark:bg-accent/20 border-b border-border dark:border-primary/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="table-header py-4 px-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Pedido
              </div>
            </TableHead>
            <TableHead className="table-header py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Fornecedor
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell table-header py-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos
              </div>
            </TableHead>
            <TableHead className="hidden lg:table-cell table-header py-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data Entrega
              </div>
            </TableHead>
            <TableHead className="table-header py-4">Status</TableHead>
            <TableHead className="text-right table-header py-4">
              <div className="flex items-center justify-end gap-2">
                <DollarSign className="h-4 w-4" />
                Valor
              </div>
            </TableHead>
            <TableHead className="text-right table-header py-4 px-6">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido, index) => (
            <TableRow 
              key={pedido.id}
              className={cn(
                "hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 transition-all duration-200 border-b border-gray-100/60",
                index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              )}
            >
              <TableCell className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center flex-shrink-0 border border-purple-200/50">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="table-cell-primary font-mono truncate">
                      #{pedido.id}
                    </div>
                    <div className="table-cell-secondary mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {pedido.dataPedido}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="py-4">
                <div className="min-w-0">
                  <div className="table-cell-primary truncate">{capitalize(pedido.fornecedor)}</div>
                  <div className="table-cell-secondary mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
                      <Package className="h-3 w-3" />
                      {pedido.itens} itens
                    </span>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="hidden md:table-cell py-4">
                <div className="min-w-0">
                  <div className="table-cell-primary truncate max-w-[200px]">
                    {pedido.produtos.slice(0, 2).map(p => capitalize(p)).join(", ")}
                    {pedido.produtos.length > 2 && (
                      <span className="table-cell-secondary"> +{pedido.produtos.length - 2} mais</span>
                    )}
                  </div>
                  <div className="table-cell-secondary mt-1">
                    {pedido.produtos.length} produto{pedido.produtos.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="hidden lg:table-cell py-4">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1 text-gray-900">
                    <Truck className="h-3 w-3 text-purple-600" />
                    {pedido.dataEntrega}
                  </div>
                  <div className="text-xs text-gray-500">
                    Entrega prevista
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="py-4">
                {getStatusBadge(pedido.status)}
              </TableCell>
              
              <TableCell className="text-right py-4">
                <div className="font-bold text-green-600 text-base">{pedido.total}</div>
              </TableCell>
              
              <TableCell className="py-4 px-6">
                <div className="flex justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onView(pedido)}
                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Visualizar pedido</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEdit(pedido)}
                    className="h-8 w-8 p-0 hover:bg-amber-100 hover:text-amber-700 transition-colors duration-200"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar pedido</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete(pedido)}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir pedido</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}