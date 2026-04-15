import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, Package, Building2, Search, Star, Trophy, X, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PricingUnit } from "@/utils/priceNormalization";
import { useDebounce } from "@/hooks/useDebounce";
import { designSystem } from "@/styles/design-system";
import { supabase } from "@/integrations/supabase/client";

interface QuoteEditTabProps {
  products: any[];
  fornecedores: any[];
  availableProducts: any[];
  availableSuppliers: any[];
  onAddQuoteItem: (params: any) => Promise<void>;
  onRemoveQuoteItem: (productId: string) => Promise<void>;
  onAddQuoteSupplier: (supplierId: string) => Promise<void>;
  onRemoveQuoteSupplier: (supplierId: string) => Promise<void>;
  onUpdateQuoteItemQuantity: (productId: string, quantidade: number, unidade: string) => Promise<void>;
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
  onUpdateQuoteItemQuantity,
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
  const debouncedProductSearch = useDebounce(productSearch, 150);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);

  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(-1);
  const debouncedSupplierSearch = useDebounce(supplierSearch, 150);
  const supplierSearchRef = useRef<HTMLInputElement>(null);
  const supplierListRef = useRef<HTMLDivElement>(null);

  const [dynamicProducts, setDynamicProducts] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isSearchingSuppliers, setIsSearchingSuppliers] = useState(false);

  // Busca reativa de produtos via Supabase
  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedProductSearch || debouncedProductSearch.trim().length < 1) {
        setDynamicProducts([]);
        return;
      }

      setIsSearchingProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, brand_name, brand_rating, brand_score, unit')
          .ilike('name', `%${debouncedProductSearch}%`)
          .limit(30);

        if (error) throw error;
        
        // Mantemos a lista original para feedback visual, similar ao modal de nova cotação
        setDynamicProducts(data || []);
      } catch (error) {
        console.error("Erro na busca de produtos:", error);
      } finally {
        setIsSearchingProducts(false);
      }
    };

    searchProducts();
  }, [debouncedProductSearch, products]);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const productsNotInQuote = useMemo(() => {
    return availableProducts.filter(p => !products.some(pi => pi.product_id === p.id));
  }, [availableProducts, products]);

  const suppliersNotInQuote = useMemo(() => {
    return availableSuppliers.filter(s => !fornecedores.some(f => f.id === s.id));
  }, [availableSuppliers, fornecedores]);

  const filteredProductsLocal = useMemo(() => {
    if (!productSearch || productSearch.trim().length < 1) return [];
    return productsNotInQuote
      .filter((p: any) => safeStr(p.name).toLowerCase().includes(productSearch.toLowerCase()))
      .slice(0, 30);
  }, [productsNotInQuote, productSearch, safeStr]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch || supplierSearch.trim().length < 1) return [];
    return suppliersNotInQuote
      .filter((s: any) => safeStr(s.name).toLowerCase().includes(supplierSearch.toLowerCase()))
      .slice(0, 30);
  }, [suppliersNotInQuote, supplierSearch, safeStr]);

  // Combinar produtos locais e dinâmicos (evitando duplicatas)
  const allProducts = useMemo(() => {
    const combined = [...dynamicProducts];
    filteredProductsLocal.forEach(p => {
      if (!combined.some(cp => cp.id === p.id)) {
        combined.push(p);
      }
    });

    // Filtro final rigoroso para evitar que produtos já na cotação apareçam (inclusive do Supabase)
    return combined.filter(p => !products.some(pi => pi.product_id === p.id));
  }, [dynamicProducts, filteredProductsLocal, products]);


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
    setProductUnit(product.unit || "un");
    setDynamicProducts([]);
    setHighlightedProductIndex(-1);
  };

  const selectSupplierFromList = (supplier: any) => {
    setSelectedSupplier(supplier);
    setSelectedSupplierToAdd(supplier.id);
    setSupplierSearch(safeStr(supplier.name));
    setHighlightedSupplierIndex(-1);
  };

  const handleProductKeyDown = (e: React.KeyboardEvent) => {
    if (dynamicProducts.length > 0 && !selectedProduct) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedProductIndex(prev => prev < dynamicProducts.length - 1 ? prev + 1 : 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedProductIndex(prev => prev > 0 ? prev - 1 : dynamicProducts.length - 1);
        return;
      }
      if (e.key === 'Enter' && highlightedProductIndex >= 0) {
        e.preventDefault();
        selectProductFromList(dynamicProducts[highlightedProductIndex]);
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
    <div className="bg-background">
      <div className={cn(
        "p-4 space-y-4 transition-all duration-300",
        ((productSearch.length > 0 && !selectedProduct) || (supplierSearch.length > 0 && !selectedSupplier)) ? "pb-80" : "pb-10"
      )}>
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

                {isSearchingProducts && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </div>
                )}

              {productSearch.length > 0 && !selectedProduct && (
                <div ref={productListRef} className="absolute left-0 right-0 top-full z-[1000] mt-1 bg-popover border border-border shadow-2xl rounded-xl max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar p-1 animate-in fade-in zoom-in-95 duration-200">
                  {allProducts.length > 0 ? (
                    allProducts.map((p: any, index: number) => (
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
                      ))
                    ) : (
                      <div className="p-3 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        Nenhum produto encontrado
                      </div>
                    )}
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
                    <SelectItem value="metade" className="text-xs font-bold">METADE</SelectItem>
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
                      <div className="flex items-center gap-1 mt-0.5">
                        <Input 
                          type="number" 
                          defaultValue={p.quantidade} 
                          className="w-14 h-6 text-[10px] p-1 font-black bg-background border-border/50 focus:border-brand/50 focus:ring-0 rounded-md transition-all h-auto"
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== Number(p.quantidade)) {
                              onUpdateQuoteItemQuantity(p.product_id, val, p.unidade);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                        />
                        <Select 
                          defaultValue={p.unidade || "un"} 
                          onValueChange={(val) => onUpdateQuoteItemQuantity(p.product_id, Number(p.quantidade), val)}
                        >
                          <SelectTrigger className="w-16 h-6 text-[9px] font-black uppercase p-1 bg-background border-border/50 focus:border-brand/50 rounded-md transition-all h-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border">
                            <SelectItem value="un" className="text-[10px] font-bold">UN</SelectItem>
                            <SelectItem value="kg" className="text-[10px] font-bold">KG</SelectItem>
                            <SelectItem value="cx" className="text-[10px] font-bold">CX</SelectItem>
                            <SelectItem value="pct" className="text-[10px] font-bold">PCT</SelectItem>
                            <SelectItem value="metade" className="text-[10px] font-bold">MT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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

              {isSearchingSuppliers && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              )}

              {supplierSearch.length > 0 && !selectedSupplier && (
                <div ref={supplierListRef} className="absolute left-0 right-0 top-full z-[1000] mt-1 bg-popover border border-border shadow-2xl rounded-xl max-h-[250px] overflow-y-auto overflow-x-hidden custom-scrollbar p-1 animate-in fade-in zoom-in-95 duration-200">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier: any, index: number) => (
                      <button
                        key={supplier.id}
                        onClick={() => selectSupplierFromList(supplier)}
                        onMouseEnter={() => setHighlightedSupplierIndex(index)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-3 transition-all rounded-lg",
                          highlightedSupplierIndex === index ? "bg-brand/10 text-foreground" : "hover:bg-accent text-muted-foreground"
                        )}
                      >
                        <span className="font-black tracking-tight truncate uppercase">{safeStr(supplier.name)}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Nenhum fornecedor encontrado
                    </div>
                  )}
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
