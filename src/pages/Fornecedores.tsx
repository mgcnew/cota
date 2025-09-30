import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Search, 
  Plus, 
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  DollarSign,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Star
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddSupplierDialog from "@/components/forms/AddSupplierDialog";
import EditSupplierDialog from "@/components/forms/EditSupplierDialog";
import DeleteSupplierDialog from "@/components/forms/DeleteSupplierDialog";
import AddQuoteDialog from "@/components/forms/AddQuoteDialog";
import { ImportSuppliersDialog } from "@/components/forms/ImportSuppliersDialog";
import { toast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { ViewMode } from "@/types/pagination";

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
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { paginate } = usePagination<Supplier>({ initialItemsPerPage: 10 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      setAuthDialogOpen(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (user) {
      loadSuppliers();
    }
  }, [user]);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSuppliers: Supplier[] = data.map(s => ({
        id: s.id,
        name: s.name,
        contact: s.contact || "",
        limit: "R$ 0,00",
        activeQuotes: 0,
        totalQuotes: 0,
        avgPrice: "R$ 0,00",
        lastOrder: new Date(s.created_at).toLocaleDateString('pt-BR'),
        rating: 0,
        status: "active" as const,
        phone: s.phone || undefined,
        email: s.email || undefined,
        address: s.address || undefined,
      }));

      setSuppliers(formattedSuppliers);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  };

  const handleAddSupplier = () => {
    loadSuppliers();
  };

  const handleEditSupplier = (id: string, data: SupplierFormData) => {
    setSuppliers(suppliers.map(supplier => 
      supplier.id === id 
        ? { ...supplier, ...data }
        : supplier
    ));
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(supplier => supplier.id !== id));
  };

  const handleSuppliersImported = (importedSuppliers: Supplier[]) => {
    setSuppliers(prev => [...prev, ...importedSuppliers]);
  };

  // Mock data de produtos para cotações
  const mockProducts = [
    { id: "1", name: "Coxa com Sobrecoxa" },
    { id: "2", name: "Filé de Frango" },
    { id: "3", name: "Linguiça Toscana Aurora" },
    { id: "4", name: "Contra Filé" },
    { id: "5", name: "Peito de Frango" },
  ];

  const handleAddQuote = (data: any) => {
    toast({
      title: "Cotação criada",
      description: "A cotação foi criada e enviada aos fornecedores.",
    });
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedData = paginate(filteredSuppliers);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary", 
      pending: "outline"
    } as const;
    
    const labels = {
      active: "Ativo",
      inactive: "Inativo",
      pending: "Pendente"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.floor(rating) 
                ? "fill-warning text-warning" 
                : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie seus fornecedores e acompanhe performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <ImportSuppliersDialog onSuppliersImported={handleSuppliersImported} />
          <AddSupplierDialog onAdd={handleAddSupplier} />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar fornecedores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {["all", "active", "inactive", "pending"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status as any)}
                >
                  {status === "all" ? "Todos" : 
                   status === "active" ? "Ativos" :
                   status === "inactive" ? "Inativos" : "Pendentes"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <MetricCard
          title="Total"
          value={suppliers.length}
          icon={Building2}
          variant="default"
        />
        <MetricCard
          title="Ativos"
          value={suppliers.filter(s => s.status === "active").length}
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Limite Total"
          value="R$ 198k"
          icon={DollarSign}
          variant="info"
        />
        <MetricCard
          title="Cotações Ativas"
          value="40"
          icon={FileText}
          variant="warning"
        />
      </div>

      {/* Suppliers View */}
      {viewMode === "grid" ? (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map((supplier) => (
            <Card key={supplier.id} className="card-elevated border-2 hover:border-primary/30 transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 min-w-0">
                    <CardTitle className="text-base md:text-lg truncate">{supplier.name}</CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{supplier.contact}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={supplier.status} />
                      {renderStarRating(supplier.rating)}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingSupplier(supplier)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeletingSupplier(supplier)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Limite</p>
                    <p className="font-semibold text-foreground">{supplier.limit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preço médio</p>
                    <p className="font-semibold text-success">{supplier.avgPrice}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cotações ativas</p>
                    <p className="font-semibold text-primary">{supplier.activeQuotes}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-semibold text-muted-foreground">{supplier.totalQuotes}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{supplier.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Último pedido: {supplier.lastOrder}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Cotações
                  </Button>
                  <AddQuoteDialog
                    onAdd={handleAddQuote}
                    trigger={
                      <Button size="sm" className="flex-1">
                        Nova Cotação
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Limite</TableHead>
                    <TableHead>Preço Médio</TableHead>
                    <TableHead className="hidden sm:table-cell">Cotações</TableHead>
                    <TableHead className="hidden lg:table-cell">Avaliação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-xs text-muted-foreground">{supplier.contact}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StatusBadge status={supplier.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{supplier.limit}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-success">{supplier.avgPrice}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">
                          <div className="font-medium text-primary">{supplier.activeQuotes} ativas</div>
                          <div className="text-muted-foreground">{supplier.totalQuotes} total</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {renderStarRating(supplier.rating)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingSupplier(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeletingSupplier(supplier)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DataPagination
              currentPage={paginatedData.pagination.currentPage}
              totalPages={paginatedData.pagination.totalPages}
              itemsPerPage={paginatedData.pagination.itemsPerPage}
              totalItems={paginatedData.pagination.totalItems}
              onPageChange={paginatedData.pagination.goToPage}
              onItemsPerPageChange={paginatedData.pagination.setItemsPerPage}
              startIndex={paginatedData.pagination.startIndex}
              endIndex={paginatedData.pagination.endIndex}
            />
          </CardContent>
        </Card>
      )}

      {filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou adicione novos fornecedores
            </p>
            <AddSupplierDialog onAdd={handleAddSupplier} trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Fornecedor
              </Button>
            } />
          </CardContent>
        </Card>
      )}

      <EditSupplierDialog
        supplier={editingSupplier}
        open={!!editingSupplier}
        onOpenChange={(open) => !open && setEditingSupplier(null)}
        onEdit={handleEditSupplier}
      />

      <DeleteSupplierDialog
        supplier={deletingSupplier}
        open={!!deletingSupplier}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
        onDelete={handleDeleteSupplier}
      />
      </div>
    </>
  );
}