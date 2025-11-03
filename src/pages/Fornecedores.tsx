import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUserRole } from "@/hooks/useUserRole";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Plus, Phone, Mail, MapPin, TrendingUp, DollarSign, FileText, MoreVertical, Edit, Trash2, Upload, Eye, ChevronDown, History, MessageCircle, Award, Star, Clock, CircleDot, CreditCard, ShoppingCart, ClipboardList } from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddSupplierDialog from "@/components/forms/AddSupplierDialog";
import EditSupplierDialog from "@/components/forms/EditSupplierDialog";
import DeleteSupplierDialog from "@/components/forms/DeleteSupplierDialog";
import AddQuoteDialog from "@/components/forms/AddQuoteDialog";
import { ImportSuppliersDialog } from "@/components/forms/ImportSuppliersDialog";
import { SupplierQuoteHistoryDialog } from "@/components/forms/SupplierQuoteHistoryDialog";
import { toast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { ViewMode } from "@/types/pagination";
import { PageWrapper, PageSection } from "@/components/layout/PageWrapper";
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface Supplier {
  id: string;
  name: string;
  contact: string;
  limit: string;
  activeQuotes: number;
  totalQuotes: number;
  avgPrice: string;
  lastOrder: string;
  rating: number;
  status: "active" | "inactive" | "pending";
  phone?: string;
  email?: string;
  address?: string;
}
type SupplierFormData = {
  name: string;
  contact: string;
  phone?: string;
  email?: string;
  address?: string;
  limit: string;
  status: "active" | "inactive" | "pending";
};
export default function Fornecedores() {
  const navigate = useNavigate();
  const {
    user,
    loading
  } = useAuth();
  const { canViewSensitiveData } = useUserRole();
  const {
    suppliers,
    isLoading: suppliersLoading,
    deleteSupplier,
    updateSupplier,
    refetch
  } = useSuppliers();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const {
    viewMode,
    setViewMode
  } = useResponsiveViewMode();
  const {
    paginate
  } = usePagination<Supplier>({
    initialItemsPerPage: 10
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const addSupplierRef = useRef<HTMLButtonElement>(null);
  const importSuppliersRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!loading && !user) {
      setAuthDialogOpen(true);
    }
  }, [loading, user]);
  const handleAddSupplier = () => {
    refetch();
  };
  const handleEditSupplier = (id: string, data: SupplierFormData) => {
    updateSupplier({
      supplierId: id,
      data
    });
  };
  const handleDeleteSupplier = (id: string) => {
    deleteSupplier(id);
  };
  const handleSuppliersImported = (importedSuppliers: Supplier[]) => {
    refetch();
  };

  // Função para gerar mensagem personalizada do WhatsApp
  const generateWhatsAppMessage = (supplierName: string, contactName: string) => {
    const currentHour = new Date().getHours();
    let greeting = "";
    if (currentHour >= 5 && currentHour < 12) {
      greeting = "Bom dia";
    } else if (currentHour >= 12 && currentHour < 18) {
      greeting = "Boa tarde";
    } else {
      greeting = "Boa noite";
    }
    const message = `${greeting}, ${contactName}! Sou da equipe de compras da empresa. Gostaria de conversar sobre uma oportunidade de negócio com ${supplierName}. Podemos conversar?`;
    return encodeURIComponent(message);
  };

  // Função para abrir WhatsApp
  const openWhatsApp = (supplier: Supplier) => {
    if (!canViewSensitiveData) {
      toast({
        title: "Acesso restrito",
        description: "Apenas administradores podem visualizar e usar os contatos dos fornecedores.",
        variant: "destructive"
      });
      return;
    }
    
    if (!supplier.phone) {
      toast({
        title: "Telefone não encontrado",
        description: "Este fornecedor não possui telefone cadastrado.",
        variant: "destructive"
      });
      return;
    }

    // Remove caracteres não numéricos do telefone
    const cleanPhone = supplier.phone.replace(/\D/g, '');
    const message = generateWhatsAppMessage(supplier.name, supplier.contact);
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Mock data de produtos para cotações
  const mockProducts = [{
    id: "1",
    name: "Coxa com Sobrecoxa"
  }, {
    id: "2",
    name: "Filé de Frango"
  }, {
    id: "3",
    name: "Linguiça Toscana Aurora"
  }, {
    id: "4",
    name: "Contra Filé"
  }, {
    id: "5",
    name: "Peito de Frango"
  }];
  const handleAddQuote = (data: any) => {
    toast({
      title: "Cotação criada",
      description: "A cotação foi criada e enviada aos fornecedores."
    });
  };
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) || supplier.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const paginatedData = paginate(filteredSuppliers);
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        variant: "default" as const,
        label: "Ativo",
        className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 font-semibold shadow-sm"
      },
      inactive: {
        variant: "secondary" as const,
        label: "Inativo",
        className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 font-semibold shadow-sm"
      },
      pending: {
        variant: "outline" as const,
        label: "Pendente",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 font-semibold shadow-sm"
      }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    return <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>;
  };
  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return { label: "Excelente", icon: Award, color: "bg-green-100 text-green-800 border-green-200" };
    if (rating >= 3.5) return { label: "Bom", icon: TrendingUp, color: "bg-blue-100 text-blue-800 border-blue-200" };
    if (rating >= 2.5) return { label: "Regular", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    return { label: "Atenção", icon: MessageCircle, color: "bg-red-100 text-red-800 border-red-200" };
  };

  const renderNumericRating = (rating: number) => (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
      {rating.toFixed(1)} / 10
    </span>
  );

  // Calculate real stats
  const stats = useMemo(() => {
    const totalLimit = suppliers.reduce((sum, s) => {
      const limitValue = parseFloat(s.limit.replace(/[^\d,]/g, '').replace(',', '.'));
      return sum + (isNaN(limitValue) ? 0 : limitValue);
    }, 0);
    const activeQuotesTotal = suppliers.reduce((sum, s) => sum + s.activeQuotes, 0);
    
    // Distribuição por status
    const porStatus = {
      active: suppliers.filter(s => s.status === "active").length,
      inactive: suppliers.filter(s => s.status === "inactive").length,
      pending: suppliers.filter(s => s.status === "pending").length
    };
    
    // Percentual de fornecedores ativos
    const percentualAtivos = suppliers.length > 0 
      ? Math.round((porStatus.active / suppliers.length) * 100)
      : 0;
    
    // Limite médio por fornecedor ativo
    const limiteMedioPorAtivo = porStatus.active > 0
      ? (totalLimit / porStatus.active).toFixed(1)
      : "0.0";
    
    // Média de cotações por fornecedor
    const fornecedoresComCotacoes = suppliers.filter(s => s.activeQuotes > 0 || s.totalQuotes > 0);
    const totalQuotes = suppliers.reduce((sum, s) => sum + s.totalQuotes, 0);
    const mediaCotacoesPorFornecedor = fornecedoresComCotacoes.length > 0
      ? (totalQuotes / fornecedoresComCotacoes.length).toFixed(1)
      : "0.0";
    
    // Distribuição de cotações por fornecedor (para o mini gráfico)
    // Agrupa fornecedores por faixas de cotações ativas
    const distribuicaoCotacoes = [0, 0, 0, 0, 0, 0, 0]; // 7 barras
    suppliers.forEach(s => {
      const quotes = s.activeQuotes;
      if (quotes === 0) distribuicaoCotacoes[0]++;
      else if (quotes <= 2) distribuicaoCotacoes[1]++;
      else if (quotes <= 5) distribuicaoCotacoes[2]++;
      else if (quotes <= 8) distribuicaoCotacoes[3]++;
      else if (quotes <= 12) distribuicaoCotacoes[4]++;
      else if (quotes <= 20) distribuicaoCotacoes[5]++;
      else distribuicaoCotacoes[6]++;
    });
    
    return {
      total: suppliers.length,
      active: porStatus.active,
      inactive: porStatus.inactive,
      pending: porStatus.pending,
      percentualAtivos,
      totalLimit: totalLimit > 0 ? `R$ ${totalLimit.toFixed(0)}k` : "R$ 0",
      limiteMedioPorAtivo,
      activeQuotes: activeQuotesTotal,
      mediaCotacoesPorFornecedor,
      distribuicaoCotacoes
    };
  }, [suppliers]);
  if (loading || suppliersLoading) {
    return <div className="flex items-center justify-center h-screen">
        <div className="text-center">Carregando...</div>
      </div>;
  }
  return <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className="page-container">
          {/* Stats Cards - Inspiração Dashboard Statistics Card 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
            {/* Card 1: Total de Fornecedores */}
            <Card className="group relative overflow-hidden bg-indigo-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl rounded-xl transition-all duration-300">
              {/* Decoração SVG sutil */}
              <svg
                className="absolute right-0 top-0 h-full w-2/3 pointer-events-none opacity-10 dark:opacity-5"
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
                  <Building2 className="h-4 w-4 text-white/70 dark:text-gray-400" />
                  <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                    Fornecedores
                  </CardTitle>
                    </div>
              </CardHeader>
              <CardContent className="space-y-2.5 z-10 relative">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                    {stats.total}
                  </span>
                  <Badge className="bg-white/20 text-white font-semibold border-0">
                    <TrendingUp className="w-3 h-3" />
                      +{Math.floor(stats.total * 0.15)}
                  </Badge>
                    </div>
                <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span>Cadastrados:</span>
                    <span className="font-medium text-white dark:text-gray-300">
                      {stats.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                    <span>Percentual ativos:</span>
                    <span className="font-medium">{stats.percentualAtivos}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
                    <span>{stats.active} ativos</span>
                    <span>•</span>
                    <span>{stats.inactive} inativos</span>
                    <span>•</span>
                    <span>{stats.pending} pendentes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Fornecedores Ativos */}
            <Card className="group relative overflow-hidden bg-emerald-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl rounded-xl transition-all duration-300">
              {/* Decoração SVG sutil */}
              <svg
                className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5"
                viewBox="0 0 200 200"
                fill="none"
                style={{ zIndex: 0 }}
              >
                <defs>
                  <filter id="blur-fornecedores-ativos" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="10" />
                  </filter>
                </defs>
                <ellipse cx="170" cy="60" rx="40" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur-fornecedores-ativos)" />
                <rect x="120" y="20" width="60" height="20" rx="8" fill="#fff" fillOpacity="0.10" />
                <polygon points="150,0 200,0 200,50" fill="#fff" fillOpacity="0.07" />
                <circle cx="180" cy="100" r="14" fill="#fff" fillOpacity="0.16" />
              </svg>

              <CardHeader className="border-0 z-10 relative pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-white/70 dark:text-gray-400" />
                  <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                    Ativos
                  </CardTitle>
                    </div>
              </CardHeader>
              <CardContent className="space-y-2.5 z-10 relative">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                    {stats.active}
                  </span>
                    {stats.percentualAtivos > 0 && (
                    <Badge className="bg-white/20 text-white font-semibold border-0">
                        {stats.percentualAtivos}%
                    </Badge>
                    )}
                  </div>
                <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span>Fornecedores ativos:</span>
                    <span className="font-medium text-white dark:text-gray-300">
                      {stats.active}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                    <span>Percentual da base:</span>
                    <span className="font-medium">{stats.percentualAtivos}%</span>
                </div>
                  <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
                    <span>{stats.inactive} inativos</span>
                    <span>•</span>
                    <span>{stats.pending} pendentes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Limite Total */}
            <Card className="group relative overflow-hidden bg-blue-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl rounded-xl transition-all duration-300">
              {/* Decoração SVG sutil */}
              <svg
                className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5"
                viewBox="0 0 200 200"
                fill="none"
                style={{ zIndex: 0 }}
              >
                <defs>
                  <filter id="blur-limite" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="12" />
                  </filter>
                </defs>
                <rect x="120" y="0" width="70" height="70" rx="35" fill="#fff" fillOpacity="0.09" filter="url(#blur-limite)" />
                <ellipse cx="170" cy="80" rx="28" ry="12" fill="#fff" fillOpacity="0.12" />
                <polygon points="200,0 200,60 140,0" fill="#fff" fillOpacity="0.07" />
                <circle cx="150" cy="30" r="10" fill="#fff" fillOpacity="0.15" />
              </svg>

              <CardHeader className="border-0 z-10 relative pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-white/70 dark:text-gray-400" />
                  <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                    Limite Total
                  </CardTitle>
                    </div>
              </CardHeader>
              <CardContent className="space-y-2.5 z-10 relative">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl font-semibold tracking-tight text-white dark:text-white truncate">
                    {stats.totalLimit}
                  </span>
                    {stats.active > 0 && (
                    <Badge className="bg-white/20 text-white font-semibold border-0">
                        {stats.active} ativos
                    </Badge>
                    )}
                  </div>
                <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span>Limite total:</span>
                    <span className="font-medium text-white dark:text-gray-300">
                      {stats.totalLimit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                    <span>Média por ativo:</span>
                    <span className="font-medium">R$ {stats.limiteMedioPorAtivo}k</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Cotações Ativas */}
            <Card className="group relative overflow-hidden bg-orange-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl rounded-xl transition-all duration-300">
              {/* Decoração SVG sutil */}
              <svg
                className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5"
                viewBox="0 0 200 200"
                fill="none"
                style={{ zIndex: 0 }}
              >
                        <defs>
                  <filter id="blur-cotacoes-fornecedores" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="16" />
                  </filter>
                        </defs>
                <polygon points="200,0 200,100 100,0" fill="#fff" fillOpacity="0.09" />
                <ellipse cx="170" cy="40" rx="30" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur-cotacoes-fornecedores)" />
                <rect x="140" y="60" width="40" height="18" rx="8" fill="#fff" fillOpacity="0.10" />
                <circle cx="150" cy="30" r="14" fill="#fff" fillOpacity="0.18" />
                <line x1="120" y1="0" x2="200" y2="80" stroke="#fff" strokeOpacity="0.08" strokeWidth="6" />
                      </svg>

              <CardHeader className="border-0 z-10 relative pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-white/70 dark:text-gray-400" />
                  <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                    Cotações
                  </CardTitle>
                    </div>
              </CardHeader>
              <CardContent className="space-y-2.5 z-10 relative">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                    {stats.activeQuotes}
                  </span>
                    {stats.mediaCotacoesPorFornecedor !== "0.0" && (
                    <Badge className="bg-white/20 text-white font-semibold border-0">
                        {stats.mediaCotacoesPorFornecedor}
                    </Badge>
                    )}
                  </div>
                <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span>Cotações ativas:</span>
                    <span className="font-medium text-white dark:text-gray-300">
                      {stats.activeQuotes}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                    <span>Média por fornecedor:</span>
                    <span className="font-medium">{stats.mediaCotacoesPorFornecedor}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white dark:bg-[#1C1F26] border border-gray-200/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
            <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
            {/* ViewToggle - Escondido no mobile */}
            <div className="hidden sm:block">
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:justify-end">
              {/* Mobile: Busca e Botão Criar lado a lado */}
              <div className="flex gap-2 sm:gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 z-10" />
                  <Input placeholder="Buscar fornecedores..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-12 pr-4 w-full sm:w-64 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-indigo-300/70 dark:hover:border-indigo-600/70 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 dark:focus:ring-indigo-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white" />
                </div>

                {/* Botão Criar - Visível apenas no mobile */}
                <Button 
                  onClick={() => addSupplierRef.current?.click()}
                  className="sm:hidden bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl px-4 flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Select Status - Escondido no mobile */}
              <div className="hidden sm:block">
                <Select value={statusFilter} onValueChange={value => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-indigo-300/70 dark:hover:border-indigo-600/70 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 dark:focus:ring-indigo-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown Ações - Escondido no mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="hidden sm:flex bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border z-50 w-48 shadow-lg">
                  <DropdownMenuLabel className="text-gray-600 font-medium">Gerenciar Fornecedores</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => addSupplierRef.current?.click()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Fornecedor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => importSuppliersRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Fornecedores
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers View */}
      {viewMode === "grid" ? <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map(supplier => <Card key={supplier.id} className="group sm:hover:shadow-xl sm:dark:hover:shadow-lg sm:dark:hover:shadow-black/20 transition-all duration-300 border border-gray-200/60 dark:border-gray-700/30 sm:hover:border-indigo-300/60 sm:dark:hover:border-indigo-600/50 bg-white dark:bg-[#1C1F26] sm:bg-gradient-to-br sm:from-white sm:to-indigo-50/30 sm:dark:from-[#1C1F26] sm:dark:to-[#1C1F26] sm:backdrop-blur-sm">
              <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 sm:space-y-3 flex-1">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="hidden sm:block p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 group-hover:from-indigo-500/20 group-hover:to-blue-500/20 transition-all duration-300 flex-shrink-0">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-base font-semibold text-gray-900 dark:text-white sm:group-hover:text-indigo-700 sm:dark:group-hover:text-indigo-400 transition-colors duration-300 truncate">
                          {capitalize(supplier.name)}
                        </CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5 sm:mt-1">{capitalize(supplier.contact)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={supplier.status} />
                      {renderNumericRating(supplier.rating)}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 sm:hover:bg-indigo-100 h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-gray-400 dark:text-gray-500 sm:text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <SupplierQuoteHistoryDialog supplierName={supplier.name} supplierId={supplier.id} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()} className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors">
                            <Eye className="h-4 w-4 mr-2 text-blue-600" />
                            Ver Histórico de Cotações
                          </DropdownMenuItem>} />
                      <DropdownMenuItem onClick={() => setEditingSupplier(supplier)} className="hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors">
                        <Edit className="h-4 w-4 mr-2 text-green-600" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors" onClick={() => setDeletingSupplier(supplier)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                {/* Mobile: Layout Profissional Equilibrado */}
                <div className="sm:hidden space-y-2.5">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Limite</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{supplier.limit}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Preço Médio</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{supplier.avgPrice}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Cotações Ativas</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{supplier.activeQuotes}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Total</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{supplier.totalQuotes}</span>
                  </div>
                  
                  {/* Botão Nova Cotação - Mobile */}
                  <div className="pt-2.5">
                    <AddQuoteDialog onAdd={handleAddQuote} trigger={
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full border-2 border-indigo-500/60 dark:border-indigo-400/60 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium transition-all duration-200 text-xs h-9 shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Nova Cotação
                      </Button>
                    } />
                  </div>
                </div>

                {/* Desktop: Layout Original Decorativo */}
                <div className="hidden sm:block space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/60 dark:border-blue-700/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Limite</span>
                        </div>
                        <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{supplier.limit}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">Preço Médio</span>
                        </div>
                        <p className="text-lg font-bold text-green-800 dark:text-green-300">{supplier.avgPrice}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-200/60 dark:border-indigo-700/30 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <FileText className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Cotações Ativas</span>
                      </div>
                      <span className="text-lg font-bold text-indigo-800 dark:text-indigo-300">{supplier.activeQuotes}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-purple-50/80 dark:bg-purple-900/20 border border-purple-200/60 dark:border-purple-700/30 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Total</span>
                      </div>
                      <span className="text-lg font-bold text-purple-800 dark:text-purple-300">{supplier.totalQuotes}</span>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/30">
                    {supplier.phone ? (
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-green-100">
                          <Phone className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{supplier.phone}</span>
                      </div>
                    ) : !canViewSensitiveData && (
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                          <Phone className="h-3 w-3 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-400 italic">Restrito a admins</span>
                      </div>
                    )}
                    {supplier.email ? (
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-blue-100">
                          <Mail className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{supplier.email}</span>
                      </div>
                    ) : !canViewSensitiveData && (
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                          <Mail className="h-3 w-3 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-400 italic">Restrito a admins</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-orange-100">
                        <FileText className="h-3 w-3 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Último: {supplier.lastOrder}</span>
                    </div>
                  </div>

                  <AddQuoteDialog onAdd={handleAddQuote} trigger={<Button size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Cotação
                    </Button>} />
                </div>
              </CardContent>
            </Card>)}
        </div> : <Card className="border-0 bg-transparent">
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableCell colSpan={7} className="px-1 pb-3 pt-0 border-none">
                      <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-blue-200/60 dark:border-blue-900/40 rounded-lg shadow-sm px-4 py-3">
                        <div className="w-[30%] flex items-center gap-2 pr-4 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/15 to-cyan-500/15 flex items-center justify-center text-blue-600 dark:text-cyan-300">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-blue-900 dark:text-blue-100">Fornecedor</span>
                        </div>
                        <div className="hidden md:flex w-[12%] pl-2 justify-center items-center gap-1.5">
                          <CircleDot className="h-3.5 w-3.5 text-blue-600/70 dark:text-blue-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-blue-900 dark:text-blue-100">Status</span>
                        </div>
                        <div className="hidden lg:flex w-[14%] pl-2 justify-center items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-blue-600/70 dark:text-blue-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-blue-900 dark:text-blue-100">Limites</span>
                        </div>
                        <div className="hidden lg:flex w-[12%] pl-2 justify-center items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-blue-600/70 dark:text-blue-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-blue-900 dark:text-blue-100">Total</span>
                        </div>
                        <div className="hidden xl:flex w-[12%] pl-2 justify-center items-center gap-1.5">
                          <ShoppingCart className="h-3.5 w-3.5 text-blue-600/70 dark:text-blue-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-blue-900 dark:text-blue-100">Pedidos</span>
                        </div>
                        <div className="hidden xl:flex w-[10%] pl-2 justify-center items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-blue-600/70 dark:text-blue-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-blue-900 dark:text-blue-100">Nota</span>
                        </div>
                        <div className="w-[10%] pl-4 flex justify-end items-center gap-1.5">
                          <MoreVertical className="h-3.5 w-3.5 text-blue-600/70 dark:text-blue-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-blue-900 dark:text-blue-100">Ações</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map(supplier => <TableRow key={supplier.id} className="group border-none">
                      <TableCell colSpan={7} className="px-1 py-3">
                        <div className="flex items-center p-3 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300/70 dark:border-gray-700/30 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-indigo-300/60 dark:hover:border-indigo-700/50 transition-[box-shadow,border-color] duration-200 [&_*]:!transition-none">
                          {/* Fornecedor - Largura fixa */}
                          <div className="w-[30%] flex items-center gap-3 pr-4">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 dark:from-indigo-400/20 dark:to-blue-400/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="table-cell-primary truncate">{capitalize(supplier.name)}</div>
                              <div className="table-cell-secondary mt-1">{capitalize(supplier.contact)}</div>
                            </div>
                          </div>

                          {/* Status - Largura fixa, hidden on mobile */}
                          <div className="hidden md:block w-[12%] px-2">
                            <div className="flex justify-center">
                              {getStatusBadge(supplier.status)}
                            </div>
                          </div>

                          {/* Limite - Largura fixa, hidden on large screens */}
                          <div className="hidden lg:block w-[15%] px-2">
                            <div className="flex justify-center">
                              <Badge variant="outline" className="bg-blue-50/80 dark:bg-blue-900/30 border-blue-200/60 dark:border-blue-700/60 text-blue-700 dark:text-blue-400 font-medium text-xs">{supplier.limit}</Badge>
                            </div>
                          </div>

                          {/* Preço Médio - Largura fixa */}
                          <div className="w-[15%] px-2">
                            <div className="flex justify-center">
                              <span className="font-bold text-green-700 dark:text-green-400 text-sm">{supplier.avgPrice}</span>
                            </div>
                          </div>

                          {/* Cotações - Largura fixa, hidden on small screens */}
                          <div className="hidden sm:block w-[10%] px-2">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1.5 mb-1">
                                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200/50 dark:border-indigo-800/40">
                                  <ClipboardList className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="font-semibold text-indigo-700 dark:text-indigo-400 text-xs">{supplier.activeQuotes}</span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{supplier.totalQuotes}</div>
                            </div>
                          </div>

                          {/* Avaliação - Largura fixa, hidden on large screens */}
                          <div className="hidden lg:block w-[12%] px-2">
                            <div className="flex justify-center">
                              {renderNumericRating(supplier.rating)}
                            </div>
                          </div>

                          {/* Ações - Largura fixa */}
                          <div className="w-[10%] pl-4">
                            <div className="flex items-center justify-end gap-2">
                              <SupplierQuoteHistoryDialog supplierName={supplier.name} supplierId={supplier.id} trigger={<Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 p-0 h-8 w-8 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 flex items-center justify-center shadow-sm hover:shadow-md !transition-all">
                                    <History className="h-4 w-4" />
                                  </Button>} />

                              <Button variant="ghost" size="sm" onClick={() => openWhatsApp(supplier)} className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 p-0 h-8 w-8 rounded-lg border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 flex items-center justify-center shadow-sm hover:shadow-md !transition-all" title={`Conversar com ${supplier.contact} no WhatsApp`}>
                                <MessageCircle className="h-4 w-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 h-8 w-8 p-0 rounded-full !transition-colors">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-background border z-50 w-48 shadow-lg">
                                  <DropdownMenuItem onClick={() => setEditingSupplier(supplier)} className="hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors py-2">
                                    <Edit className="h-4 w-4 mr-2 text-green-600" />
                                    <span className="font-medium">Editar Fornecedor</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors py-2" onClick={() => setDeletingSupplier(supplier)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    <span className="font-medium">Excluir Fornecedor</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-indigo-100/80 dark:border-gray-700/30 bg-gradient-to-r from-indigo-50/30 to-blue-50/30 dark:from-gray-800/30 dark:to-gray-800/20 px-6 py-4">
              <DataPagination currentPage={paginatedData.pagination.currentPage} totalPages={paginatedData.pagination.totalPages} itemsPerPage={paginatedData.pagination.itemsPerPage} totalItems={paginatedData.pagination.totalItems} onPageChange={paginatedData.pagination.goToPage} onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} startIndex={paginatedData.pagination.startIndex} endIndex={paginatedData.pagination.endIndex} />
            </div>
          </CardContent>
        </Card>}

      {filteredSuppliers.length === 0 && <Card className="bg-white dark:bg-[#1C1F26] border border-gray-200/80 dark:border-gray-700/30">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhum fornecedor encontrado</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tente ajustar os filtros ou adicione novos fornecedores
            </p>
            <AddSupplierDialog onAdd={handleAddSupplier} trigger={<Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Fornecedor
              </Button>} />
          </CardContent>
        </Card>}

      <EditSupplierDialog supplier={editingSupplier} open={!!editingSupplier} onOpenChange={open => !open && setEditingSupplier(null)} onEdit={handleEditSupplier} />

      <DeleteSupplierDialog supplier={deletingSupplier} open={!!deletingSupplier} onOpenChange={open => !open && setDeletingSupplier(null)} onDelete={handleDeleteSupplier} />

      {/* Hidden triggers for dialogs */}
      <div className="hidden">
        <AddSupplierDialog onAdd={handleAddSupplier} trigger={<button ref={addSupplierRef} />} />
        <ImportSuppliersDialog onSuppliersImported={handleSuppliersImported} trigger={<button ref={importSuppliersRef} />} />
      </div>
        </div>
      </PageWrapper>
    </>;
}