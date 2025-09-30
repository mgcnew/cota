import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { ViewMode } from "@/types/pagination";
import { 
  ShoppingCart, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Truck,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  X
} from "lucide-react";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import EditPedidoDialog from "@/components/forms/EditPedidoDialog";
import DeletePedidoDialog from "@/components/forms/DeletePedidoDialog";
import ViewPedidoDialog from "@/components/forms/ViewPedidoDialog";

export default function Pedidos() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const { paginate } = usePagination<any>({ initialItemsPerPage: 10 });
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

  // Mock data baseado na planilha Excel
  const [pedidos, setPedidos] = useState([
    {
      id: "PED-001",
      fornecedor: "Holambra",
      total: "R$ 3.800,00",
      status: "confirmado",
      dataPedido: "23/09/2025",
      dataEntrega: "26/09/2025",
      itens: 3,
      produtos: ["Coxa com Sobrecoxa", "Peito de Frango", "Asa de Frango"],
      observacoes: "Entrega urgente"
    },
    {
      id: "PED-002", 
      fornecedor: "Seara",
      total: "R$ 7.920,00",
      status: "entregue",
      dataPedido: "20/09/2025",
      dataEntrega: "23/09/2025",
      itens: 2,
      produtos: ["Filé de Frango", "Contra Filé"],
      observacoes: ""
    },
    {
      id: "PED-003",
      fornecedor: "Davi",
      total: "R$ 3.698,00",
      status: "pendente",
      dataPedido: "22/09/2025",
      dataEntrega: "25/09/2025",
      itens: 4,
      produtos: ["Linguiça Toscana", "Calabresa", "Mortadela", "Presunto"],
      observacoes: "Verificar qualidade"
    },
    {
      id: "PED-004",
      fornecedor: "Adriano/Sidio",
      total: "R$ 2.100,00",
      status: "processando",
      dataPedido: "24/09/2025",
      dataEntrega: "27/09/2025",
      itens: 2,
      produtos: ["Picanha", "Alcatra"],
      observacoes: ""
    },
    {
      id: "PED-005",
      fornecedor: "Silvia",
      total: "R$ 10.800,00",
      status: "cancelado",
      dataPedido: "19/09/2025",
      dataEntrega: "22/09/2025",
      itens: 3,
      produtos: ["Contra Filé", "File Mignon", "Maminha"],
      observacoes: "Cancelado por indisponibilidade"
    }
  ]);

  const fornecedores = [...new Set(pedidos.map(p => p.fornecedor))];

  const handleAddPedido = (pedido: any) => {
    setPedidos([...pedidos, pedido]);
  };

  const handleEditPedido = (pedidoAtualizado: any) => {
    setPedidos(pedidos.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
  };

  const handleDeletePedido = (id: string) => {
    setPedidos(pedidos.filter(p => p.id !== id));
  };

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
    const csvData = filteredPedidos.map(p => [
      p.id,
      p.fornecedor,
      p.total,
      p.status,
      p.dataPedido,
      p.dataEntrega,
      p.itens,
      p.produtos.join("; "),
      p.observacoes
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
    const variants = {
      pendente: "outline",
      processando: "default",
      confirmado: "secondary", 
      entregue: "secondary",
      cancelado: "destructive"
    };
    
    const labels = {
      pendente: "Pendente",
      processando: "Processando",
      confirmado: "Confirmado",
      entregue: "Entregue",
      cancelado: "Cancelado"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
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
    const matchesSearch = pedido.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.produtos.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const totalValue = pedidos
    .filter(p => p.status !== "cancelado")
    .reduce((acc, p) => acc + parseFloat(p.total.replace("R$ ", "").replace(".", "").replace(",", ".")), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos realizados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <Button className="gradient-primary" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por fornecedor, produto ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="processando">Processando</option>
              <option value="confirmado">Confirmados</option>
              <option value="entregue">Entregues</option>
              <option value="cancelado">Cancelados</option>
            </select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
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
                    <select 
                      value={fornecedorFilter}
                      onChange={(e) => setFornecedorFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="all">Todos os Fornecedores</option>
                      {fornecedores.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Valor Mínimo</Label>
                      <Input
                        type="number"
                        placeholder="R$ 0,00"
                        value={valorMin}
                        onChange={(e) => setValorMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Máximo</Label>
                      <Input
                        type="number"
                        placeholder="R$ 0,00"
                        value={valorMax}
                        onChange={(e) => setValorMax(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {pedidos.filter(p => p.status === "pendente" || p.status === "processando").length}
            </div>
            <p className="text-sm text-muted-foreground">Pedidos Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {pedidos.filter(p => p.status === "entregue").length}
            </div>
            <p className="text-sm text-muted-foreground">Pedidos Entregues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {Math.round(pedidos.reduce((acc, p) => acc + p.itens, 0) / pedidos.length)}
            </div>
            <p className="text-sm text-muted-foreground">Itens por Pedido</p>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos View */}
      {viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.items.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{pedido.id}</div>
                        <div className="text-xs text-muted-foreground">{pedido.dataPedido}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{pedido.fornecedor}</div>
                    <div className="text-xs text-muted-foreground">{pedido.itens} itens</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-xs truncate">
                      {pedido.produtos.slice(0, 2).join(", ")}
                      {pedido.produtos.length > 2 && ` +${pedido.produtos.length - 2}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{pedido.dataEntrega}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(pedido.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">{pedido.total}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedPedido(pedido);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedPedido(pedido);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedPedido(pedido);
                          setDeleteDialogOpen(true);
                        }}
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
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map((pedido) => (
            <Card key={pedido.id} className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{pedido.id}</CardTitle>
                  </div>
                  {getStatusBadge(pedido.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fornecedor:</span>
                    <span className="font-medium">{pedido.fornecedor}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-bold text-success">{pedido.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entrega:</span>
                    <span className="font-medium">{pedido.dataEntrega}</span>
                  </div>
                </div>
                <div className="flex gap-1 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedPedido(pedido); setViewDialogOpen(true); }}>
                    <Eye className="h-4 w-4 mr-1" />Ver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedPedido(pedido); setEditDialogOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedPedido(pedido); setDeleteDialogOpen(true); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddPedidoDialog 
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddPedido}
      />
      
      {selectedPedido && (
        <>
          <EditPedidoDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            pedido={selectedPedido}
            onEdit={handleEditPedido}
          />
          
          <DeletePedidoDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            pedido={selectedPedido}
            onDelete={handleDeletePedido}
          />
          
          <ViewPedidoDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            pedido={selectedPedido}
          />
        </>
      )}
    </div>
  );
}