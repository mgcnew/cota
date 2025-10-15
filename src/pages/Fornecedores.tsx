import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSuppliers } from "@/hooks/useSuppliers";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Plus, Phone, Mail, MapPin, TrendingUp, DollarSign, FileText, MoreVertical, Edit, Trash2, Star, Upload, Eye, ChevronDown, Clock, MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const renderStarRating = (rating: number) => {
    return <div className="flex items-center gap-1">
        {Array.from({
        length: 5
      }, (_, i) => <Star key={i} className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-warning text-warning" : "text-muted-foreground"}`} />)}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>;
  };

  // Calculate real stats
  const stats = useMemo(() => {
    const totalLimit = suppliers.reduce((sum, s) => {
      const limitValue = parseFloat(s.limit.replace(/[^\d,]/g, '').replace(',', '.'));
      return sum + (isNaN(limitValue) ? 0 : limitValue);
    }, 0);
    const activeQuotesTotal = suppliers.reduce((sum, s) => sum + s.activeQuotes, 0);
    return {
      total: suppliers.length,
      active: suppliers.filter(s => s.status === "active").length,
      totalLimit: totalLimit > 0 ? `R$ ${totalLimit.toFixed(0)}k` : "R$ 0",
      activeQuotes: activeQuotesTotal
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
      {/* Header Fornecedores com Tema Índigo */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-3xl bg-gradient-to-r from-indigo-900 to-blue-700 bg-clip-text text-transparent">
                    Fornecedores
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
                      <Star className="h-3 w-3" />
                      Rede de Fornecedores
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">Gerencie fornecedores e acompanhe performance</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 bg-white/40 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span>{filteredSuppliers.length} fornecedores ativos</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0">
                  Ações
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar fornecedores..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as any)}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
        </CardContent>
      </Card>

      {/* Stats Cards Melhorados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50/50 to-blue-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 relative">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Total de Fornecedores</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="flex items-center gap-1 text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+{Math.floor(stats.total * 0.15)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{
                    width: '90%'
                  }}></div>
              </div>
              <span className="text-xs text-gray-500">90%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-emerald-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 relative">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Fornecedores Ativos</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+{Math.floor(stats.active * 0.1)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {Math.floor(stats.active / stats.total * 100)}% da base ativa • {stats.total - stats.active} inativos
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-cyan-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 relative">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Limite Total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalLimit}</div>
              </div>
              <div className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+12%</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Capacidade total de crédito disponível
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-amber-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 relative">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Cotações Ativas</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeQuotes}</div>
              </div>
              <div className="flex items-center gap-1 text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+25%</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {Math.floor(stats.activeQuotes * 0.7)} aguardando • {Math.floor(stats.activeQuotes * 0.3)} em análise
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers View */}
      {viewMode === "grid" ? <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map(supplier => <Card key={supplier.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200/60 hover:border-indigo-300/60 bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 group-hover:from-indigo-500/20 group-hover:to-blue-500/20 transition-all duration-300">
                        <Building2 className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors duration-300 truncate">
                          {supplier.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 truncate mt-1">{supplier.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={supplier.status} />
                      {renderStarRating(supplier.rating)}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-indigo-100">
                        <MoreVertical className="h-4 w-4" />
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

              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border border-blue-200/60">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Limite</span>
                      </div>
                      <p className="text-lg font-bold text-blue-800">{supplier.limit}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Preço Médio</span>
                      </div>
                      <p className="text-lg font-bold text-green-800">{supplier.avgPrice}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-200/60 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-600">Cotações Ativas</span>
                    </div>
                    <span className="text-lg font-bold text-indigo-800">{supplier.activeQuotes}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-50/80 border border-purple-200/60 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600">Total</span>
                    </div>
                    <span className="text-lg font-bold text-purple-800">{supplier.totalQuotes}</span>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-gray-50/80 border border-gray-200/60">
                  {supplier.phone && <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-green-100">
                        <Phone className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{supplier.phone}</span>
                    </div>}
                  {supplier.email && <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-blue-100">
                        <Mail className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{supplier.email}</span>
                    </div>}
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-orange-100">
                      <FileText className="h-3 w-3 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Último: {supplier.lastOrder}</span>
                  </div>
                </div>

                <AddQuoteDialog onAdd={handleAddQuote} trigger={<Button size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cotação
                  </Button>} />
              </CardContent>
            </Card>)}
        </div> : <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50/20">
          <CardContent className="p-0">
            <div className="max-w-full overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200">
                  <TableRow className="border-b-2 border-gray-100">
                    <TableHead className="font-semibold text-indigo-900 py-4 px-4 text-xs w-[30%]">                  Fornecedor</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-indigo-900 py-4 px-4 text-xs w-[12%]">         Status</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-indigo-900 py-4 px-4 text-xs w-[15%]">          Limite</TableHead>
                    <TableHead className="font-semibold text-indigo-900 py-4 px-4 text-xs w-[15%]">      Preço Médio</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold text-indigo-900 py-4 px-4 text-xs w-[10%]"> Cotações</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-indigo-900 py-4 px-4 text-xs w-[8%]"> Avaliação</TableHead>
                    <TableHead className="text-right font-semibold text-indigo-900 py-4 px-4 text-xs w-[10%]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map(supplier => <TableRow key={supplier.id} className="group">
                      <TableCell colSpan={7} className="p-3">
                        <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-slate-250/70 hover:shadow-md hover:border-slate-350/70 transition-all duration-300">
                          {/* Fornecedor - Largura fixa */}
                          <div className="w-[30%] flex items-center gap-3 pr-4">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Building2 className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900 text-sm truncate">{supplier.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{supplier.contact}</div>
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
                              <Badge variant="outline" className="bg-blue-50/80 border-blue-200/60 text-blue-700 font-medium text-xs">{supplier.limit}</Badge>
                            </div>
                          </div>

                          {/* Preço Médio - Largura fixa */}
                          <div className="w-[15%] px-2">
                            <div className="flex justify-center">
                              <span className="font-bold text-green-700 text-sm">{supplier.avgPrice}</span>
                            </div>
                          </div>

                          {/* Cotações - Largura fixa, hidden on small screens */}
                          <div className="hidden sm:block w-[10%] px-2">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <FileText className="h-3 w-3 text-indigo-600" />
                                <span className="font-semibold text-indigo-700 text-xs">{supplier.activeQuotes}</span>
                              </div>
                              <div className="text-xs text-gray-500">{supplier.totalQuotes}</div>
                            </div>
                          </div>

                          {/* Avaliação - Largura fixa, hidden on large screens */}
                          <div className="hidden lg:block w-[8%] px-2">
                            <div className="flex justify-center">
                              {renderStarRating(supplier.rating)}
                            </div>
                          </div>

                          {/* Ações - Largura fixa */}
                          <div className="w-[10%] pl-4">
                            <div className="flex items-center justify-end gap-2">
                              <SupplierQuoteHistoryDialog supplierName={supplier.name} supplierId={supplier.id} trigger={<Button variant="ghost" size="sm" className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 p-0 h-8 w-8 rounded-full border border-gray-200 hover:border-orange-300 flex items-center justify-center">
                                    <Clock className="h-4 w-4" />
                                  </Button>} />

                              <Button variant="ghost" size="sm" onClick={() => openWhatsApp(supplier)} className="text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 p-0 h-8 w-8 rounded-full border border-gray-200 hover:border-green-300 flex items-center justify-center" title={`Conversar com ${supplier.contact} no WhatsApp`}>
                                <MessageCircle className="h-4 w-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 hover:bg-gray-50/50 transition-colors duration-200 h-8 w-8 p-0 rounded-full">
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
            <div className="border-t border-indigo-100/80 bg-gradient-to-r from-indigo-50/30 to-blue-50/30 px-6 py-4">
              <DataPagination currentPage={paginatedData.pagination.currentPage} totalPages={paginatedData.pagination.totalPages} itemsPerPage={paginatedData.pagination.itemsPerPage} totalItems={paginatedData.pagination.totalItems} onPageChange={paginatedData.pagination.goToPage} onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} startIndex={paginatedData.pagination.startIndex} endIndex={paginatedData.pagination.endIndex} />
            </div>
          </CardContent>
        </Card>}

      {filteredSuppliers.length === 0 && <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
            <p className="text-muted-foreground mb-4">
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