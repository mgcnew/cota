import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Package, Award, Search, DollarSign, ClipboardList, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupplierQuoteHistory } from "@/hooks/useSupplierQuoteHistory";
import { useSupplierOrderHistory } from "@/hooks/useSupplierOrderHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { designSystem } from "@/styles/design-system";
import { capitalize } from "@/lib/text-utils";

interface SupplierQuoteHistoryDialogProps {
  supplierName: string;
  supplierId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SupplierQuoteHistoryDialog({ supplierName, supplierId, trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: SupplierQuoteHistoryDialogProps) {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("quotes");
  const [searchTerm, setSearchTerm] = useState("");
  const scrollPositionRef = useRef<number>(0);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

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

    if (isControlled && controlledOnOpenChange) {
      controlledOnOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
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

  // Calculate price trend for each order (compare with previous order)
  const ordersWithTrend = useMemo(() => {
    if (orderHistory.length === 0) return [];

    // Orders are already sorted by date descending
    return orderHistory.map((order, index) => {
      const previousOrder = orderHistory[index + 1]; // Next in array = previous in time
      let trend: 'up' | 'down' | 'same' | null = null;
      let trendPercent: number | null = null;

      if (previousOrder && previousOrder.totalValue > 0) {
        const diff = order.totalValue - previousOrder.totalValue;
        trendPercent = (diff / previousOrder.totalValue) * 100;

        if (Math.abs(trendPercent) < 1) {
          trend = 'same';
        } else if (diff > 0) {
          trend = 'up';
        } else {
          trend = 'down';
        }
      }

      return { ...order, trend, trendPercent };
    });
  }, [orderHistory]);

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
      <div className={cn("px-4 sm:px-6 py-2 border-b", designSystem.colors.border.subtle)}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger
            value="quotes"
            className="data-[state=active]:text-primary"
          >
            <Package className="h-3.5 w-3.5 mr-1.5" />
            Cotações
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="data-[state=active]:text-primary"
          >
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
            Pedidos
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="quotes" className="flex-1 overflow-auto custom-scrollbar m-0">
        <div className={cn("p-4 sm:p-6 space-y-6", designSystem.colors.surface.page)}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Resumo Sidebar */}
            <div className="lg:w-72 flex-shrink-0 space-y-6">
              <div className={cn(designSystem.components.card.flat, "p-4 space-y-4")}>
                <h4 className={cn(designSystem.typography.size.xs, designSystem.typography.weight.bold, "uppercase tracking-wider flex items-center gap-2", designSystem.colors.text.muted)}>
                  <span className="w-1 h-4 bg-primary/20 rounded-full"></span>
                  Resumo de Cotações
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className={designSystem.colors.text.secondary}>Total</span>
                    <span className={cn("font-bold", designSystem.colors.text.primary)}>{quoteStats.totalQuotes}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={designSystem.colors.text.secondary}>Vitórias</span>
                    <span className="font-bold text-emerald-500">{quoteStats.wonQuotes}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={designSystem.colors.text.secondary}>Taxa de vitória</span>
                    <span className={cn("font-bold", designSystem.colors.text.primary)}>{quoteStats.totalQuotes ? `${quoteStats.winRate.toFixed(1)}%` : "-"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={designSystem.colors.text.secondary}>Preço médio</span>
                    <span className={cn("font-bold", designSystem.colors.text.primary)}>{quoteStats.totalQuotes ? `R$ ${quoteStats.avgPrice.toFixed(2)}` : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className={cn(designSystem.typography.size.xs, designSystem.typography.weight.semibold, designSystem.colors.text.muted)}>Filtrar produtos</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={designSystem.components.input.root + " pl-10 h-10"}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {quotesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : uniqueProducts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className={designSystem.colors.text.secondary}>
                    {baseUniqueProducts.length === 0 ? "Nenhum produto cotado" : "Nenhum produto encontrado"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uniqueProducts.map((product) => {
                    const productQuotes = quoteHistory.filter(q => q.product === product.name);
                    return productQuotes.map((quote, quoteIndex) => (
                      <div
                        key={`${product.name}-${quoteIndex}`}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md",
                          designSystem.colors.surface.card,
                          designSystem.colors.border.subtle
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className={cn("font-bold text-sm truncate", designSystem.colors.text.primary)}>{quote.product}</h5>
                          <p className={cn("text-xs", designSystem.colors.text.secondary)}>{formatDate(String(quote.date))}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-primary">R$ {quote.price.toFixed(2)}</p>
                          <Badge
                            variant={quote.isWinner ? "success" : "secondary"}
                            className="mt-1"
                          >
                            {quote.isWinner ? "Venceu" : "Não venceu"}
                          </Badge>
                        </div>
                      </div>
                    ));
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="orders" className="flex-1 overflow-auto custom-scrollbar m-0">
        <div className={cn("p-4 sm:p-6 space-y-6", designSystem.colors.surface.page)}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Resumo Sidebar */}
            <div className="lg:w-72 flex-shrink-0 space-y-6">
              <div className={cn(designSystem.components.card.flat, "p-4 space-y-4")}>
                <h4 className={cn(designSystem.typography.size.xs, designSystem.typography.weight.bold, "uppercase tracking-wider flex items-center gap-2", designSystem.colors.text.muted)}>
                  <span className="w-1 h-4 bg-primary/20 rounded-full"></span>
                  Resumo de Pedidos
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className={designSystem.colors.text.secondary}>Total de pedidos</span>
                    <span className={cn("font-bold", designSystem.colors.text.primary)}>{orderStats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={designSystem.colors.text.secondary}>Valor total</span>
                    <span className={cn("font-bold text-emerald-500")}>R$ {orderStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={designSystem.colors.text.secondary}>Último pedido</span>
                    <span className={cn("font-bold", designSystem.colors.text.primary)}>{orderStats.lastOrderDate ? formatDate(orderStats.lastOrderDate) : '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className={designSystem.colors.text.secondary}>Nenhum pedido registrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ordersWithTrend.map((order) => (
                    <div key={order.id} className={cn("border rounded-2xl overflow-hidden", designSystem.colors.border.subtle, designSystem.colors.surface.card)}>
                      <div className="p-4 sm:p-5 border-b border-border/50 bg-muted/20">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-foreground/5", designSystem.colors.text.muted)}>Pedido</span>
                              <span className={cn("font-mono text-sm font-bold", designSystem.colors.text.primary)}>#{order.id.substring(0, 8)}</span>
                            </div>
                            <p className={cn("text-xs", designSystem.colors.text.secondary)}>{formatDate(order.orderDate)}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">Valor Total</p>
                              <p className="font-bold text-primary">R$ {order.totalValue.toFixed(2)}</p>
                            </div>
                            <Badge variant={order.status === "entregue" || order.status === "completed" ? "success" : "warning"}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {order.items.length > 0 && (
                        <div className="p-4 sm:p-5 bg-background/30">
                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                                <div className="flex-1 min-w-0">
                                  <p className={cn("font-medium truncate", designSystem.colors.text.primary)}>{item.productName}</p>
                                  <p className={cn("text-xs", designSystem.colors.text.secondary)}>{item.quantity} un. x R$ {item.unitPrice.toFixed(2)}</p>
                                </div>
                                <p className={cn("font-bold", designSystem.colors.text.primary)}>R$ {item.totalPrice.toFixed(2)}</p>
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
        </div>
      </TabsContent>
    </Tabs>
  );

  // Mobile: Usar Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        {(!isControlled || trigger) && (
          <DrawerTrigger asChild>
            {trigger}
          </DrawerTrigger>
        )}
        <DrawerContent className={cn("h-[90vh] flex flex-col p-0 gap-0 overflow-hidden")}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg border", designSystem.colors.surface.card, designSystem.colors.border.subtle)}>
                <Package className={cn("h-4 w-4", designSystem.colors.text.primary)} />
              </div>
              <div className="flex-1 min-w-0">
                <DrawerTitle className={cn(designSystem.typography.size.base, designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
                  Histórico do Fornecedor
                </DrawerTitle>
                <p className={cn("text-xs truncate", designSystem.colors.text.secondary)}>
                  {supplierName}
                </p>
              </div>
            </div>
          </div>
        <div className="flex flex-col flex-1 overflow-hidden bg-background">
            {modalContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Usar Dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {(!isControlled || trigger) && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className={cn(designSystem.components.modal.content, "max-w-3xl h-[85vh] p-0 flex flex-col overflow-hidden")}>
        <div className={designSystem.components.modal.header}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg border", designSystem.colors.surface.card, designSystem.colors.border.subtle)}>
              <Package className={cn("h-4 w-4", designSystem.colors.text.primary)} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className={cn(designSystem.typography.size.lg, designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
                Histórico do Fornecedor
              </DialogTitle>
              <p className={cn("text-xs truncate", designSystem.colors.text.secondary)}>
                {supplierName}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {modalContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}