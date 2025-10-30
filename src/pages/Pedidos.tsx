import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capitalize } from "@/lib/text-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { ViewMode } from "@/types/pagination";
import { ShoppingCart, Plus, Search, Filter, Eye, Edit, Truck, Download, CheckCircle, Clock, XCircle, Trash2, X, Loader2, DollarSign, Package, Building2, Calendar, TrendingUp } from "lucide-react";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import EditPedidoDialog from "@/components/forms/EditPedidoDialog";
import DeletePedidoDialog from "@/components/forms/DeletePedidoDialog";
import ViewPedidoDialog from "@/components/forms/ViewPedidoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/layout/PageWrapper";
export default function Pedidos() {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    viewMode,
    setViewMode
  } = useResponsiveViewMode();
  const {
    paginate
  } = usePagination<any>({
    initialItemsPerPage: 10
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fornecedorFilter, setFornecedorFilter] = useState("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadOrders();
  }, [user]);
  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const {
        data: orders,
        error
      } = await supabase.from('orders').select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      const formattedOrders = orders?.map(order => ({
        id: order.id,
        fornecedor: order.supplier_name,
        total: `R$ ${Number(order.total_value).toLocaleString('pt-BR', {
          minimumFractionDigits: 2
        })}`,
        status: order.status,
        dataPedido: new Date(order.order_date).toLocaleDateString('pt-BR'),
        dataEntrega: new Date(order.delivery_date).toLocaleDateString('pt-BR'),
        itens: order.order_items?.length || 0,
        produtos: order.order_items?.map((item: any) => item.product_name) || [],
        observacoes: order.observations || "",
        detalhesItens: order.order_items?.map((item: any) => ({
          produto: item.product_name,
          quantidade: item.quantity,
          valorUnitario: Number(item.unit_price)
        })) || [],
        supplier_id: order.supplier_id,
        delivery_date: order.delivery_date
      })) || [];
      setPedidos(formattedOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  // Função para abreviar nomes longos de fornecedores
  const abbreviateSupplierName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    const words = name.split(' ');
    if (words.length === 1) {
      return name.substring(0, maxLength - 3) + '...';
    }

    // Se tem múltiplas palavras, tenta manter primeira e última palavra
    if (words.length >= 2) {
      const firstWord = words[0];
      const lastWord = words[words.length - 1];
      const abbreviated = `${firstWord} ... ${lastWord}`;
      if (abbreviated.length <= maxLength) {
        return abbreviated;
      }
    }

    // Se ainda for muito longo, trunca simples
    return name.substring(0, maxLength - 3) + '...';
  };
  const handleAddPedido = () => {
    loadOrders();
  };
  const handleEditPedido = () => {
    loadOrders();
  };
  const handleDeletePedido = () => {
    loadOrders();
  };
  const fornecedores = [...new Set(pedidos.map(p => p.fornecedor))];
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFornecedorFilter("all");
    setDataInicio("");
    setDataFim("");
    setValorMin("");
    setValorMax("");
  };
  const exportToCSV = () => {
    const headers = ["ID", "Fornecedor", "Total", "Status", "Data Pedido", "Data Entrega", "Itens", "Produtos", "Observações"];
    const csvData = filteredPedidos.map(p => [p.id, p.fornecedor, p.total, p.status, p.dataPedido, p.dataEntrega, p.itens, p.produtos.join("; "), p.observacoes]);
    const csvContent = [headers.join(","), ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = pedido.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) || pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) || pedido.produtos.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || pedido.status === statusFilter;
    const matchesFornecedor = fornecedorFilter === "all" || pedido.fornecedor === fornecedorFilter;
    const pedidoValor = parseFloat(pedido.total.replace("R$ ", "").replace(".", "").replace(",", "."));
    const matchesValorMin = !valorMin || pedidoValor >= parseFloat(valorMin);
    const matchesValorMax = !valorMax || pedidoValor <= parseFloat(valorMax);
    const pedidoData = pedido.dataPedido.split('/').reverse().join('-');
    const matchesDataInicio = !dataInicio || pedidoData >= dataInicio;
    const matchesDataFim = !dataFim || pedidoData <= dataFim;
    return matchesSearch && matchesStatus && matchesFornecedor && matchesValorMin && matchesValorMax && matchesDataInicio && matchesDataFim;
  });
  const paginatedData = paginate(filteredPedidos);
  const totalValue = pedidos.filter(p => p.status !== "cancelado").reduce((acc, p) => acc + parseFloat(p.total.replace("R$ ", "").replace(".", "").replace(",", ".")), 0);
  return <PageWrapper>
      <div className="page-container">
        {/* Statistics Cards - Estilo Apple */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 overflow-visible">
          <Card className="group relative overflow-hidden bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:scale-[1.01] hover:border-gray-300 dark:hover:border-gray-600/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ativos</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                  <Clock className="h-2.5 w-2.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-600">65%</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {pedidos.filter(p => p.status === "pendente" || p.status === "processando").length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">em andamento</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-xs font-semibold text-amber-600">65%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:scale-[1.01] hover:border-gray-300 dark:hover:border-gray-600/50">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Truck className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entregues</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-2.5 w-2.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-600">{Math.floor(pedidos.filter(p => p.status === "entregue").length / pedidos.length * 100)}%</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {pedidos.filter(p => p.status === "entregue").length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">concluídos</p>
              </div>
              <div className="flex items-end gap-0.5 h-8">
                {[55, 70, 60, 85, 75, 90, 80].map((height, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500 to-green-400 rounded-t opacity-60 hover:opacity-100 transition-opacity" style={{ height: `${height}%` }}></div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:scale-[1.01] hover:border-gray-300 dark:hover:border-gray-600/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Total</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <TrendingUp className="h-2.5 w-2.5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600">15%</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">em pedidos</p>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Média: R$ {pedidos.length > 0 ? (totalValue / pedidos.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:scale-[1.01] hover:border-gray-300 dark:hover:border-gray-600/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Package className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Itens</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                  <Package className="h-2.5 w-2.5 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-600">Média</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {pedidos.length > 0 ? Math.round(pedidos.reduce((acc, p) => acc + p.itens, 0) / pedidos.length) : 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">por pedido</p>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Total: {pedidos.reduce((acc, p) => acc + p.itens, 0)} itens em {pedidos.length} pedidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
          <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
            <ViewToggle view={viewMode} onViewChange={setViewMode} />

            <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:justify-end">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 z-10" />
                <Input placeholder="Buscar por fornecedor, produto ou ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 pr-4 w-64 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-pink-300/70 dark:hover:border-pink-600/70 focus:border-pink-400 dark:focus:border-pink-500 focus:ring-2 focus:ring-pink-200/50 dark:focus:ring-pink-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white" />
              </div>

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full sm:w-[180px] h-10 bg-white/85 dark:bg-gray-900/60 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/70 hover:border-pink-300/70 dark:hover:border-pink-500/70 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-200/40 dark:focus:ring-pink-700/40 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 px-3 text-gray-900 dark:text-gray-100">
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendentes</option>
                <option value="processando">Processando</option>
                <option value="confirmado">Confirmados</option>
                <option value="entregue">Entregues</option>
                <option value="cancelado">Cancelados</option>
              </select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-pink-300/70 dark:hover:border-pink-600/70 focus:border-pink-400 dark:focus:border-pink-500 focus:ring-2 focus:ring-pink-200/50 dark:focus:ring-pink-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros Avançados
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Filtros Avançados</h4>
                      <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Fornecedor</Label>
                      <select value={fornecedorFilter} onChange={e => setFornecedorFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                        <option value="all">Todos os Fornecedores</option>
                        {fornecedores.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Data Início</Label>
                        <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Fim</Label>
                        <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Valor Mínimo</Label>
                        <Input type="number" placeholder="R$ 0,00" value={valorMin} onChange={e => setValorMin(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Máximo</Label>
                        <Input type="number" placeholder="R$ 0,00" value={valorMax} onChange={e => setValorMax(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={exportToCSV} className="h-10 bg-white/85 dark:bg-gray-900/60 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/70 hover:border-pink-300/70 dark:hover:border-pink-500/70 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-200/40 dark:focus:ring-pink-700/40 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 text-gray-900 dark:text-gray-100">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>

              <Button className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? <div className="flex items-center justify-center py-12">
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
                          <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-pink-300/60 dark:border-pink-900/60 rounded-xl shadow-md backdrop-blur-sm px-4 py-3">
                            <div className="w-[22%] flex items-center gap-2 pr-4 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/15 to-rose-500/15 flex items-center justify-center text-pink-600 dark:text-rose-300">
                                <ShoppingCart className="h-4 w-4" />
                              </div>
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-pink-900 dark:text-pink-100">Pedido</span>
                            </div>
                            <div className="w-[18%] flex items-center gap-2 pl-2 min-w-0">
                              <Building2 className="h-4 w-4 text-pink-600 dark:text-pink-300" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-pink-900 dark:text-pink-100">Fornecedor</span>
                            </div>
                            <div className="hidden md:flex w-[18%] pl-2 items-center gap-2">
                              <Package className="h-4 w-4 text-pink-600 dark:text-pink-300" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-pink-900 dark:text-pink-100">Produtos</span>
                            </div>
                            <div className="hidden lg:flex w-[15%] pl-2 items-center gap-2">
                              <Calendar className="h-4 w-4 text-pink-600 dark:text-pink-300" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-pink-900 dark:text-pink-100">Entrega</span>
                            </div>
                            <div className="flex w-[13%] pl-2 justify-center">
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-pink-900 dark:text-pink-100">Status</span>
                            </div>
                            <div className="flex w-[16%] pl-2 justify-center items-center gap-2">
                              <DollarSign className="h-4 w-4 text-pink-600 dark:text-pink-300" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-pink-900 dark:text-pink-100">Valor</span>
                            </div>
                            <div className="w-[10%] pl-4 flex justify-end">
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-pink-900 dark:text-pink-100">Ações</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.items.map((pedido, index) => <TableRow key={pedido.id} className="group border-none">
                          <TableCell colSpan={7} className="px-1 py-3">
                            <div className="flex items-center p-3 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300/70 dark:border-gray-700/30 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-300">
                              {/* Pedido - Largura fixa */}
                              <div className="w-[15%] flex items-center gap-3 pr-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 dark:from-pink-400/20 dark:to-rose-400/20 flex items-center justify-center flex-shrink-0 border border-pink-200/50 dark:border-pink-700/50">
                                  <ShoppingCart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
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
                                    <Truck className="h-3 w-3 text-pink-600 dark:text-pink-400" />
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
                                <div className="flex justify-end gap-2">
                                  {/* Botão Visualizar - Primário */}
                                  <Button variant="outline" size="sm" onClick={() => {
                                setSelectedPedido(pedido);
                                setViewDialogOpen(true);
                              }} className="h-8 w-8 p-0 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-800 dark:hover:text-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <Eye className="h-3 w-3" />
                                    <span className="sr-only">Ver pedido</span>
                                  </Button>

                                  {/* Botão Editar - Secundário */}
                                  <Button variant="outline" size="sm" onClick={() => {
                                setSelectedPedido(pedido);
                                setEditDialogOpen(true);
                              }} className="h-8 w-8 p-0 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-300 dark:hover:border-amber-600 hover:text-amber-700 dark:hover:text-amber-300 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <Edit className="h-3 w-3" />
                                  </Button>

                                  {/* Botão Excluir - Destrutivo */}
                                  <Button variant="outline" size="sm" onClick={() => {
                                setSelectedPedido(pedido);
                                setDeleteDialogOpen(true);
                              }} className="h-8 w-8 p-0 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-600 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Paginação com melhor espaçamento */}
                <div className="border-t border-pink-100/80 dark:border-gray-700/30 bg-gradient-to-r from-pink-50/30 to-rose-50/30 dark:from-gray-800/30 dark:to-gray-800/20 px-6 py-4">
                  <DataPagination currentPage={paginatedData.pagination.currentPage} totalPages={paginatedData.pagination.totalPages} itemsPerPage={paginatedData.pagination.itemsPerPage} totalItems={paginatedData.pagination.totalItems} onPageChange={paginatedData.pagination.goToPage} onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} startIndex={paginatedData.pagination.startIndex} endIndex={paginatedData.pagination.endIndex} />
                </div>
              </CardContent>
            </Card> : <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {paginatedData.items.map(pedido => {
            const cardClass = pedido.status === "entregue" ? "card-status-completed" : pedido.status === "confirmado" ? "card-status-active" : pedido.status === "processando" ? "card-status-pending" : pedido.status === "cancelado" ? "card-status-error" : "card-status-pending";
            return <Card key={pedido.id} className={cn("group", cardClass)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn("p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110", pedido.status === "entregue" ? "bg-success/10" : pedido.status === "confirmado" ? "bg-info/10" : pedido.status === "processando" ? "bg-warning/10" : pedido.status === "cancelado" ? "bg-error/10" : "bg-muted")}>
                          <div className={cn(pedido.status === "entregue" ? "text-success" : pedido.status === "confirmado" ? "text-info" : pedido.status === "processando" ? "text-warning" : pedido.status === "cancelado" ? "text-error" : "text-muted-foreground")}>
                            {getStatusIcon(pedido.status)}
                          </div>
                        </div>
                        <div>
                          <CardTitle className="card-title leading-tight" title={pedido.fornecedor}>
                            {capitalize(abbreviateSupplierName(pedido.fornecedor, 25))}
                          </CardTitle>
                          <p className="table-cell-secondary">#{pedido.id}</p>
                        </div>
                      </div>
                      {getStatusBadge(pedido.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-bold text-success">{pedido.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Entrega:</span>
                        <span className="font-medium">{pedido.dataEntrega}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Itens:</span>
                        <span className="font-medium">{pedido.itens} produtos</span>
                      </div>
                    </div>
                    <div className="flex gap-1 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    setSelectedPedido(pedido);
                    setViewDialogOpen(true);
                  }}>
                        <Eye className="h-4 w-4 mr-1" />Ver
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                    setSelectedPedido(pedido);
                    setEditDialogOpen(true);
                  }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                    setSelectedPedido(pedido);
                    setDeleteDialogOpen(true);
                  }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>;
          })}
            </div>}
        </>}

      {/* Dialogs */}
      <AddPedidoDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={handleAddPedido} />
      
      {selectedPedido && <>
          <EditPedidoDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} pedido={selectedPedido} onEdit={handleEditPedido} />
          
          <DeletePedidoDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} pedido={selectedPedido} onDelete={handleDeletePedido} />
          
          <ViewPedidoDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen} pedido={selectedPedido} />
        </>}
      </div>
    </PageWrapper>;
}