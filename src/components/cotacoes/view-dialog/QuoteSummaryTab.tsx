import { Package, Building2, TrendingDown, Trophy, Search, ArrowUpDown, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuoteSummaryTabProps {
  stats: {
    totalProdutos: number;
    totalFornecedores: number;
    fornecedoresRespondidos: number;
    melhorValor: number;
    melhorFornecedor: string;
  };
  melhorTotal: number;
  productPricesData: any[];
  safeStr: (val: any) => string;
}

export function QuoteSummaryTab({ stats, melhorTotal, productPricesData, safeStr }: QuoteSummaryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // Calcular Top Fornecedores
  const topSuppliers = useMemo(() => {
    const wins: Record<string, { name: string; count: number; total: number }> = {};
    productPricesData.forEach(item => {
      if (item.bestPrice > 0 && item.bestSupplierName) {
        if (!wins[item.bestSupplierName]) {
          wins[item.bestSupplierName] = { name: item.bestSupplierName, count: 0, total: 0 };
        }
        wins[item.bestSupplierName].count++;
        wins[item.bestSupplierName].total += item.bestPrice;
      }
    });
    return Object.values(wins)
      .sort((a, b) => b.count - a.count || a.total - b.total)
      .slice(0, 3);
  }, [productPricesData]);

  const filteredAndSortedData = useMemo(() => {
    let data = [...productPricesData];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item =>
        safeStr(item.productName).toLowerCase().includes(query) ||
        safeStr(item.bestSupplierName).toLowerCase().includes(query)
      );
    }
    switch (sortBy) {
      case "price-asc": data.sort((a, b) => a.bestPrice - b.bestPrice); break;
      case "price-desc": data.sort((a, b) => b.bestPrice - a.bestPrice); break;
      case "savings": data.sort((a, b) => b.savings - a.savings); break;
      case "name": data.sort((a, b) => safeStr(a.productName).localeCompare(safeStr(b.productName))); break;
    }
    return data;
  }, [productPricesData, searchQuery, sortBy, safeStr]);

  return (
    <div className="flex flex-col h-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-teal-600" />
            <span className="text-xs text-teal-700">Produtos</span>
          </div>
          <p className="text-xl font-bold text-teal-800">{stats.totalProdutos}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-700">Fornecedores</span>
          </div>
          <p className="text-xl font-bold text-blue-800">{stats.totalFornecedores}</p>
          <p className="text-xs text-blue-600">{stats.fornecedoresRespondidos} responderam</p>
        </div>
        <div className="p-3 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-700">Melhor Total</span>
          </div>
          <p className="text-xl font-bold text-green-800">R$ {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-purple-700">Vencedores</span>
          </div>
          <p className="text-xl font-bold text-purple-800">{topSuppliers.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 px-4 pb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="price-asc">Menor Preço</SelectItem>
            <SelectItem value="price-desc">Maior Preço</SelectItem>
            <SelectItem value="savings">Maior Economia</SelectItem>
            <SelectItem value="name">Nome (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Produtos */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-4">
          {filteredAndSortedData.length > 0 ? (
            filteredAndSortedData.map((item) => (
              <div
                key={item.productId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  item.bestPrice > 0 ? "bg-green-50 border-green-200" : "bg-white"
                )}
              >
                <div className="flex-1">
                  <p className="font-medium">{safeStr(item.productName)}</p>
                  <p className="text-xs text-muted-foreground">Qtd: {safeStr(item.quantidade)} {safeStr(item.unidade)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {item.bestPrice > 0 ? (
                    <>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">{safeStr(item.bestSupplierName)}</p>
                      </div>
                      {item.savings > 0 && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          -{((item.savings / (item.bestPrice + item.savings)) * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="text-gray-400">Sem preço</Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Inbox}
              title="Nenhum resultado"
              description={searchQuery ? "Tente ajustar sua busca." : "Aguardando cotações."}
              variant="inline"
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
