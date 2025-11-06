import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Package, Award, Search, DollarSign, ClipboardList, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupplierQuoteHistory } from "@/hooks/useSupplierQuoteHistory";
import { useSupplierOrderHistory } from "@/hooks/useSupplierOrderHistory";
import { useMobile } from "@/contexts/MobileProvider";

interface SupplierQuoteHistoryDialogProps {
  supplierName: string;
  supplierId: string;
  trigger?: React.ReactNode;
}

export function SupplierQuoteHistoryDialog({ supplierName, supplierId, trigger }: SupplierQuoteHistoryDialogProps) {
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("quotes");
  const [searchTerm, setSearchTerm] = useState("");
  const scrollPositionRef = useRef<number>(0);
  
  const { data: quoteHistory = [], isLoading: quotesLoading, error: quotesError } = useSupplierQuoteHistory(supplierId);
  const { data: orderHistory = [], isLoading: ordersLoading, error: ordersError } = useSupplierOrderHistory(isOpen && activeTab === "orders" ? supplierId : "");

  // Função para gerenciar abertura/fechamento e manter scroll
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      scrollPositionRef.current = window.scrollY;
    } else {
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 100);
    }
    setIsOpen(newOpen);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const quoteStats = quoteHistory.length > 0 ? {
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

  const orderStats = orderHistory.length > 0 ? {
    totalOrders: orderHistory.length,
    totalValue: orderHistory.reduce((sum, order) => sum + order.totalValue, 0),
    avgValue: orderHistory.reduce((sum, order) => sum + order.totalValue, 0) / orderHistory.length,
    lastOrderDate: orderHistory[0]?.orderDate || null,
    deliveredOrders: orderHistory.filter(order => order.status === "entregue" || order.status === "completed").length
  } : {
    totalOrders: 0,
    totalValue: 0,
    avgValue: 0,
    lastOrderDate: null,
    deliveredOrders: 0
  };

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
      const lastQuoteDate = productQuotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date;
      
      return {
        name: productName,
        totalQuoted,
        totalWon,
        winRate: (totalWon / totalQuoted) * 100,
        avgPrice,
        minPrice,
        maxPrice,
        lastQuoteDate
      };
    });
  }, [quoteHistory]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...baseUniqueProducts];

    if (searchTerm.trim()) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [baseUniqueProducts, searchTerm]);

  const uniqueProducts = filteredAndSortedProducts;

  // Conteúdo do modal (reutilizado em mobile e desktop)
  const modalContent = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
      <div className={`${isMobile ? 'px-4 pt-4' : 'px-6 pt-4'} border-b border-gray-200 dark:border-gray-700`}>
        <TabsList className={`grid grid-cols-2 ${isMobile ? 'w-full' : 'w-full sm:w-auto'}`}>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Cotações
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="quotes" className={`flex-1 overflow-auto ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className={`flex flex-col gap-4 ${isMobile ? '' : 'lg:flex-row lg:items-stretch'}`}>
          {!isMobile && (
            <div className="lg:w-72 flex-shrink-0 space-y-4">
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-900/20">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Resumo de Cotações</h4>
                  <div className="space-y-2 text-xs text-blue-900/80 dark:text-blue-100/80">
                    <div className="flex justify-between">
                      <span>Total de cotações</span>
                      <span className="font-semibold">{quoteStats.totalQuotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vitórias</span>
                      <span className="font-semibold">{quoteStats.wonQuotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de vitória</span>
                      <span className="font-semibold">{quoteStats.totalQuotes ? `${quoteStats.winRate.toFixed(1)}%` : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Produtos atendidos</span>
                      <span className="font-semibold">{quoteStats.uniqueProducts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Preço médio</span>
                      <span className="font-semibold">{quoteStats.totalQuotes ? `R$ ${quoteStats.avgPrice.toFixed(2)}` : '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wide block">Filtrar produtos</label>
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
            </div>
          )}

          {/* Mobile: Resumo no topo */}
          {isMobile && (
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-900/20 mb-4">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Resumo de Cotações</h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-blue-900/80 dark:text-blue-100/80">
                <div>
                  <span className="block mb-1">Total</span>
                  <span className="font-semibold text-base">{quoteStats.totalQuotes}</span>
                </div>
                <div>
                  <span className="block mb-1">Vitórias</span>
                  <span className="font-semibold text-base">{quoteStats.wonQuotes}</span>
                </div>
                <div>
                  <span className="block mb-1">Taxa de vitória</span>
                  <span className="font-semibold text-base">{quoteStats.totalQuotes ? `${quoteStats.winRate.toFixed(1)}%` : "-"}</span>
                </div>
                <div>
                  <span className="block mb-1">Preço médio</span>
                  <span className="font-semibold text-base">{quoteStats.totalQuotes ? `R$ ${quoteStats.avgPrice.toFixed(2)}` : '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mobile: Busca no topo */}
          {isMobile && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 text-base"
                />
              </div>
            </div>
          )}

          <div className={`${isMobile ? 'space-y-3' : 'flex-1 space-y-4'}`}>
                {quotesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : quotesError ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-2">Erro ao carregar dados de cotações</div>
                    <div className="text-sm text-gray-500">{quotesError.message}</div>
                  </div>
                ) : filteredAndSortedProducts.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-blue-200 dark:border-blue-900/40 rounded-xl">
                    <Package className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <div className="text-blue-700 dark:text-blue-200 mb-2">
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
                ) : isMobile ? (
                  // Mobile: Cards em vez de tabela
                  <div className="space-y-3">
                    {filteredAndSortedProducts.map((product) => {
                      const productQuotes = quoteHistory.filter(q => q.product === product.name);
                      return productQuotes.map((quote, quoteIndex) => (
                        <div key={`${product.name}-${quoteIndex}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800/60">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900 dark:text-white text-base">{quote.product}</span>
                              <Badge 
                                variant={quote.isWinner ? "default" : "secondary"}
                                className={cn(
                                  "font-medium text-xs",
                                  quote.isWinner 
                                    ? "bg-green-100 text-green-700 border-green-200" 
                                    : "bg-gray-100 text-gray-700 border-gray-200"
                                )}
                              >
                                {quote.isWinner ? "Ganha" : "Não ganha"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>{formatDate(String(quote.date))}</span>
                              <span className="font-semibold text-gray-900 dark:text-white">R$ {quote.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })}
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
        </div>
      </TabsContent>

      <TabsContent value="orders" className={`flex-1 overflow-auto ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className={`flex flex-col gap-4 ${isMobile ? '' : 'lg:flex-row lg:items-stretch'}`}>
          {!isMobile && (
            <div className="lg:w-72 flex-shrink-0 space-y-4">
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                  <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-3">Resumo de Pedidos</h4>
                  <div className="space-y-2 text-xs text-emerald-900/80 dark:text-emerald-100/80">
                    <div className="flex justify-between">
                      <span>Total de pedidos</span>
                      <span className="font-semibold">{orderStats.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pedidos entregues</span>
                      <span className="font-semibold">{orderStats.deliveredOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor total</span>
                      <span className="font-semibold">{orderStats.totalOrders ? `R$ ${orderStats.totalValue.toFixed(2)}` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ticket médio</span>
                      <span className="font-semibold">{orderStats.totalOrders ? `R$ ${orderStats.avgValue.toFixed(2)}` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Último pedido</span>
                      <span className="font-semibold">{orderStats.lastOrderDate ? formatDate(orderStats.lastOrderDate) : '-'}</span>
                    </div>
                  </div>
                </div>
            </div>
          )}

          {/* Mobile: Resumo no topo */}
          {isMobile && (
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-900/20 mb-4">
              <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-3">Resumo de Pedidos</h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-emerald-900/80 dark:text-emerald-100/80">
                <div>
                  <span className="block mb-1">Total</span>
                  <span className="font-semibold text-base">{orderStats.totalOrders}</span>
                </div>
                <div>
                  <span className="block mb-1">Entregues</span>
                  <span className="font-semibold text-base">{orderStats.deliveredOrders}</span>
                </div>
                <div>
                  <span className="block mb-1">Valor total</span>
                  <span className="font-semibold text-base">{orderStats.totalOrders ? `R$ ${orderStats.totalValue.toFixed(2)}` : '-'}</span>
                </div>
                <div>
                  <span className="block mb-1">Ticket médio</span>
                  <span className="font-semibold text-base">{orderStats.totalOrders ? `R$ ${orderStats.avgValue.toFixed(2)}` : '-'}</span>
                </div>
              </div>
            </div>
          )}

          <div className={isMobile ? 'space-y-3' : 'flex-1'}>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-2">Erro ao carregar pedidos</div>
                    <div className="text-sm text-gray-500">{ordersError.message}</div>
                  </div>
                ) : orderHistory.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                    <ClipboardList className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                    <div className="text-emerald-700 dark:text-emerald-200">Nenhum pedido registrado com este fornecedor</div>
                  </div>
                ) : (
                  <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                    {orderHistory.map((order) => (
                      <div key={order.id} className={`border border-gray-200 dark:border-gray-700 rounded-xl ${isMobile ? 'p-3' : 'p-4'} bg-white dark:bg-gray-800/60 ${isMobile ? '' : 'hover:shadow-md transition-shadow'}`}>
                        <div className={`flex flex-col ${isMobile ? '' : 'md:flex-row md:justify-between md:items-start'} gap-4`}>
                          <div className="space-y-2">
                            <div className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-900 dark:text-white`}>
                              <span className={`uppercase ${isMobile ? 'text-xs' : 'text-xs'} tracking-wide text-gray-500 dark:text-gray-400`}>Pedido</span>
                              <span>#{order.id.substring(0, 8)}</span>
                            </div>
                            <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-4 gap-3'} ${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 dark:text-gray-300`}>
                              <div>
                                <p className="font-semibold text-gray-800 dark:text-white">Data do pedido</p>
                                <p>{formatDate(order.orderDate)}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 dark:text-white">Entrega</p>
                                <p>{order.deliveryDate ? formatDate(order.deliveryDate) : "-"}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 dark:text-white">Valor</p>
                                <p>R$ {order.totalValue.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 dark:text-white">Status</p>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "px-2 py-0.5 text-xs font-semibold",
                                    order.status === "entregue" || order.status === "completed"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : order.status === "pendente" || order.status === "processing"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-gray-50 text-gray-700 border-gray-200"
                                  )}
                                >
                                  {order.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {order.observations && (
                          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            Observações: {order.observations}
                          </div>
                        )}

                        {order.items.length > 0 && (
                          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Itens do pedido</p>
                            <div className="space-y-2">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                                  <div className="flex-1 pr-4">
                                    <span className="font-medium text-gray-800 dark:text-white">{item.productName}</span>
                                  </div>
                                  <div className="w-24 text-right">
                                    <span>{item.quantity} un.</span>
                                  </div>
                                  <div className="w-28 text-right">
                                    <span>R$ {item.unitPrice.toFixed(2)}</span>
                                  </div>
                                  <div className="w-32 text-right font-semibold text-gray-800 dark:text-white">
                                    R$ {item.totalPrice.toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  // Mobile: Usar Sheet (bottom sheet)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          {trigger || (
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Ver Histórico
            </button>
          )}
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl pb-8 overflow-hidden flex flex-col p-0 [&>button]:hidden">
          <SheetHeader className="flex-shrink-0 px-4 py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    Histórico do Fornecedor
                  </SheetTitle>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {supplierName}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="h-9 w-9 p-0 flex-shrink-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            {modalContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Usar Dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Ver Histórico
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col [&>button]:hidden">
        <DialogHeader className="flex-shrink-0 border-b border-gray-100 pb-4">
          <DialogTitle className="flex items-center justify-between gap-3 text-xl font-bold text-gray-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span>Histórico do Fornecedor - {supplierName}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col flex-1 overflow-hidden">
          {modalContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}