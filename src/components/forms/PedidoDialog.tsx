import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, Trash2, Loader2, Building2, Calendar, Package, FileText, 
  Save, ShoppingCart, X, Search, ClipboardList, Download,
  DollarSign, ChevronLeft, ChevronRight, Check, Calculator, ArrowLeftRight, ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";

import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

interface PedidoItem {
  produto: string;
  quantidade: number;
  valorUnitario: number;
  unidade: string;
  marca?: string;
}

interface PedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  onEdit?: () => void;
}

export default function PedidoDialog({ open, onOpenChange, pedido, onEdit }: PedidoDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("itens");
  
  // Mobile Steps
  const STEPS = [
    { id: "itens", title: "Produtos", icon: Package },
    { id: "logistica", title: "Logística", icon: Building2 },
    { id: "resumo", title: "Resumo", icon: ClipboardList },
  ];
  const [activeStep, setActiveStep] = useState(STEPS[0].id);
  const currentStepIndex = STEPS.findIndex(s => s.id === activeStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Mobile Drawer & Form states
  const [showMobileProductSearch, setShowMobileProductSearch] = useState(false);
  const [newMobileQuantity, setNewMobileQuantity] = useState("1");
  const [newMobileUnit, setNewMobileUnit] = useState("un");
  const [newMobilePrice, setNewMobilePrice] = useState("");
  const [selectedMobileProduct, setSelectedMobileProduct] = useState<any>(null);

  // Form states
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const isReadOnly = pedido?.status === 'entregue';
  
  // Add Product Form States
  const [newProduct, setNewProduct] = useState<any>(null);
  const [newProductSearch, setNewProductSearch] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("un"); // Nova unidade para o item
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debouncedNewProductSearch = useDebounce(newProductSearch, 300);
  
  // Refs
  const newProductInputRef = useRef<HTMLInputElement>(null);
  const newQuantityInputRef = useRef<HTMLInputElement>(null);
  const newPriceInputRef = useRef<HTMLInputElement>(null);

  // Package conversion states
  const [showConversion, setShowConversion] = useState(false);
  const [conversionMode, setConversionMode] = useState<'box_to_unit' | 'unit_to_box'>('box_to_unit');
  const [unPerBox, setUnPerBox] = useState('');

  // Calculator states
  const [showCalc, setShowCalc] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcExpr, setCalcExpr] = useState('');
  const calcRef = useRef({ prevVal: null as number | null, op: null as string | null, waitNew: false });

  // Data states
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const calculateTotal = () => itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);

  // Swipe and Touch states for mobile
  const [swipableItemId, setSwipableItemId] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const swipeStartRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    swipeStartRef.current = e.touches[0].clientX;
    setSwipableItemId(index);
    setSwipeOffset(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartRef.current === null || swipableItemId === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - swipeStartRef.current;
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -80));
    } else {
      setSwipeOffset(0);
    }
  };
  const handleTouchEnd = (index: number) => {
    if (swipeOffset < -50 && !isReadOnly) {
      setItens(itens.filter((_, i) => i !== index));
    }
    swipeStartRef.current = null;
    setSwipableItemId(null);
    setSwipeOffset(0);
  };

  // Função para exportar HTML
  const handleDownloadHtml = useCallback(() => {
    if (!pedido || itens.length === 0) return;

    const total = calculateTotal();
    const selectedSupplier = suppliers.find(s => s.id === fornecedor);
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatDateExport = (dateString: string) => {
      if (!dateString) return '-';
      if (dateString.includes('/')) return dateString;
      try { return new Date(dateString).toLocaleDateString('pt-BR'); } catch { return dateString; }
    };

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Pedido #${pedido.id.substring(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f9fafb; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
    .header { background: linear-gradient(135deg, ${ds.colors.brand.primary} 0%, ${ds.colors.brand.hover} 100%); color: #18181b; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
    .header h1 { font-size: 24px; font-weight: 800; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .info-card { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid ${ds.colors.brand.primary}; }
    .info-card strong { display: block; color: ${ds.colors.brand.primary}; font-size: 12px; text-transform: uppercase; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 700; border-bottom: 2px solid #e5e7eb; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .total-row { background: #dcfce7 !important; font-weight: 700; }
    .total-row td { color: #166534; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>📦 PEDIDO #${pedido.id.substring(0, 8)}</h1></div>
    <div class="info-grid">
      <div class="info-card"><strong>Fornecedor</strong><span>${selectedSupplier?.name || '-'}</span></div>
      <div class="info-card"><strong>Entrega</strong><span>${formatDateExport(dataEntrega)}</span></div>
      <div class="info-card"><strong>Itens</strong><span>${itens.length}</span></div>
      <div class="info-card"><strong>Gerado</strong><span>${new Date().toLocaleDateString('pt-BR')}</span></div>
    </div>
    <table>
      <thead><tr><th>Produto</th><th>Qtd</th><th style="text-align: right;">Valor Unit.</th><th style="text-align: right;">Subtotal</th></tr></thead>
      <tbody>
        ${itens.map((item, idx) => `<tr><td>${idx + 1}. ${item.produto}</td><td>${item.quantidade} ${item.unidade}</td><td style="text-align: right;">R$ ${formatCurrency(item.valorUnitario)}</td><td style="text-align: right;">R$ ${formatCurrency(item.quantidade * item.valorUnitario)}</td></tr>`).join('')}
        <tr class="total-row"><td colspan="3" style="text-align: right;">TOTAL</td><td style="text-align: right;">R$ ${formatCurrency(total)}</td></tr>
      </tbody>
    </table>
    ${observacoes ? `<div style="background: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid ${ds.colors.brand.primary};"><strong style="color: ${ds.colors.brand.primary};">Observações:</strong><p>${observacoes}</p></div>` : ''}
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pedido-${pedido.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast({ title: "Pedido exportado!" });
  }, [pedido, itens, fornecedor, dataEntrega, observacoes, suppliers, toast]);

  const statusOptions = [
    { value: "pendente", label: "Pendente", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
    { value: "processando", label: "Processando", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
    { value: "confirmado", label: "Confirmado", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30" },
    { value: "entregue", label: "Entregue", color: "bg-brand/10 text-brand border-brand/30" },
    { value: "cancelado", label: "Cancelado", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" }
  ];

  useEffect(() => {
    if (open) {
      loadSuppliers();
      // Removido loadProducts massivo
      setActiveTab("itens");
    }
    if (pedido && open) {
      setFornecedor(pedido.supplier_id || "");
      setDataEntrega(pedido.delivery_date || "");
      setStatus(pedido.status || "pendente");
      setObservacoes(pedido.observations || pedido.observacoes || "");
      
      if (pedido.detalhesItens?.length > 0) {
        setItens(pedido.detalhesItens.map((item: any) => ({
          produto: item.product_name || item.produto || "",
          quantidade: parseFloat(item.quantity || item.quantidade || 1),
          valorUnitario: parseFloat(item.unit_price || item.valorUnitario || 0),
          unidade: item.unit || item.unidade || "un",
          marca: item.brand_name || item.marca || ""
        })));
      } else {
        setItens([]);
      }
    }
  }, [pedido, open]);

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('id, name').order('name');
    setSuppliers(data || []);
  };

  const searchProducts = async (term: string) => {
    if (!term || term.trim().length < 3) {
      setProducts([]);
      setShowProductSuggestions(false);
      return;
    }
    
    setIsSearchingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, unit')
        .ilike('name', `%${term}%`)
        .order('name')
        .limit(20);
      
      if (error) throw error;
      setProducts(data || []);
      if ((data || []).length > 0) {
        setShowProductSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearchingProducts(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedNewProductSearch && debouncedNewProductSearch.trim().length >= 3) {
        searchProducts(debouncedNewProductSearch);
      } else {
        setProducts([]);
        setShowProductSuggestions(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [debouncedNewProductSearch]);

  const filteredNewProducts = products;

  const handleAddNewItem = () => {
    const productName = newProduct ? newProduct.name : newProductSearch;
    if (!productName) return;
    
    const qty = parseFloat(newQuantity) || 1;
    const price = typeof newPrice === 'string' ? parseFloat(newPrice.replace(',', '.')) || 0 : newPrice;
    const marca = newProduct?.brand_name || "";
    const unidade = newProductUnit || (newProduct?.unit || 'un');

    setItens([{ produto: productName, quantidade: qty, valorUnitario: price, unidade, marca }, ...itens]);
    
    // Reset form
    setNewProduct(null);
    setNewProductSearch("");
    setNewQuantity("");
    setNewPrice("");
    
    // Focus back
    setTimeout(() => newProductInputRef.current?.focus(), 50);
  };

  const handleNewItemKeyDown = (e: React.KeyboardEvent, field: 'search' | 'quantity' | 'price') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'search') {
        if (filteredNewProducts.length > 0 && highlightedIndex >= 0) {
           const p = filteredNewProducts[highlightedIndex];
           setNewProduct(p);
           setNewProductSearch(p.name);
           setHighlightedIndex(-1);
           newQuantityInputRef.current?.focus();
        } else if (newProductSearch) {
           newQuantityInputRef.current?.focus();
        }
      } else if (field === 'quantity') {
        newPriceInputRef.current?.focus();
      } else if (field === 'price') {
        handleAddNewItem();
      }
    } else if (e.key === 'ArrowDown' && field === 'search') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredNewProducts.length - 1));
    } else if (e.key === 'ArrowUp' && field === 'search') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, -1));
    }
  };

  // ── Calculator ─────────────────────────────────────────────────────
  const calcComputeFn = (a: number, b: number, op: string) => {
    const r = op === '+' ? a+b : op === '-' ? a-b : op === '*' ? a*b : b !== 0 ? a/b : 0;
    return Math.round(r * 1e10) / 1e10;
  };

  const handleCalcKey = useCallback((key: string) => {
    const cs = calcRef.current;
    if (key === 'C') {
      setCalcDisplay('0'); setCalcExpr('');
      calcRef.current = { prevVal: null, op: null, waitNew: false }; return;
    }
    if (key === '⌫') { setCalcDisplay(d => d.length > 1 ? d.slice(0, -1) : '0'); return; }
    if ('0123456789.'.includes(key)) {
      setCalcDisplay(d => {
        if (cs.waitNew) { cs.waitNew = false; return key === '.' ? '0.' : key; }
        if (key === '.' && d.includes('.')) return d;
        return d === '0' && key !== '.' ? key : d + key;
      }); return;
    }
    const opMap: Record<string, string> = { '×': '*', '÷': '/', '+': '+', '-': '-' };
    if (opMap[key]) {
      setCalcDisplay(d => {
        const val = parseFloat(d);
        if (cs.prevVal !== null && cs.op && !cs.waitNew) {
          const res = calcComputeFn(cs.prevVal, val, cs.op);
          const s = Number.isInteger(res) ? String(res) : res.toFixed(8).replace(/\.?0+$/, '') || '0';
          cs.prevVal = res; setCalcExpr(`${s} ${key}`); cs.op = opMap[key]; cs.waitNew = true;
          return s;
        }
        cs.prevVal = val; setCalcExpr(`${val} ${key}`); cs.op = opMap[key]; cs.waitNew = true;
        return d;
      }); return;
    }
    if (key === '=') {
      if (cs.prevVal === null || !cs.op) return;
      setCalcDisplay(d => {
        const val = parseFloat(d);
        const res = calcComputeFn(cs.prevVal!, val, cs.op!);
        const s = Number.isInteger(res) ? String(res) : res.toFixed(8).replace(/\.?0+$/, '') || '0';
        cs.prevVal = null; cs.op = null; cs.waitNew = true; setCalcExpr('');
        return s;
      });
    }
  }, []);

  useEffect(() => {
    if (!showCalc) return;
    const kmap: Record<string, string> = {
      '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
      '.':'.', ',':'.', '+':'+', '-':'-', '*':'×', '/':'÷', 'Enter':'=', '=':'='
    };
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const mapped = kmap[e.key];
      if (mapped) { e.preventDefault(); handleCalcKey(mapped); }
      else if (e.key === 'Backspace') { e.preventDefault(); handleCalcKey('⌫'); }
      else if (e.key === 'Delete') { e.preventDefault(); handleCalcKey('C'); }
      else if (e.key === 'Escape') setShowCalc(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showCalc, handleCalcKey]);

  // ── Conversion helpers ─────────────────────────────────────────────
  const conversionResult = (() => {
    const price = parseFloat(String(newPrice).replace(',', '.')) || 0;
    const factor = parseFloat(unPerBox.replace(',', '.')) || 0;
    if (!price || !factor) return null;
    if (conversionMode === 'box_to_unit') return { label: 'Preço por unidade', value: price / factor };
    return { label: 'Preço por caixa', value: price * factor };
  })();

  const handleApplyConversion = () => {
    if (!conversionResult) return;
    setNewPrice(conversionResult.value.toFixed(4).replace(/\.?0+$/, ''));
    if (conversionMode === 'box_to_unit') setNewProductUnit('un');
    else setNewProductUnit('cx');
    setShowConversion(false);
  };

  const handleSubmit = async () => {
    if (!user || !fornecedor || !dataEntrega) {
      toast({ title: "Erro", description: "Preencha fornecedor e data de entrega", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const total = calculateTotal();
      const selectedSupplier = suppliers.find(s => s.id === fornecedor);

      await supabase.from('orders').update({
        supplier_id: fornecedor,
        supplier_name: selectedSupplier?.name || '',
        total_value: total,
        status,
        delivery_date: dataEntrega,
        observations: observacoes,
      }).eq('id', pedido.id);

      await supabase.from('order_items').delete().eq('order_id', pedido.id);

      const orderItems = itens.filter(item => item.produto).map(item => {
        const product = products.find(p => p.name === item.produto);
        return {
          order_id: pedido.id,
          product_id: product?.id || null,
          product_name: item.produto,
          quantity: item.quantidade,
          unit: item.unidade,
          unit_price: item.valorUnitario,
          total_price: item.quantidade * item.valorUnitario,
        };
      });

      if (orderItems.length > 0) {
        await supabase.from('order_items').insert(orderItems);
      }

      toast({ title: "Pedido atualizado com sucesso!" });
      if (onEdit) onEdit();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isMobile) return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const getStatusBadge = (statusValue: string) => {
    const config = statusOptions.find(s => s.value === statusValue) || statusOptions[0];
    return (
      <Badge 
        variant="outline" 
        className={cn(
          ds.typography.size.xs,
          ds.typography.weight.bold,
          "uppercase tracking-wider",
          config.color
        )}
      >
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    if (dateString.includes('/')) return dateString;
    try { return new Date(dateString).toLocaleDateString('pt-BR'); } catch { return dateString; }
  };

  const selectedSupplier = suppliers.find(s => s.id === fornecedor);

  // Header content shared between Dialog and Drawer
  const headerContent = (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
        "bg-brand"
      )}>
        <ShoppingCart className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <DialogTitle className={cn(
          ds.typography.size.base,
          ds.typography.weight.bold,
          ds.colors.text.primary,
          "leading-none"
        )}>
          Gerenciar Pedido
        </DialogTitle>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={cn(
            ds.typography.size.xs,
            ds.typography.weight.bold,
            ds.colors.text.secondary,
            "uppercase tracking-wider px-2 py-0.5 rounded-md",
            ds.colors.surface.section
          )}>
            #{pedido?.id?.substring(0, 8)}
          </span>
          {getStatusBadge(status || pedido?.status || 'pendente')}
        </div>
      </div>
    </div>
  );

  // Footer content
  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onOpenChange(false)} 
        disabled={loading} 
        className={cn(ds.components.button.secondary, "gap-2")}
      >
        <X className="h-4 w-4" />
        Fechar
      </Button>
      <Button 
        onClick={handleSubmit} 
        size="sm" 
        disabled={loading || isReadOnly} 
        className={cn(ds.components.button.primary, "gap-2")}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Salvar Alterações
          </>
        )}
      </Button>
    </div>
  );


  const nextStep = () => {
    if (currentStepIndex < STEPS.length - 1) setActiveStep(STEPS[currentStepIndex + 1].id);
  };
  const prevStep = () => {
    if (currentStepIndex > 0) setActiveStep(STEPS[currentStepIndex - 1].id);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("h-[96dvh] max-h-[96dvh] flex flex-col p-0", ds.colors.surface.page)}>
          <div className="flex flex-col h-full relative">
            <div className="flex-shrink-0 px-4 py-4 bg-brand text-zinc-950 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col">
                    <DrawerTitle className="text-zinc-950 font-bold text-lg leading-none">Ped #{pedido?.id?.substring(0, 8)}</DrawerTitle>
                    <DrawerDescription className="text-zinc-900/70 font-medium">Editar Pedido</DrawerDescription>
                  </div>
                </div>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="text-zinc-950 hover:bg-black/10 h-9 w-9 rounded-xl">
                    <X className="h-5 w-5" />
                  </Button>
                </DrawerClose>
              </div>
              <Progress value={progress} className="h-2 bg-black/10" indicatorClassName="bg-zinc-950" />
            </div>

            <div className="flex-1 overflow-y-auto w-full custom-scrollbar pb-32">
              {activeStep === "itens" && (
                <div className="p-4 space-y-4">
                  {!isReadOnly && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                          ref={newProductInputRef}
                          placeholder="Buscar produto celular..."
                          value={newProductSearch}
                          onChange={(e) => { setNewProductSearch(e.target.value); setNewProduct(null); }}
                          onFocus={(e) => {
                            if (newProductSearch.trim().length >= 3) setShowProductSuggestions(true);
                          }}
                          className={cn(ds.components.input.root, "pl-10 h-12 bg-background")}
                        />
                        {showProductSuggestions && products.length > 0 && !newProduct && (
                          <div className={cn(
                            "absolute top-full left-0 right-0 mt-2 max-h-[250px] overflow-y-auto rounded-xl shadow-2xl z-[200] border",
                            ds.colors.surface.card, ds.colors.border.default
                          )}>
                            {filteredNewProducts.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => { 
                                  setNewProduct(p); 
                                  setNewProductSearch(p.name); 
                                  setNewProductUnit(p.unit || 'un');
                                  setProducts([]);
                                  setShowProductSuggestions(false);
                                }}
                                className={cn(
                                  "w-full px-4 py-3 text-left flex items-center justify-between gap-3 border-b last:border-none",
                                  ds.colors.surface.hover, ds.colors.border.default
                                )}
                              >
                                <span className={cn(ds.typography.size.sm, ds.typography.weight.bold)}>{p.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {newProduct && (
                        <div className="space-y-4 p-4 rounded-2xl border bg-brand/5 border-brand/20 shadow-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={ds.components.input.group}>
                              <Label className={ds.components.input.label}>Qtd ({newProductUnit})</Label>
                              <Input
                                type="number"
                                value={newQuantity}
                                onChange={(e) => setNewQuantity(e.target.value)}
                                className={cn(ds.components.input.root, "h-12 text-center text-lg font-bold")}
                              />
                            </div>
                            <div className={ds.components.input.group}>
                              <div className="flex items-center justify-between">
                                <Label className={ds.components.input.label}>Preço</Label>
                                <button 
                                  type="button" 
                                  onClick={() => setShowCalc(!showCalc)}
                                  className="text-brand p-1 hover:bg-brand/10 rounded-lg transition-colors"
                                >
                                  <Calculator className="h-4 w-4" />
                                </button>
                              </div>
                              <Input
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className={cn(ds.components.input.root, "h-12 text-center text-lg font-bold")}
                                placeholder="0,00"
                              />
                            </div>
                          </div>

                          {/* Mobile Conversion Toggle */}
                          <div className="flex items-center justify-between px-1">
                            <button
                              type="button"
                              onClick={() => setShowConversion(!showConversion)}
                              className={cn(
                                "flex items-center gap-2 text-xs font-bold transition-all px-3 py-2 rounded-xl",
                                showConversion ? "bg-brand text-zinc-950" : "bg-white/50 dark:bg-black/20 text-zinc-500"
                              )}
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                              Conversão
                              <ChevronDown className={cn("h-3 w-3 transition-transform", showConversion && "rotate-180")} />
                            </button>
                            
                            {newProductUnit !== 'un' && (
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-brand/30 text-brand">
                                {newProductUnit}
                              </Badge>
                            )}
                          </div>

                          {showConversion && (
                            <div className="p-4 rounded-2xl border border-dashed border-brand/40 bg-white/40 dark:bg-black/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => setConversionMode('box_to_unit')}
                                  className={cn(
                                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all",
                                    conversionMode === 'box_to_unit' ? "bg-white dark:bg-zinc-700 shadow-sm text-brand" : "text-zinc-400"
                                  )}
                                >
                                  Cx → Un
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConversionMode('unit_to_box')}
                                  className={cn(
                                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all",
                                    conversionMode === 'unit_to_box' ? "bg-white dark:bg-zinc-700 shadow-sm text-brand" : "text-zinc-400"
                                  )}
                                >
                                  Un → Cx
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <Label className="text-[10px] font-black uppercase text-zinc-400 mb-1 block">Unidades por Caixa</Label>
                                  <Input
                                    type="number"
                                    placeholder="Ex: 12"
                                    value={unPerBox}
                                    onChange={e => setUnPerBox(e.target.value)}
                                    className={cn(ds.components.input.root, "h-11 text-center font-bold")}
                                  />
                                </div>
                                {conversionResult && (
                                  <div className="flex-1 text-right">
                                    <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">{conversionResult.label}</p>
                                    <p className="text-lg font-black text-brand leading-none">R$ {conversionResult.value.toFixed(2)}</p>
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                onClick={handleApplyConversion}
                                disabled={!conversionResult}
                                className={cn(ds.components.button.primary, "w-full h-11 rounded-xl shadow-lg")}
                              >
                                Aplicar Conversão
                              </Button>
                            </div>
                          )}

                          {/* Mobile Calculator */}
                          {showCalc && (
                            <div className="p-4 rounded-2xl border border-brand/20 bg-zinc-950 shadow-2xl animate-in fade-in slide-in-from-top-4">
                              <div className="bg-black/50 px-4 py-3 rounded-xl mb-3 text-right">
                                <p className="text-[10px] text-zinc-500 font-mono h-4">{calcExpr}</p>
                                <p className="text-2xl font-black text-brand font-mono">{calcDisplay}</p>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {([
                                  ['C', '⌫', '÷', '×'],
                                  ['7', '8', '9', '-'],
                                  ['4', '5', '6', '+'],
                                  ['1', '2', '3', '='],
                                  ['0', '.', 'OK']
                                ] as string[][]).map((row, ri) => (
                                  row.map(k => {
                                    const isSpecial = ['C', '⌫', '÷', '×', '-', '+', '=', 'OK'].includes(k);
                                    const isOK = k === 'OK';
                                    return (
                                      <button
                                        key={k}
                                        type="button"
                                        onClick={() => {
                                          if (k === 'OK') { setNewPrice(calcDisplay); setShowCalc(false); }
                                          else handleCalcKey(k);
                                        }}
                                        className={cn(
                                          "h-12 rounded-xl text-sm font-bold active:scale-95 transition-all",
                                          isOK ? "col-span-2 bg-brand text-zinc-950" : 
                                          isSpecial ? "bg-zinc-800 text-brand" : 
                                          "bg-zinc-900 text-white"
                                        )}
                                      >
                                        {k}
                                      </button>
                                    )
                                  })
                                ))}
                              </div>
                            </div>
                          )}

                          <Button onClick={handleAddNewItem} className={cn(ds.components.button.primary, "w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-brand/20")}>
                            Adicionar ao Pedido
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 mt-6">
                    {itens.map((item, index) => (
                      <div 
                        key={index} 
                        className="relative rounded-xl overflow-hidden touch-pan-y shadow-sm"
                        onTouchStart={(e) => handleTouchStart(e, index)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={() => handleTouchEnd(index)}
                      >
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end pr-4 pointer-events-none">
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </div>
                        <div 
                          className={cn(
                            "relative p-4 flex items-center gap-4 transition-transform z-10 border rounded-xl",
                            ds.colors.surface.card, ds.colors.border.default,
                            swipableItemId === index ? "" : "duration-200"
                          )}
                          style={{
                            transform: swipableItemId === index ? `translateX(${swipeOffset}px)` : 'translateX(0px)',
                          }}
                        >
                          <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center font-bold text-zinc-500 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary, "truncate")}>{item.produto}</p>
                            <p className={cn(ds.typography.size.xs, ds.colors.text.secondary, "mt-0.5")}>{item.quantidade} {item.unidade} × R$ {item.valorUnitario}</p>
                          </div>
                          <div className="text-right">
                            <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary)}>
                              R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {itens.length === 0 && (
                      <div className="py-8 text-center border border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
                         <Package className="h-8 w-8 text-zinc-400 mx-auto mb-2 opacity-50" />
                         <p className="text-sm font-medium text-zinc-500">Nenhum item adicionado</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeStep === "logistica" && (
                <div className="p-4 space-y-5">
                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Fornecedor</Label>
                    <Select value={fornecedor} onValueChange={setFornecedor} disabled={isReadOnly}>
                      <SelectTrigger className={cn(ds.components.input.root, "h-12")}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id} className="font-bold">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Data de Entrega</Label>
                    <Input 
                      type="date" 
                      value={dataEntrega} 
                      onChange={e => setDataEntrega(e.target.value)} 
                      disabled={isReadOnly}
                      className={cn(ds.components.input.root, "h-12")} 
                    />
                  </div>

                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Status do Pedido</Label>
                    <Select value={status} onValueChange={setStatus} disabled={isReadOnly}>
                      <SelectTrigger className={cn(ds.components.input.root, "h-12")}>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="font-bold">{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Observações</Label>
                    <Textarea
                      placeholder="Alguma observação?"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      disabled={isReadOnly}
                      className={cn(ds.components.input.root, "min-h-[100px] resize-none")}
                    />
                  </div>
                </div>
              )}

              {activeStep === "resumo" && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={cn("p-4 rounded-xl border", ds.colors.surface.card, ds.colors.border.default)}>
                      <p className="text-xs font-bold text-zinc-500 mb-1 uppercase">Fornecedor</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{selectedSupplier?.name || '-'}</p>
                    </div>
                    <div className={cn("p-4 rounded-xl border", ds.colors.surface.card, ds.colors.border.default)}>
                      <p className="text-xs font-bold text-zinc-500 mb-1 uppercase">Entrega</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatDate(dataEntrega)}</p>
                    </div>
                  </div>

                  <div className={cn("p-5 rounded-xl border bg-brand/5 border-brand/20", ds.colors.surface.card)}>
                    <div className="flex items-center gap-3 mb-2">
                       <DollarSign className="w-6 h-6 text-brand" />
                       <p className="text-sm font-bold text-brand uppercase">Total do Pedido</p>
                    </div>
                    <p className="text-3xl font-black text-brand">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={handleDownloadHtml}
                      className={cn(ds.components.button.secondary, "w-full h-12 gap-2 font-bold")}
                    >
                      <Download className="h-5 w-5" />
                      Exportar Resumo (HTML)
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
              <Button variant="outline" className="h-14 w-14 rounded-xl flex-shrink-0" onClick={prevStep} disabled={currentStepIndex === 0}>
                <ChevronLeft className="h-6 w-6" />
              </Button>
              {currentStepIndex === STEPS.length - 1 ? (
                <Button onClick={handleSubmit} className="flex-1 h-14 rounded-xl bg-brand text-zinc-950 font-bold text-lg shadow-xl disabled:opacity-50" disabled={loading || isReadOnly}>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="h-6 w-6 mr-2" />}
                  Finalizar Edição
                </Button>
              ) : (
                <Button onClick={nextStep} className="flex-1 h-14 rounded-xl bg-brand text-zinc-950 font-bold text-lg shadow-xl outline-none">
                  Próximo <ChevronRight className="h-6 w-6 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 overflow-hidden border shadow-xl flex flex-col",
          ds.colors.surface.page,
          ds.colors.border.default,
          // Mobile: Full Screen
          isMobile 
            ? "w-full h-[100dvh] max-h-[100dvh] rounded-none border-none inset-0 p-0" 
            : "w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[1000px] h-[95vh] sm:h-[90vh] max-h-[850px] rounded-2xl"
        )}
        hideClose={isMobile}
      >
        <div className={cn(
          "flex-shrink-0 border-b px-6 py-5 flex items-center justify-between",
          ds.colors.surface.section,
          ds.colors.border.default
        )}>
          {headerContent}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownloadHtml}
              className={cn(ds.components.button.ghost, "h-9 w-9 text-brand hover:text-brand hover:bg-brand/10")}
              title="Exportar pedido"
            >
              <Download className="h-4 w-4" />
            </Button>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className={cn(ds.components.button.ghost, "h-9 w-9")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 flex-shrink-0">
            <TabsList className={cn(
              ds.components.tabs.clean.list,
              "grid grid-cols-2 gap-1 h-11 p-1"
            )}>
              <TabsTrigger value="itens" className={cn(ds.components.tabs.clean.trigger, "gap-2")}>
                <Package className="h-4 w-4" />Itens do Pedido
              </TabsTrigger>
              <TabsTrigger value="resumo" className={cn(ds.components.tabs.clean.trigger, "gap-2")}>
                <ClipboardList className="h-4 w-4" />Resumo e Dados
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="itens" className="flex-1 overflow-auto m-0 p-6 custom-scrollbar">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-4")}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={ds.components.input.group}>
                        <Label className={ds.components.input.label}>Fornecedor</Label>
                        <Select value={fornecedor} onValueChange={setFornecedor} disabled={isReadOnly}>
                          <SelectTrigger className={cn(ds.components.input.root, "h-11")}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className={cn(
                            ds.colors.surface.card,
                            ds.colors.border.default,
                            "border shadow-xl backdrop-blur-xl"
                          )}>
                            {suppliers.map(s => (
                              <SelectItem key={s.id} value={s.id} className="font-bold">{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className={ds.components.input.group}>
                        <Label className={ds.components.input.label}>Data de Entrega</Label>
                        <Input 
                          type="date" 
                          value={dataEntrega} 
                          onChange={e => setDataEntrega(e.target.value)} 
                          onFocus={handleInputFocus}
                          disabled={isReadOnly}
                          className={cn(ds.components.input.root, "h-11 shadow-sm")} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-4")}>
                    <div className={ds.components.input.group}>
                      <Label className={ds.components.input.label}>Status do Pedido</Label>
                      <Select value={status} onValueChange={setStatus} disabled={isReadOnly}>
                        <SelectTrigger className={cn(ds.components.input.root, "h-11")}>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className={cn(
                          ds.colors.surface.card,
                          ds.colors.border.default,
                          "border shadow-xl backdrop-blur-xl"
                        )}>
                          {statusOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="font-bold">{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {!isReadOnly && (
                <Card className={cn(ds.components.card.root, "border-brand/20 bg-brand/5 shadow-sm overflow-visible")}>
                  <CardContent className={cn(ds.components.card.body, "space-y-4 pt-4 overflow-visible")}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                          <Plus className="h-4 w-4 text-zinc-950" />
                        </div>
                        <span className={cn(ds.typography.size.sm, ds.typography.weight.bold, "text-brand uppercase tracking-wider")}>
                          Adicionar Novo Item
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCalc(v => !v)}
                        title="Calculadora (teclado numérico ativo)"
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                          showCalc
                            ? "bg-brand text-zinc-950 shadow-md"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-brand/20 hover:text-brand"
                        )}
                      >
                        <Calculator className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="relative overflow-visible">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        ref={newProductInputRef}
                        placeholder="Pesquisar produto no catálogo..."
                        value={newProductSearch}
                        onChange={(e) => { setNewProductSearch(e.target.value); setNewProduct(null); }}
                        onKeyDown={(e) => handleNewItemKeyDown(e, 'search')}
                        onFocus={(e) => {
                          if (newProductSearch.trim().length >= 3) setShowProductSuggestions(true);
                          handleInputFocus(e);
                        }}
                        className={cn(ds.components.input.root, "pl-10 h-11 bg-background/50")}
                      />
                      
                      {showProductSuggestions && products.length > 0 && !newProduct && (
                        <div className={cn(
                          "absolute top-full left-0 right-0 mt-2 max-h-[250px] overflow-y-auto rounded-xl shadow-2xl z-[200] border animate-in fade-in zoom-in-95 duration-200 custom-scrollbar",
                          ds.colors.surface.card,
                          ds.colors.border.default
                        )}>
                          {filteredNewProducts.map((p, idx) => (
                            <button
                              key={p.id}
                              onClick={() => { 
                                setNewProduct(p); 
                                setNewProductSearch(p.name); 
                                setNewProductUnit(p.unit || 'un');
                                setProducts([]);
                                newQuantityInputRef.current?.focus(); 
                              }}
                              className={cn(
                                "w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-all border-b last:border-none",
                                highlightedIndex === idx ? "bg-brand/10 text-brand" : ds.colors.surface.hover,
                                ds.colors.border.default
                              )}
                            >
                              <div className="flex flex-col min-w-0">
                                <span className={cn(ds.typography.size.sm, ds.typography.weight.bold, "truncate")}>{p.name}</span>
                                <span className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>{p.unit || 'un'}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-7 gap-3">
                      <div className="col-span-3 lg:col-span-2">
                        <Input
                          ref={newQuantityInputRef}
                          type="number"
                          placeholder="Quantidade"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                          onKeyDown={(e) => handleNewItemKeyDown(e, 'quantity')}
                          onFocus={handleInputFocus}
                          className={cn(ds.components.input.root, "h-11 text-center")}
                        />
                      </div>
                      <div className="col-span-2 lg:col-span-2">
                        <Select value={newProductUnit} onValueChange={setNewProductUnit}>
                          <SelectTrigger className={cn(ds.components.input.root, "h-11")}>
                            <SelectValue placeholder="Un" />
                          </SelectTrigger>
                          <SelectContent className={cn(ds.colors.surface.card, ds.colors.border.default, "border shadow-xl")}>
                            {['un', 'kg', 'pct', 'cx', 'g', 'l', 'ml', 'metade'].map(u => (
                              <SelectItem key={u} value={u} className="font-bold uppercase">{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 lg:col-span-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">R$</span>
                          <Input
                            ref={newPriceInputRef}
                            placeholder="Preço"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            onKeyDown={(e) => handleNewItemKeyDown(e, 'price')}
                            onFocus={handleInputFocus}
                            className={cn(ds.components.input.root, "pl-8 h-11 text-center font-bold")}
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleAddNewItem} 
                        className={cn(ds.components.button.primary, "h-11 col-span-7 lg:col-span-1")}
                      >
                        <Plus className="h-4 w-4 mr-2 lg:mr-0" />
                        <span className="lg:hidden">Adicionar Item</span>
                      </Button>
                    </div>

                    {/* ─ Conversão de embalagem ─ */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowConversion(!showConversion)}
                        className={cn(
                          "flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all px-3 py-1.5 rounded-lg border",
                          showConversion 
                            ? "bg-brand/10 text-brand border-brand/30 shadow-sm" 
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent hover:border-brand/20 hover:text-brand"
                        )}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Ferramenta de Conversão
                        <ChevronDown className={cn("h-3 w-3 transition-transform", showConversion && "rotate-180")} />
                      </button>

                      {newProductUnit !== 'un' && (
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Unidade Atual:</span>
                           <Badge variant="outline" className="text-[10px] font-black uppercase border-brand/40 text-brand bg-brand/5">
                             {newProductUnit}
                           </Badge>
                        </div>
                      )}
                    </div>

                    {showConversion && (
                      <div className="p-4 rounded-2xl border border-dashed border-brand/40 bg-brand/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex p-1 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setConversionMode('box_to_unit')}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                              conversionMode === 'box_to_unit' 
                                ? "bg-white dark:bg-zinc-700 text-brand shadow-sm" 
                                : "text-zinc-500 hover:text-brand/70"
                            )}
                          >
                            Preço da Caixa → Valor Unidade
                          </button>
                          <button
                            type="button"
                            onClick={() => setConversionMode('unit_to_box')}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                              conversionMode === 'unit_to_box' 
                                ? "bg-white dark:bg-zinc-700 text-brand shadow-sm" 
                                : "text-zinc-500 hover:text-brand/70"
                            )}
                          >
                            Preço Unidade → Valor Caixa
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 items-end">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Fator (Un/Cx)</Label>
                            <Input
                              type="number"
                              placeholder="Ex: 12"
                              value={unPerBox}
                              onChange={e => setUnPerBox(e.target.value)}
                              className={cn(ds.components.input.root, "h-10 text-center font-bold text-lg")}
                            />
                          </div>
                          
                          {conversionResult ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-2.5 border border-brand/20 shadow-sm flex flex-col items-center justify-center min-h-[60px]">
                              <p className="text-[10px] font-black uppercase text-zinc-400 mb-0.5">{conversionResult.label}</p>
                              <p className="text-xl font-black text-brand tracking-tighter">R$ {conversionResult.value.toFixed(2)}</p>
                            </div>
                          ) : (
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-2.5 border border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center min-h-[60px]">
                              <p className="text-[10px] font-bold text-zinc-400 italic">Aguardando fator...</p>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={handleApplyConversion}
                          disabled={!conversionResult}
                          className={cn(ds.components.button.primary, "w-full h-11 rounded-xl shadow-lg shadow-brand/20 font-black uppercase tracking-widest text-xs")}
                        >
                          Aplicar Preço Calculado
                        </Button>
                      </div>
                    )}

                    {/* ─ Calculadora flutuante ─ */}
                    {showCalc && (
                      <div className={cn(
                        "rounded-2xl border shadow-2xl p-5 space-y-3 select-none animate-in fade-in zoom-in-95 duration-200",
                        ds.colors.surface.card, ds.colors.border.default
                      )}>
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Calculadora Ativa</span>
                          </div>
                          <button onClick={() => setShowCalc(false)} className="text-zinc-400 hover:text-red-500 transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="rounded-2xl bg-zinc-950 px-5 py-4 text-right space-y-1 min-h-[80px] flex flex-col justify-center shadow-inner">
                          {calcExpr && <p className="text-[10px] text-zinc-500 font-mono tracking-wider">{calcExpr}</p>}
                          <p className="text-3xl font-black text-brand font-mono tracking-tighter">{calcDisplay}</p>
                        </div>

                        <div className="grid gap-2.5">
                          {([
                            ['C', '⌫', '÷', '×'],
                            ['7', '8', '9', '-'],
                            ['4', '5', '6', '+'],
                            ['1', '2', '3', '='],
                            ['0', '.', 'Aplicar Preço'],
                          ] as string[][]).map((row, ri) => (
                            <div key={ri} className="grid gap-2.5" style={{ gridTemplateColumns: ri === 4 ? '1fr 1fr 2fr' : 'repeat(4, 1fr)' }}>
                              {row.map(k => {
                                const isOp = ['+', '-', '×', '÷'].includes(k);
                                const isEq = k === '=';
                                const isAct = k === 'C' || k === '⌫';
                                const isApply = k === 'Aplicar Preço';
                                return (
                                  <button
                                    key={k}
                                    type="button"
                                    onClick={() => {
                                      if (isApply) { setNewPrice(calcDisplay); setShowCalc(false); }
                                      else handleCalcKey(k);
                                    }}
                                    className={cn(
                                      "rounded-xl py-3 text-sm font-bold transition-all active:scale-90",
                                      isEq && "bg-brand text-zinc-950 shadow-lg shadow-brand/20",
                                      isOp && !isEq && "bg-zinc-800 text-brand hover:bg-brand hover:text-zinc-950",
                                      isAct && "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white",
                                      isApply && "bg-emerald-500/10 text-emerald-600 font-black tracking-tighter hover:bg-emerald-500 hover:text-white",
                                      !isOp && !isEq && !isAct && !isApply && "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-brand/20 hover:text-brand"
                                    )}
                                  >
                                    {k}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                            <kbd className="px-1.5 py-0.5 rounded border bg-zinc-50 dark:bg-zinc-800">Esc</kbd> fechar
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                            <kbd className="px-1.5 py-0.5 rounded border bg-zinc-50 dark:bg-zinc-800">Enter</kbd> calcular
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Package className="h-4 w-4 text-zinc-500" />
                  </div>
                  <h3 className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.secondary, "uppercase tracking-wider")}>
                    Lista de Produtos
                  </h3>
                </div>
                <Badge className={cn(ds.components.badge.base, "bg-brand/10 text-brand border-brand/20 px-3 py-1")}>
                  {itens.length} {itens.length === 1 ? 'Item' : 'Itens'}
                </Badge>
              </div>

              <div className="space-y-3">
                {itens.map((item, index) => (
                  <Card key={index} className={cn(
                    ds.components.card.root,
                    "hover:shadow-md transition-shadow group overflow-hidden border-l-4",
                    item.valorUnitario > 0 ? "border-l-brand" : "border-l-zinc-300 dark:border-l-zinc-700"
                  )}>
                    <CardContent className={cn(ds.components.card.body, "flex items-center gap-4 py-4")}>
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold",
                        ds.colors.surface.section,
                        ds.colors.text.secondary
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(ds.typography.size.base, ds.typography.weight.bold, ds.colors.text.primary, "truncate")}>
                          {item.produto}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={cn(ds.typography.size.sm, ds.typography.weight.bold, item.valorUnitario > 0 ? "text-brand" : "text-zinc-500 italic")}>
                            {item.valorUnitario > 0 ? `R$ ${item.valorUnitario.toFixed(2)}` : 'Sem preço'}
                          </span>
                          <span className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>
                            × {item.quantidade} {item.unidade}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className={cn(ds.typography.size.base, ds.typography.weight.bold, ds.colors.text.primary)}>
                          R$ {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {!isReadOnly && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setItens(itens.filter((_, i) => i !== index))} 
                            className={cn(ds.components.button.danger, "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Total */}
              <Card className={cn(ds.components.card.root, "bg-brand/5 border-brand/20")}>
                <CardContent className={cn(ds.components.card.body, "flex items-center justify-between")}>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-brand" />
                    <span className={cn(
                      ds.typography.size.sm,
                      ds.typography.weight.bold,
                      "text-brand",
                      "uppercase tracking-wider"
                    )}>Total</span>
                  </div>
                  <p className={cn(
                    ds.typography.size.base,
                    ds.typography.weight.bold,
                    "text-brand"
                  )}>R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Resumo */}
          <TabsContent value="resumo" className="flex-1 overflow-auto m-0 p-6 custom-scrollbar">
            <div className="space-y-4">
              {/* Cards de Estatísticas */}
              <div className={cn("grid gap-4", isMobile ? "grid-cols-2" : "grid-cols-4")}>
                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-3")}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-brand" />
                      </div>
                      <span className={cn(
                        ds.typography.size.xs,
                        ds.typography.weight.bold,
                        ds.colors.text.secondary,
                        "uppercase tracking-wider"
                      )}>Fornecedor</span>
                    </div>
                    <p className={cn(
                      ds.typography.size.sm,
                      ds.typography.weight.bold,
                      ds.colors.text.primary,
                      "truncate"
                    )}>{selectedSupplier?.name || '-'}</p>
                  </CardContent>
                </Card>

                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-3")}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className={cn(
                        ds.typography.size.xs,
                        ds.typography.weight.bold,
                        "text-blue-600 dark:text-blue-400",
                        "uppercase tracking-wider"
                      )}>Entrega</span>
                    </div>
                    <p className={cn(
                      ds.typography.size.sm,
                      ds.typography.weight.bold,
                      ds.colors.text.primary
                    )}>{formatDate(dataEntrega)}</p>
                  </CardContent>
                </Card>

                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-3")}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className={cn(
                        ds.typography.size.xs,
                        ds.typography.weight.bold,
                        "text-emerald-600 dark:text-emerald-400",
                        "uppercase tracking-wider"
                      )}>Itens</span>
                    </div>
                    <p className={cn(
                      ds.typography.size.sm,
                      ds.typography.weight.bold,
                      ds.colors.text.primary
                    )}>{itens.length} produto(s)</p>
                  </CardContent>
                </Card>

                <Card className={cn(ds.components.card.root, "bg-brand/5 border-brand/20")}>
                  <CardContent className={cn(ds.components.card.body, "space-y-3")}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-brand" />
                      </div>
                      <span className={cn(
                        ds.typography.size.xs,
                        ds.typography.weight.bold,
                        "text-brand",
                        "uppercase tracking-wider"
                      )}>Total</span>
                    </div>
                    <p className={cn(
                      ds.typography.size.lg,
                      ds.typography.weight.bold,
                      "text-brand"
                    )}>R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Status */}
              <Card className={ds.components.card.root}>
                <CardContent className={cn(
                  ds.components.card.body,
                  "flex flex-col items-center justify-center gap-3 py-8"
                )}>
                  <span className={cn(
                    ds.typography.size.xs,
                    ds.typography.weight.bold,
                    ds.colors.text.secondary,
                    "uppercase tracking-wider"
                  )}>Status do Pedido</span>
                  {getStatusBadge(status || pedido?.status || 'pendente')}
                </CardContent>
              </Card>

              {/* Observações */}
              {observacoes && (
                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-3")}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand" />
                      <span className={cn(
                        ds.typography.size.sm,
                        ds.typography.weight.bold,
                        ds.colors.text.primary
                      )}>Observações</span>
                    </div>
                    <p className={cn(
                      ds.typography.size.sm,
                      ds.colors.text.primary,
                      "whitespace-pre-wrap leading-relaxed"
                    )}>{observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className={cn(
          "flex-shrink-0 border-t px-6 py-4",
          ds.colors.surface.section,
          ds.colors.border.default
        )}>
          {footerContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
