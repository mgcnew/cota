import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Package, Award, Search, DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupplierQuoteHistory } from "@/hooks/useSupplierQuoteHistory";

interface SupplierQuoteHistoryDialogProps {
  supplierName: string;
  supplierId: string;
  trigger?: React.ReactNode;
}

export function SupplierQuoteHistoryDialog({ supplierName, supplierId, trigger }: SupplierQuoteHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: quoteHistory = [], isLoading, error } = useSupplierQuoteHistory(supplierId);

  const getVariationIcon = (type: 'up' | 'down' | 'stable') => {
    switch (type) {
      case 'up':
        return <TrendingUp className="h-5 w-5 font-bold text-red-700" />;
      case 'down':
        return <TrendingDown className="h-5 w-5 font-bold text-green-700" />;
      default:
        return <Minus className="h-5 w-5 font-bold text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluida':
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-300 shadow-md px-2 py-1 text-xs font-semibold">
            Concluída
          </Badge>
        );
      case 'ativa':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-300 shadow-md px-2 py-1 text-xs font-semibold">
            Ativa
          </Badge>
        );
      case 'expirada':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-red-300 shadow-md px-2 py-1 text-xs font-semibold">
            Expirada
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-300 shadow-md px-2 py-1 text-xs font-semibold">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const stats = quoteHistory.length > 0 ? {
    totalQuotes: quoteHistory.length,
    wonQuotes: quoteHistory.filter(q => q.isWinner).length,
    winRate: (quoteHistory.filter(q => q.isWinner).length / quoteHistory.length) * 100,
    uniqueProducts: new Set(quoteHistory.map(q => q.product)).size,
    avgPrice: quoteHistory.reduce((sum, q) => sum + q.price, 0) / quoteHistory.length
  } : {
    totalQuotes: 0,
    wonQuotes: 0,
    winRate: 0,
    uniqueProducts: 0,
    avgPrice: 0
  };

  // Agrupar produtos únicos com suas informações
  const baseUniqueProducts = useMemo(() => {
    if (quoteHistory.length === 0) return [];
    
    return Array.from(new Set(quoteHistory.map(q => q.product))).map(productName => {
      const productQuotes = quoteHistory.filter(q => q.product === productName);
      const wonQuotes = productQuotes.filter(q => q.isWinner);
      const totalQuoted = productQuotes.length;
      const totalWon = wonQuotes.length;
      const avgPrice = productQuotes.reduce((sum, q) => sum + q.price, 0) / productQuotes.length;
      const minPrice = Math.min(...productQuotes.map(q => q.price));
      const maxPrice = Math.max(...productQuotes.map(q => q.price));
      
      return {
        name: productName,
        totalQuoted,
        totalWon,
        winRate: (totalWon / totalQuoted) * 100,
        avgPrice,
        minPrice,
        maxPrice,
        lastQuoteDate: productQuotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      };
    });
  }, [quoteHistory]);

  // Aplicar filtro de busca
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...baseUniqueProducts];

    // Aplicar busca por nome do produto
    if (searchTerm.trim()) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [baseUniqueProducts, searchTerm]);

  // Manter compatibilidade com o código existente
  const uniqueProducts = filteredAndSortedProducts;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Ver Histórico
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b border-gray-100 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            Histórico de Cotações - Produtos
          </DialogTitle>
        </DialogHeader>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-auto p-6">
          {/* Barra de busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela de produtos */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">Erro ao carregar dados</div>
              <div className="text-sm text-gray-500">{error.message}</div>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600 mb-2">
                {baseUniqueProducts.length === 0 ? "Nenhum produto cotado" : "Nenhum produto encontrado"}
              </div>
              {baseUniqueProducts.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                  }}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-b border-blue-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Data
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Nome do Produto
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Preço
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Status da Cotação
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedProducts.map((product, index) => {
                      // Para cada produto, mostrar todas as cotações
                      const productQuotes = quoteHistory.filter(q => q.product === product.name);
                      
                      return productQuotes.map((quote, quoteIndex) => (
                        <tr 
                          key={`${product.name}-${quoteIndex}`}
                          className={cn(
                            "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-200",
                            (index + quoteIndex) % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          )}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {formatDate(String(quote.date))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{quote.product}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              R$ {quote.price.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={quote.isWinner ? "default" : "secondary"}
                              className={cn(
                                "font-medium",
                                quote.isWinner 
                                  ? "bg-green-100 text-green-700 border-green-200" 
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              )}
                            >
                              {quote.isWinner ? "Ganha" : "Não ganha"}
                            </Badge>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}