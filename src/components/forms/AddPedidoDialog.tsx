import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Plus, Trash2, Loader2, ShoppingCart, Package, Building2, Calendar, DollarSign, CheckCircle, ChevronRight, ChevronLeft, Clock, FileText, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useActivityLog } from "@/hooks/useActivityLog";

interface PedidoItem {
  produto: string;
  quantidade: number;
  valorUnitario: number;
  unidade: string;
}

interface AddPedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (pedido: any) => void;
}

export default function AddPedidoDialog({ open, onOpenChange, onAdd }: AddPedidoDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([{ produto: "", quantidade: 1, valorUnitario: 0, unidade: "un" }]);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);
  
  // Tab system states
  const [activeTab, setActiveTab] = useState("produtos");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  useEffect(() => {
    if (open) {
      loadSuppliers();
      loadProducts();
    }
  }, [open]);

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading suppliers:', error);
      return;
    }
    setSuppliers(data || []);
  };

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;
      if (!totalCount || totalCount === 0) {
        setProducts([]);
        return;
      }

      // Load in batches of 1000
      const pageSize = 1000;
      const totalPages = Math.ceil(totalCount / pageSize);
      const allProducts = [];

      console.log(`[ADD PEDIDO] Loading ${totalCount} products in ${totalPages} pages`);

      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: pageData, error: pageError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('name')
          .range(from, to);

        if (pageError) throw pageError;
        if (pageData && pageData.length > 0) {
          allProducts.push(...pageData);
        }
      }

      console.log(`[ADD PEDIDO] Loaded ${allProducts.length} products total`);
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar produtos",
        variant: "destructive",
      });
    }
  };

  // Filter products with debounce
  const filteredProducts = useMemo(() => {
    if (!debouncedProductSearch) return products.slice(0, 50);
    return products.filter(p => 
      p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase())
    );
  }, [products, debouncedProductSearch]);

  const handleAddItem = () => {
    setItens([...itens, { produto: "", quantidade: 1, valorUnitario: 0, unidade: "un" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PedidoItem, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  const calculateTotal = () => {
    return itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);
  };

  // Tab system functions
  const tabs = [
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "fornecedor", label: "Fornecedor", icon: Building2 },
    { id: "detalhes", label: "Detalhes", icon: FileText }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const progress = ((currentTabIndex + 1) / tabs.length) * 100;

  const canProceedToNext = () => {
    switch (activeTab) {
      case "produtos":
        return itens.length > 0 && itens.every(item => item.produto && item.quantidade > 0);
      case "fornecedor":
        return fornecedor && dataEntrega;
      case "detalhes":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  const getTabStatus = (tabId: string) => {
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex < currentTabIndex) return "completed";
    if (tabIndex === currentTabIndex) return "current";
    return "pending";
  };

  const handleAddNewProduct = () => {
    if (!selectedProduct || !newProductQuantity || !newProductUnit || !newProductPrice) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos do produto",
        variant: "destructive",
      });
      return;
    }

    const newItem: PedidoItem = {
      produto: selectedProduct.name,
      quantidade: parseFloat(newProductQuantity),
      valorUnitario: parseFloat(newProductPrice),
      unidade: newProductUnit
    };

    setItens([...itens, newItem]);
    
    // Reset form
    setSelectedProduct(null);
    setNewProductQuantity("");
    setNewProductUnit("");
    setNewProductPrice("");

    toast({
      title: "Produto adicionado",
      description: `${selectedProduct.name} foi adicionado ao pedido`,
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      });
      return;
    }

    if (!fornecedor || !dataEntrega || itens.some(item => !item.produto || item.quantidade <= 0)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const total = calculateTotal();
      const selectedSupplier = suppliers.find(s => s.id === fornecedor);

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          supplier_id: fornecedor,
          supplier_name: selectedSupplier?.name || '',
          total_value: total,
          status: 'pendente',
          delivery_date: dataEntrega,
          observations: observacoes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = itens.map(item => {
        const product = products.find(p => p.name === item.produto);
        return {
          order_id: order.id,
          product_id: product?.id || null,
          product_name: item.produto,
          quantity: item.quantidade,
          unit_price: item.valorUnitario,
          total_price: item.quantidade * item.valorUnitario,
          unit: item.unidade,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Log activity
      await logActivity({
        tipo: "pedido",
        acao: "Pedido criado",
        detalhes: `Pedido para ${selectedSupplier?.name || 'Fornecedor'} no valor de R$ ${total.toFixed(2)}`,
        valor: total
      });

      toast({
        title: "Pedido criado",
        description: "Pedido adicionado com sucesso",
      });

      onAdd(order);

      // Reset form
      setFornecedor("");
      setDataEntrega("");
      setObservacoes("");
      setItens([{ produto: "", quantidade: 1, valorUnitario: 0, unidade: "un" }]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[95vh] sm:max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-lg sm:rounded-xl p-0 flex flex-col">
        <DialogHeader className="relative px-4 sm:px-6 py-3 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 border-b border-pink-100/60 overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-pink-400/10 to-rose-400/10 rounded-full -translate-y-12 -translate-x-12"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-rose-400/10 rounded-full -translate-y-16 translate-x-16"></div>
          
          <div className="relative z-10">
            {/* Compact Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-xl bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 text-white shadow-lg shadow-pink-500/25 ring-2 ring-white/20 flex-shrink-0">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg font-bold bg-gradient-to-r from-pink-900 via-rose-800 to-pink-800 bg-clip-text text-transparent">
                    Novo Pedido
                  </DialogTitle>
                  <p className="text-gray-600/80 text-xs">
                    {Math.round(progress)}% concluído
                  </p>
                </div>

                {/* Navigation Controls - Moved to left side */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {currentTabIndex > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={loading}
                      className="border-gray-300 hover:bg-gray-100 h-8 px-3"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Voltar</span>
                    </Button>
                  )}
                  
                  {currentTabIndex < tabs.length - 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleNext}
                      disabled={!canProceedToNext() || loading}
                      className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg h-8 px-3"
                    >
                      <span className="hidden sm:inline">Próximo</span>
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="sm"
                      disabled={loading}
                      onClick={handleSubmit}
                      className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg h-8 px-3"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                          <span className="hidden sm:inline">Criando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Criar</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Close Button - Isolated on the right */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-gray-600 hover:bg-gray-100 h-8 w-8 p-0 flex-shrink-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Compact Progress Bar */}
            <div className="mt-2">
              <Progress 
                value={progress} 
                className="h-2 bg-pink-100/60 [&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-rose-500"
              />
            </div>
          </div>
        </DialogHeader>

        {/* Compact Tab Navigation */}
        <div className="flex-shrink-0 px-3 sm:px-6 py-2 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/40 to-rose-50/30 backdrop-blur-sm">
          <div className="flex space-x-1 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-pink-200/40">
            {tabs.map((tab) => {
              const status = getTabStatus(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 relative overflow-hidden group
                    ${status === 'current' 
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xl shadow-pink-500/25 scale-105' 
                      : status === 'completed'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-pink-700'
                    }
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  
                  <div className={`
                    flex items-center justify-center w-4 h-4 rounded transition-all
                    ${status === 'current' ? 'bg-white/20' : ''}
                    ${status === 'completed' ? 'bg-white/20' : ''}
                  `}>
                    {status === 'completed' ? (
                      <CheckCircle className="h-3 w-3 text-white" />
                    ) : (
                      <tab.icon className="h-3 w-3" />
                    )}
                  </div>
                  
                  <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area - Now with more space */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              <div className="h-full p-4 sm:p-6">
                {activeTab === 'produtos' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 h-full">
                    {/* Left Column - Add Product Form */}
                    <Card className="border-pink-100 shadow-sm order-1 lg:order-1 h-fit">
                      <div className="p-2 sm:p-3 border-b border-pink-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-pink-500" />
                          Adicionar Produto
                        </h3>
                      </div>
                      <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Produto</Label>
                          <Combobox
                            options={filteredProducts.map(p => ({ value: p.name, label: p.name }))}
                            value={selectedProduct ? selectedProduct.name : ""}
                            onValueChange={(value) => {
                              const product = products.find(p => p.name === value);
                              setSelectedProduct(product || null);
                            }}
                            placeholder="Digite para buscar produtos..."
                            searchPlaceholder={`Buscar entre ${products.length} produtos...`}
                            emptyText="Nenhum produto encontrado"
                            className="w-full border-pink-200 hover:border-pink-300"
                            onSearchChange={setProductSearch}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Quantidade</Label>
                            <Input
                              type="number"
                              value={newProductQuantity}
                              onChange={(e) => setNewProductQuantity(e.target.value)}
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Unidade</Label>
                            <Select value={newProductUnit} onValueChange={setNewProductUnit}>
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Unidade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="un">Unidade (un)</SelectItem>
                                <SelectItem value="kg">Quilograma (kg)</SelectItem>
                                <SelectItem value="pc">Peça (pc)</SelectItem>
                                <SelectItem value="caixa">Caixa</SelectItem>
                                <SelectItem value="litro">Litro (L)</SelectItem>
                                <SelectItem value="metro">Metro (m)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Valor Unitário</Label>
                          <Input
                            type="number"
                            value={newProductPrice}
                            onChange={(e) => setNewProductPrice(e.target.value)}
                            placeholder="0,00"
                            min="0"
                            step="0.01"
                            className="text-sm"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={handleAddNewProduct}
                          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-sm sm:text-base py-2 sm:py-2.5"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar à Lista
                        </Button>
                      </div>
                    </Card>

                    {/* Right Column - Products List */}
                    <Card className="border-pink-100 shadow-sm order-2 lg:order-2 flex flex-col">
                      <div className="p-2 sm:p-3 border-b border-pink-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50 flex-shrink-0">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-pink-500" />
                          Produtos Adicionados ({itens.length})
                        </h3>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto">
                        <div className="p-2 sm:p-3 space-y-2">
                          {itens.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Nenhum produto adicionado</p>
                              <p className="text-xs">Use o formulário ao lado para adicionar produtos</p>
                            </div>
                          ) : (
                            itens.map((item, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-2 bg-gray-50/50">
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className="font-medium text-gray-900 text-xs pr-2 flex-1">
                                    {item.produto || 'Produto não encontrado'}
                                  </h4>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(index)}
                                    className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
                                  <div>
                                    <span className="font-medium">Qtd:</span> 
                                    <span>{item.quantidade} {item.unidade}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Unit:</span> 
                                    <span>R$ {item.valorUnitario.toFixed(2)}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-medium text-pink-600">
                                      R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      {itens.length > 0 && (
                        <div className="p-2 sm:p-3 border-t border-pink-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50 flex-shrink-0">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 text-sm">Total:</span>
                            <span className="text-base font-bold text-pink-600">
                              R$ {calculateTotal().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {activeTab === 'fornecedor' && (
                  <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 h-full">
                    <Card className="border-pink-100 shadow-sm">
                      <div className="p-2 sm:p-3 border-b border-pink-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-pink-500" />
                          Informações do Fornecedor
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          Selecione o fornecedor e defina a data de entrega
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="fornecedor" className="text-xs font-medium text-gray-700">
                            Fornecedor *
                          </Label>
                          <Combobox
                            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                            value={fornecedor}
                            onValueChange={setFornecedor}
                            placeholder="Selecione um fornecedor..."
                            searchPlaceholder="Buscar fornecedor..."
                            emptyText="Nenhum fornecedor encontrado"
                            className="w-full text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="dataEntrega" className="text-xs font-medium text-gray-700">
                            Data de Entrega *
                          </Label>
                          <Input
                            id="dataEntrega"
                            type="date"
                            value={dataEntrega}
                            onChange={(e) => setDataEntrega(e.target.value)}
                            className="w-full text-sm"
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'detalhes' && (
                  <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 h-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      {/* Observações */}
                      <Card className="border-pink-100 shadow-sm">
                        <div className="p-2 sm:p-3 border-b border-pink-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-pink-500" />
                            Observações
                          </h3>
                        </div>
                        <div className="p-2 sm:p-3">
                          <Textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Observações adicionais sobre o pedido..."
                            className="min-h-[80px] sm:min-h-[100px] resize-none border-pink-200 focus:border-pink-300 text-sm"
                          />
                        </div>
                      </Card>

                      {/* Resumo do Pedido */}
                      <Card className="border-pink-100 shadow-sm">
                        <div className="p-2 sm:p-3 border-b border-pink-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-pink-500" />
                            Resumo do Pedido
                          </h3>
                        </div>
                        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                            <div>
                              <span className="text-gray-600">Produtos:</span>
                              <div className="font-medium">{itens.length} itens</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Fornecedor:</span>
                              <div className="font-medium text-xs truncate">
                                {fornecedor ? suppliers.find(s => s.id === fornecedor)?.name : 'Não selecionado'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Data de Entrega:</span>
                              <div className="font-medium">
                                {dataEntrega ? new Date(dataEntrega).toLocaleDateString('pt-BR') : 'Não definida'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Valor Total:</span>
                              <div className="font-bold text-pink-600 text-sm sm:text-base">
                                R$ {calculateTotal().toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          {itens.length > 0 && (
                            <div className="border-t border-gray-200 pt-2 sm:pt-3">
                              <h4 className="font-medium text-gray-900 mb-1 text-xs">Produtos Selecionados:</h4>
                              <div className="h-20 sm:h-24 overflow-y-auto">
                                <div className="space-y-1">
                                  {itens.map((item, index) => (
                                    <div key={index} className="text-xs text-gray-600 flex justify-between gap-2">
                                      <span className="truncate flex-1">{item.produto}</span>
                                      <span className="flex-shrink-0">{item.quantidade} {item.unidade}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-t border-pink-100/60 bg-gradient-to-r from-pink-50/30 to-rose-50/30 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 sm:gap-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              {loading ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Criando pedido...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  <span>Etapa {currentTabIndex + 1} de {tabs.length}</span>
                </>
              )}
            </div>
            
            <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center sm:justify-end">
              {currentTabIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                  className="border-pink-200 hover:bg-pink-50 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden xs:inline">Anterior</span>
                  <span className="xs:hidden">Ant.</span>
                </Button>
              )}
              
              {currentTabIndex < tabs.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedToNext() || loading}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none"
                >
                  <span className="hidden xs:inline">Próximo</span>
                  <span className="xs:hidden">Prox.</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !fornecedor || !dataEntrega || itens.some(item => !item.produto || item.quantidade <= 0)}
                  className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none"
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="hidden xs:inline">Criando...</span>
                      <span className="xs:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden xs:inline">Criar Pedido</span>
                      <span className="xs:hidden">Criar</span>
                    </>
                  )}
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="border-gray-300 hover:bg-gray-50 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none"
              >
                <span className="hidden xs:inline">Cancelar</span>
                <span className="xs:hidden">Cancel.</span>
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
