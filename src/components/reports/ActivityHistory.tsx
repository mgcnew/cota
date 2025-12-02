import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataPagination } from "@/components/ui/data-pagination";
import { History, Search, FileText, ShoppingCart, Package, Building2, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePagination } from "@/hooks/usePagination";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ViewHistoricoDialog from "@/components/forms/ViewHistoricoDialog";

interface ActivityHistoryProps {
  isActive: boolean;
}

interface HistoricoItem {
  id: string;
  tipo: string;
  acao: string;
  detalhes: string;
  data: string;
  usuario: string;
  valor: string;
  economia: string;
  created_at: string;
}

export function ActivityHistory({ isActive }: ActivityHistoryProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { paginate } = usePagination<HistoricoItem>({ initialItemsPerPage: 10 });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoricoItem | null>(null);
  
  const hasLoaded = useRef(false);

  const loadHistorico = useCallback(async () => {
    if (!user?.id) {
      setHistorico([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData?.company_id) {
        setHistorico([]);
        setLoading(false);
        return;
      }

      // Buscar activity_log
      const { data: activityData } = await supabase
        .from("activity_log")
        .select("*")
        .eq("company_id", companyData.company_id)
        .order("created_at", { ascending: false })
        .limit(500);

      let formattedData: HistoricoItem[] = [];

      if (activityData && activityData.length > 0) {
        formattedData = activityData.map(item => ({
          id: item.id,
          tipo: item.tipo,
          acao: item.acao,
          detalhes: item.detalhes,
          data: format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
          usuario: user?.email || "Usuário",
          valor: item.valor ? `R$ ${parseFloat(item.valor.toString()).toFixed(2).replace(".", ",")}` : "",
          economia: item.economia ? `${parseFloat(item.economia.toString()).toFixed(2)}%` : "",
          created_at: item.created_at
        }));
      } else {
        // Buscar dados de outras tabelas se activity_log estiver vazio
        const [quotesRes, ordersRes, productsRes, suppliersRes] = await Promise.all([
          supabase.from("quotes").select("id, status, data_inicio, created_at").eq("company_id", companyData.company_id).order("created_at", { ascending: false }).limit(50),
          supabase.from("orders").select("id, status, supplier_name, total_value, created_at").eq("company_id", companyData.company_id).order("created_at", { ascending: false }).limit(50),
          supabase.from("products").select("id, name, created_at").eq("company_id", companyData.company_id).order("created_at", { ascending: false }).limit(30),
          supabase.from("suppliers").select("id, name, created_at").eq("company_id", companyData.company_id).order("created_at", { ascending: false }).limit(30)
        ]);

        const allData: HistoricoItem[] = [];

        quotesRes.data?.forEach(q => {
          allData.push({
            id: q.id,
            tipo: "cotacao",
            acao: `Cotação ${q.status === "concluida" || q.status === "finalizada" ? "finalizada" : q.status}`,
            detalhes: `Cotação ${q.status}`,
            data: format(new Date(q.data_inicio || q.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
            usuario: user?.email || "Usuário",
            valor: "",
            economia: "",
            created_at: q.data_inicio || q.created_at
          });
        });

        ordersRes.data?.forEach(o => {
          allData.push({
            id: o.id,
            tipo: "pedido",
            acao: `Pedido ${o.status === "pendente" ? "criado" : o.status}`,
            detalhes: `Pedido para ${o.supplier_name || "Fornecedor"}`,
            data: format(new Date(o.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
            usuario: user?.email || "Usuário",
            valor: o.total_value ? `R$ ${parseFloat(o.total_value.toString()).toFixed(2).replace(".", ",")}` : "",
            economia: "",
            created_at: o.created_at
          });
        });

        productsRes.data?.forEach(p => {
          allData.push({
            id: p.id,
            tipo: "produto",
            acao: "Produto criado",
            detalhes: `Produto "${p.name}" adicionado`,
            data: format(new Date(p.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
            usuario: user?.email || "Usuário",
            valor: "",
            economia: "",
            created_at: p.created_at
          });
        });

        suppliersRes.data?.forEach(s => {
          allData.push({
            id: s.id,
            tipo: "fornecedor",
            acao: "Fornecedor criado",
            detalhes: `Fornecedor "${s.name}" adicionado`,
            data: format(new Date(s.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
            usuario: user?.email || "Usuário",
            valor: "",
            economia: "",
            created_at: s.created_at
          });
        });

        formattedData = allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setHistorico(formattedData);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast({
        title: "Erro ao carregar histórico",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (isActive && user && !hasLoaded.current) {
      loadHistorico();
      hasLoaded.current = true;
    }
  }, [isActive, user, loadHistorico]);

  const filteredHistorico = historico.filter(item => {
    const matchesSearch = !searchTerm || 
      item.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detalhes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "all" || item.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  const paginatedData = paginate(filteredHistorico);

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, typeof FileText> = {
      cotacao: FileText,
      pedido: ShoppingCart,
      produto: Package,
      fornecedor: Building2
    };
    return icons[tipo] || History;
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      cotacao: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      pedido: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      produto: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      fornecedor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    };
    return colors[tipo] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="border-gray-200 dark:border-gray-700/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar no histórico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="cotacao">Cotações</SelectItem>
                <SelectItem value="pedido">Pedidos</SelectItem>
                <SelectItem value="produto">Produtos</SelectItem>
                <SelectItem value="fornecedor">Fornecedores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Atividades */}
      <Card className="border-gray-200 dark:border-gray-700/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Atividades Recentes
            <Badge variant="secondary" className="ml-2">{filteredHistorico.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedData.items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma atividade encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedData.items.map((item) => {
                const Icon = getTipoIcon(item.tipo);
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => { setSelectedItem(item); setViewDialogOpen(true); }}
                  >
                    <div className={cn("p-2 rounded-lg", getTipoBadgeColor(item.tipo))}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {item.acao}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.tipo}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.detalhes}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{item.data}</span>
                        {item.valor && <span className="text-green-600 font-medium">{item.valor}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Paginação */}
          {paginatedData.items.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 p-4">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Visualização */}
      <ViewHistoricoDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        item={selectedItem}
      />
    </div>
  );
}
