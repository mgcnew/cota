import { useState, useRef, useMemo, useEffect, useCallback } from "react";
console.log('[WhatsApp DEBUG] QuoteValuesTab.tsx carregado!');
import { Building2, Search, ArrowLeft, DollarSign, Edit2, Check, X, Inbox, MessageCircle, History } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { designSystem } from "@/styles/design-system";
import { formatCurrency } from "@/utils/formatters";
import { LastPaidPricesTooltip } from "./LastPaidPricesTooltip";
import { generateWhatsAppMessage } from "@/lib/gemini";
import { sendWhatsAppMessage, isWhatsAppConfigured } from "@/lib/whatsapp";

interface QuoteValuesTabProps {
  products: any[];
  fornecedores: any[];
  quoteId: string;
  supplierItems: any[];
  onUpdateSupplierProductValue: (params: any) => void;
  onRefresh: () => void;
  isMobile: boolean;
  safeStr: (val: any) => string;
  getBestPriceInfoForProduct: (productId: string) => { bestPrice: number; bestSupplierId: string | null };
  isReadOnly?: boolean;
}

export function QuoteValuesTab({
  products,
  fornecedores,
  quoteId,
  supplierItems,
  onUpdateSupplierProductValue,
  onRefresh,
  isMobile,
  safeStr,
  getBestPriceInfoForProduct,
  isReadOnly = false
}: QuoteValuesTabProps) {
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const editInputRef = useRef<HTMLInputElement>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showMobileValues, setShowMobileValues] = useState(false);

  // Helper para formatar string de digitação para Real (ex: "1250" -> "12,50")
  const formatInputToBRL = (value: string) => {
    const digitOnly = value.replace(/\D/g, "");
    if (!digitOnly) return "";
    const numericValue = parseInt(digitOnly, 10) / 100;
    return numericValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Helper para converter string formatada em número (ex: "1.250,50" -> 1250.5)
  const parseBRLToNumber = (value: string) => {
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  };

  useEffect(() => {
    // Seleciona o primeiro fornecedor apenas se não houver um selecionado
    // e se a lista de fornecedores estiver disponível
    if (fornecedores.length > 0 && !selectedSupplier) {
      const firstId = fornecedores[0]?.id;
      if (firstId) {
        setSelectedSupplier(firstId);
      }
    }
  }, [fornecedores, selectedSupplier]);

  useEffect(() => {
    if (editingProductId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProductId]);

  const getSupplierProductValue = useCallback((supplierId: string, productId: string): number => {
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    return item?.valor_oferecido || 0;
  }, [supplierItems]);

  const getCurrentProductValue = useCallback((supplierId: string, productId: string): number => {
    if (selectedSupplier === supplierId && editedValues[productId] !== undefined) {
      return parseBRLToNumber(editedValues[productId]);
    }
    return getSupplierProductValue(supplierId, productId);
  }, [selectedSupplier, editedValues, getSupplierProductValue]);

  const handleStartEdit = useCallback((productId: string, currentValue: number) => {
    if (isReadOnly) return;
    setEditingProductId(productId);
    // Inicializa com o valor formatado (sem R$)
    const formatted = currentValue > 0
      ? currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "";
    setEditedValues(prev => ({ ...prev, [productId]: formatted }));
  }, [isReadOnly]);

  const handleSaveEdit = useCallback(async (productId: string, nextProductId?: string) => {
    if (selectedSupplier && editedValues[productId] !== undefined) {
      const newValue = parseBRLToNumber(editedValues[productId]);

      // Atualização otimista: avança para o próximo campo IMEDIATAMENTE
      if (nextProductId) {
        const nextVal = getSupplierProductValue(selectedSupplier, nextProductId);
        setEditingProductId(nextProductId);
        const formatted = nextVal > 0
          ? nextVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "";
        setEditedValues({ [nextProductId]: formatted });
      } else {
        setEditingProductId(null);
        setEditedValues({});
      }

      // Salva no banco em background (sem bloquear a UI)
      try {
        await onUpdateSupplierProductValue({
          quoteId,
          supplierId: selectedSupplier,
          productId,
          newValue
        });
        onRefresh();
      } catch {
        toast({ title: "Erro ao salvar valor", variant: "destructive" });
      }
    }
  }, [selectedSupplier, editedValues, quoteId, onUpdateSupplierProductValue, onRefresh, toast, getSupplierProductValue]);

  const handleCancelEdit = useCallback(() => {
    setEditingProductId(null);
    setEditedValues({});
  }, []);


  const handleInputChange = (productId: string, value: string) => {
    const formatted = formatInputToBRL(value);
    setEditedValues(prev => ({ ...prev, [productId]: formatted }));
  };

  const calcularTotalFornecedor = useCallback((supplierId: string) => {
    return products.reduce((sum: number, product: any) =>
      sum + getSupplierProductValue(supplierId, product.product_id), 0);
  }, [products, getSupplierProductValue]);

  const calcularTotalInicialFornecedor = useCallback((supplierId: string) => {
    return products.reduce((sum: number, product: any) => {
      const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === product.product_id);
      const val = Number(item?.valor_inicial) || Number(item?.valor_oferecido) || 0;
      return sum + val;
    }, 0);
  }, [products, supplierItems]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return fornecedores;
    return fornecedores.filter((f: any) => f.nome.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [fornecedores, supplierSearch]);

  const currentSupplier = useMemo(() =>
    fornecedores.find((f: any) => f.id === selectedSupplier),
    [fornecedores, selectedSupplier]
  );

  const handleWhatsApp = async (e: React.MouseEvent, supplierName: string, phone?: string) => {
    e.stopPropagation();
    
    // Alerta para confirmar que o clique foi capturado pelo código novo
    window.alert(`[WhatsApp DEBUG] Clicou em: ${supplierName}\nTelefone: ${phone || 'SEM TELEFONE'}`);
    
    const configured = isWhatsAppConfigured();
    console.log('[WhatsApp DEBUG] State:', { configured, token: !!import.meta.env.VITE_W_API_TOKEN });
    
    // Alerta definitivo para diagnóstico do .env no navegador
    window.alert(`DIAGNÓSTICO WHATSAPP:\n\nConfigurado: ${configured ? 'SIM' : 'NÃO'}\nToken no Navegador: ${import.meta.env.VITE_W_API_TOKEN ? 'SIM (Começa com ' + import.meta.env.VITE_W_API_TOKEN.substring(0,3) + ')' : 'NÃO'}\n\nSe aparecer NÃO, o seu .env não está sendo lido pelo Vite.`);
    
    console.log('[WhatsApp DEBUG] ========================================');
    console.log('[WhatsApp DEBUG] isWhatsAppConfigured():', configured);
    console.log('[WhatsApp DEBUG] phone:', phone);
    console.log('[WhatsApp DEBUG] supplierName:', supplierName);
    console.log('[WhatsApp DEBUG] Vai usar API?', configured && !!phone);
    console.log('[WhatsApp DEBUG] ========================================');
    
    if (configured && phone) {
      try {
        toast({ title: "Enviando cotação para o WhatsApp...", description: `Fornecedor: ${supplierName}` });
        const msg = await generateWhatsAppMessage(supplierName, products);
        console.log('[WhatsApp DEBUG] Mensagem gerada, chamando sendWhatsAppMessage...');
        const result = await sendWhatsAppMessage(null, phone, msg);
        console.log('[WhatsApp DEBUG] Resultado:', JSON.stringify(result));
        
        if (result.success) {
          toast({ title: "✅ Cotação enviada com sucesso!", variant: "default" });
        } else {
          throw new Error(result.error || "Erro desconhecido");
        }
      } catch (error: any) {
        console.error("[WhatsApp DEBUG] Erro no envio via API:", error);
        toast({ 
          title: "Erro ao enviar via API", 
          description: error?.message || "Erro de validação ou conexão",
          variant: "destructive" 
        });
        
        // TEMPORARIAMENTE: Não vamos abrir o WhatsApp manual automaticamente quando houver falha,
        // para que possamos ler a mensagem de erro da API na tela.
      }
    } else {
      console.log('[WhatsApp DEBUG] ❌ Caiu no modo MANUAL (wa.me link)');
      console.log('[WhatsApp DEBUG] Motivo:', !configured ? 'API não configurada' : 'Sem telefone');
      // Modo manual original
      const msg = await generateWhatsAppMessage(supplierName, products);
      const url = phone 
        ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-transparent overflow-hidden">
      {/* Sidebar - Lista de Fornecedores */}
      <div className={cn(
        "w-full md:w-60 flex-shrink-0 border-b md:border-b-0 md:border-r border-border/50 flex flex-col bg-muted/10",
        isMobile && showMobileValues ? "hidden" : "flex"
      )}>
        <div className="p-3 border-b border-border/50 bg-card/50">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-zinc-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Participantes</span>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-brand transition-colors" />
            <Input
              placeholder="Filtro rápido..."
              value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs bg-background border-border/50 shadow-sm focus:border-brand/50 focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
          {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((fornecedor: any) => {
              const total = calcularTotalFornecedor(fornecedor.id);
              const totalInicial = calcularTotalInicialFornecedor(fornecedor.id);
              const economiaTotal = totalInicial > total ? totalInicial - total : 0;
              const isSelected = selectedSupplier === fornecedor.id;

              return (
                <button
                  key={fornecedor.id}
                  onClick={() => {
                    setSelectedSupplier(fornecedor.id);
                    setEditingProductId(null);
                    if (isMobile) setShowMobileValues(true);
                  }}
                  className={cn(
                    "w-full p-3 rounded-xl transition-all duration-300 flex flex-col gap-1.5 text-left border relative overflow-hidden",
                    isSelected 
                      ? "bg-brand/10 border-brand/40 shadow-sm" 
                      : "bg-card hover:bg-muted/50 border-border/50 hover:border-brand/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <span className={cn(
                      "text-[11px] font-bold uppercase truncate tracking-tight",
                      isSelected ? "text-brand" : "text-foreground"
                    )}>
                      {fornecedor.nome}
                    </span>
                    <Badge variant={isSelected ? "default" : "outline"} className={cn(
                      "h-4 px-1 text-[8px] font-black uppercase tracking-tighter",
                      isSelected ? "bg-brand text-black" : "text-muted-foreground"
                    )}>
                      {total > 0 ? formatCurrency(total) : "Pendente"}
                    </Badge>
                  </div>
                  
                  {economiaTotal > 0 && (
                    <div className="flex items-center gap-1.5 opacity-80 z-10">
                      <div className="h-1 w-1 rounded-full bg-emerald-500" />
                      <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">
                        Economia: {formatCurrency(economiaTotal)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-1 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        fornecedor.status === 'respondido' ? "bg-brand shadow-[0_0_8px_hsl(var(--brand))]" : "bg-zinc-300 dark:bg-zinc-700"
                      )} />
                      <span className="text-[8px] font-black uppercase text-zinc-400 tracking-tighter">
                        {fornecedor.status === 'respondido' ? "Respondeu" : "Pendente"}
                      </span>
                    </div>
                    <div
                      onClick={(e) => handleWhatsApp(e, fornecedor.nome, fornecedor.phone)}
                      className={cn(
                        "flex items-center justify-center p-1.5 rounded-lg transition-colors border cursor-pointer",
                        isSelected
                          ? "bg-brand/10 text-brand border-brand/20 hover:bg-brand hover:text-black"
                          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-brand hover:text-black"
                      )}
                      title="Enviar Cotação via WhatsApp"
                    >
                      <MessageCircle className="h-3 w-3" />
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <Inbox className="h-6 w-6 text-zinc-300 mx-auto mb-2 opacity-20" />
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Nenhum fornecedor</p>
            </div>
          )}
        </div>
      </div>

      {/* Área Principal - Valores */}
      <div className={cn(
        "flex-1 flex flex-col bg-background overflow-hidden",
        isMobile && !showMobileValues ? "hidden" : "flex"
      )}>
        {isMobile && (
          <div className="flex items-center gap-2 p-4 border-b border-border/50 bg-card">
            <Button variant="ghost" className="h-9 px-2 rounded-xl" onClick={() => setShowMobileValues(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-xs font-bold">Trocar Fornecedor</span>
            </Button>
          </div>
        )}

        {selectedSupplier ? (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-card/50 flex-shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                <div className="p-2 rounded-xl bg-brand/10 flex-shrink-0">
                  <Building2 className="h-5 w-5 text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Gerenciando Valores:</p>
                  <p className="text-lg font-black text-foreground tracking-tight truncate" title={currentSupplier?.nome}>{currentSupplier?.nome}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end flex-shrink-0">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Valor Proposto</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-bold text-brand">R$</span>
                  <div className="flex flex-col items-end">
                    <p className="text-xl font-black text-foreground">
                      {calcularTotalFornecedor(selectedSupplier).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {(() => {
                      const totalC = calcularTotalFornecedor(selectedSupplier);
                      const totalI = calcularTotalInicialFornecedor(selectedSupplier);
                      if (totalI > totalC && totalC > 0) {
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-zinc-400 line-through">
                              {formatCurrency(totalI)}
                            </span>
                            <Badge className="bg-emerald-500 text-black border-none h-4 px-1.5 text-[9px] font-black uppercase tracking-tighter">
                              Economia: {formatCurrency(totalI - totalC)}
                            </Badge>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {!isMobile && (
              <div className="px-6 py-3 border-b border-border/50 bg-muted/30 flex-shrink-0">
                <div className="grid grid-cols-[3fr_80px_100px_140px_auto] gap-4 items-center px-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Produto</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Unid.</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Quant.</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right pr-4">Valor (R$)</span>
                  <div className="w-10" />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1 pb-16">
              {products.map((product: any, index: number) => {
                const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                const isEditing = editingProductId === product.product_id;
                const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                const isBest = currentValue > 0 && selectedSupplier === bestSupplierId;

                return (
                  <div
                    key={product.product_id}
                    className={cn(
                      "group py-1 px-4 rounded-xl border transition-all duration-200",
                      isBest
                        ? "bg-brand/5 border-brand/20 shadow-sm"
                        : currentValue === 0
                        ? "bg-muted/20 border-border/50 opacity-60 hover:opacity-100 grayscale-[0.5]"
                        : "bg-card border-border hover:border-brand/30"
                    )}
                  >
                    {isEditing ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1 animate-in fade-in zoom-in-95">
                        <div className="flex-1 min-w-0 w-full">
                          <p className="font-black text-xs text-zinc-900 dark:text-zinc-50 uppercase tracking-tight truncate">{safeStr(product.product_name)}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">{product.quantidade} {product.unidade}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative group/input">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400 group-focus-within/input:text-brand transition-colors">R$</span>
                            <Input
                              ref={editInputRef}
                              type="text"
                              inputMode="numeric"
                              value={editedValues[product.product_id] || ""}
                              onChange={(e) => handleInputChange(product.product_id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Tab') {
                                  e.preventDefault();
                                  const nextProduct = products[index + 1];
                                  handleSaveEdit(product.product_id, nextProduct?.product_id);
                                }
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className={cn(
                                designSystem.components.input.root,
                                "w-36 h-10 pl-9 rounded-xl text-center font-black text-sm border-brand/30 focus:border-brand focus:ring-1 focus:ring-brand/20"
                              )}
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" className="h-10 w-10 rounded-xl bg-brand hover:bg-brand/90 text-black shadow-lg shadow-brand/10" onClick={() => handleSaveEdit(product.product_id)}>
                              <Check className="h-5 w-5 stroke-[3px]" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10" onClick={handleCancelEdit}>
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={cn(isMobile ? "flex items-center justify-between" : "grid grid-cols-[3fr_80px_100px_140px_auto] gap-4 items-center")}>
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-sm" title={product.product_name}>{safeStr(product.product_name)}</p>
                          {isMobile && (
                            <p className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">
                              {product.quantidade} {product.unidade}
                              {isBest && <span className="ml-2 text-brand font-black">🏆 MELHOR PREÇO</span>}
                            </p>
                          )}
                        </div>
                        {!isMobile && (
                          <>
                            <div className="text-center">
                              <Badge variant="outline" className="h-5 px-2 text-[9px] font-black uppercase text-muted-foreground border-border/50 bg-background">{safeStr(product.unidade)}</Badge>
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-black text-foreground">{safeStr(product.quantidade)}</span>
                            </div>
                          </>
                        )}
                        <div className="text-right pr-2">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1">
                              {currentValue > 0 ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <p className={cn("text-base font-black tracking-tight", isBest ? "text-brand" : "text-zinc-900 dark:text-zinc-100")}>
                                      {formatCurrency(currentValue)}
                                    </p>
                                    {(() => {
                                      const itemData = supplierItems.find((i: any) => i?.supplier_id === selectedSupplier && i?.product_id === product.product_id);
                                      const hasHistory = itemData?.price_history && itemData.price_history.length > 0;
                                      if (!hasHistory) return null;
                                      
                                      return (
                                        <TooltipProvider delayDuration={100}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="cursor-help flex items-center justify-center p-0.5 rounded text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:text-brand hover:bg-brand/10 transition-colors">
                                                <History className="h-3 w-3" />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="min-w-[140px] p-2 bg-zinc-900 border-zinc-800 text-zinc-100">
                                              <p className="text-[9px] font-black uppercase mb-1.5 text-zinc-400 tracking-widest border-b border-zinc-800 pb-1">Histórico de Preços</p>
                                              <ul className="space-y-1">
                                                {itemData.price_history.map((h: any, i: number) => {
                                                  const isLast = i === itemData.price_history.length - 1;
                                                  const nextVal = isLast ? currentValue : itemData.price_history[i+1].old_value;
                                                  return (
                                                    <li key={i} className="flex flex-col text-[10px]">
                                                      <div className="flex justify-between items-center gap-3">
                                                        <div className="flex items-center gap-1">
                                                          <span className="line-through text-red-400/80">{formatCurrency(h.old_value)}</span>
                                                          <span className="text-zinc-600">→</span>
                                                          <span className="text-emerald-400">{formatCurrency(nextVal)}</span>
                                                        </div>
                                                        <span className="text-[8px] text-zinc-500 bg-zinc-800 px-1 rounded">
                                                          {new Date(h.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} {new Date(h.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                      </div>
                                                    </li>
                                                  );
                                                })}
                                              </ul>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      );
                                    })()}
                                  </div>
                                  {(() => {
                                    const itemData = supplierItems.find((i: any) => i?.supplier_id === selectedSupplier && i?.product_id === product.product_id);
                                    const initialValue = Number(itemData?.valor_inicial) || 0;
                                    const savings = (initialValue > currentValue && currentValue > 0) ? (initialValue - currentValue) : 0;
                                    
                                    if (savings > 0) {
                                      return (
                                        <div className="flex items-center gap-1">
                                          <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 line-through opacity-70">
                                            {formatCurrency(initialValue)}
                                          </p>
                                          <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-none h-3 px-1 text-[8px] font-black mr-1">
                                            -{((savings / initialValue) * 100).toFixed(0)}%
                                          </Badge>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 mt-0.5">
                                  Não Cotado
                                </Badge>
                              )}
                              <LastPaidPricesTooltip productId={product.product_id} />
                            </div>
                            {!isMobile && isBest && <p className="text-[8px] font-black text-brand uppercase tracking-tighter mt-0.5">🏆 MELHOR PREÇO</p>}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {!isReadOnly && (
                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-brand hover:bg-brand/10" onClick={() => handleStartEdit(product.product_id, currentValue)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
            <Building2 className="h-12 w-12 text-zinc-400 mb-6" />
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase">Selecione um fornecedor</h3>
          </div>
        )}
      </div>
    </div>
  );
}
