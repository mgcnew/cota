import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMobile } from "@/contexts/MobileProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Plus, Trash2, Loader2, ShoppingCart, Package, Building2, Calendar, DollarSign, CheckCircle, ChevronRight, ChevronLeft, Clock, FileText, ChevronDown, Copy, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useActivityLog } from "@/hooks/useActivityLog";
import { parseDecimalInput, formatDecimalDisplay } from "@/lib/text-utils";
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
export default function AddPedidoDialog({
  open,
  onOpenChange,
  onAdd
}: AddPedidoDialogProps) {
  const isMobile = useMobile();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const {
    logActivity
  } = useActivityLog();
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const debouncedSupplierSearch = useDebounce(supplierSearch, 300);

  // Tab system states
  const [activeTab, setActiveTab] = useState("produtos");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  
  // Novos estados para melhorias
  const [lastUsedPrices, setLastUsedPrices] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (open) {
      loadSuppliers();
      loadProducts();
      loadLastPrices();
      // Resetar formulário ao abrir
      setActiveTab("produtos");
      setItens([]);
      setFornecedor("");
      setDataEntrega("");
      setObservacoes("");
      setSelectedProduct(null);
      setNewProductQuantity("");
      setNewProductUnit("");
      setNewProductPrice("");
      setProductSearch("");
      setErrors({});
      
      // Focar no campo de busca após um pequeno delay
      setTimeout(() => {
        const searchInput = document.querySelector('[placeholder*="buscar produtos"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 300);
    }
  }, [open]);

  // Prevenir scroll flash durante mudança de tab
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'Enter':
            e.preventDefault();
            if (currentTabIndex < tabs.length - 1) {
              if (canProceedToNext()) handleNext();
            } else {
              handleSubmit();
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (canProceedToNext()) handleNext();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            handlePrevious();
            break;
        }
      }
    };
    
    if (open) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [open, activeTab, fornecedor, dataEntrega, itens]);

  const loadSuppliers = async () => {
    const {
      data,
      error
    } = await supabase.from('suppliers').select('id, name, contact').order('name');
    if (error) {
      console.error('Error loading suppliers:', error);
      return;
    }
    setSuppliers(data || []);
  };

  const loadLastPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('product_id, unit_price')
        .limit(100);
      
      if (error) {
        console.error('Error loading last prices:', error);
        return;
      }
      
      if (data) {
        const pricesMap: Record<string, number> = {};
        data.forEach((item: any) => {
          if (!pricesMap[item.product_id]) {
            pricesMap[item.product_id] = item.unit_price;
          }
        });
        setLastUsedPrices(pricesMap);
      }
    } catch (error) {
      console.error('Error loading last prices:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Get total count
      const {
        count: totalCount,
        error: countError
      } = await supabase.from('products').select('*', {
        count: 'exact',
        head: true
      });
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
        const {
          data: pageData,
          error: pageError
        } = await supabase.from('products').select('*').order('name').range(from, to);
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
        variant: "destructive"
      });
    }
  };

  // Filter products with debounce - só mostra ao digitar
  const filteredProducts = useMemo(() => {
    if (!debouncedProductSearch) return []; // Não mostra nada até começar a digitar
    return products.filter(p => p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase()));
  }, [products, debouncedProductSearch]);
  const handleAddItem = () => {
    setItens([...itens, {
      produto: "",
      quantidade: 1,
      valorUnitario: 0,
      unidade: "un"
    }]);
  };
  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleDuplicateItem = (index: number) => {
    const itemToDuplicate = { ...itens[index] };
    setItens([...itens, itemToDuplicate]);
    toast({
      title: "Produto duplicado",
      description: "Produto adicionado à lista"
    });
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    
    // Auto-preencher preço se disponível
    if (lastUsedPrices[product.id]) {
      setNewProductPrice(lastUsedPrices[product.id].toString());
    }
    
    // Auto-preencher unidade padrão se não estiver definida
    if (!newProductUnit) {
      setNewProductUnit('un');
    }
  };
  const handleItemChange = (index: number, field: keyof PedidoItem, value: any) => {
    const newItens = [...itens];
    newItens[index] = {
      ...newItens[index],
      [field]: value
    };
    setItens(newItens);
  };
  const calculateTotal = () => {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);
  };

  // Tab system functions
  const tabs = [{
    id: "produtos",
    label: "Produtos",
    icon: Package
  }, {
    id: "fornecedor",
    label: "Fornecedor",
    icon: Building2
  }, {
    id: "detalhes",
    label: "Detalhes",
    icon: FileText
  }];
  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const progress = (currentTabIndex + 1) / tabs.length * 100;
  const canProceedToNext = () => {
    switch (activeTab) {
      case "produtos":
        // Permite avançar se tiver pelo menos 1 produto válido
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
  const validateProduct = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedProduct) {
      newErrors.product = "Selecione um produto";
    }
    if (!newProductQuantity || parseFloat(newProductQuantity) <= 0) {
      newErrors.quantity = "Quantidade deve ser maior que 0";
    }
    if (!newProductUnit) {
      newErrors.unit = "Selecione uma unidade";
    }
    if (!newProductPrice || parseFloat(newProductPrice) <= 0) {
      newErrors.price = "Preço deve ser maior que 0";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddNewProduct = () => {
    if (!validateProduct()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos corretamente",
        variant: "destructive"
      });
      return;
    }
    
    const quantidade = parseDecimalInput(newProductQuantity);
    if (!quantidade || quantidade <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade deve ser um número válido maior que zero",
        variant: "destructive"
      });
      return;
    }
    
    const productName = selectedProduct.name;
    const productId = selectedProduct.id;
    const productPrice = parseFloat(newProductPrice.replace(',', '.'));
    
    const newItem: PedidoItem = {
      produto: productName,
      quantidade: quantidade,
      valorUnitario: productPrice,
      unidade: newProductUnit
    };
    setItens([...itens, newItem]);

    // Salvar último preço usado
    setLastUsedPrices({
      ...lastUsedPrices,
      [productId]: productPrice
    });

    // Reset form e focar no campo de busca
    setSelectedProduct(null);
    setNewProductQuantity("");
    setNewProductUnit("");
    setNewProductPrice("");
    setProductSearch("");
    setErrors({});
    
    // Focar no campo de busca após adicionar
    setTimeout(() => {
      const searchInput = document.querySelector('[placeholder*="buscar produtos"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
    
    toast({
      title: "✅ Produto adicionado",
      description: `${productName} foi adicionado ao pedido`,
      duration: 2000
    });
  };
  const handleSubmit = async (keepOpen = false) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive"
      });
      return;
    }
    if (!fornecedor || !dataEntrega || itens.some(item => !item.produto || item.quantidade <= 0)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const total = calculateTotal();
      const selectedSupplier = suppliers.find(s => s.id === fornecedor);

      // Get company_id
      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) {
        throw new Error("Empresa não encontrada");
      }

      // Insert order
      const {
        data: order,
        error: orderError
      } = await supabase.from('orders').insert({
        company_id: companyData.company_id,
        supplier_id: fornecedor,
        supplier_name: selectedSupplier?.name || '',
        total_value: total,
        status: 'pendente',
        delivery_date: dataEntrega,
        observations: observacoes
      }).select().single();
      if (orderError) throw orderError;

      // Insert order items
      const orderItems = itens.map(item => {
        const product = products.find(p => p.name === item.produto);
        // Garantir que quantidade é number
        const quantidade = typeof item.quantidade === 'string' 
          ? parseDecimalInput(item.quantidade) || 0
          : item.quantidade;
        
        return {
          order_id: order.id,
          product_id: product?.id || null,
          product_name: item.produto,
          quantity: quantidade,
          unit_price: item.valorUnitario,
          total_price: quantidade * item.valorUnitario,
          unit: item.unidade
        };
      });
      const {
        error: itemsError
      } = await supabase.from('order_items').insert(orderItems);
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
        description: keepOpen
          ? "Pedido adicionado! Crie outro pedido."
          : "Pedido adicionado com sucesso"
      });
      onAdd(order);

      // Reset form
      setFornecedor("");
      setDataEntrega("");
      setObservacoes("");
      setItens([]);
      setActiveTab("produtos");
      
      if (!keepOpen) {
        onOpenChange(false);
      } else {
        // Focar no campo de busca de produto
        setTimeout(() => {
          const searchInput = document.querySelector<HTMLInputElement>('.product-search');
          if (searchInput) searchInput.focus();
        }, 100);
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pedido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  // Conteúdo do modal (reutilizado em mobile e desktop)
  const modalContent = (
    <>
      <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-4' : 'px-4 sm:px-5 py-3 sm:py-4'} border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`${isMobile ? 'w-10 h-10' : 'w-9 h-9'} rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0`}>
              <ShoppingCart className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`${isMobile ? 'text-lg' : 'text-base sm:text-lg'} font-semibold text-gray-900 dark:text-white truncate`}>
                Novo Pedido
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                Etapa {currentTabIndex + 1}/{tabs.length}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className={`${isMobile ? 'h-9 w-9' : 'h-8 w-8'} p-0 flex-shrink-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
          >
            <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
          </Button>
        </div>
      </div>

      {/* Tab Navigation com Barra de Progresso */}
      <div className={`flex-shrink-0 ${isMobile ? 'px-3 py-2' : 'px-3 sm:px-4 py-2'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 overflow-x-hidden`}>
        {/* Barra de Progresso */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 dark:text-gray-400`}>
              Progresso: {Math.round(progress)}%
            </span>
            <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>
              {currentTabIndex + 1} de {tabs.length} etapas
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
            />
          </div>
        </div>
        
        <div className="flex space-x-1 bg-white dark:bg-gray-900 rounded-md p-0.5 border border-gray-200 dark:border-gray-700 min-w-0">
          {tabs.map(tab => {
            const status = getTabStatus(tab.id);
            return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`
                    flex-1 flex items-center justify-center gap-1 ${isMobile ? 'px-3 py-2' : 'px-2 py-1.5'} rounded ${isMobile ? 'text-sm' : 'text-xs'} font-medium transition-all duration-200
                    ${status === 'current' 
                      ? 'bg-pink-600 dark:bg-pink-500 text-white shadow-sm' 
                      : status === 'completed' 
                      ? 'bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700' 
                      : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                  `}>
                    {status === 'completed' ? <CheckCircle className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} /> : <tab.icon className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />}
                  <span className={isMobile ? 'inline' : 'hidden sm:inline'}>{tab.label}</span>
                </button>;
          })}
        </div>
      </div>

      {/* Content Area */}
      <div 
        className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden"
        style={{ 
          scrollbarGutter: 'stable',
          ...(isTransitioning && { overflowY: 'hidden' })
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-full w-full min-w-0"
            style={{ willChange: 'opacity' }}
          >
            <div className={`${isMobile ? 'p-4' : 'p-3 sm:p-4'} pb-4 max-w-full overflow-x-hidden`}>
              {activeTab === 'produtos' && <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-3 lg:gap-4'} max-w-full`}>
                  {/* Left Column - Add Product Form */}
                    <Card className={`border-gray-200 dark:border-gray-700 shadow-sm order-1 lg:order-1 h-fit dark:bg-gray-800 min-w-0 ${isMobile ? 'p-4' : 'p-2 sm:p-3'}`}>
                      <div className={`${isMobile ? 'p-3 mb-3' : 'p-2 sm:p-3'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800`}>
                        <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-foreground flex items-center gap-2`}>
                          <Package className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-pink-500 dark:text-pink-400`} />
                          Adicionar Produto
                        </h3>
                      </div>
                      <div className={`${isMobile ? 'space-y-4' : 'space-y-2 sm:space-y-3'} pb-3 sm:pb-4 min-w-0`}>
                        <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                          <Label className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-foreground`}>Produto *</Label>
                          <div className="min-w-0">
                            <Combobox options={filteredProducts.map(p => ({
                        value: p.name,
                        label: p.name
                      }))} value={selectedProduct ? selectedProduct.name : ""} onValueChange={value => {
                        const product = products.find(p => p.name === value);
                        if (product) handleProductSelect(product);
                      }} placeholder="Digite para buscar produtos..." searchPlaceholder={`Buscar entre ${products.length} produtos...`} emptyText={debouncedProductSearch ? "Nenhum produto encontrado" : "Digite para ver produtos..."} className={`w-full min-w-0 ${isMobile ? 'h-11 text-base' : ''}`} onSearchChange={setProductSearch} />
                          </div>
                          {errors.product && (
                            <p className="text-xs text-red-500 dark:text-red-400">{errors.product}</p>
                          )}
                        </div>

                        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'sm:grid-cols-2 gap-3'} min-w-0`}>
                          <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                            <Label className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-foreground`}>Quantidade *</Label>
                            <Input 
                              type="text" 
                              value={newProductQuantity} 
                              onChange={e => {
                                const value = e.target.value;
                                // Permitir apenas números, vírgula e ponto
                                if (/^\d*[,.]?\d*$/.test(value) || value === '') {
                                  setNewProductQuantity(value);
                                  if (errors.quantity) setErrors({...errors, quantity: ""});
                                }
                              }} 
                              placeholder="Ex: 98,5 ou 100" 
                              className={`${isMobile ? 'h-11 text-base' : 'text-sm'} ${errors.quantity ? 'border-red-500 dark:border-red-400' : ''}`} 
                            />
                            {errors.quantity && (
                              <p className="text-xs text-red-500 dark:text-red-400">{errors.quantity}</p>
                            )}
                          </div>
                          <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                            <Label className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-foreground`}>Unidade *</Label>
                            <div className="min-w-0">
                              <Select value={newProductUnit} onValueChange={value => {
                                setNewProductUnit(value);
                                if (errors.unit) setErrors({...errors, unit: ""});
                              }}>
                                <SelectTrigger className={`${isMobile ? 'h-11 text-base' : 'text-sm'} w-full min-w-0 ${errors.unit ? 'border-red-500 dark:border-red-400' : ''}`}>
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
                            {errors.unit && (
                              <p className="text-xs text-red-500 dark:text-red-400">{errors.unit}</p>
                            )}
                          </div>
                        </div>

                        <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                          <Label className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-foreground`}>Valor Unitário *</Label>
                          <Input 
                            type="number" 
                            value={newProductPrice} 
                            onChange={e => {
                              setNewProductPrice(e.target.value);
                              if (errors.price) setErrors({...errors, price: ""});
                            }} 
                            placeholder="0,00"
                            min="0" 
                            step="0.01" 
                            className={`${isMobile ? 'h-11 text-base' : 'text-sm'} w-full min-w-0 ${errors.price ? 'border-red-500 dark:border-red-400' : ''}`} 
                          />
                          {errors.price && (
                            <p className="text-xs text-red-500 dark:text-red-400">{errors.price}</p>
                          )}
                          {selectedProduct && lastUsedPrices[selectedProduct.id] && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Último preço: R$ {lastUsedPrices[selectedProduct.id].toFixed(2)}
                            </p>
                          )}
                        </div>

                        <Button 
                          type="button" 
                          onClick={handleAddNewProduct}
                          disabled={!selectedProduct || !newProductQuantity || !newProductPrice || !newProductUnit}
                          className={`w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed ${isMobile ? 'h-11 text-base' : 'text-sm sm:text-base py-2 sm:py-2.5'} transition-all duration-200 shadow-md hover:shadow-lg`}
                        >
                          <Plus className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                          Adicionar à Lista
                        </Button>
                      </div>
                    </Card>

                    {/* Right Column - Products List */}
                    <Card className={`border-gray-200 dark:border-gray-700 shadow-sm order-2 lg:order-2 flex flex-col dark:bg-gray-800 min-w-0 ${isMobile ? 'p-4' : 'p-2 sm:p-3'}`}>
                      <div className={`${isMobile ? 'p-3 mb-3' : 'p-2 sm:p-3'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 flex-shrink-0`}>
                        <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-foreground flex items-center gap-2`}>
                          <Package className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-pink-500 dark:text-pink-400`} />
                          Produtos Adicionados ({itens.length})
                        </h3>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto">
                        <div className={`${isMobile ? 'p-3 space-y-3' : 'p-2 sm:p-3 space-y-2'}`}>
                          {itens.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                                <Package className="h-8 w-8 text-pink-500 dark:text-pink-400 opacity-60" />
                              </div>
                              <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium mb-1`}>Nenhum produto adicionado</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Use o formulário ao lado para adicionar produtos ao pedido</p>
                            </div> : itens.map((item, index) => <motion.div 
                              key={index} 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              className={`border border-border rounded-lg ${isMobile ? 'p-3' : 'p-2'} bg-muted/50 hover:bg-muted/70 transition-colors`}
                            >
                                <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-1'} gap-2 min-w-0`}>
                                  <h4 className={`font-medium text-foreground ${isMobile ? 'text-sm' : 'text-xs'} flex-1 truncate min-w-0`}>
                                    {item.produto || 'Produto não encontrado'}
                                  </h4>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDuplicateItem(index)} 
                                      className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} p-0 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50`}
                                      title="Duplicar produto"
                                    >
                                      <Copy className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                                    </Button>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleRemoveItem(index)} 
                                      className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50`}
                                      title="Remover produto"
                                    >
                                      <Trash2 className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                                    </Button>
                                  </div>
                                </div>
                                <div className={`grid grid-cols-3 ${isMobile ? 'gap-2 text-sm' : 'gap-1 sm:gap-2 text-xs'} text-muted-foreground min-w-0`}>
                                  <div className="min-w-0 truncate">
                                    <span className="font-medium">Qtd: </span> 
                                    <span className="truncate">{formatDecimalDisplay(item.quantidade)} {item.unidade}</span>
                                  </div>
                                  <div className="min-w-0 truncate">
                                    <span className="font-medium">Unit: </span> 
                                    <span className="truncate">R$ {item.valorUnitario.toFixed(2)}</span>
                                  </div>
                                  <div className="text-right min-w-0 truncate">
                                    <span className={`font-medium text-pink-600 dark:text-pink-400 truncate ${isMobile ? 'text-base' : ''}`}>
                                      R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>)}
                        </div>
                      </div>
                      {itens.length > 0 && <div className={`${isMobile ? 'p-3' : 'p-2 sm:p-3'} border-t-2 border-pink-200 dark:border-pink-800 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 flex-shrink-0`}>
                          <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className={`font-semibold text-foreground ${isMobile ? 'text-base' : 'text-sm'}`}>
                                Total do Pedido
                              </span>
                              <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 dark:text-gray-400`}>
                                {itens.length} {itens.length === 1 ? 'produto' : 'produtos'}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`${isMobile ? 'text-xl' : 'text-lg'} font-bold text-pink-600 dark:text-pink-400`}>
                                R$ {calculateTotal().toFixed(2)}
                              </span>
                              <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 dark:text-gray-400`}>
                                Média: R$ {(calculateTotal() / itens.length).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>}
                    </Card>
                  </div>}

              {activeTab === 'fornecedor' && <div className={`max-w-2xl mx-auto w-full ${isMobile ? 'space-y-4' : 'space-y-3 sm:space-y-4'}`}>
                  <Card className={`border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 min-w-0 ${isMobile ? 'p-4' : 'p-2 sm:p-3'}`}>
                    <div className={`${isMobile ? 'p-3 mb-3' : 'p-2 sm:p-3'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800`}>
                      <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-900 dark:text-white flex items-center gap-2`}>
                        <Building2 className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-pink-500`} />
                        Informações do Fornecedor
                      </h3>
                      <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 dark:text-gray-400 mt-1`}>
                        Selecione o fornecedor e defina a data de entrega
                      </p>
                    </div>
                    <div className={`${isMobile ? 'p-4 space-y-4' : 'p-3 sm:p-4 space-y-3 sm:space-y-4'} min-w-0`}>
                      <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                        <Label htmlFor="fornecedor" className={`${isMobile ? 'text-base' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>
                          Fornecedor *
                        </Label>
                        <div className="min-w-0">
                          <Combobox 
                            options={suppliers
                              .filter(s => 
                                !debouncedSupplierSearch || 
                                s.name.toLowerCase().includes(debouncedSupplierSearch.toLowerCase()) ||
                                (s.contact && s.contact.toLowerCase().includes(debouncedSupplierSearch.toLowerCase()))
                              )
                              .map(s => ({
                                value: s.id,
                                label: s.contact ? `${s.name} (${s.contact})` : s.name
                              }))} 
                            value={fornecedor} 
                            onValueChange={setFornecedor} 
                            placeholder="Selecione um fornecedor..." 
                            searchPlaceholder="Buscar por nome ou vendedor..." 
                            emptyText="Nenhum fornecedor encontrado" 
                            className={`w-full ${isMobile ? 'h-11 text-base' : 'text-sm'} min-w-0`}
                            onSearchChange={setSupplierSearch}
                          />
                        </div>
                      </div>
                      
                      <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                        <Label htmlFor="dataEntrega" className={`${isMobile ? 'text-base' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>
                          Data de Entrega *
                        </Label>
                        <Input id="dataEntrega" type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} className={`w-full ${isMobile ? 'h-11 text-base' : 'text-sm'} min-w-0`} />
                      </div>
                    </div>
                  </Card>
                </div>}

              {activeTab === 'detalhes' && <div className={`max-w-4xl mx-auto w-full ${isMobile ? 'space-y-4' : 'space-y-3 sm:space-y-4'}`}>
                  <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-3 sm:gap-4'} w-full max-w-full`}>
                    {/* Observações */}
                    <Card className={`border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 min-w-0 ${isMobile ? 'p-4' : 'p-2 sm:p-3'}`}>
                      <div className={`${isMobile ? 'p-3 mb-3' : 'p-2 sm:p-3'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800`}>
                        <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-900 dark:text-white flex items-center gap-2`}>
                          <FileText className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-pink-500 dark:text-pink-400`} />
                          Observações
                        </h3>
                      </div>
                      <div className={`${isMobile ? 'p-3' : 'p-2 sm:p-3'} min-w-0`}>
                        <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações adicionais sobre o pedido..." className={`${isMobile ? 'min-h-[120px] text-base' : 'min-h-[80px] sm:min-h-[100px] text-sm'} resize-none w-full min-w-0 dark:bg-gray-900 dark:border-gray-600 dark:text-white`} />
                      </div>
                    </Card>

                    {/* Resumo do Pedido */}
                    <Card className={`border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 min-w-0 ${isMobile ? 'p-4' : 'p-2 sm:p-3'}`}>
                      <div className={`${isMobile ? 'p-3 mb-3' : 'p-2 sm:p-3'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800`}>
                        <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-900 dark:text-white flex items-center gap-2`}>
                          <Clock className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-pink-500 dark:text-pink-400`} />
                          Resumo do Pedido
                        </h3>
                      </div>
                      <div className={`${isMobile ? 'p-3 space-y-3' : 'p-2 sm:p-3 space-y-2 sm:space-y-3'}`}>
                                                          <div className={`grid grid-cols-1 ${isMobile ? 'sm:grid-cols-2 gap-3' : 'sm:grid-cols-2 gap-2 sm:gap-3'} ${isMobile ? 'text-sm' : 'text-xs'} min-w-0`}>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Produtos:</span>
                              <div className={`font-medium dark:text-gray-200 ${isMobile ? 'text-base' : ''}`}>{itens.length} itens</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Fornecedor:</span>
                              <div className={`font-medium ${isMobile ? 'text-sm' : 'text-xs'} truncate dark:text-gray-200`}>
                                {fornecedor ? suppliers.find(s => s.id === fornecedor)?.name : 'Não selecionado'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Data de Entrega:</span>
                              <div className={`font-medium dark:text-gray-200 ${isMobile ? 'text-base' : ''}`}>
                                {dataEntrega ? new Date(dataEntrega).toLocaleDateString('pt-BR') : 'Não definida'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Valor Total:</span>
                              <div className={`font-bold text-pink-600 ${isMobile ? 'text-lg' : 'text-sm sm:text-base'}`}>
                                R$ {calculateTotal().toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          {itens.length > 0 && <div className={`border-t border-gray-200 dark:border-gray-700 ${isMobile ? 'pt-3' : 'pt-2 sm:pt-3'}`}>
                              <h4 className={`font-medium text-gray-900 dark:text-white ${isMobile ? 'mb-2' : 'mb-1'} ${isMobile ? 'text-sm' : 'text-xs'}`}>Produtos Selecionados:</h4>
                              <div className={`${isMobile ? 'h-24' : 'h-20 sm:h-24'} overflow-y-auto`}>
                                <div className={isMobile ? 'space-y-2' : 'space-y-1'}>
                                  {itens.map((item, index) => <div key={index} className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 dark:text-gray-400 flex justify-between gap-2`}>
                                      <span className="truncate flex-1">{item.produto}</span>
                                      <span className="flex-shrink-0">{formatDecimalDisplay(item.quantidade)} {item.unidade}</span>
                                    </div>)}
                                </div>
                              </div>
                            </div>}
                      </div>
                    </Card>
                  </div>
                </div>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-3' : 'px-3 sm:px-4 py-2'} border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800`}>
        <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between w-full gap-2'}`}>
          <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
            {currentTabIndex > 0 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrevious} 
                disabled={loading}
                className={`${isMobile ? 'flex-1 h-11 text-base' : ''} dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700`}
              >
                <ChevronLeft className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />
                Voltar
              </Button>
            )}
          </div>
          
          <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
              className={`${isMobile ? 'flex-1 h-11 text-base' : ''} dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700`}
            >
              Cancelar
            </Button>
            
            {currentTabIndex < tabs.length - 1 ? (
              <Button 
                type="button" 
                onClick={handleNext} 
                disabled={!canProceedToNext() || loading}
                className={`${isMobile ? 'flex-1 h-11 text-base' : ''} bg-pink-600 dark:bg-pink-500 hover:bg-pink-700 dark:hover:bg-pink-600 text-white`}
              >
                Próximo
                <ChevronRight className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} ml-1`} />
              </Button>
            ) : (
              <>
                <Button 
                  type="button"
                  onClick={() => handleSubmit(false)} 
                  disabled={loading || !fornecedor || !dataEntrega || itens.some(item => !item.produto || item.quantidade <= 0)}
                  className={`${isMobile ? 'flex-1 h-11 text-base' : ''} bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-500 dark:to-rose-500 hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 text-white`}
                >
                  {loading ? (
                    <>
                      <div className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin mr-2`}></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                      Criar Pedido
                    </>
                  )}
                </Button>
                {!isMobile && (
                  <Button 
                    type="button"
                    onClick={() => handleSubmit(true)} 
                    disabled={loading || !fornecedor || !dataEntrega || itens.some(item => !item.produto || item.quantidade <= 0)}
                    variant="outline"
                    className="border-pink-500 dark:border-pink-400 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Mais
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] p-0 flex flex-col bg-white dark:bg-gray-900 [&>button]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Novo Pedido</SheetTitle>
          </SheetHeader>
          {modalContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[900px] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[850px] overflow-hidden border border-gray-200/60 dark:border-gray-700/30 shadow-xl rounded-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-900 [&>button]:hidden">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Novo Pedido
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400 text-xs truncate">
                  Etapa {currentTabIndex + 1}/{tabs.length}
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 flex-shrink-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 px-3 sm:px-4 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 overflow-x-hidden">
          <div className="flex space-x-1 bg-white dark:bg-gray-900 rounded-md p-0.5 border border-gray-200 dark:border-gray-700 min-w-0">
            {tabs.map(tab => {
            const status = getTabStatus(tab.id);
            return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`
                    flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all
                    ${status === 'current' 
                      ? 'bg-pink-600 dark:bg-pink-500 text-white' 
                      : status === 'completed' 
                      ? 'bg-green-500 dark:bg-green-600 text-white' 
                      : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                  `}>
                    {status === 'completed' ? <CheckCircle className="h-3 w-3" /> : <tab.icon className="h-3 w-3" />}
                  <span className="hidden sm:inline text-xs">{tab.label}</span>
                </button>;
          })}
          </div>
        </div>

        {/* Content Area */}
        <div 
          className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden"
          style={{ 
            scrollbarGutter: 'stable',
            ...(isTransitioning && { overflowY: 'hidden' })
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-full w-full min-w-0"
              style={{ willChange: 'opacity' }}
            >
              <div className="p-3 sm:p-4 pb-4 max-w-full overflow-x-hidden">
                {activeTab === 'produtos' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 max-w-full">
                  {/* Left Column - Add Product Form */}
                    <Card className="border-gray-200 dark:border-gray-700 shadow-sm order-1 lg:order-1 h-fit dark:bg-gray-800 min-w-0">
                      <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
                        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                          Adicionar Produto
                        </h3>
                      </div>
                      <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 pb-3 sm:pb-4 min-w-0">
                        <div className="space-y-2 min-w-0">
                          <Label className="text-sm font-medium text-foreground">Produto *</Label>
                          <div className="min-w-0">
                            <Combobox options={filteredProducts.map(p => ({
                        value: p.name,
                        label: p.name
                      }))} value={selectedProduct ? selectedProduct.name : ""} onValueChange={value => {
                        const product = products.find(p => p.name === value);
                        if (product) handleProductSelect(product);
                      }} placeholder="Digite para buscar produtos..." searchPlaceholder={`Buscar entre ${products.length} produtos...`} emptyText={debouncedProductSearch ? "Nenhum produto encontrado" : "Digite para ver produtos..."} className="w-full min-w-0" onSearchChange={setProductSearch} />
                          </div>
                          {errors.product && (
                            <p className="text-xs text-red-500 dark:text-red-400">{errors.product}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                          <div className="space-y-2 min-w-0">
                            <Label className="text-sm font-medium text-foreground">Quantidade *</Label>
                            <Input 
                              type="text" 
                              value={newProductQuantity} 
                              onChange={e => {
                                const value = e.target.value;
                                // Permitir apenas números, vírgula e ponto
                                if (/^\d*[,.]?\d*$/.test(value) || value === '') {
                                  setNewProductQuantity(value);
                                  if (errors.quantity) setErrors({...errors, quantity: ""});
                                }
                              }} 
                              placeholder="Ex: 98,5 ou 100" 
                              className={`text-sm ${errors.quantity ? 'border-red-500 dark:border-red-400' : ''}`} 
                            />
                            {errors.quantity && (
                              <p className="text-xs text-red-500 dark:text-red-400">{errors.quantity}</p>
                            )}
                          </div>
                          <div className="space-y-2 min-w-0">
                            <Label className="text-sm font-medium text-foreground">Unidade *</Label>
                            <div className="min-w-0">
                              <Select value={newProductUnit} onValueChange={value => {
                                setNewProductUnit(value);
                                if (errors.unit) setErrors({...errors, unit: ""});
                              }}>
                                <SelectTrigger className={`text-sm w-full min-w-0 ${errors.unit ? 'border-red-500 dark:border-red-400' : ''}`}>
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
                            {errors.unit && (
                              <p className="text-xs text-red-500 dark:text-red-400">{errors.unit}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 min-w-0">
                          <Label className="text-sm font-medium text-foreground">Valor Unitário *</Label>
                          <Input 
                            type="number" 
                            value={newProductPrice} 
                            onChange={e => {
                              setNewProductPrice(e.target.value);
                              if (errors.price) setErrors({...errors, price: ""});
                            }} 
                            placeholder="0,00"
                            min="0" 
                            step="0.01" 
                            className={`text-sm w-full min-w-0 ${errors.price ? 'border-red-500 dark:border-red-400' : ''}`} 
                          />
                          {errors.price && (
                            <p className="text-xs text-red-500 dark:text-red-400">{errors.price}</p>
                          )}
                          {selectedProduct && lastUsedPrices[selectedProduct.id] && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Último preço: R$ {lastUsedPrices[selectedProduct.id].toFixed(2)}
                            </p>
                          )}
                        </div>

                        <Button type="button" onClick={handleAddNewProduct} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-sm sm:text-base py-2 sm:py-2.5">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar à Lista
                        </Button>
                      </div>
                    </Card>

                    {/* Right Column - Products List */}
                    <Card className="border-gray-200 dark:border-gray-700 shadow-sm order-2 lg:order-2 flex flex-col dark:bg-gray-800 min-w-0">
                      <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 flex-shrink-0">
                        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                          Produtos Adicionados ({itens.length})
                        </h3>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto">
                        <div className="p-2 sm:p-3 space-y-2">
                          {itens.length === 0 ? <div className="text-center py-6 text-muted-foreground">
                              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Nenhum produto adicionado</p>
                              <p className="text-xs">Use o formulário ao lado para adicionar produtos</p>
                            </div> : itens.map((item, index) => <div key={index} className="border border-border rounded-lg p-2 bg-muted/50">
                                <div className="flex items-start justify-between mb-1 gap-2 min-w-0">
                                  <h4 className="font-medium text-foreground text-xs flex-1 truncate min-w-0">
                                    {item.produto || 'Produto não encontrado'}
                                  </h4>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDuplicateItem(index)} 
                                      className="h-5 w-5 p-0 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                      title="Duplicar produto"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleRemoveItem(index)} 
                                      className="h-5 w-5 p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                                      title="Remover produto"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs text-muted-foreground min-w-0">
                                  <div className="min-w-0 truncate">
                                    <span className="font-medium">Qtd: </span> 
                                    <span className="truncate">{formatDecimalDisplay(item.quantidade)} {item.unidade}</span>
                                  </div>
                                  <div className="min-w-0 truncate">
                                    <span className="font-medium">Unit: </span> 
                                    <span className="truncate">R$ {item.valorUnitario.toFixed(2)}</span>
                                  </div>
                                  <div className="text-right min-w-0 truncate">
                                    <span className="font-medium text-pink-600 dark:text-pink-400 truncate">
                                      R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>)}
                        </div>
                      </div>
                      {itens.length > 0 && <div className="p-2 sm:p-3 border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 flex-shrink-0">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-foreground text-sm">Total:</span>
                            <span className="text-base font-bold text-pink-600 dark:text-pink-400">
                              R$ {calculateTotal().toFixed(2)}
                            </span>
                          </div>
                        </div>}
                    </Card>
                  </div>}

                {activeTab === 'fornecedor' && <div className="max-w-2xl mx-auto w-full space-y-3 sm:space-y-4">
                    <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 min-w-0">
                      <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-pink-500" />
                          Informações do Fornecedor
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Selecione o fornecedor e defina a data de entrega
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 min-w-0">
                        <div className="space-y-2 min-w-0">
                          <Label htmlFor="fornecedor" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Fornecedor *
                          </Label>
                          <div className="min-w-0">
                            <Combobox 
                            options={suppliers
                              .filter(s => 
                                !debouncedSupplierSearch || 
                                s.name.toLowerCase().includes(debouncedSupplierSearch.toLowerCase()) ||
                                (s.contact && s.contact.toLowerCase().includes(debouncedSupplierSearch.toLowerCase()))
                              )
                              .map(s => ({
                                value: s.id,
                                label: s.contact ? `${s.name} (${s.contact})` : s.name
                              }))} 
                            value={fornecedor} 
                            onValueChange={setFornecedor} 
                            placeholder="Selecione um fornecedor..." 
                            searchPlaceholder="Buscar por nome ou vendedor..." 
                            emptyText="Nenhum fornecedor encontrado" 
                            className="w-full text-sm min-w-0"
                            onSearchChange={setSupplierSearch}
                          />
                          </div>
                        </div>
                        
                        <div className="space-y-2 min-w-0">
                          <Label htmlFor="dataEntrega" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Data de Entrega *
                          </Label>
                          <Input id="dataEntrega" type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} className="w-full text-sm min-w-0" />
                        </div>
                      </div>
                    </Card>
                  </div>}

                {activeTab === 'detalhes' && <div className="max-w-4xl mx-auto w-full space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full max-w-full">
                      {/* Observações */}
                      <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 min-w-0">
                        <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                            Observações
                          </h3>
                        </div>
                        <div className="p-2 sm:p-3 min-w-0">
                          <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações adicionais sobre o pedido..." className="min-h-[80px] sm:min-h-[100px] resize-none text-sm w-full min-w-0 dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
                        </div>
                      </Card>

                      {/* Resumo do Pedido */}
                      <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 min-w-0">
                        <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                            Resumo do Pedido
                          </h3>
                        </div>
                        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs min-w-0">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Produtos:</span>
                              <div className="font-medium dark:text-gray-200">{itens.length} itens</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Fornecedor:</span>
                              <div className="font-medium text-xs truncate dark:text-gray-200">
                                {fornecedor ? suppliers.find(s => s.id === fornecedor)?.name : 'Não selecionado'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Data de Entrega:</span>
                              <div className="font-medium dark:text-gray-200">
                                {dataEntrega ? new Date(dataEntrega).toLocaleDateString('pt-BR') : 'Não definida'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Valor Total:</span>
                              <div className="font-bold text-pink-600 text-sm sm:text-base">
                                R$ {calculateTotal().toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          {itens.length > 0 && <div className="border-t border-gray-200 dark:border-gray-700 pt-2 sm:pt-3">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-xs">Produtos Selecionados:</h4>
                              <div className="h-20 sm:h-24 overflow-y-auto">
                                <div className="space-y-1">
                                  {itens.map((item, index) => <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex justify-between gap-2">
                                      <span className="truncate flex-1">{item.produto}</span>
                                      <span className="flex-shrink-0">{formatDecimalDisplay(item.quantidade)} {item.unidade}</span>
                                    </div>)}
                                </div>
                              </div>
                            </div>}
                        </div>
                      </Card>
                    </div>
                  </div>}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="flex-shrink-0 px-3 sm:px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex gap-2">
              {currentTabIndex > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePrevious} 
                  disabled={loading}
                  className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={loading}
                className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
              
              {currentTabIndex < tabs.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  disabled={!canProceedToNext() || loading}
                  className="bg-pink-600 dark:bg-pink-500 hover:bg-pink-700 dark:hover:bg-pink-600 text-white"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <>
                  <Button 
                    type="button"
                    onClick={() => handleSubmit(false)} 
                    disabled={loading || !fornecedor || !dataEntrega || itens.some(item => !item.produto || item.quantidade <= 0)}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-500 dark:to-rose-500 hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 text-white"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Criando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Criar Pedido
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => handleSubmit(true)} 
                    disabled={loading || !fornecedor || !dataEntrega || itens.some(item => !item.produto || item.quantidade <= 0)}
                    variant="outline"
                    className="border-pink-500 dark:border-pink-400 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Mais
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}