import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Package, Calendar, DollarSign, Building2, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { capitalize } from "@/lib/text-utils";
import type { Quote } from "@/hooks/useCotacoes";

interface CotacoesTableProps {
  cotacoes: Quote[];
  onView: (cotacao: Quote) => void;
  onEdit: (cotacao: Quote) => void;
  onDelete: (cotacao: Quote) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function CotacoesTable({ cotacoes, onView, onEdit, onDelete, getStatusBadge }: CotacoesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted dark:bg-accent/20 border-b border-border dark:border-primary/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="table-header py-4 px-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cotação
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell table-header py-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produto
              </div>
            </TableHead>
            <TableHead className="hidden lg:table-cell table-header py-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </div>
            </TableHead>
            <TableHead className="table-header py-4">Status</TableHead>
            <TableHead className="table-header py-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Melhor Preço
              </div>
            </TableHead>
            <TableHead className="hidden sm:table-cell table-header py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Fornecedores
              </div>
            </TableHead>
            <TableHead className="text-right table-header py-4 px-6">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cotacoes.map((cotacao, index) => (
            <TableRow 
              key={cotacao.id}
              className={cn(
                "hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-cyan-50/30 transition-all duration-200 border-b border-gray-100/60",
                index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              )}
            >
              <TableCell className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-teal-200/50">
                    <FileText className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="table-cell-primary font-mono truncate">
                      {cotacao.id.length > 12 
                        ? `${cotacao.id.substring(0, 8)}...${cotacao.id.substring(cotacao.id.length - 4)}`
                        : cotacao.id
                      }
                    </div>
                    <div className="table-cell-secondary md:hidden mt-1 truncate">{capitalize(cotacao.produto)}</div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="hidden md:table-cell py-4">
                <div className="min-w-0">
                  <div className="table-cell-primary truncate">{capitalize(cotacao.produto)}</div>
                  <div className="table-cell-secondary mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
                      <Package className="h-3 w-3" />
                      {cotacao.quantidade}
                    </span>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="hidden lg:table-cell py-4">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1 text-gray-900">
                    <Calendar className="h-3 w-3 text-teal-600" />
                    {cotacao.dataInicio}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {cotacao.dataFim}
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="py-4">
                {getStatusBadge(cotacao.status)}
              </TableCell>
              
              <TableCell className="py-4">
                <div className="space-y-1">
                  <div className="font-bold text-green-600 text-base">{cotacao.melhorPreco}</div>
                  <div className="table-cell-secondary truncate max-w-[120px]">{capitalize(cotacao.melhorFornecedor)}</div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                    <DollarSign className="h-3 w-3" />
                    -{cotacao.economia}
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="hidden sm:table-cell py-4">
                <Badge 
                  variant="outline" 
                  className="bg-blue-50 border-blue-200 text-blue-700 font-medium"
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  {cotacao.fornecedores}
                </Badge>
              </TableCell>
              
              <TableCell className="py-4 px-6">
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Abrir menu de ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={() => onView(cotacao)}
                        className="cursor-pointer"
                      >
                        <Eye className="h-4 w-4 mr-2 text-blue-600" />
                        <span>Visualizar</span>
                      </DropdownMenuItem>
                      
                      {cotacao.status !== "concluida" && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => onEdit(cotacao)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2 text-amber-600" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => onDelete(cotacao)}
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {cotacao.status === "concluida" && (
                        <DropdownMenuItem disabled className="text-gray-400">
                          <FileText className="h-4 w-4 mr-2" />
                          <span>Cotação finalizada</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}