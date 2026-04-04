import { useState, useRef, useMemo, useEffect, useCallback } from "react";
console.log('[WhatsApp DEBUG] QuoteValuesTab.tsx carregado!');
import { Building2, Search, ArrowLeft, DollarSign, Edit2, Check, X, Inbox, MessageCircle, History, Smartphone, User, Trophy, Link as LinkIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { designSystem } from "@/styles/design-system";
import { formatCurrency } from "@/utils/formatters";
import { LastPaidPricesTooltip } from "./LastPaidPricesTooltip";
import { generateWhatsAppMessage } from "@/lib/gemini";
import { sendWhatsAppMessage, isWhatsAppConfigured } from "@/lib/whatsapp-service";

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
  
  // Agrupamento de cotações
  const [otherOpenQuotes, setOtherOpenQuotes] = useState<any[]>([]);
  const [useGroupedLink, setUseGroupedLink] = useState(false);

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

  // Busca se esse fornecedor está em outras cotações "ativas"
  useEffect(() => {
    setOtherOpenQuotes([]);
    setUseGroupedLink(false);

    const fetchOtherQuotes = async () => {
      if (!selectedSupplier || !quoteId) return;

      console.log("🔍 [QuoteValues] Scanning other quotes for supplier:", selectedSupplier);

      try {
        const { data, error } = await supabase
          .from('quote_suppliers')
          .select(`
            quote_id,
            access_token,
            quotes!inner (
              id,
              status,
              data_inicio
            )
          `)
          .eq('supplier_id', selectedSupplier)
          .neq('quote_id', quoteId)
          .in('quotes.status', ['ativa', 'ativo', 'aberto', 'pendente']);

        if (error) {
          console.error("❌ [QuoteValues] Error fetching other quotes:", error);
          return;
        }

        console.log("📊 [QuoteValues] Other quotes found for supplier:", data);

        const formatted = (data || []).map((q: any) => {
          const quoteInfo = Array.isArray(q.quotes) ? q.quotes[0] : q.quotes;
          return {
            id: q.quote_id,
            token: q.access_token,
            status: quoteInfo?.status || 'desconhecido'
          };
        }).filter(q => q.token);
        
        console.log("✅ [QuoteValues] Formatted other quotes with tokens:", formatted);
        setOtherOpenQuotes(formatted);
      } catch (err) {
        console.error("❌ [QuoteValues] Unexpected error scanning quotes:", err);
      }
    };

    fetchOtherQuotes();
  }, [selectedSupplier, quoteId]);

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
  
  // Função auxiliar para encurtar links
  const getShortLink = async (originalTokens: string) => {
    try {
      // 1. Verifica se já existe um link para esses tokens
      const { data: existing } = await supabase
        .from('short_links')
        .select('id')
        .eq('original_tokens', originalTokens)
        .maybeSingle();
        
      if (existing) return existing.id;
      
      // 2. Se não existir, cria um novo código curto de 6 dígitos
      const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error } = await supabase
        .from('short_links')
        .insert([{ id: shortId, original_tokens: originalTokens }]);
        
      if (error) {
        console.error("[ShortLink] Erro ao criar:", error);
        return null;
      }
      
      return shortId;
    } catch (err) {
      console.error("[ShortLink] Falha:", err);
      return null;
    }
  };

  const handleWhatsApp = async (e: React.MouseEvent, supplierId: string, supplierName: string, contactPerson?: string, phone?: string, accessToken?: string) => {
    e.stopPropagation();
    
    // Busca o fornecedor correto pelo ID passado (não depende do state selectedSupplier)
    const targetSupplier = fornecedores.find((f: any) => f.id === supplierId);
    const configured = isWhatsAppConfigured();
    
    if (configured && phone) {
      try {
        toast({ title: "Enviando cotação para o WhatsApp...", description: `Para: ${contactPerson || supplierName}` });
        // Prioritize the salesperson's name for the message greeting
        const greetingName = contactPerson || targetSupplier?.contact || targetSupplier?.contato || supplierName;
        let msg = await generateWhatsAppMessage(greetingName, products, !!accessToken);
        
        // Adiciona link do portal se existir token
        if (accessToken) {
          const baseUrl = window.location.origin;
          const currentToken = targetSupplier?.accessToken || targetSupplier?.access_token || accessToken;
          const tokens = useGroupedLink ? [currentToken, ...otherOpenQuotes.map(q => q.token)].join(',') : currentToken;

          // Tenta encurtar o link
          console.log('[WhatsApp DEBUG] Gerando link curto para:', tokens);
          const shortId = await getShortLink(tokens);
          
          if (shortId) {
            msg += `\n${baseUrl}/r/${shortId}\n\n`;
          } else {
            // Fallback para link longo se falhar
            msg += `\n${baseUrl}/responder/${tokens}\n\n`;
          }
          
          if (useGroupedLink && otherOpenQuotes.length > 0) {
            msg += `🛡️ *Acesso Unificado:* Link único reunindo tudo o que precisamos cotar agora.`;
          } else {
            msg += `🛡️ *Link Seguro:* Acesso exclusivo e seguro para sua empresa.`;
          }
        }
        
        msg += `\n\nEquipe de Compras`;
        
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
      }
    } else {
      console.log('[WhatsApp DEBUG] ❌ Caiu no modo MANUAL (wa.me link)');
      const greetingName = contactPerson || targetSupplier?.contact || targetSupplier?.contato || supplierName;
      let msg = await generateWhatsAppMessage(greetingName, products, !!accessToken);

      if (accessToken) {
        const baseUrl = window.location.origin;
        const currentToken = targetSupplier?.accessToken || targetSupplier?.access_token || accessToken;
        const tokens = useGroupedLink ? [currentToken, ...otherOpenQuotes.map(q => q.token)].join(',') : currentToken;

        // Tenta encurtar o link (modo manual)
        const shortId = await getShortLink(tokens);
        
        if (shortId) {
          msg += `\n${baseUrl}/r/${shortId}\n\n`;
        } else {
          msg += `\n${baseUrl}/responder/${tokens}\n\n`;
        }
        
        if (useGroupedLink && otherOpenQuotes.length > 0) {
          msg += `🛡️ *Acesso Unificado:* Link único reunindo tudo o que precisamos cotar agora.`;
        } else {
          msg += `🛡️ *Link Seguro:* Acesso exclusivo e seguro para sua empresa.`;
        }
      }

      msg += `\n\nEquipe de Compras`;

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
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-tighter",
                        fornecedor.status === 'respondido' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                      )}>
                        {fornecedor.status === 'respondido' ? "📲 VIA PORTAL" : "Pendente"}
                      </span>
                    </div>
                    <div
                      onClick={(e) => {
                        // Auto-seleciona o fornecedor antes de enviar
                        setSelectedSupplier(fornecedor.id);
                        setEditingProductId(null);
                        handleWhatsApp(e, fornecedor.id, fornecedor.nome, fornecedor.contact || fornecedor.contato, fornecedor.phone, fornecedor.accessToken);
                      }}
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
                  
                  {/* Indicador de Acesso ao Portal */}
                  {fornecedor.accessToken ? (
                    <div className="absolute right-0 bottom-0 px-1.5 py-0.5 bg-brand/10 text-[6px] text-brand rounded-tl-md font-black uppercase tracking-tighter">
                      ACESSO ATIVO
                    </div>
                  ) : (
                    <div className="absolute right-0 bottom-0 px-1.5 py-0.5 bg-red-500/5 text-[6px] text-red-400 rounded-tl-md font-black uppercase tracking-tighter">
                      SEM ACESSO
                    </div>
                  )}
                  
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

              {otherOpenQuotes.length > 0 && (
                <div className="hidden lg:flex items-center gap-3 mr-6 animate-in slide-in-from-right-4">
                  <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] font-black uppercase tracking-tighter">
                    {otherOpenQuotes.length} vínculo{otherOpenQuotes.length > 1 ? 's' : ''} encontrado{otherOpenQuotes.length > 1 ? 's' : ''}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          onClick={() => setUseGroupedLink(!useGroupedLink)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0",
                            useGroupedLink 
                              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" 
                              : "bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-50"
                          )}
                        >
                          <Check className={cn("h-3.5 w-3.5", useGroupedLink ? "opacity-100" : "opacity-0 w-0 h-0 hidden")} />
                          {useGroupedLink ? "Agrupamento Ativado" : "Agrupar Link Unificado"}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-amber-900 text-white border-amber-800 text-xs max-w-xs shadow-xl rounded-xl">
                        As outras cotações serão resolvidas no mesmo link (mesma tela) ao enviar via WhatsApp!
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

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

            {/* Banner de mobile/tablet para link unificado */}
            {otherOpenQuotes.length > 0 && (
              <div className="lg:hidden px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[10px] font-black text-amber-900 dark:text-amber-300 uppercase tracking-tight">
                    {otherOpenQuotes.length} cotação{otherOpenQuotes.length > 1 ? 's' : ''} extra{otherOpenQuotes.length > 1 ? 's' : ''}
                  </span>
                </div>
                <button 
                  onClick={() => setUseGroupedLink(!useGroupedLink)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all",
                    useGroupedLink 
                      ? "bg-amber-600 text-white" 
                      : "bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  )}
                >
                  {useGroupedLink ? "Agrupado" : "Agrupar"}
                </button>
              </div>
            )}

            {!isMobile && (
              <div className="px-6 py-3 border-b border-border/50 bg-muted/30 flex-shrink-0">
                  <div className="grid grid-cols-[3fr_60px_60px_280px_auto] gap-4 items-center px-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Produto</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Un.</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Qtde.</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right pr-2">Negociação e Valor</span>
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
                      <div className={cn(isMobile ? "flex items-center justify-between" : "grid grid-cols-[3fr_60px_60px_280px_auto] gap-4 items-center h-11")}>
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-[13px]" title={product.product_name}>{safeStr(product.product_name)}</p>
                          {isMobile && (
                            <p className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">
                              {product.quantidade} {product.unidade}
                              {isBest && <span className="ml-2 text-brand font-black">🏆</span>}
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
                        <div className="flex items-center justify-end gap-2 pr-2">
                          {currentValue > 0 ? (
                            <div className="flex items-center gap-3">
                              {/* Melhor Preço Indicator */}
                              <div className="w-5 flex justify-center">
                                {isBest && (
                                  <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center justify-center h-5 w-5 bg-brand/10 text-brand rounded-full animate-pulse">
                                          <Trophy className="h-3 w-3" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-brand text-black font-black text-[10px] uppercase border-none shadow-xl"> Melhor Preço Garantido </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>

                              {/* Preço Principal */}
                              <p className={cn(
                                "text-[14px] font-black tracking-tight w-[75px] text-right",
                                isBest ? "text-brand" : "text-zinc-900 dark:text-zinc-100"
                              )}>
                                {formatCurrency(currentValue)}
                              </p>

                              {/* Ícone de Origem */}
                              <div className="w-6 flex justify-center">
                                {(() => {
                                  const itemData = supplierItems.find((i: any) => i?.supplier_id === selectedSupplier && i?.product_id === product.product_id);
                                  const isFromSupplier = itemData?.updated_by_type === 'fornecedor';
                                  
                                  return (
                                    <TooltipProvider delayDuration={100}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className={cn(
                                            "flex items-center justify-center h-6 w-6 rounded-md border shadow-sm transition-all shrink-0",
                                            isFromSupplier 
                                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                          )}>
                                            {isFromSupplier ? <Smartphone className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border-zinc-800 text-white shadow-xl">
                                          {isFromSupplier ? "Preenchido via Link" : "Preenchido Manual"}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                })()}
                              </div>

                              {/* Histórico */}
                              <div className="w-6 flex justify-center">
                                {(() => {
                                  const itemData = supplierItems.find((i: any) => i?.supplier_id === selectedSupplier && i?.product_id === product.product_id);
                                  const historyArray = Array.isArray(itemData?.price_history) ? itemData.price_history : [];
                                  if (historyArray.length === 0) return <div className="w-6" />;
                                  
                                  return (
                                    <TooltipProvider delayDuration={100}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="cursor-help flex items-center justify-center h-6 w-6 rounded-md text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:text-brand hover:bg-brand/10 transition-colors">
                                            <History className="h-3.5 w-3.5" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden min-w-[220px]">
                                          <div className="bg-zinc-900 text-white p-3 border-b border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <History className="h-4 w-4 text-brand" />
                                              <span className="text-[11px] font-black uppercase tracking-widest leading-none">Negociação</span>
                                            </div>
                                            <Badge className="bg-white/10 text-white/70 border-none text-[10px] font-black h-5 px-1.5">
                                              {historyArray.length} etapas
                                            </Badge>
                                          </div>
                                          <div className="bg-zinc-950 p-2 max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
                                            {[...historyArray].reverse().map((entry: any, auditIdx: number) => {
                                              const isBuyerAudit = entry.by === 'comprador';
                                              return (
                                                <div key={auditIdx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 hover:bg-white/[0.06] transition-colors group/audit">
                                                  <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                      <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                                                        isBuyerAudit ? "bg-blue-500 shadow-blue-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                                                      )} />
                                                      <span className="text-[10px] font-black uppercase tracking-tight text-white/60">
                                                        {isBuyerAudit ? 'Comprador' : 'Vendedor'}
                                                      </span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                                                      {entry.date ? new Date(entry.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center justify-between font-mono bg-black/20 p-2 rounded-lg border border-white/5">
                                                    <span className="text-white/30 line-through text-[10px]">{formatCurrency(entry.old_value)}</span>
                                                    <div className="h-px w-3 bg-white/10" />
                                                    <span className={cn(
                                                      "text-xs font-black italic tracking-tighter",
                                                      entry.new_value < entry.old_value ? "text-emerald-400" : "text-white"
                                                    )}>
                                                      {formatCurrency(entry.new_value)}
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                })()}
                              </div>

                              {/* Savings % */}
                              <div className="w-[45px] flex justify-end">
                                {(() => {
                                  const itemData = supplierItems.find((i: any) => i?.supplier_id === selectedSupplier && i?.product_id === product.product_id);
                                  const initialValue = Number(itemData?.valor_inicial) || 0;
                                  const currentPriceValue = currentValue;
                                  const savings = (initialValue > currentPriceValue && currentPriceValue > 0) ? (initialValue - currentPriceValue) : 0;
                                  
                                  if (savings > 0) {
                                    return (
                                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none h-5 px-1.5 text-[10px] font-black">
                                        -{((savings / initialValue) * 100).toFixed(0)}%
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          ) : (
                            <div className="text-right w-[150px]">
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                                Não Cotado
                              </Badge>
                            </div>
                          )}
                          <LastPaidPricesTooltip productId={product.product_id} />
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
