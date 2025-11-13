import { useState, useMemo, useEffect, useRef, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Trash2,
  Download,
  Share2,
  FileText,
  Package,
  MapPin,
  Loader2,
  Activity,
  Calendar,
  TrendingUp,
  CircleDot
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useStockCounts } from "@/hooks/useStockCounts";
import { useStockCountsMobile } from "@/hooks/mobile/useStockCountsMobile";
import { useStockSectors } from "@/hooks/useStockSectors";
import { useToast } from "@/hooks/use-toast";
import { ViewStockCountDialog } from "@/components/stock/ViewStockCountDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { useMobile } from "@/contexts/MobileProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Filter } from "lucide-react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { MobileSearchWithAction } from "@/components/mobile/MobileSearchWithAction";
import { MobileActionSheet } from "@/components/mobile/MobileActionSheet";
import { DataPagination } from "@/components/ui/data-pagination";
import { useDebounce } from "@/hooks/useDebounce";

export default function ContagemEstoque() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  
  // Estados devem ser declarados antes de serem usados nos hooks
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Hooks condicionais: mobile vs desktop
  const desktopData = useStockCounts();
  const debouncedSearch = useDebounce(searchTerm, 300);
  const mobileData = useStockCountsMobile(
    debouncedSearch,
    statusFilter as "all" | "pendente" | "em_andamento" | "finalizada" | "cancelada",
    isMobile
  );
  
  // Usar dados mobile ou desktop baseado na plataforma
  const stockCounts = isMobile ? (mobileData.stockCounts || []) : desktopData.stockCounts;
  const isLoading = isMobile ? mobileData.isLoading : desktopData.isLoading;
  const createStockCount = isMobile ? mobileData.createStockCount : desktopData.createStockCount;
  const updateStockCount = isMobile ? mobileData.updateStockCount : desktopData.updateStockCount;
  const deleteStockCount = isMobile ? mobileData.deleteStockCount : desktopData.deleteStockCount;
  
  const { sectors } = useStockSectors();
  const [selectedCount, setSelectedCount] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [countType, setCountType] = useState<"from_order" | "from_scratch">("from_order");
  const [countNotes, setCountNotes] = useState<string>("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isCreatingCount, setIsCreatingCount] = useState(false);
  
  // Ref para trigger do dialog de criação (usado pelo MobileFAB)
  const createDialogRef = useRef<HTMLButtonElement>(null);
  
  // Ref para preservar posição de scroll ao abrir/fechar modal
  const scrollPositionRef = useRef<number>(0);
  
  // Handler para abrir/fechar modal com preservação de scroll
  const handleCreateDialogOpenChange = (open: boolean) => {
    if (open) {
      // Salvar posição de scroll atual
      scrollPositionRef.current = window.scrollY;
    } else {
      // Resetar campos
      setSelectedOrderId("");
      setCountNotes("");
      setCountType("from_order");
    }
    setCreateDialogOpen(open);
    
    // Restaurar scroll após fechar (apenas no mobile)
    if (!open && isMobile) {
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 100);
    }
  };

  // Carregar pedidos disponíveis para criar contagem (apenas quando dialog está aberto)
  useEffect(() => {
    if (!createDialogOpen || !user) return;

    const loadOrders = async () => {
      setLoadingOrders(true);
      try {
        // Buscar todos os pedidos (não apenas pendentes)
        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, supplier_name, order_date, status')
          .order('order_date', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Erro ao carregar pedidos:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os pedidos.",
            variant: "destructive",
          });
          return;
        }

        if (orders) {
          setAvailableOrders(orders);
        }
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [createDialogOpen, user, toast]);

  // Filtros: mobile usa server-side, desktop usa client-side
  // Otimização: mobile não precisa filtrar novamente, já vem do servidor
  const filteredCounts = useMemo(() => {
    if (isMobile) {
      // Mobile já vem filtrado do servidor - retornar direto
      return stockCounts;
    }
    // Desktop: filtrar client-side
    return stockCounts.filter(count => {
      const matchesSearch = 
        (count as any).order?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        count.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || count.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [stockCounts, searchTerm, statusFilter, isMobile]);
  
  // Função para invalidar cache (usado pelo PullToRefresh) - memoizada
  const invalidateCache = useCallback(async () => {
    if (isMobile) {
      await mobileData.refetch();
    } else {
      // Desktop não tem refetch direto, mas podemos invalidar queries
      // Por enquanto, apenas recarregar a página ou fazer refetch manual
    }
  }, [isMobile, mobileData]);
  
  // Função para trigger do dialog de criação (usado pelo MobileFAB)
  const triggerCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  // Memoizar getStatusBadge para evitar recriação
  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      pendente: {
        variant: "outline" as const,
        className: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
        label: "Pendente"
      },
      em_andamento: {
        variant: "outline" as const,
        className: "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
        label: "Em Andamento"
      },
      finalizada: {
        variant: "outline" as const,
        className: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700",
        label: "Finalizada"
      },
      cancelada: {
        variant: "outline" as const,
        className: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 font-medium dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
        label: "Cancelada"
      },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    return <Badge variant={config.variant} className={cn("transition-all duration-200", config.className)}>
      {config.label}
    </Badge>;
  }, []);

  // Função memoizada para cores de status
  const getStatusColors = useMemo(() => {
    const colorMap: Record<string, { border: string; bg: string; iconBg: string; iconColor: string }> = {
      finalizada: {
        border: "border-emerald-300/60",
        bg: "from-white to-emerald-50/30",
        iconBg: "from-emerald-500/10 to-green-500/10 group-hover:from-emerald-500/20 group-hover:to-green-500/20",
        iconColor: "text-emerald-600"
      },
      em_andamento: {
        border: "border-blue-300/60",
        bg: "from-white to-blue-50/30",
        iconBg: "from-blue-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20",
        iconColor: "text-blue-600"
      },
      pendente: {
        border: "border-amber-300/60",
        bg: "from-white to-amber-50/30",
        iconBg: "from-amber-500/10 to-yellow-500/10 group-hover:from-amber-500/20 group-hover:to-yellow-500/20",
        iconColor: "text-amber-600"
      },
      cancelada: {
        border: "border-red-300/60",
        bg: "from-white to-red-50/30",
        iconBg: "from-red-500/10 to-pink-500/10 group-hover:from-red-500/20 group-hover:to-pink-500/20",
        iconColor: "text-red-600"
      },
    };
    
    return (status: string) => colorMap[status] || {
      border: "border-gray-300/60",
      bg: "from-white to-gray-50/30",
      iconBg: "from-gray-500/10 to-slate-500/10 group-hover:from-gray-500/20 group-hover:to-slate-500/20",
      iconColor: "text-gray-600"
    };
  }, []);

  const handleCreateCount = async () => {
    if (countType === "from_order" && !selectedOrderId) {
      toast({
        title: "Selecione um pedido",
        description: "Por favor, selecione um pedido para criar a contagem.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCount(true);
    try {
      const newCount = isMobile
        ? await createStockCount.mutateAsync({
            order_id: countType === "from_order" ? selectedOrderId : undefined,
            notes: countNotes || undefined,
          })
        : await createStockCount.mutateAsync({
            order_id: countType === "from_order" ? selectedOrderId : undefined,
            notes: countNotes || undefined,
          });

      setCreateDialogOpen(false);
      setSelectedOrderId("");
      setCountNotes("");
      setCountType("from_order");

      // Abrir o modal de visualização automaticamente após criar
      if (newCount) {
        setSelectedCount(newCount.id);
        setViewDialogOpen(true);
      }
    } catch (error) {
      // Erro já é tratado pelo hook
      console.error('Erro ao criar contagem:', error);
    } finally {
      setIsCreatingCount(false);
    }
  };

  // Memoizar handlers para evitar recriação
  const handleViewCount = useCallback((countId: string) => {
    setSelectedCount(countId);
    setViewDialogOpen(true);
  }, []);

  const handleFinalizeCount = useCallback(async (countId: string) => {
    try {
      if (isMobile) {
        await updateStockCount.mutateAsync({
          id: countId,
          status: "finalizada",
        });
      } else {
        await updateStockCount.mutateAsync({
          id: countId,
          status: "finalizada",
        });
      }
    } catch (error) {
      console.error('Erro ao finalizar contagem:', error);
    }
  }, [isMobile, updateStockCount]);

  const handleDeleteCount = useCallback(async (countId: string) => {
    if (confirm("Tem certeza que deseja excluir esta contagem?")) {
      try {
        if (isMobile) {
          await deleteStockCount.mutateAsync(countId);
        } else {
          await deleteStockCount.mutateAsync(countId);
        }
      } catch (error) {
        console.error('Erro ao excluir contagem:', error);
      }
    }
  }, [isMobile, deleteStockCount]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = stockCounts.length;
    const pendentes = stockCounts.filter(c => c.status === 'pendente').length;
    const emAndamento = stockCounts.filter(c => c.status === 'em_andamento').length;
    const finalizadas = stockCounts.filter(c => c.status === 'finalizada').length;
    const canceladas = stockCounts.filter(c => c.status === 'cancelada').length;
    
    // Calcular percentuais
    const percentualFinalizadas = total > 0 
      ? Math.round((finalizadas / total) * 100)
      : 0;
    
    const taxaConclusao = total > 0
      ? Math.round((finalizadas / total) * 100)
      : 0;
    
    return { 
      total, 
      pendentes, 
      emAndamento, 
      finalizadas,
      canceladas,
      percentualFinalizadas,
      taxaConclusao
    };
  }, [stockCounts]);

  return (
    <PageWrapper>
      <div className="page-container">
        {/* Statistics Cards - Oculto no mobile */}
        {!isMobile && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
          {/* Card 1: Total */}
          <Card className="group relative overflow-hidden bg-indigo-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
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
                <ClipboardList className="h-4 w-4 text-white/70 dark:text-gray-400" />
                <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                  Total
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 z-10 relative">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                  {stats.total}
                </span>
                {stats.total > 0 && (
                  <Badge className="bg-white/20 text-white font-semibold border-0">
                    {stats.taxaConclusao}% concluídas
                  </Badge>
                )}
              </div>
              <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                <div className="flex items-center justify-between">
                  <span>Total de contagens:</span>
                  <span className="font-medium text-white dark:text-gray-300">
                    {stats.total}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
                  <span>{stats.pendentes} pendentes</span>
                  <span>•</span>
                  <span>{stats.finalizadas} finalizadas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pendentes */}
          <Card className="group relative overflow-hidden bg-amber-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
            <svg
              className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
              viewBox="0 0 200 200"
              fill="none"
              style={{ zIndex: 0 }}
            >
              <ellipse cx="170" cy="60" rx="40" ry="18" fill="#fff" fillOpacity="0.13" />
              <rect x="120" y="20" width="60" height="20" rx="8" fill="#fff" fillOpacity="0.10" />
              <circle cx="180" cy="100" r="14" fill="#fff" fillOpacity="0.16" />
            </svg>
            <CardHeader className="border-0 z-10 relative pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/70 dark:text-gray-400" />
                <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                  Pendentes
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 z-10 relative">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                  {stats.pendentes}
                </span>
                {stats.total > 0 && (
                  <Badge className="bg-white/20 text-white font-semibold border-0">
                    {Math.floor((stats.pendentes / stats.total) * 100)}%
                  </Badge>
                )}
              </div>
              <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                <div className="flex items-center justify-between">
                  <span>Aguardando:</span>
                  <span className="font-medium text-white dark:text-gray-300">
                    {stats.pendentes}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Em Andamento */}
          <Card className="group relative overflow-hidden bg-blue-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
            <svg
              className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
              viewBox="0 0 200 200"
              fill="none"
              style={{ zIndex: 0 }}
            >
              <rect x="120" y="0" width="70" height="70" rx="35" fill="#fff" fillOpacity="0.09" />
              <ellipse cx="170" cy="80" rx="28" ry="12" fill="#fff" fillOpacity="0.12" />
              <circle cx="150" cy="30" r="10" fill="#fff" fillOpacity="0.15" />
            </svg>
            <CardHeader className="border-0 z-10 relative pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-white/70 dark:text-gray-400" />
                <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                  Em Andamento
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 z-10 relative">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                  {stats.emAndamento}
                </span>
                {stats.total > 0 && (
                  <Badge className="bg-white/20 text-white font-semibold border-0">
                    {Math.floor((stats.emAndamento / stats.total) * 100)}%
                  </Badge>
                )}
              </div>
              <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                <div className="flex items-center justify-between">
                  <span>Contando:</span>
                  <span className="font-medium text-white dark:text-gray-300">
                    {stats.emAndamento}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Finalizadas */}
          <Card className="group relative overflow-hidden bg-emerald-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
            <svg
              className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
              viewBox="0 0 200 200"
              fill="none"
              style={{ zIndex: 0 }}
            >
              <polygon points="200,0 200,100 100,0" fill="#fff" fillOpacity="0.09" />
              <ellipse cx="170" cy="40" rx="30" ry="18" fill="#fff" fillOpacity="0.13" />
              <circle cx="150" cy="30" r="14" fill="#fff" fillOpacity="0.18" />
            </svg>
            <CardHeader className="border-0 z-10 relative pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-white/70 dark:text-gray-400" />
                <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                  Finalizadas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 z-10 relative">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                  {stats.finalizadas}
                </span>
                {stats.total > 0 && (
                  <Badge className="bg-white/20 text-white font-semibold border-0">
                    {Math.floor((stats.finalizadas / stats.total) * 100)}%
                  </Badge>
                )}
              </div>
              <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                <div className="flex items-center justify-between">
                  <span>Concluídas:</span>
                  <span className="font-medium text-white dark:text-gray-300">
                    {stats.finalizadas}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Filtros */}
        {isMobile ? (
          <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none mb-4">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 z-10" />
                  <Input 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 w-full h-11 text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 dark:hover:border-orange-600/70 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200/50 dark:focus:ring-orange-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white"
                  />
                </div>
                <MobileActionSheet
                  title="Filtros"
                  trigger={
                    <Button
                      variant="outline"
                      className="h-11 px-4 border-2 border-gray-200/60 dark:border-gray-700/60"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  }
                  open={filtersOpen}
                  onOpenChange={setFiltersOpen}
                >
                  <div className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Filtros</h3>
                    <div>
                      <Label className="mb-2 block">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Status</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="finalizada">Finalizada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </MobileActionSheet>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:justify-end flex-1">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 z-10" />
                    <Input 
                      placeholder="Buscar por fornecedor ou observações..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 sm:pl-12 pr-4 w-full sm:w-64 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 dark:hover:border-orange-600/70 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200/50 dark:focus:ring-orange-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-[180px] h-10 bg-white/85 dark:bg-gray-900/60 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/70 hover:border-orange-300/70 dark:hover:border-orange-500/70 focus:border-orange-400 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-200/40 dark:focus:ring-orange-700/40 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 px-3 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="finalizada">Finalizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>

                  <Button 
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Contagem
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Contagens */}
        {isLoading && stockCounts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCounts.length === 0 ? (
          <Card className="border border-gray-200/60 dark:border-gray-700/30">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Nenhuma contagem encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Crie uma nova contagem a partir de um pedido ou do zero
                </p>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Contagem
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile: Cards */}
            {isMobile ? (
              <>
                <PullToRefresh
                  onRefresh={async () => {
                    await invalidateCache();
                  }}
                  disabled={!isMobile}
                >
                  <div className="grid gap-3 sm:gap-4 grid-cols-1">
                    {filteredCounts.map((count) => {
                    const colors = getStatusColors(count.status);
                    return (
                    <Card key={count.id} className={cn("group border border-gray-200/60 dark:border-gray-700/30 bg-gradient-to-br", colors.bg, "dark:from-[#1C1F26] dark:to-[#1C1F26]", "backdrop-blur-sm")}>
                      <CardHeader className="pb-3 p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className={cn("p-1.5 rounded-lg", colors.iconBg)}>
                              <ClipboardList className={cn("h-4 w-4", colors.iconColor)} />
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <CardTitle className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {isMobile 
                                  ? ((count as any).supplier_name || "Contagem Livre")
                                  : ((count as any).order?.supplier_name || "Contagem Livre")
                                }
                              </CardTitle>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {getStatusBadge(count.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3 p-3">
                        <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/30">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Calendar className="h-3 w-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Data</span>
                              </div>
                              <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                                {format(new Date(count.count_date), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Package className="h-3 w-3 text-orange-600" />
                                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Pedido</span>
                              </div>
                              <p className="text-base font-bold text-orange-800 dark:text-orange-300">
                                {isMobile ? (count.order_id ? "Sim" : "Não") : ((count as any).order ? "Sim" : "Não")}
                              </p>
                            </div>
                          </div>
                        </div>

                        {count.notes && (
                          <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/30">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <FileText className="h-3 w-3 text-blue-600" />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Observações</span>
                            </div>
                            <p className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 line-clamp-2">
                              {count.notes}
                            </p>
                          </div>
                        )}

                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCount(count.id)}
                              className="h-8 w-8 p-0 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-800 dark:hover:text-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {count.status !== "finalizada" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFinalizeCount(count.id)}
                                className="h-8 w-8 p-0 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCount(count.id)}
                              className="h-8 w-8 p-0 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-600 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
                
                {/* Paginação Mobile */}
                {mobileData.pagination && (
                  <div className="mt-4">
                    <DataPagination
                      currentPage={mobileData.pagination.currentPage ?? 1}
                      totalPages={mobileData.pagination.totalPages ?? 1}
                      itemsPerPage={(mobileData.pagination as any).itemsPerPage ?? 20}
                      totalItems={mobileData.pagination.totalItems ?? 0}
                      onPageChange={mobileData.pagination.goToPage}
                      onItemsPerPageChange={(mobileData.pagination as any).onItemsPerPageChange || (() => {})}
                      startIndex={(mobileData.pagination as any).startIndex ?? 0}
                      endIndex={(mobileData.pagination as any).endIndex ?? 0}
                    />
                  </div>
                  )}
                </PullToRefresh>
              </>
            ) : (
              /* Desktop: Tabela */
              <Card className="border-0 bg-transparent">
                <CardContent className="p-0">
                  <div className="overflow-x-auto w-full">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableCell colSpan={6} className="px-1 pb-3 pt-0 border-none">
                            <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-orange-200/60 dark:border-orange-900/40 rounded-lg shadow-sm px-4 py-3">
                              <div className="w-[25%] flex items-center gap-2 pr-4 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/15 to-amber-500/15 flex items-center justify-center text-orange-600 dark:text-orange-300">
                                  <ClipboardList className="h-4 w-4" />
                                </div>
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Fornecedor</span>
                              </div>
                              <div className="hidden md:flex w-[15%] pl-2 justify-center items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Data</span>
                              </div>
                              <div className="hidden lg:flex w-[15%] pl-2 justify-center items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Pedido</span>
                              </div>
                              <div className="hidden md:flex w-[15%] pl-2 justify-center items-center gap-1.5">
                                <CircleDot className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Status</span>
                              </div>
                              <div className="hidden lg:flex w-[20%] pl-2 justify-center items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Observações</span>
                              </div>
                              <div className="w-[10%] pl-4 flex justify-end items-center gap-1.5">
                                <MoreVertical className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Ações</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCounts.map((count) => (
                          <TableRow key={count.id} className="group border-none">
                            <TableCell colSpan={6} className="px-1 py-3">
                              <div className="flex items-center px-1.5 py-2 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300/70 dark:border-gray-700/30 transition-all duration-200 group-hover:bg-white dark:group-hover:bg-gray-800/70 group-hover:shadow-md dark:group-hover:shadow-lg dark:group-hover:shadow-black/20 group-hover:border-orange-300/60 dark:group-hover:border-orange-700/50 [&_*]:!transition-none">
                                {/* Fornecedor - Largura fixa */}
                                <div className="w-[25%] flex items-center gap-3 px-2">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20">
                                    <ClipboardList className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                  </div>
                                  <div className="min-w-0 flex-1 max-w-[200px]">
                                    <div className="table-cell-primary truncate" title={(count as any).order?.supplier_name || "Contagem Livre"}>
                                      {(count as any).order?.supplier_name || "Contagem Livre"}
                                    </div>
                                  </div>
                                </div>

                                {/* Data - Largura fixa, hidden on mobile */}
                                <div className="hidden md:block w-[15%] px-2">
                                  <div className="text-center pointer-events-none">
                                    <span className="table-cell-primary text-sm">
                                      {format(new Date(count.count_date), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                  </div>
                                </div>

                                {/* Pedido - Largura fixa, hidden on small screens */}
                                <div className="hidden lg:block w-[15%] px-2">
                                  <div className="flex justify-center pointer-events-none">
                                    <Badge variant="outline" className="bg-orange-50/80 dark:bg-orange-900/30 border-orange-200/60 dark:border-orange-700/60 text-orange-700 dark:text-orange-400 font-medium text-xs">
                                      {(count as any).order ? "Sim" : "Não"}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Status - Largura fixa, hidden on mobile */}
                                <div className="hidden md:block w-[15%] px-2">
                                  <div className="flex justify-center pointer-events-none">
                                    {getStatusBadge(count.status)}
                                  </div>
                                </div>

                                {/* Observações - Largura fixa, hidden on small screens */}
                                <div className="hidden lg:block w-[20%] px-2">
                                  <div className="text-center pointer-events-none">
                                    <span className="table-cell-primary truncate block text-xs">
                                      {count.notes ? count.notes.substring(0, 50) + (count.notes.length > 50 ? "..." : "") : "—"}
                                    </span>
                                  </div>
                                </div>

                                {/* Ações - Largura fixa */}
                                <div className="w-[10%] pl-4">
                                  <div className="flex items-center justify-end gap-2 pointer-events-auto">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewCount(count.id)}
                                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 p-0 h-8 w-8 rounded-lg border border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 flex items-center justify-center shadow-sm hover:shadow-md !transition-all"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 h-8 w-8 p-0 rounded-full !transition-colors">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-background border z-50 w-48 shadow-lg">
                                        <DropdownMenuLabel className="text-gray-600 font-medium">Mais Ações</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {count.status !== "finalizada" && (
                                          <DropdownMenuItem onClick={() => handleFinalizeCount(count.id)} className="hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors">
                                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                                            Finalizar
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer" onClick={() => handleDeleteCount(count.id)}>
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Modal: Criar Contagem */}
        {isMobile ? (
          <Sheet open={createDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
            <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl pb-8 overflow-hidden flex flex-col p-0 [&>button]:hidden">
              <SheetHeader className="flex-shrink-0 px-4 py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-lg font-bold text-gray-900 dark:text-white">
                        Nova Contagem
                      </SheetTitle>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Crie uma nova contagem de estoque
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCreateDialogOpenChange(false)}
                    className="h-9 w-9 rounded-lg flex-shrink-0"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <div>
                  <Label className="mb-3 block text-base font-semibold">Tipo de Contagem</Label>
                  <RadioGroup value={countType} onValueChange={(value) => setCountType(value as "from_order" | "from_scratch")}>
                    <div className="flex items-center space-x-3 mb-3">
                      <RadioGroupItem value="from_order" id="from_order" className="h-5 w-5" />
                      <Label htmlFor="from_order" className="font-normal cursor-pointer text-base">
                        A partir de um pedido
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="from_scratch" id="from_scratch" className="h-5 w-5" />
                      <Label htmlFor="from_scratch" className="font-normal cursor-pointer text-base">
                        Criar do zero (sem pedido)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {countType === "from_order" && (
                  <div>
                    <Label className="mb-2 block text-base font-semibold">Selecionar Pedido</Label>
                    {loadingOrders ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                        <span className="text-base text-muted-foreground">Carregando pedidos...</span>
                      </div>
                    ) : (
                      <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="Selecione um pedido" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOrders.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhum pedido disponível
                            </SelectItem>
                          ) : (
                            availableOrders.map((order) => (
                              <SelectItem key={order.id} value={order.id}>
                                {order.supplier_name} - {format(new Date(order.order_date), "dd/MM/yyyy")} ({order.status})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {!loadingOrders && availableOrders.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Não há pedidos disponíveis. Você pode criar uma contagem do zero.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label className="mb-2 block text-base font-semibold">Observações (opcional)</Label>
                  <Textarea
                    placeholder="Adicione observações sobre esta contagem..."
                    value={countNotes}
                    onChange={(e) => setCountNotes(e.target.value)}
                    rows={4}
                    className="text-base resize-none"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900 space-y-2">
                <Button 
                  onClick={handleCreateCount} 
                  disabled={(isMobile ? isCreatingCount : createStockCount.isPending) || (countType === "from_order" && !selectedOrderId)}
                  className="w-full h-11 text-base bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                >
                  {(isMobile ? isCreatingCount : createStockCount.isPending) ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Contagem"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleCreateDialogOpenChange(false)}
                  className="w-full h-11 text-base"
                >
                  Cancelar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={createDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Contagem de Estoque</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">Tipo de Contagem</Label>
                  <RadioGroup value={countType} onValueChange={(value) => setCountType(value as "from_order" | "from_scratch")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="from_order" id="from_order" />
                      <Label htmlFor="from_order" className="font-normal cursor-pointer">
                        A partir de um pedido
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="from_scratch" id="from_scratch" />
                      <Label htmlFor="from_scratch" className="font-normal cursor-pointer">
                        Criar do zero (sem pedido)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {countType === "from_order" && (
                  <div>
                    <Label>Selecionar Pedido</Label>
                    {loadingOrders ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Carregando pedidos...</span>
                      </div>
                    ) : (
                      <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um pedido" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOrders.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhum pedido disponível
                            </SelectItem>
                          ) : (
                            availableOrders.map((order) => (
                              <SelectItem key={order.id} value={order.id}>
                                {order.supplier_name} - {format(new Date(order.order_date), "dd/MM/yyyy")} ({order.status})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {!loadingOrders && availableOrders.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Não há pedidos disponíveis. Você pode criar uma contagem do zero.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    placeholder="Adicione observações sobre esta contagem..."
                    value={countNotes}
                    onChange={(e) => setCountNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => handleCreateDialogOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateCount} 
                    disabled={(isMobile ? isCreatingCount : createStockCount.isPending) || (countType === "from_order" && !selectedOrderId)}
                  >
                    {(isMobile ? isCreatingCount : createStockCount.isPending) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Contagem"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog: Visualizar Contagem */}
        <ViewStockCountDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          stockCountId={selectedCount}
        />
      </div>
    </PageWrapper>
  );
}

