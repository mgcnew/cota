import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, Package, Building2, Search, Star, Trophy, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PricingUnit } from "@/utils/priceNormalization";
import { useDebounce } from "@/hooks/useDebounce";
import { designSystem } from "@/styles/design-system";

interface QuoteEditTabProps {
  products: any[];
  fornecedores: any[];
  availableProducts: any[];
  availableSuppliers: any[];
  onAddQuoteItem: (params: any) => Promise<void>;
  onRemoveQuoteItem: (productId: string) => Promise<void>;
  onAddQuoteSupplier: (supplierId: string) => Promise<void>;
  onRemoveQuoteSupplier: (supplierId: string) => Promise<void>;
  quoteId: string;
  safeStr: (val: any) => string;
}

export function QuoteEditTab({
  products,
  fornecedores,
  availableProducts,
  availableSuppliers,
  onAddQuoteItem,
  onRemoveQuoteItem,
  onAddQuoteSupplier,
  onRemoveQuoteSupplier,
  quoteId,
  safeStr
}: QuoteEditTabProps) {
  const { toast } = useToast();
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [productUnit, setProductUnit] = useState<PricingUnit>("un");
  const [selectedSupplierToAdd, setSelectedSupplierToAdd] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);

  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(-1);
  const debouncedSupplierSearch = useDebounce(supplierSearch, 300);
  const supplierSearchRef = useRef<HTMLInputElement>(null);
  const supplierListRef = useRef<HTMLDivElement>(null);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const suppliersNotInQuote = useMemo(() =>
    availableSuppliers.filter((s: any) => !fornecedores.some((f: any) => f.id === s.id)),
    [availableSuppliers, fornecedores]
  );

  const availableProductsNotInQuote = useMemo(() =>
    availableProducts.filter((p: any) => !products.some((qp: any) => qp.product_id === p.id)),
    [availableProducts, products]
  );

  const filteredProducts = useMemo(() => {
    if (!debouncedProductSearch || debouncedProductSearch.trim().length < 2) return [];
    return availableProductsNotInQuote
      .filter((p: any) => safeStr(p.name).toLowerCase().includes(debouncedProductSearch.toLowerCase()))
      .slice(0, 30);
  }, [availableProductsNotInQuote, debouncedProductSearch, safeStr]);

  const filteredSuppliers = useMemo(() => {
    if (!debouncedSupplierSearch || debouncedSupplierSearch.trim().length < 2) return [];
    return suppliersNotInQuote
      .filter((s: any) => safeStr(s.name).toLowerCase().includes(debouncedSupplierSearch.toLowerCase()))
      .slice(0, 30);
  }, [suppliersNotInQuote, debouncedSupplierSearch, safeStr]);

  useEffect(() => {
    setHighlightedProductIndex(-1);
  }, [debouncedProductSearch]);

  useEffect(() => {
    setHighlightedSupplierIndex(-1);
  }, [debouncedSupplierSearch]);

  const selectProductFromList = (product: any) => {
    setSelectedProduct(product);
    setSelectedProductToAdd(product.id);
    setProductSearch(safeStr(product.name));
    setHighlightedProductIndex(-1);
  };

  const selectSupplierFromList = (supplier: any) => {
    setSelectedSupplier(supplier);
    setSelectedSupplierToAdd(supplier.id);
    setSupplierSearch(safeStr(supplier.name));
    setHighlightedSupplierIndex(-1);
  };

  const handleProductKeyDown = (e: React.KeyboardEvent) => {
    if (filteredProducts.length > 0 && !selectedProduct) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedProductIndex(prev => prev < filteredProducts.length - 1 ? prev + 1 : 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedProductIndex(prev => prev > 0 ? prev - 1 : filteredProducts.length - 1);
        return;
      }
      if (e.key === 'Enter' && highlightedProductIndex >= 0) {
        e.preventDefault();
        selectProductFromList(filteredProducts[highlightedProductIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setProductSearch("");
        setHighlightedProductIndex(-1);
        return;
      }
    }
  };

  const handleSupplierKeyDown = (e: React.KeyboardEvent) => {
    if (filteredSuppliers.length > 0 && !selectedSupplier) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedSupplierIndex(prev => prev < filteredSuppliers.length - 1 ? prev + 1 : 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedSupplierIndex(prev => prev > 0 ? prev - 1 : filteredSuppliers.length - 1);
        return;
      }
      if (e.key === 'Enter' && highlightedSupplierIndex >= 0) {
        e.preventDefault();
        selectSupplierFromList(filteredSuppliers[highlightedSupplierIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSupplierSearch("");
        setHighlightedSupplierIndex(-1);
        return;
      }
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProductToAdd) return;
    try {
      await onAddQuoteItem({
        quoteId,
        productId: selectedProductToAdd,
        quantidade: productQuantity,
        unidade: productUnit
      });
      setSelectedProductToAdd("");
      setSelectedProduct(null);
      setProductSearch("");
      setProductQuantity(1);
      toast({ title: "Produto adicionado!" });
    } catch {
      toast({ title: "Erro ao adicionar produto", variant: "destructive" });
    }
  };

  const handleAddSupplier = async () => {
    if (!selectedSupplierToAdd) return;
    try {
      await onAddQuoteSupplier(selectedSupplierToAdd);
      setSelectedSupplierToAdd("");
      setSelectedSupplier(null);
      setSupplierSearch("");
      toast({ title: "Fornecedor adicionado!" });
    } catch {
      toast({ title: "Erro ao adicionar fornecedor", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col w-full bg-background">
      <div className="p-4 space-y-4 pb-16">
        {/* Gestão de Produtos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-brand/10">
                <Package className="h-3.5 w-3.5 text-brand" />
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Produtos</span>
            </div>
          </div>

          <div className="p-3 bg-muted/30 border border-border rounded-xl shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  ref={productSearchRef}
                  placeholder="Adicionar produto..."
                  value={selectedProduct ? safeStr(selectedProduct.name) : productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setSelectedProduct(null);
                    setSelectedProductToAdd("");
                  }}
                  onFocus={handleInputFocus}
                  onKeyDown={handleProductKeyDown}
                  className={cn(designSystem.components.input.root, "pl-9 h-9 rounded-lg text-xs font-bold bg-background")}
                />

                {filteredProducts.length > 0 && !selectedProduct && (
                  <div ref={productListRef} className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1 custom-scrollbar">
                    {filteredProducts.map((p: any, index: number) => (
                      <button
                        key={p.id}
                        onClick={() => selectProductFromList(p)}
                        onMouseEnter={() => setHighlightedProductIndex(index)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-3 transition-all rounded-lg",
                          highlightedProductIndex === index ? "bg-brand/10 text-foreground" : "hover:bg-accent text-muted-foreground"
                        )}
                      >
                        <span className="font-black tracking-tight truncate uppercase">{safeStr(p.name)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 min-w-fit">
                <Input type="number" min="1" value={productQuantity} onChange={(e) => setProductQuantity(Number(e.target.value))} className={cn(designSystem.components.input.root, "w-16 h-9 text-center font-black text-xs bg-background")} />
                <Select value={productUnit} onValueChange={(val: PricingUnit) => setProductUnit(val)}>
                  <SelectTrigger className={cn(designSystem.components.input.root, "w-24 h-9 rounded-lg font-bold text-[10px] uppercase bg-background")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="un" className="text-xs font-bold">UNIDADE</SelectItem>
                    <SelectItem value="kg" className="text-xs font-bold">KG</SelectItem>
                    <SelectItem value="cx" className="text-xs font-bold">CAIXA</SelectItem>
                    <SelectItem value="pct" className="text-xs font-bold">PACOTE</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddProduct} disabled={!selectedProductToAdd} className="h-9 w-9 rounded-lg bg-brand hover:bg-brand/80 text-black">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {products.length > 0 ? (
              products.map((p: any) => (
                <div key={p.product_id} className="flex items-center justify-between p-2.5 bg-muted/20 border border-border rounded-xl group hover:border-brand/30 transition-all">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center text-muted-foreground border border-border shadow-sm group-hover:text-brand transition-colors">
                      <Package className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-foreground uppercase tracking-tight truncate">{safeStr(p.product_name)}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{safeStr(p.quantidade)} {safeStr(p.unidade)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onRemoveQuoteItem(p.product_id)} className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center rounded-xl border border-dashed border-border">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nenhum produto</p>
              </div>
            )}
          </div>
        </div>

        {/* Gestão de Fornecedores */}
        <div className="space-y-3 pt-5 border-t border-border">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1 rounded-lg bg-brand/10">
              <Building2 className="h-3.5 w-3.5 text-brand" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fornecedores</span>
          </div>

          <div className="p-2.5 bg-muted/30 border border-border rounded-xl shadow-sm flex gap-2 relative">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={supplierSearchRef}
                placeholder="Busque e convide um fornecedor..."
                value={selectedSupplier ? safeStr(selectedSupplier.name) : supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setSelectedSupplier(null);
                  setSelectedSupplierToAdd("");
                }}
                onFocus={handleInputFocus}
                onKeyDown={handleSupplierKeyDown}
                className={cn(designSystem.components.input.root, "pl-9 h-9 rounded-lg text-xs font-bold bg-background")}
              />

              {filteredSuppliers.length > 0 && !selectedSupplier && (
                <div ref={supplierListRef} className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1 custom-scrollbar">
                  {filteredSuppliers.map((s: any, index: number) => (
                    <button
                      key={s.id}
                      onClick={() => selectSupplierFromList(s)}
                      onMouseEnter={() => setHighlightedSupplierIndex(index)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-3 transition-all rounded-lg",
                        highlightedSupplierIndex === index ? "bg-brand/10 text-foreground" : "hover:bg-accent text-muted-foreground"
                      )}
                    >
                      <span className="font-black tracking-tight truncate uppercase">{safeStr(s.name)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Button onClick={handleAddSupplier} disabled={!selectedSupplierToAdd} className="h-9 w-9 rounded-lg bg-brand hover:bg-brand/80 text-black">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fornecedores.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between p-2.5 bg-muted/20 border border-border rounded-xl group hover:border-brand/30 transition-all">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-brand" />
                  <span className="text-[10px] font-black text-foreground uppercase truncate">{safeStr(f.nome)}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onRemoveQuoteSupplier(f.id)} className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
