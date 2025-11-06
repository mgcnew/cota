import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import { ShoppingCart, Plus, Search, Filter, Eye, Truck, Download, CheckCircle, Clock, XCircle, Trash2, X, Loader2, DollarSign, Package, Building2, Calendar, TrendingUp, MoreVertical, CircleDot } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import PedidoDialog from "@/components/forms/PedidoDialog";
import DeletePedidoDialog from "@/components/forms/DeletePedidoDialog";
import { usePedidos } from "@/hooks/usePedidos";
import { usePedidosMobile } from "@/hooks/mobile/usePedidosMobile";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useMobile } from "@/contexts/MobileProvider";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { MobileFAB } from "@/components/mobile/MobileFAB";
import { MobileActionSheet } from "@/components/mobile/MobileActionSheet";
export default function Pedidos() {
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
  
  // Declarar isMobile primeiro, antes de usar
  const isMobile = useMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<"all" | "pendente" | "processando" | "confirmado" | "entregue" | "cancelado">("all");
  
  // MOBILE OPTIMIZATION: Usar hook mobile ou desktop baseado no dispositivo
  const desktopPedidos = usePedidos();
  // Mobile: passar searchQuery e statusFilter para busca server-side
  const mobilePedidos = usePedidosMobile(
    isMobile ? debouncedSearchTerm : undefined,
    isMobile ? statusFilter : undefined,
    isMobile // enabled apenas se for mobile
  );
  
  // Selecionar hook baseado no dispositivo
  const isMobileDevice = isMobile;
  const pedidosData = isMobileDevice ? {
    pedidos: mobilePedidos.pedidos || [],
    isLoading: mobilePedidos.isLoading,
    error: mobilePedidos.error,
    refetch: mobilePedidos.refetch,
    deletePedido: mobilePedidos.deletePedido,
  } : {
    pedidos: desktopPedidos.pedidos,
    isLoading: desktopPedidos.isLoading,
    error: desktopPedidos.error,
    refetch: desktopPedidos.refetch,
    deletePedido: desktopPedidos.deletePedido,
  };

  const { pedidos: pedidosDataArray, isLoading, refetch, deletePedido } = pedidosData;
  
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pedidoDialogOpen, setPedidoDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);

  
  // Formatar os pedidos para o formato esperado pela página
  const pedidos = useMemo(() => {
    return pedidosDataArray.map(order => {
      // Mobile pode ter estrutura diferente, normalizar
      const orderData = isMobileDevice && 'items_count' in order 
        ? {
            id: order.id,
            supplier_name: order.supplier_name,
            supplier_id: order.supplier_id || null,
            order_date: order.order_date,
            delivery_date: order.delivery_date,
            status: order.status,
            total_value: order.total_value,
            observations: order.observations,
            items: [], // Mobile não carrega items detalhados
          }
        : order;
      
      return {
        id: orderData.id,
        fornecedor: orderData.supplier_name,
        total: `R$ ${Number(orderData.total_value).toLocaleString('pt-BR', {
          minimumFractionDigits: 2
        })}`,
        status: orderData.status,
        dataPedido: new Date(orderData.order_date).toLocaleDateString('pt-BR'),
        dataEntrega: orderData.delivery_date ? new Date(orderData.delivery_date).toLocaleDateString('pt-BR') : '',
        itens: isMobileDevice && 'items_count' in order ? (order.items_count || 0) : (orderData.items?.length || 0),
        produtos: orderData.items?.map((item: any) => item.product_name) || [],
        observacoes: orderData.observations || "",
        detalhesItens: orderData.items?.map((item: any) => ({
          produto: item.product_name,
          quantidade: item.quantity,
          valorUnitario: Number(item.unit_price)
        })) || [],
        supplier_id: orderData.supplier_id || null,
        delivery_date: orderData.delivery_date
      };
    });
  }, [pedidosDataArray, isMobileDevice]);
  
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
    refetch();
  };
  const handleEditPedido = () => {
    refetch();
  };
  const handleDeletePedido = () => {
    refetch();
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
  // Mobile: dados já vêm filtrados e paginados do servidor
  // Desktop: filtrar e paginar no cliente
  const filteredPedidos = useMemo(() => {
    if (isMobileDevice) {
      // Mobile: dados já filtrados pelo hook, apenas aplicar filtros adicionais se necessário
      return pedidos.filter(pedido => {
        const matchesFornecedor = fornecedorFilter === "all" || pedido.fornecedor === fornecedorFilter;
        const pedidoValor = parseFloat(pedido.total.replace("R$ ", "").replace(/\./g, "").replace(",", "."));
        const matchesValorMin = !valorMin || pedidoValor >= parseFloat(valorMin);
        const matchesValorMax = !valorMax || pedidoValor <= parseFloat(valorMax);
        const pedidoData = pedido.dataPedido.split('/').reverse().join('-');
        const matchesDataInicio = !dataInicio || pedidoData >= dataInicio;
        const matchesDataFim = !dataFim || pedidoData <= dataFim;
        return matchesFornecedor && matchesValorMin && matchesValorMax && matchesDataInicio && matchesDataFim;
      });
    } else {
      // Desktop: filtrar tudo no cliente
      return pedidos.filter(pedido => {
        const matchesSearch = pedido.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) || pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) || pedido.produtos.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
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
    }
  }, [pedidos, searchTerm, statusFilter, fornecedorFilter, valorMin, valorMax, dataInicio, dataFim, isMobileDevice]);

  // Mobile: usar paginação do hook mobile
  // Desktop: usar paginação client-side
  const paginatedData = isMobileDevice 
    ? {
        items: filteredPedidos, // Já vem paginado do servidor, mas aplicamos filtros adicionais
        pagination: mobilePedidos.pagination,
      }
    : paginate(filteredPedidos);

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

  // Helper functions para renderizar Cards (memoizadas inline)
  const renderCard1 = useMemo(() => (
    <Card className="bg-amber-600 dark:bg-[#1C1F26] border border-amber-500/30 dark:border-gray-800 rounded-lg hover:border-amber-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-700/50 dark:bg-gray-800">
            <Clock className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Ativos
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {stats.pedidosAtivos}
          </span>
          {stats.percentualAtivos > 0 && (
            <Badge className="bg-amber-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
              {stats.percentualAtivos}%
            </Badge>
          )}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Em andamento:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {stats.pedidosAtivos}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>Percentual:</span>
            <span className="font-medium">{stats.percentualAtivos}%</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
            <span>{stats.pedidosPendentes} pendentes</span>
            <span>•</span>
            <span>{stats.pedidosProcessando} processando</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  const renderCard2 = useMemo(() => (
    <Card className="bg-emerald-600 dark:bg-[#1C1F26] border border-emerald-500/30 dark:border-gray-800 rounded-lg hover:border-emerald-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-700/50 dark:bg-gray-800">
            <Truck className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Entregues
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {stats.pedidosEntregues}
          </span>
          {stats.taxaEntrega > 0 && (
            <Badge className="bg-emerald-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
              {stats.taxaEntrega}%
            </Badge>
          )}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Concluídos:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {stats.pedidosEntregues}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>Taxa de entrega:</span>
            <span className="font-medium">{stats.taxaEntrega}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  const renderCard3 = useMemo(() => (
    <Card className="bg-blue-600 dark:bg-[#1C1F26] border border-blue-500/30 dark:border-gray-800 rounded-lg hover:border-blue-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-700/50 dark:bg-gray-800">
            <DollarSign className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Valor Total
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xl font-bold tracking-tight text-white dark:text-white truncate">
            {stats.totalValueFormatado}
          </span>
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Em pedidos:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {stats.totalValueFormatado}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>Média por pedido:</span>
            <span className="font-medium">{stats.valorMedioFormatado}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  const renderCard4 = useMemo(() => (
    <Card className="bg-purple-600 dark:bg-[#1C1F26] border border-purple-500/30 dark:border-gray-800 rounded-lg hover:border-purple-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-700/50 dark:bg-gray-800">
            <Package className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Itens
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {stats.mediaItensPorPedido}
          </span>
          <Badge className="bg-purple-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
            Média
          </Badge>
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Média por pedido:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {stats.mediaItensPorPedido}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>Total de itens:</span>
            <span className="font-medium">{stats.totalItens}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
            <span>{stats.totalPedidos} pedidos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  return <PageWrapper>
      <div className="page-container">
        {/* Statistics Cards - Apenas desktop */}
        {!isMobile && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
          {/* Card 1: Pedidos Ativos */}
          <Card className="group relative overflow-hidden bg-amber-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
            {/* Decoração SVG sutil */}
            <svg
              className="absolute right-0 top-0 h-full w-2/3 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
              viewBox="0 0 300 200"
              fill="none"
              style={{ zIndex: 0 }}
            >
              <circle cx="220" cy="100" r="90" fill="#fff" fillOpacity="0.08" />
              <circle cx="260" cy="60" r="60" fill="#fff" fillOpacity="0.10" />
              <circle cx="200" cy="160" r="50" fill="#fff" fillOpacity="0.07" />
              <circle cx="270" cy="150" r="30" fill="#fff" fillOpacity="0.12" />
            </svg>

            <CardHeader className="border-0 z-10 relative pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/70 dark:text-gray-400" />
                <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                  Ativos
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 z-10 relative">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                  {stats.pedidosAtivos}
                </span>
                {stats.percentualAtivos > 0 && (
                  <Badge className="bg-white/20 text-white font-semibold border-0">
                    {stats.percentualAtivos}%
                  </Badge>
                )}
              </div>
              <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                <div className="flex items-center justify-between">
                  <span>Em andamento:</span>
                  <span className="font-medium text-white dark:text-gray-300">
                    {stats.pedidosAtivos}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                  <span>Percentual:</span>
                  <span className="font-medium">{stats.percentualAtivos}%</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
                  <span>{stats.pedidosPendentes} pendentes</span>
                  <span>•</span>
                  <span>{stats.pedidosProcessando} processando</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Entregues */}
          <Card className="group relative overflow-hidden bg-emerald-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
            {/* Decoração SVG sutil */}
            <svg
              className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
              viewBox="0 0 200 200"
              fill="none"
              style={{ zIndex: 0 }}
            >
              <defs>
                <filter id="blur-entregues" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" />
                </filter>
              </defs>
              <ellipse cx="170" cy="60" rx="40" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur-entregues)" />
              <rect x="120" y="20" width="60" height="20" rx="8" fill="#fff" fillOpacity="0.10" />
              <polygon points="150,0 200,0 200,50" fill="#fff" fillOpacity="0.07" />
              <circle cx="180" cy="100" r="14" fill="#fff" fillOpacity="0.16" />
            </svg>

            <CardHeader className="border-0 z-10 relative pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-white/70 dark:text-gray-400" />
                <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                  Entregues
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 z-10 relative">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                  {stats.pedidosEntregues}
                </span>
                {stats.taxaEntrega > 0 && (
                  <Badge className="bg-white/20 text-white font-semibold border-0">
                    {stats.taxaEntrega}%
                  </Badge>
                )}
              </div>
              <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                <div className="flex items-center justify-between">
                  <span>Concluídos:</span>
                  <span className="font-medium text-white dark:text-gray-300">
                    {stats.pedidosEntregues}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                  <span>Taxa de entrega:</span>
                  <span className="font-medium">{stats.taxaEntrega}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Valor Total */}
          <Card className="group relative overflow-hidden bg-blue-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
            {/* Decoração SVG sutil */}
            <svg
              className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
              viewBox="0 0 200 200"
              fill="none"
              style={{ zIndex: 0 }}
            >
              <defs>
                <filter id="blur-valor-pedidos" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="12" />
                </filter>
              </defs>
              <rect x="120" y="0" width="70" height="70" rx="35" fill="#fff" fillOpacity="0.09" filter="url(#blur-valor-pedidos)" />
              <ellipse cx="170" cy="80" rx="28" ry="12" fill="#fff" fillOpacity="0.12" />
              <polygon points="200,0 200,60 140,0" fill="#fff" fillOpacity="0.07" />
              <circle cx="150" cy="30" r="10" fill="#fff" fillOpacity="0.15" />
            </svg>

            <CardHeader className="border-0 z-10 relative pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-white/70 dark:text-gray-400" />
                <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                  Valor Total
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 z-10 relative">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-semibold tracking-tight text-white dark:text-white truncate">
                  {stats.totalValueFormatado}
                </span>
              </div>
              <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                <div className="flex items-center justify-between">
                  <span>Em pedidos:</span>
                  <span className="font-medium text-white dark:text-gray-300">
                    {stats.totalValueFormatado}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                  <span>Média por pedido:</span>
                  <span className="font-medium">{stats.valorMedioFormatado}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Itens */}
          <Card className="group relative overflow-hidden bg-purple-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
            {/* Decoração SVG sutil */}
            <svg
              className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
              viewBox="0 0 200 200"
              fill="none"
              style={{ zIndex: 0 }}
            >
              <defs>
                <filter id="blur-itens-pedidos" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="16" />
                </filter>
              </defs>
              <polygon points="200,0 200,100 100,0" fill="#fff" fillOpacity="0.09" />
              <ellipse cx="170" cy="40" rx="30" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur-itens-pedidos)" />
              <rect x="140" y="60" width="40" height="18" rx="8" fill="#fff" fillOpacity="0.10" />
              <circle cx="150" cy="30" r="14" fill="#fff" fillOpacity="0.18" />
              <line x1="120" y1="0" x2="200" y2="80" stroke="#fff" strokeOpacity="0.08" strokeWidth="6" />
            </svg>

            <CardHeader className="border-0 z-10 relative pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-white/70 dark:text-gray-400" />
                <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                  Itens
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 z-10 relative">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                  {stats.mediaItensPorPedido}
                </span>
                <Badge className="bg-white/20 text-white font-semibold border-0">
                  Média
                </Badge>
              </div>
              <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                <div className="flex items-center justify-between">
                  <span>Média por pedido:</span>
                  <span className="font-medium text-white dark:text-gray-300">
                    {stats.mediaItensPorPedido}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                  <span>Total de itens:</span>
                  <span className="font-medium">{stats.totalItens}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
                  <span>{stats.totalPedidos} pedidos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Filters */}
        {isMobile ? (
          <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
            <CardContent className="p-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 z-10" />
                  <Input 
                    placeholder="Buscar pedidos..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="pl-10 pr-4 w-full h-11 text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 dark:hover:border-orange-600/70 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200/50 dark:focus:ring-orange-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white" 
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setFiltersOpen(true)}
                  className="h-11 px-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 dark:hover:border-orange-600/70 rounded-xl"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                {/* ViewToggle - Esconder no mobile */}
                <div className="hidden lg:block">
                  <ViewToggle view={viewMode} onViewChange={setViewMode} />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:justify-end flex-1 lg:flex-initial">
                  {/* Barra de busca */}
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 z-10" />
                    <Input placeholder="Buscar por fornecedor, produto ou ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 sm:pl-12 pr-4 w-full sm:w-64 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 dark:hover:border-orange-600/70 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200/50 dark:focus:ring-orange-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white" />
                  </div>

                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full sm:w-[180px] h-10 bg-white/85 dark:bg-gray-900/60 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/70 hover:border-orange-300/70 dark:hover:border-orange-500/70 focus:border-orange-400 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-200/40 dark:focus:ring-orange-700/40 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 px-3 text-gray-900 dark:text-gray-100">
                    <option value="all">Todos os Status</option>
                    <option value="pendente">Pendentes</option>
                    <option value="processando">Processando</option>
                    <option value="confirmado">Confirmados</option>
                    <option value="entregue">Entregues</option>
                    <option value="cancelado">Cancelados</option>
                  </select>

                  {/* Botão Desktop */}
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
        )}

        {/* Mobile Action Sheet para Filtros */}
        {isMobile && (
          <MobileActionSheet open={filtersOpen} onOpenChange={setFiltersOpen} title="Filtros">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value as any)} 
                  className="w-full h-11 text-base bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pendente">Pendentes</option>
                  <option value="processando">Processando</option>
                  <option value="confirmado">Confirmados</option>
                  <option value="entregue">Entregues</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>
            </div>
          </MobileActionSheet>
        )}

      {showLoading ? <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div> : <>
          {/* Pedidos View */}
          {isMobile ? (
            <PullToRefresh onRefresh={refetch} disabled={!isMobile}>
              <div className="grid gap-3 grid-cols-1">
                {paginatedData.items.map((pedido, index) => {
                  const getStatusColors = (status: string) => {
                    switch (status) {
                      case "entregue":
                        return {
                          border: "border-green-300/60",
                          bg: "from-white to-green-50/30",
                          iconBg: "from-green-500/10 to-emerald-500/10",
                          iconColor: "text-green-600"
                        };
                      case "confirmado":
                        return {
                          border: "border-blue-300/60",
                          bg: "from-white to-blue-50/30",
                          iconBg: "from-blue-500/10 to-cyan-500/10",
                          iconColor: "text-blue-600"
                        };
                      case "processando":
                        return {
                          border: "border-amber-300/60",
                          bg: "from-white to-amber-50/30",
                          iconBg: "from-amber-500/10 to-yellow-500/10",
                          iconColor: "text-amber-600"
                        };
                      case "cancelado":
                        return {
                          border: "border-red-300/60",
                          bg: "from-white to-red-50/30",
                          iconBg: "from-red-500/10 to-pink-500/10",
                          iconColor: "text-red-600"
                        };
                      default:
                        return {
                          border: "border-gray-300/60",
                          bg: "from-white to-gray-50/30",
                          iconBg: "from-gray-500/10 to-slate-500/10",
                          iconColor: "text-gray-600"
                        };
                    }
                  };
                  const colors = getStatusColors(pedido.status);
                  return (
                    <Card 
                      key={pedido.id} 
                      className={cn("border border-gray-200/60 dark:border-gray-700/30 bg-gradient-to-br", colors.bg, "dark:from-[#1C1F26] dark:to-[#1C1F26]", "backdrop-blur-sm")}
                      onClick={() => {
                        setSelectedPedido(pedido);
                        setPedidoDialogOpen(true);
                      }}
                    >
                      <CardHeader className="pb-3 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={cn("p-2 rounded-lg", colors.iconBg)}>
                              <div className={cn("h-5 w-5", colors.iconColor)}>
                                {getStatusIcon(pedido.status)}
                              </div>
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                              <CardTitle className="text-base font-bold text-gray-900 dark:text-white truncate" title={pedido.fornecedor}>
                                {capitalize(abbreviateSupplierName(pedido.fornecedor, 25))}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(pedido.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3 p-4 pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{pedido.itens} itens</span>
                          </div>
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{pedido.total}</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </PullToRefresh>
          ) : viewMode === "table" ? <Card className="border-0 bg-transparent">
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
                                <div className="flex justify-end gap-2">
                                  {/* Botão Visualizar/Editar - Unificado */}
                                  <Button variant="outline" size="sm" onClick={() => {
                                setSelectedPedido(pedido);
                                setPedidoDialogOpen(true);
                              }} className="h-8 w-8 p-0 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-800 dark:hover:text-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <Eye className="h-3 w-3" />
                                    <span className="sr-only">Ver/Editar pedido</span>
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
            </Card> : (
            <PullToRefresh onRefresh={refetch} disabled={true}>
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
            const pedidoNumero = paginatedData.pagination.startIndex + index + 1;
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
            </PullToRefresh>
          )}
        </>}

      {/* Mobile FAB */}
      {isMobile && (
        <MobileFAB
          onClick={() => setAddDialogOpen(true)}
          label="Novo Pedido"
        />
      )}

      {/* Dialogs */}
      <AddPedidoDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={handleAddPedido} />
      
      {selectedPedido && <>
          <PedidoDialog 
            open={pedidoDialogOpen} 
            onOpenChange={setPedidoDialogOpen} 
            pedido={selectedPedido} 
            onEdit={handleEditPedido} 
          />
          
          <DeletePedidoDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} pedido={selectedPedido} onDelete={handleDeletePedido} />
        </>}
      </div>
    </PageWrapper>;
}