import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, Package, Building2, Search, Star, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { PricingUnit } from "@/utils/priceNormalization";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/useDebounce";

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
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [productUnit, setProductUnit] = useState<PricingUnit>("un");
  const [selectedSupplierToAdd, setSelectedSupplierToAdd] = useState("");
  
  // States para busca de produtos
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);

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
      .filter((p: any) => p.nome.toLowerCase().includes(debouncedProductSearch.toLowerCase()))
      .slice(0, 30);
  }, [availableProductsNotInQuote, debouncedProductSearch]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedProductIndex(-1);
  }, [debouncedProductSearch]);

  const selectProductFromList = (product: any) => {
    setSelectedProduct(product);
    setSelectedProductToAdd(product.id);
    setProductSearch(product.nome);
    setHighlightedProductIndex(-1);
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
      toast({ title: "Fornecedor adicionado!" });
    } catch {
      toast({ title: "Erro ao adicionar fornecedor", variant: "destructive" });
    }
  };

  return (
    <div className="flex-1 overflow-auto m-0 p-0 custom-scrollbar">
      <div className="p-3 space-y-3">
        {/* Gestão de Produtos */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Package className="h-3 w-3 text-gray-400" />
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Adicionar Produtos</span>
          </div>
          <Card className="p-2 bg-white/40 dark:bg-gray-900/40 border-white/30 dark:border-white/10 backdrop-blur-2xl rounded-xl shadow-sm relative z-50">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <Input
                  ref={productSearchRef}
                  placeholder="Buscar produto..."
                  value={selectedProduct ? selectedProduct.nome : productSearch}
                  onChange={(e) => { 
                    setProductSearch(e.target.value); 
                    setSelectedProduct(null); 
                    setSelectedProductToAdd("");
                  }}
                  onKeyDown={handleProductKeyDown}
                  className="h-8 pl-8 text-[10px] font-bold bg-white/60 dark:bg-white/5 border-white/30 rounded-lg focus:ring-orange-500/20"
                />
                
                {filteredProducts.length > 0 && !selectedProduct && (
                  <div 
                    ref={productListRef}
                    className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl max-h-64 overflow-auto animate-in fade-in slide-in-from-top-1 custom-scrollbar"
                  >
                    {filteredProducts.map((p: any, index: number) => (
                      <button
                        key={p.id}
                        onClick={() => selectProductFromList(p)}
                        onMouseEnter={() => setHighlightedProductIndex(index)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-all border-b border-gray-100 dark:border-gray-900 last:border-none",
                          highlightedProductIndex === index 
                            ? "bg-orange-500/10 text-orange-700 dark:text-orange-400" 
                            : "hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={cn("w-6 h-6 rounded flex items-center justify-center transition-all flex-shrink-0", highlightedProductIndex === index ? "bg-orange-500 text-white shadow-md" : "bg-gray-100 dark:bg-gray-800 text-gray-400")}>
                            <Package className="h-3 w-3" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold tracking-tight truncate">{safeStr(p.name)}</span>
                            {p.brand_name && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{p.brand_name}</span>
                                {p.brand_rating > 0 && (
                                  <div className="flex items-center gap-0.5">
                                    <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500">{p.brand_rating}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {p.brand_score > 0 && (
                          <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            <Trophy className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                              {p.brand_score >= 1000 ? `${(p.brand_score/1000).toFixed(1)}k` : p.brand_score}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Input 
                  type="number" 
                  min="1" 
                  value={productQuantity} 
                  onChange={(e) => setProductQuantity(Number(e.target.value))} 
                  className="w-20 h-8 text-[10px] font-bold bg-white/60 dark:bg-white/5 border-white/30 rounded-lg" 
                />
                <Select value={productUnit} onValueChange={(val: PricingUnit) => setProductUnit(val)}>
                  <SelectTrigger className="w-24 h-8 text-[10px] font-bold bg-white/60 dark:bg-white/5 border-white/30 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl">
                    <SelectItem value="un" className="text-[10px] font-bold">Unidade</SelectItem>
                    <SelectItem value="kg" className="text-[10px] font-bold">Kg</SelectItem>
                    <SelectItem value="cx" className="text-[10px] font-bold">Caixa</SelectItem>
                    <SelectItem value="pct" className="text-[10px] font-bold">Pacote</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddProduct} 
                  disabled={!selectedProductToAdd}
                  size="icon"
                  className="h-8 w-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          <div className="space-y-1">
            {products.map((p: any) => (
              <div key={p.product_id} className="flex items-center justify-between p-2 bg-white/20 dark:bg-white/5 rounded-lg border border-white/10 hover:border-gray-400/30 transition-all group">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Package className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">{safeStr(p.product_name)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-white/40 dark:bg-white/5 h-5 px-1.5 border-white/20">
                    {safeStr(p.quantidade)} {safeStr(p.unidade)}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onRemoveQuoteItem(p.product_id)}
                    className="h-6 w-6 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gestão de Fornecedores */}
        <div className="space-y-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/40">
          <div className="flex items-center gap-2 px-1">
            <Building2 className="h-3 w-3 text-gray-400" />
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Adicionar Fornecedores</span>
          </div>
          <Card className="p-2 bg-white/40 dark:bg-gray-900/40 border-white/30 dark:border-white/10 backdrop-blur-2xl rounded-xl shadow-sm">
            <div className="flex gap-2">
              <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd}>
                <SelectTrigger className="flex-1 h-8 text-[10px] font-bold bg-white/60 dark:bg-white/5 border-white/30 rounded-lg">
                  <SelectValue placeholder="Selecione um fornecedor..." />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl">
                  {suppliersNotInQuote.map((s: any) => (
                    <SelectItem key={s.id} value={s.id} className="text-[10px] font-bold">{safeStr(s.nome)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddSupplier} 
                disabled={!selectedSupplierToAdd}
                size="icon"
                className="h-8 w-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg shadow-sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            {fornecedores.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between p-2 bg-white/20 dark:bg-white/5 rounded-lg border border-white/10 hover:border-gray-400/30 transition-all group">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Building2 className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">{safeStr(f.nome)}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRemoveQuoteSupplier(f.id)}
                  className="h-6 w-6 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
