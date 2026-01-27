import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Building2, Search, ArrowLeft, DollarSign, Edit2, Check, X, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { designSystem } from "@/styles/design-system";
import { formatCurrency } from "@/utils/formatters";

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
  readOnly?: boolean;
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
  readOnly = false
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
    if (fornecedores.length > 0 && !selectedSupplier) {
      setSelectedSupplier(fornecedores[0].id);
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
    setEditingProductId(productId);
    // Inicializa com o valor formatado (sem R$)
    const formatted = currentValue > 0
      ? currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "";
    setEditedValues(prev => ({ ...prev, [productId]: formatted }));
  }, []);

  const handleSaveEdit = useCallback(async (productId: string) => {
    if (selectedSupplier && editedValues[productId] !== undefined) {
      try {
        const newValue = parseBRLToNumber(editedValues[productId]);
        await onUpdateSupplierProductValue({
          quoteId,
          supplierId: selectedSupplier,
          productId,
          newValue
        });
        setEditingProductId(null);
        setEditedValues({});
        toast({ title: "Valor atualizado!" });
        onRefresh();
      } catch {
        toast({ title: "Erro ao salvar", variant: "destructive" });
      }
    }
  }, [selectedSupplier, editedValues, quoteId, onUpdateSupplierProductValue, onRefresh, toast]);

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

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return fornecedores;
    return fornecedores.filter((f: any) => f.nome.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [fornecedores, supplierSearch]);

  const currentSupplier = useMemo(() =>
    fornecedores.find((f: any) => f.id === selectedSupplier),
    [fornecedores, selectedSupplier]
  );

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-transparent overflow-hidden">
      {/* Sidebar - Lista de Fornecedores */}
      <div className={cn(
        "w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 flex flex-col bg-zinc-50/30 dark:bg-zinc-950/20",
        isMobile && showMobileValues ? "hidden" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
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
              className={cn(designSystem.components.input.root, "pl-9 h-9 rounded-xl text-xs bg-white dark:bg-zinc-950")}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((fornecedor: any) => {
              const total = calcularTotalFornecedor(fornecedor.id);
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
                    "w-full text-left p-3 rounded-2xl border transition-all duration-200 relative overflow-hidden group",
                    isSelected
                      ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md ring-1 ring-brand/20"
                      : "bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                  )}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={cn("w-2 h-2 rounded-full", fornecedor.status === 'respondido' ? "bg-brand shadow-[0_0_8px_hsl(var(--brand))]" : "bg-zinc-300 dark:bg-zinc-700")} />
                    <span className={cn("text-xs font-bold truncate", isSelected ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500")} title={fornecedor.nome}>{safeStr(fornecedor.nome)}</span>
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span className={cn("text-[11px] font-black", isSelected ? "text-brand" : "text-zinc-400")}>
                      {formatCurrency(total)}
                    </span>
                    {fornecedor.status === 'respondido' && isSelected && (
                      <div className="h-4 px-1.5 rounded bg-brand/10 text-brand text-[9px] font-black tracking-tighter">RESPONDEU</div>
                    )}
                  </div>
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
        "flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden",
        isMobile && !showMobileValues ? "hidden" : "flex"
      )}>
        {isMobile && (
          <div className="flex items-center gap-2 p-4 border-b border-zinc-100 dark:border-zinc-800">
            <Button variant="ghost" className="h-9 px-2 rounded-xl" onClick={() => setShowMobileValues(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-xs font-bold">Trocar Fornecedor</span>
            </Button>
          </div>
        )}

        {selectedSupplier ? (
          <>
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20 flex-shrink-0">
              <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                <div className="p-3 rounded-2xl bg-brand/10 flex-shrink-0">
                  <Building2 className="h-5 w-5 text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Gerenciando Valores:</p>
                  <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate" title={currentSupplier?.nome}>{currentSupplier?.nome}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end flex-shrink-0">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Valor Proposto</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-brand">R$</span>
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    {calcularTotalFornecedor(selectedSupplier).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {!isMobile && (
              <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 flex-shrink-0">
                <div className="grid grid-cols-[3fr_80px_100px_140px_auto] gap-4 items-center px-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Produto</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Unid.</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Quant.</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right pr-4">Valor (R$)</span>
                  <div className="w-10" />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-1 pb-20">
              {products.map((product: any) => {
                const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                const isEditing = editingProductId === product.product_id;
                const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                const isBest = currentValue > 0 && selectedSupplier === bestSupplierId;

                return (
                  <div
                    key={product.product_id}
                    className={cn(
                      "group py-1.5 px-5 rounded-xl border transition-all duration-300",
                      isBest
                        ? "bg-brand/5 border-brand/20 shadow-sm"
                        : "bg-white dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
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
                                if (e.key === 'Enter') handleSaveEdit(product.product_id);
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
                              <Badge variant="outline" className="h-5 px-2 text-[9px] font-black uppercase text-zinc-500 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">{safeStr(product.unidade)}</Badge>
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">{safeStr(product.quantidade)}</span>
                            </div>
                          </>
                        )}
                        <div className="text-right pr-2">
                          <div className="flex flex-col items-end">
                            <p className={cn("text-base font-black tracking-tight", isBest ? "text-brand" : "text-zinc-900 dark:text-zinc-100")}>
                              {formatCurrency(currentValue)}
                            </p>
                            {!isMobile && isBest && <p className="text-[8px] font-black text-brand uppercase tracking-tighter mt-0.5">🏆 MELHOR PREÇO</p>}
                          </div>
                        </div>
                        <div className="flex-shrink-0 min-w-[40px] flex justify-end">
                          {!readOnly && (
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
