import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Package, Calendar, DollarSign, Building2, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { capitalize } from "@/lib/text-utils";
import type { Quote } from "@/hooks/useCotacoes";
import { CapitalizedText } from "@/components/ui/capitalized-text";

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
        <TableHeader className="bg-transparent">
          <TableRow>
            <TableCell colSpan={7} className="px-1 pb-3 pt-0 border-none">
              <div className="flex items-center bg-gradient-to-r from-teal-500/20 via-teal-400/15 to-cyan-500/20 dark:from-teal-900/40 dark:via-teal-900/35 dark:to-cyan-900/35 border border-teal-300/60 dark:border-teal-900/60 rounded-xl shadow-md backdrop-blur-sm px-4 py-3">
                <div className="w-[22%] flex items-center gap-2 pr-4 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/70 dark:bg-gray-900/40 border border-teal-200/50 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-cyan-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-900 dark:text-teal-100">Cotação</span>
                </div>
                <div className="hidden md:flex w-[20%] pl-2">
                  <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-900 dark:text-teal-100">Produto</span>
                </div>
                <div className="hidden lg:flex w-[18%] pl-2">
                  <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-900 dark:text-teal-100">Período</span>
                </div>
                <div className="hidden sm:flex w-[12%] pl-2 justify-center">
                  <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-900 dark:text-teal-100">Status</span>
                </div>
                <div className="flex w-[16%] pl-2 justify-center">
                  <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-900 dark:text-teal-100">Melhor Preço</span>
                </div>
                <div className="hidden sm:flex w-[12%] pl-2 justify-center">
                  <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-900 dark:text-teal-100">Fornecedores</span>
                </div>
                <div className="w-[10%] pl-4 flex justify-end">
                  <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-900 dark:text-teal-100">Ações</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cotacoes.map((cotacao, index) => (
            <TableRow 
              key={cotacao.id}
              className={cn(
                "hover:bg-accent/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border-b border-border",
                index % 2 === 0 ? "bg-card" : "bg-muted/30"
              )}
            >
              <TableCell className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="table-cell-primary font-mono truncate">
                      {cotacao.id.length > 12 
                        ? `${cotacao.id.substring(0, 8)}...${cotacao.id.substring(cotacao.id.length - 4)}`
                        : cotacao.id
                      }
                    </div>
                    <div className="table-cell-secondary md:hidden mt-1 truncate" title={cotacao.produto}>
                      <CapitalizedText className="block truncate">
                        {cotacao.produtoResumo}
                      </CapitalizedText>
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="hidden md:table-cell py-4">
                <div className="min-w-0">
                  <div className="table-cell-primary truncate" title={cotacao.produto}>
                    <CapitalizedText>
                      {cotacao.produtoResumo}
                    </CapitalizedText>
                  </div>
                  <div className="table-cell-secondary mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                      <Package className="h-3 w-3" />
                      {cotacao.quantidade}
                    </span>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="hidden lg:table-cell py-4">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1 text-foreground">
                    <Calendar className="h-3 w-3 text-primary" />
                    {cotacao.dataInicio}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
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
                  <div className="font-bold text-success text-base">{cotacao.melhorPreco}</div>
                  <CapitalizedText as="div" className="table-cell-secondary truncate max-w-[120px]">
                    {cotacao.melhorFornecedor}
                  </CapitalizedText>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success rounded-md text-xs font-medium">
                    <DollarSign className="h-3 w-3" />
                    -{cotacao.economia}
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="hidden sm:table-cell py-4">
                <Badge 
                  variant="outline" 
                  className="bg-primary/10 border-primary/20 text-primary font-medium"
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  {cotacao.fornecedores}
                </Badge>
              </TableCell>
              
              <TableCell className="py-4 px-4">
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-accent transition-colors duration-200"
                      >
                        <MoreVertical className="h-4 w-4 transition-colors duration-200" />
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