import { useState, useRef, useMemo, useEffect, useCallback, memo } from "react";
import { Building2, Search, ArrowLeft, DollarSign, Edit2, Check, X, Trophy, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { PricingUnit } from "@/utils/priceNormalization";
import { EmptyState } from "@/components/ui/empty-state";

const PRICING_UNIT_OPTIONS: { value: PricingUnit; label: string }[] = [
  { value: "kg", label: "por kg" },
  { value: "un", label: "por unidade" },
  { value: "cx", label: "por caixa" },
  { value: "pct", label: "por pacote" },
];

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
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string | number>>({});
  const [editedPricingMetadata, setEditedPricingMetadata] = useState<Record<string, { unidadePreco: PricingUnit; fatorConversao?: number }>>({});
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
    <div className="flex h-full">
      {/* Sidebar - Lista de Fornecedores */}
      <div className={cn(
        "w-64 flex-shrink-0 border-r flex flex-col",
        isMobile && showMobileValues ? "hidden" : "flex"
      )}>
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            <span className="text-xs font-semibold text-gray-500">Fornecedores</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
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
                      "w-full text-left p-2 rounded-lg border transition-colors",
                      isSelected
                        ? "bg-teal-50 border-teal-200"
                        : "bg-white border-transparent hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        fornecedor.status === 'respondido' ? "bg-green-500" : "bg-gray-300"
                      )} />
                      <span className="text-sm font-medium truncate">{safeStr(fornecedor.nome)}</span>
                    </div>
                    <div className="ml-4 mt-1 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {fornecedor.status === 'respondido' && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">OK</Badge>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <EmptyState
                icon={Inbox}
                title="Nenhum fornecedor"
                description={supplierSearch ? "Tente buscar outro nome." : "Sem fornecedores."}
                variant="inline"
              />
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área Principal - Valores */}
      <div className={cn(
        "flex-1 flex flex-col",
        isMobile && !showMobileValues ? "hidden" : "flex"
      )}>
        {isMobile && (
          <div className="flex items-center gap-2 p-3 border-b">
            <Button variant="ghost" size="icon" onClick={() => setShowMobileValues(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Voltar</span>
          </div>
        )}

        {selectedSupplier ? (
          <>
            {/* Header do Fornecedor */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100">
                  <DollarSign className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Valores de:</p>
                  <p className="font-semibold">{fornecedores.find((f: any) => f.id === selectedSupplier)?.nome}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-teal-600">
                  R$ {calcularTotalFornecedor(selectedSupplier).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Lista de Produtos */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {products.map((product: any) => {
                  const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                  const isEditing = editingProductId === product.product_id;
                  const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                  const isBest = currentValue > 0 && selectedSupplier === bestSupplierId;

                  return (
                    <div
                      key={product.product_id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        isBest ? "bg-green-50 border-green-200" : "bg-white"
                      )}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{safeStr(product.product_name)}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {safeStr(product.quantidade)} {safeStr(product.unidade)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
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
                              className="w-28 h-8"
                            />
                            <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => handleSaveEdit(product.product_id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={handleCancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className={cn("font-semibold", isBest ? "text-green-600" : "text-gray-700")}>
                              R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            {isBest && <Badge className="bg-green-100 text-green-700 border-green-200">Melhor</Badge>}
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleStartEdit(product.product_id, currentValue)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Building2}
              title="Selecione um fornecedor"
              description="Escolha um fornecedor na lista para ver/editar valores."
              variant="inline"
            />
          </div>
        )}
      </div>
    </div>
  );
}
