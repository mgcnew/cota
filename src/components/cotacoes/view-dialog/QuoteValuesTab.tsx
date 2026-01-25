import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Building2, Search, ArrowLeft, DollarSign, Edit2, Check, X, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { designSystem } from "@/styles/design-system";

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
  getBestPriceInfoForProduct
}: QuoteValuesTabProps) {
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string | number>>({});
  const editInputRef = useRef<HTMLInputElement>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showMobileValues, setShowMobileValues] = useState(false);

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
      const val = editedValues[productId];
      return typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.')) || 0;
    }
    return getSupplierProductValue(supplierId, productId);
  }, [selectedSupplier, editedValues, getSupplierProductValue]);

  const handleStartEdit = useCallback((productId: string, currentValue: number) => {
    setEditingProductId(productId);
    setEditedValues(prev => ({ ...prev, [productId]: currentValue ? currentValue.toString() : "" }));
  }, []);

  const handleSaveEdit = useCallback(async (productId: string) => {
    if (selectedSupplier && editedValues[productId] !== undefined) {
      try {
        const newValue = parseFloat(String(editedValues[productId]).replace(',', '.')) || 0;
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
  }, [selectedSupplier, editedValues, quoteId, onUpdateSupplierProductValue, onRefresh]);

  const handleCancelEdit = useCallback(() => {
    setEditingProductId(null);
    setEditedValues({});
  }, []);

  const calcularTotalFornecedor = useCallback((supplierId: string) => {
    return products.reduce((sum: number, product: any) =>
      sum + getSupplierProductValue(supplierId, product.product_id), 0);
  }, [products, getSupplierProductValue]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return fornecedores;
    return fornecedores.filter((f: any) => f.nome.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [fornecedores, supplierSearch]);

  return (
    <div className="flex h-full bg-transparent">
      {/* Sidebar - Lista de Fornecedores */}
      <div className={cn(
        "w-72 flex-shrink-0 border-r border-zinc-100 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/30",
        isMobile && showMobileValues ? "hidden" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-zinc-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fornecedores Participantes</span>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-[#83E509] transition-colors" />
            <Input
              placeholder="Filtro rápido..."
              value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)}
              className={cn("pl-9 h-9 rounded-xl text-xs", designSystem.components.input.root)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((fornecedor: any) => {
                const total = calcularTotalFornecedor(fornecedor.id);
                const isSelected = selectedSupplier === fornecedor.id;
                const matchesSearch = supplierSearch && fornecedor.nome.toLowerCase().includes(supplierSearch.toLowerCase());

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
                        ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md ring-1 ring-[#83E509]/20"
                        : "bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#83E509]" />
                    )}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        fornecedor.status === 'respondido' ? "bg-[#83E509] shadow-[0_0_8px_#83E509]" : "bg-zinc-300 dark:bg-zinc-700"
                      )} />
                      <span className={cn(
                        "text-xs font-bold truncate transition-colors",
                        isSelected ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500"
                      )}>{safeStr(fornecedor.nome)}</span>
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <span className={cn(
                        "text-[11px] font-black",
                        isSelected ? "text-[#83E509]" : "text-zinc-400"
                      )}>
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {fornecedor.status === 'respondido' && isSelected && (
                        <div className="h-4 px-1.5 rounded bg-[#83E509]/10 text-[#83E509] text-[9px] font-black tracking-tighter">RESPONDEU</div>
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
        </ScrollArea>
      </div>

      {/* Área Principal - Valores */}
      <div className={cn(
        "flex-1 flex flex-col bg-white dark:bg-zinc-950",
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
            {/* Header do Fornecedor */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-[#83E509]/10">
                  <DollarSign className="h-5 w-5 text-[#83E509]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Editando Valores de:</p>
                  <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {fornecedores.find((f: any) => f.id === selectedSupplier)?.nome}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Total Geral</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-[#83E509]">R$</span>
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    {calcularTotalFornecedor(selectedSupplier).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Produtos */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-3">
                {products.map((product: any) => {
                  const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                  const isEditing = editingProductId === product.product_id;
                  const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                  const isBest = currentValue > 0 && selectedSupplier === bestSupplierId;

                  return (
                    <div
                      key={product.product_id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all duration-200",
                        isBest
                          ? "bg-[#83E509]/5 border-[#83E509]/20"
                          : "bg-white dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800"
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{safeStr(product.product_name)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-black uppercase text-zinc-500 border-zinc-200 dark:border-zinc-800">
                            {safeStr(product.quantidade)} {safeStr(product.unidade)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-1">
                            <Input
                              ref={editInputRef}
                              type="text"
                              inputMode="decimal"
                              value={editedValues[product.product_id] || ""}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, [product.product_id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(product.product_id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className={cn("w-32 h-10 rounded-xl text-center font-bold", designSystem.components.input.root)}
                            />
                            <Button size="icon" className="h-10 w-10 rounded-xl bg-[#83E509] hover:bg-[#83E509]/80 text-black shadow-lg shadow-[#83E509]/20" onClick={() => handleSaveEdit(product.product_id)}>
                              <Check className="h-5 w-5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-500/10" onClick={handleCancelEdit}>
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={cn(
                                "text-lg font-black tracking-tight",
                                isBest ? "text-[#83E509]" : "text-zinc-900 dark:text-zinc-100"
                              )}>
                                R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              {isBest && (
                                <p className="text-[9px] font-black text-[#83E509] uppercase tracking-tighter">🏆 MELHOR PREÇO</p>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 rounded-xl text-zinc-400 hover:text-[#83E509] hover:bg-[#83E509]/10 transition-all"
                              onClick={() => handleStartEdit(product.product_id, currentValue)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
            <div className="p-6 rounded-full bg-zinc-100 dark:bg-zinc-900 mb-6">
              <Building2 className="h-12 w-12 text-zinc-400" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase">Selecione um fornecedor</h3>
            <p className="text-zinc-500 text-sm mt-1 mx-auto max-w-[200px]">Escolha um parceiro ao lado para gerenciar os valores oferecidos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
