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
import { ShoppingCart, Plus, Search, Filter, Eye, Edit, Truck, Download, CheckCircle, Clock, XCircle, Trash2, X, Loader2, DollarSign, Package, Building2, Calendar, TrendingUp, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 mb-6 overflow-visible">
          <Card className="group relative overflow-hidden bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-gray-400 dark:hover:border-gray-600/50 transition-[box-shadow,border-color] duration-300">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">Ativos</span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded-full flex-shrink-0">
                  <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-amber-600" />
                  <span className="text-[10px] sm:text-xs font-semibold text-amber-600">65%</span>
                </div>
              </div>
              <div className="mb-2 sm:mb-3">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {pedidos.filter(p => p.status === "pendente" || p.status === "processando").length}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">em andamento</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-amber-600 whitespace-nowrap">65%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-gray-400 dark:hover:border-gray-600/50 transition-[box-shadow,border-color] duration-300">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">Entregues</span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full flex-shrink-0">
                  <CheckCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-green-600" />
                  <span className="text-[10px] sm:text-xs font-semibold text-green-600">{Math.floor(pedidos.filter(p => p.status === "entregue").length / pedidos.length * 100)}%</span>
                </div>
              </div>
              <div className="mb-2 sm:mb-3">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {pedidos.filter(p => p.status === "entregue").length}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">concluídos</p>
              </div>
              <div className="flex items-end gap-0.5 h-6 sm:h-8">
                {[55, 70, 60, 85, 75, 90, 80].map((height, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500 to-green-400 rounded-t opacity-60 hover:opacity-100 transition-opacity" style={{ height: `${height}%` }}></div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-gray-400 dark:hover:border-gray-600/50 transition-[box-shadow,border-color] duration-300">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">Valor Total</span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full flex-shrink-0">
                  <TrendingUp className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-blue-600" />
                  <span className="text-[10px] sm:text-xs font-semibold text-blue-600">15%</span>
                </div>
              </div>
              <div className="mb-2 sm:mb-3">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">em pedidos</p>
              </div>
              <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 truncate">Média: R$ {pedidos.length > 0 ? (totalValue / pedidos.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-gray-400 dark:hover:border-gray-600/50 transition-[box-shadow,border-color] duration-300">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-600" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">Itens</span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 rounded-full flex-shrink-0">
                  <Package className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-purple-600" />
                  <span className="text-[10px] sm:text-xs font-semibold text-purple-600">Média</span>
                </div>
              </div>
              <div className="mb-2 sm:mb-3">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {pedidos.length > 0 ? Math.round(pedidos.reduce((acc, p) => acc + p.itens, 0) / pedidos.length) : 0}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">por pedido</p>
              </div>
              <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 truncate">Total: {pedidos.reduce((acc, p) => acc + p.itens, 0)} itens em {pedidos.length} pedidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
          <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
            {/* ViewToggle - Esconder no mobile */}
            <div className="hidden lg:block">
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:justify-end flex-1 lg:flex-initial">
              {/* Barra de busca + Botão Criar (lado a lado no mobile) */}
              <div className="flex gap-2 flex-1 sm:flex-initial">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 z-10" />
                  <Input placeholder="Buscar por fornecedor, produto ou ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 sm:pl-12 pr-4 w-full sm:w-64 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 dark:hover:border-orange-600/70 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200/50 dark:focus:ring-orange-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white" />
                </div>
                
                {/* Botão Mobile - Apenas criar (ao lado da busca) */}
                <Button 
                  onClick={() => setAddDialogOpen(true)}
                  className="sm:hidden bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl flex-shrink-0 px-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full sm:w-[180px] h-10 bg-white/85 dark:bg-gray-900/60 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/70 hover:border-orange-300/70 dark:hover:border-orange-500/70 focus:border-orange-400 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-200/40 dark:focus:ring-orange-700/40 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 px-3 text-gray-900 dark:text-gray-100 hidden sm:block">
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendentes</option>
                <option value="processando">Processando</option>
                <option value="confirmado">Confirmados</option>
                <option value="entregue">Entregues</option>
                <option value="cancelado">Cancelados</option>
              </select>

              {/* Remover Filtros Avançados e Exportar CSV */}
              {/* <Popover>
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
              </Popover> */}

              {/* Botão Desktop */}
              <Button 
                onClick={() => setAddDialogOpen(true)}
                className="hidden sm:flex bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl"
              >
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
                          <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-orange-300/60 dark:border-orange-900/60 rounded-xl shadow-md backdrop-blur-sm px-4 py-3">
                            <div className="w-[15%] flex items-center gap-2 pr-4 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/15 to-amber-500/15 flex items-center justify-center text-orange-600 dark:text-amber-300">
                                <ShoppingCart className="h-4 w-4" />
                              </div>
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Pedido</span>
                            </div>
                            <div className="w-[18%] flex items-center gap-2 px-2 min-w-0">
                              <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Fornecedor</span>
                            </div>
                            <div className="hidden md:flex w-[18%] px-2 items-center gap-2">
                              <Package className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Produtos</span>
                            </div>
                            <div className="hidden lg:flex w-[15%] px-2 items-center gap-2">
                              <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Entrega</span>
                            </div>
                            <div className="flex w-[12%] px-2 justify-center">
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Status</span>
                            </div>
                            <div className="flex w-[12%] px-2 justify-center items-center gap-2">
                              <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Valor</span>
                            </div>
                            <div className="w-[10%] pl-4 flex justify-end">
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
                <div className="border-t border-orange-100/80 dark:border-gray-700/30 bg-gradient-to-r from-orange-50/30 to-amber-50/30 dark:from-gray-800/30 dark:to-gray-800/20 px-6 py-4">
                  <DataPagination currentPage={paginatedData.pagination.currentPage} totalPages={paginatedData.pagination.totalPages} itemsPerPage={paginatedData.pagination.itemsPerPage} totalItems={paginatedData.pagination.totalItems} onPageChange={paginatedData.pagination.goToPage} onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} startIndex={paginatedData.pagination.startIndex} endIndex={paginatedData.pagination.endIndex} />
                </div>
              </CardContent>
            </Card> : <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
            const pedidoNumero = paginatedData.pagination.startIndex + index + 1;
            return <Card key={pedido.id} className={cn("group hover:shadow-xl dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 border border-gray-200/60 dark:border-gray-700/30 hover:", colors.border, "bg-gradient-to-br", colors.bg, "dark:from-[#1C1F26] dark:to-[#1C1F26] backdrop-blur-sm")}>
                  <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        <div className={cn("p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300", colors.iconBg)}>
                          <div className={cn("h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300", colors.iconColor)}>
                            {getStatusIcon(pedido.status)}
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                          <CardTitle className="text-sm sm:text-base font-bold text-gray-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors duration-300 truncate" title={pedido.fornecedor}>
                            {capitalize(abbreviateSupplierName(pedido.fornecedor, 25))}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            {getStatusBadge(pedido.status)}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 hover:bg-orange-100 h-8 w-8 sm:h-9 sm:w-9 rounded-full">
                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedPedido(pedido); setViewDialogOpen(true); }}>
                            <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedPedido(pedido); setEditDialogOpen(true); }}>
                            <Edit className="h-4 w-4 mr-2" />Editar
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