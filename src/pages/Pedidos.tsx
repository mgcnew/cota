import { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capitalize } from "@/lib/text-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { TableActionGroup } from "@/components/ui/table-action-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { ShoppingCart, Plus, Search, Eye, Truck, CheckCircle, Clock, XCircle, Trash2, Loader2, DollarSign, Package, Building2, Calendar, MoreVertical, CircleDot } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import PedidoDialog from "@/components/forms/PedidoDialog";
import DeletePedidoDialog from "@/components/forms/DeletePedidoDialog";
import { usePedidos } from "@/hooks/usePedidos";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/layout/PageWrapper";

// Lazy load stats cards
const StatsCards = lazy(() => import("@/components/pedidos/DesktopStatsCards"));

export default function Pedidos() {
  const { viewMode, setViewMode } = useResponsiveViewMode();
  const { paginate } = usePagination<any>({
    initialItemsPerPage: 10
  });

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<"all" | "pendente" | "processando" | "confirmado" | "entregue" | "cancelado">("all");

  // Unified Data Fetching
  const { pedidos: pedidosDataArray, isLoading, refetch, deletePedido } = usePedidos();

  // Controlar exibição de loading apenas na primeira carga
  const hasLoadedOnce = useRef(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      hasLoadedOnce.current = true;
      setShowLoading(false);
    }
  }, [isLoading]);

  const [fornecedorFilter, setFornecedorFilter] = useState("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pedidoDialogOpen, setPedidoDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);


  // Formatar os pedidos para o formato esperado pela página
  const pedidos = useMemo(() => {
    return pedidosDataArray.map(order => {
      return {
        id: order.id,
        fornecedor: order.supplier_name,
        total: `R$ ${Number(order.total_value).toLocaleString('pt-BR', {
          minimumFractionDigits: 2
        })}`,
        status: order.status,
        dataPedido: new Date(order.order_date).toLocaleDateString('pt-BR'),
        dataEntrega: order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : '',
        itens: order.items?.length || 0,
        produtos: order.items?.map((item: any) => item.product_name) || [],
        observacoes: order.observations || "",
        detalhesItens: order.items?.map((item: any) => ({
          produto: item.product_name,
          quantidade: item.quantity,
          valorUnitario: Number(item.unit_price)
        })) || [],
        supplier_id: order.supplier_id || null,
        delivery_date: order.delivery_date
      };
    });
  }, [pedidosDataArray]);

  const abbreviateSupplierName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    const words = name.split(' ');
    if (words.length === 1) {
      return name.substring(0, maxLength - 3) + '...';
    }
    if (words.length >= 2) {
      const firstWord = words[0];
      const lastWord = words[words.length - 1];
      const abbreviated = `${firstWord} ... ${lastWord}`;
      if (abbreviated.length <= maxLength) {
        return abbreviated;
      }
    }
    return name.substring(0, maxLength - 3) + '...';
  };

  const handleAddPedido = () => {
    refetch();
  };
  const handleEditPedido = () => {
    refetch();
  };
  const handleDeletePedido = () => {
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: {
        variant: "outline" as const,
        className: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium",
        label: "Pendente"
      },
      processando: {
        variant: "outline" as const,
        className: "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium",
        label: "Processando"
      },
      confirmado: {
        variant: "outline" as const,
        className: "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium",
        label: "Confirmado"
      },
      entregue: {
        variant: "outline" as const,
        className: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium",
        label: "Entregue"
      },
      cancelado: {
        variant: "outline" as const,
        className: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 font-medium",
        label: "Cancelado"
      }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    return <Badge variant={config.variant} className={cn("transition-all duration-200", config.className)}>
      {config.label}
    </Badge>;
  };
  const getStatusIcon = (status: string) => {
    const icons = {
      pendente: Clock,
      processando: Clock,
      confirmado: CheckCircle,
      entregue: Truck,
      cancelado: XCircle
    };
    const Icon = icons[status as keyof typeof icons];
    return <Icon className="h-4 w-4" />;
  };

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(pedido => {
      const matchesSearch = pedido.fornecedor.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || pedido.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || pedido.produtos.some(p => p.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || pedido.status === statusFilter;
      const matchesFornecedor = fornecedorFilter === "all" || pedido.fornecedor === fornecedorFilter;
      const pedidoValor = parseFloat(pedido.total.replace("R$ ", "").replace(/\./g, "").replace(",", "."));
      const matchesValorMin = !valorMin || pedidoValor >= parseFloat(valorMin);
      const matchesValorMax = !valorMax || pedidoValor <= parseFloat(valorMax);
      const pedidoData = pedido.dataPedido.split('/').reverse().join('-');
      const matchesDataInicio = !dataInicio || pedidoData >= dataInicio;
      const matchesDataFim = !dataFim || pedidoData <= dataFim;
      return matchesSearch && matchesStatus && matchesFornecedor && matchesValorMin && matchesValorMax && matchesDataInicio && matchesDataFim;
    });
  }, [pedidos, debouncedSearchTerm, statusFilter, fornecedorFilter, valorMin, valorMax, dataInicio, dataFim]);

  const paginatedData = paginate(filteredPedidos);

  // Calculate real stats
  const stats = useMemo(() => {
    const pedidosAtivos = pedidos.filter(p => p.status === "pendente" || p.status === "processando");
    const pedidosEntregues = pedidos.filter(p => p.status === "entregue");
    const pedidosCancelados = pedidos.filter(p => p.status === "cancelado");

    // Total de pedidos não cancelados
    const pedidosValidos = pedidos.filter(p => p.status !== "cancelado");

    // Calcular valor total (somar valores numéricos dos pedidos)
    const totalValue = pedidosValidos.reduce((acc, p) => {
      // Extrair valor numérico do formato "R$ X.XXX,XX"
      const cleanValue = p.total.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
      return acc + (parseFloat(cleanValue) || 0);
    }, 0);

    // Calcular valor médio por pedido
    const valorMedioPorPedido = pedidosValidos.length > 0
      ? (totalValue / pedidosValidos.length)
      : 0;

    // Calcular total de itens
    const totalItens = pedidos.reduce((acc, p) => acc + (p.itens || 0), 0);

    // Calcular média de itens por pedido
    const mediaItensPorPedido = pedidos.length > 0
      ? Math.round(totalItens / pedidos.length)
      : 0;

    // Percentual de pedidos ativos
    const percentualAtivos = pedidos.length > 0
      ? Math.round((pedidosAtivos.length / pedidos.length) * 100)
      : 0;

    // Taxa de entrega (percentual de entregues)
    const taxaEntrega = pedidos.length > 0
      ? Math.round((pedidosEntregues.length / pedidos.length) * 100)
      : 0;

    // Formatar valores com moeda brasileira
    const totalValueFormatado = totalValue > 0
      ? totalValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      : 'R$ 0,00';

    const valorMedioFormatado = valorMedioPorPedido > 0
      ? valorMedioPorPedido.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      : 'R$ 0,00';

    return {
      pedidosAtivos: pedidosAtivos.length,
      pedidosEntregues: pedidosEntregues.length,
      pedidosCancelados: pedidosCancelados.length,
      totalValue,
      totalValueFormatado,
      valorMedioPorPedido,
      valorMedioFormatado,
      totalItens,
      mediaItensPorPedido,
      percentualAtivos,
      taxaEntrega,
      totalPedidos: pedidos.length,
      pedidosPendentes: pedidos.filter(p => p.status === "pendente").length,
      pedidosProcessando: pedidos.filter(p => p.status === "processando").length
    };
  }, [pedidos]);

  return <PageWrapper>
    <div className="page-container">
      {/* Statistics Cards */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl mb-6" />}>
        <StatsCards stats={stats} />
      </Suspense>

      <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
            <div className="hidden lg:block">
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:justify-end flex-1 lg:flex-initial">
              {/* Barra de busca */}
              <div className="flex-shrink-0">
                <ExpandableSearch
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar por fornecedor, produto ou ID..."
                  accentColor="orange"
                  expandedWidth="w-72"
                />
              </div>

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full sm:w-[180px] h-10 bg-white/85 dark:bg-gray-900/60 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/70 hover:border-orange-300/70 dark:hover:border-orange-500/70 focus:border-orange-400 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-200/40 dark:focus:ring-orange-700/40 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 px-3 text-gray-900 dark:text-gray-100">
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendentes</option>
                <option value="processando">Processando</option>
                <option value="confirmado">Confirmados</option>
                <option value="entregue">Entregues</option>
                <option value="cancelado">Cancelados</option>
              </select>

              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showLoading ? <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div> : <>
        {/* Pedidos View */}
        {viewMode === "table" ? <Card className="border-0 bg-transparent">
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-transparent">
                  <TableRow>
                    <TableCell colSpan={7} className="px-1 pb-3 pt-0 border-none">
                      <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-orange-300/60 dark:border-orange-900/60 rounded-xl shadow-md backdrop-blur-sm px-4 py-3">
                        <div className="w-[15%] flex items-center gap-2 pr-4 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/15 to-amber-500/15 flex items-center justify-center text-orange-600 dark:text-amber-300">
                            <ShoppingCart className="h-4 w-4" />
                          </div>
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Pedido</span>
                        </div>
                        <div className="w-[18%] flex items-center gap-1.5 px-2 min-w-0">
                          <Building2 className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Fornecedor</span>
                        </div>
                        <div className="hidden md:flex w-[18%] px-2 items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Produtos</span>
                        </div>
                        <div className="hidden lg:flex w-[15%] px-2 items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Entrega</span>
                        </div>
                        <div className="flex w-[12%] px-2 justify-center items-center gap-1.5">
                          <CircleDot className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Status</span>
                        </div>
                        <div className="flex w-[12%] px-2 justify-center items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Valor</span>
                        </div>
                        <div className="w-[10%] pl-4 flex justify-end items-center gap-1.5">
                          <MoreVertical className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Ações</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map((pedido, index) => <TableRow key={pedido.id} className="group border-none">
                    <TableCell colSpan={7} className="px-1 py-3">
                      <div className="flex items-center p-3 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300/70 dark:border-gray-700/30 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-orange-300/60 dark:hover:border-orange-700/50 transition-[box-shadow,border-color] duration-200 [&_*]:!transition-none">
                        {/* Pedido - Largura fixa */}
                        <div className="w-[15%] flex items-center gap-3 pr-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20 flex items-center justify-center flex-shrink-0 border border-orange-200/50 dark:border-orange-700/50">
                            <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold font-mono text-sm text-foreground truncate">
                              #{pedido.id.substring(0, 8)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {pedido.dataPedido}
                            </div>
                          </div>
                        </div>

                        {/* Fornecedor - Largura fixa */}
                        <div className="w-[18%] px-2">
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate" title={pedido.fornecedor}>
                              {capitalize(abbreviateSupplierName(pedido.fornecedor))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                                <Package className="h-3 w-3" />
                                {pedido.itens} itens
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Produtos - Largura fixa, hidden on mobile */}
                        <div className="hidden md:block w-[18%] px-2">
                          <div className="min-w-0">
                            <div className="text-sm text-foreground truncate max-w-[150px]">
                              {capitalize(pedido.produtos[0])}
                              {pedido.produtos.length > 1 && <span className="text-muted-foreground"> +{pedido.produtos.length - 1}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {pedido.produtos.length} produto{pedido.produtos.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        {/* Entrega - Largura fixa, hidden on large screens */}
                        <div className="hidden lg:block w-[15%] px-2">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1 text-foreground">
                              <Truck className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                              {pedido.dataEntrega}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Entrega prevista
                            </div>
                          </div>
                        </div>

                        {/* Status - Largura fixa */}
                        <div className="w-[12%] px-2">
                          <div className="flex justify-center">
                            {getStatusBadge(pedido.status)}
                          </div>
                        </div>

                        {/* Valor - Largura fixa */}
                        <div className="w-[12%] px-2">
                          <div className="text-center">
                            <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{pedido.total}</div>
                          </div>
                        </div>

                        {/* Ações - Largura fixa */}
                        <div className="w-[10%] pl-4">
                          <TableActionGroup
                            onView={() => { setSelectedPedido(pedido); setPedidoDialogOpen(true); }}
                            onDelete={() => { setSelectedPedido(pedido); setDeleteDialogOpen(true); }}
                            showEdit={false}
                            viewLabel="Ver"
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </div>

            {/* Paginação com melhor espaçamento */}
            <div className="border-t border-orange-100/80 dark:border-gray-700/30 bg-gradient-to-r from-orange-50/30 to-amber-50/30 dark:from-gray-800/30 dark:to-gray-800/20 px-6 py-4">
              <DataPagination
                currentPage={paginatedData.pagination.currentPage}
                totalPages={paginatedData.pagination.totalPages}
                itemsPerPage={(paginatedData.pagination as any).itemsPerPage || (paginatedData.pagination as any).pageSize || 20}
                totalItems={paginatedData.pagination.totalItems}
                onPageChange={paginatedData.pagination.goToPage}
                onItemsPerPageChange={(paginatedData.pagination as any).onItemsPerPageChange || (paginatedData.pagination as any).setItemsPerPage || (paginatedData.pagination as any).setPageSize || (() => { })}
                startIndex={(paginatedData.pagination as any).startIndex || 0}
                endIndex={(paginatedData.pagination as any).endIndex || 0}
              />
            </div>
          </CardContent>
        </Card> : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {paginatedData.items.map((pedido, index) => {
              const getStatusColors = (status: string) => {
                switch (status) {
                  case "entregue":
                    return {
                      border: "border-green-300/60",
                      bg: "from-white to-green-50/30",
                      iconBg: "from-green-500/10 to-emerald-500/10 group-hover:from-green-500/20 group-hover:to-emerald-500/20",
                      iconColor: "text-green-600"
                    };
                  case "confirmado":
                    return {
                      border: "border-blue-300/60",
                      bg: "from-white to-blue-50/30",
                      iconBg: "from-blue-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20",
                      iconColor: "text-blue-600"
                    };
                  case "processando":
                    return {
                      border: "border-amber-300/60",
                      bg: "from-white to-amber-50/30",
                      iconBg: "from-amber-500/10 to-yellow-500/10 group-hover:from-amber-500/20 group-hover:to-yellow-500/20",
                      iconColor: "text-amber-600"
                    };
                  case "cancelado":
                    return {
                      border: "border-red-300/60",
                      bg: "from-white to-red-50/30",
                      iconBg: "from-red-500/10 to-pink-500/10 group-hover:from-red-500/20 group-hover:to-pink-500/20",
                      iconColor: "text-red-600"
                    };
                  default:
                    return {
                      border: "border-gray-300/60",
                      bg: "from-white to-gray-50/30",
                      iconBg: "from-gray-500/10 to-slate-500/10 group-hover:from-gray-500/20 group-hover:to-slate-500/20",
                      iconColor: "text-gray-600"
                    };
                }
              };
              const colors = getStatusColors(pedido.status);
              const pedidoNumero = ((paginatedData.pagination as any).startIndex || 0) + index + 1;
              return <Card key={pedido.id} className={cn("group border border-gray-200/60 dark:border-gray-700/30 bg-gradient-to-br", colors.bg, "dark:from-[#1C1F26] dark:to-[#1C1F26]", `sm:hover:${colors.border}`, "sm:hover:shadow-xl sm:dark:hover:shadow-lg sm:dark:hover:shadow-black/20 sm:transition-shadow sm:duration-200", "backdrop-blur-sm")}>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className={cn("p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl", colors.iconBg, "sm:transition-all sm:duration-200")}>
                        <div className={cn("h-4 w-4 sm:h-5 sm:w-5", colors.iconColor, "sm:group-hover:scale-110 sm:transition-transform sm:duration-200")}>
                          {getStatusIcon(pedido.status)}
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                        <CardTitle className={cn("text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate", "sm:group-hover:text-orange-700 sm:dark:group-hover:text-orange-400 sm:transition-colors sm:duration-200")} title={pedido.fornecedor}>
                          {capitalize(abbreviateSupplierName(pedido.fornecedor, 25))}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {getStatusBadge(pedido.status)}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:duration-200 sm:hover:bg-orange-100 h-8 w-8 sm:h-9 sm:w-9 rounded-full">
                          <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedPedido(pedido); setPedidoDialogOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" />Ver/Editar Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedPedido(pedido); setDeleteDialogOpen(true); }} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/30">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                          <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Pedido</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                          #{pedidoNumero.toString().padStart(4, '0')}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                          <span className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-400">Itens</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-orange-800 dark:text-orange-300">{pedido.itens}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="p-2.5 sm:p-3 rounded-lg bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/30">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400">Entrega</span>
                      </div>
                      <p className="text-[10px] sm:text-xs font-semibold text-blue-800 dark:text-blue-300">{pedido.dataEntrega}</p>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Valor Total</p>
                        <p className="text-lg sm:text-xl font-bold text-success">{pedido.total}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>;
            })}
          </div>
        )}
      </>}

      {/* Dialogs */}
      <AddPedidoDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={handleAddPedido} />

      {selectedPedido && (
        <PedidoDialog
          open={pedidoDialogOpen}
          onOpenChange={setPedidoDialogOpen}
          pedido={selectedPedido}
          onEdit={handleEditPedido}
        />
      )}

      <DeletePedidoDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        pedido={selectedPedido}
        onDelete={handleDeletePedido}
      />
    </div>
  </PageWrapper>;
}