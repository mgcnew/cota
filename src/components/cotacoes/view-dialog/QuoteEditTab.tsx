import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, Package, Building2, Search, Star, Trophy, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PricingUnit } from "@/utils/priceNormalization";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // States para busca de produtos
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {/* Gestão de Produtos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-[#83E509]/10">
                  <Package className="h-3.5 w-3.5 text-[#83E509]" />
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Incluir Novos Itens</span>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase text-[#83E509] border-[#83E509]/20">PASSO 01</Badge>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm relative z-50 space-y-3">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-[#83E509] transition-colors" />
                  <Input
                    ref={productSearchRef}
                    placeholder="Pesquisar catálogo..."
                    value={selectedProduct ? selectedProduct.nome : productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setSelectedProduct(null);
                      setSelectedProductToAdd("");
                    }}
                    onFocus={handleInputFocus}
                    onKeyDown={handleProductKeyDown}
                    className={cn("pl-11 h-10 rounded-lg text-xs font-bold", designSystem.components.input.root)}
                  />

                  {filteredProducts.length > 0 && !selectedProduct && (
                    <div
                      ref={productListRef}
                      className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2 custom-scrollbar p-1"
                    >
                      <div className="px-3 py-1.5 text-[9px] font-black text-[#83E509] uppercase tracking-widest opacity-50 border-b border-zinc-100 dark:border-zinc-800">Sugestões Encontradas</div>
                      {filteredProducts.map((p: any, index: number) => (
                        <button
                          key={p.id}
                          onClick={() => selectProductFromList(p)}
                          onMouseEnter={() => setHighlightedProductIndex(index)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-3 transition-all rounded-lg mt-1",
                            highlightedProductIndex === index
                              ? "bg-[#83E509]/10 text-zinc-900 dark:text-[#83E509]"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                          )}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={cn("w-7 h-7 rounded-md flex items-center justify-center transition-all flex-shrink-0 shadow-sm", highlightedProductIndex === index ? "bg-[#83E509] text-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-[#83E509]/20 group-hover:text-[#83E509]")}>
                              <Package className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-black tracking-tight truncate uppercase leading-none">{safeStr(p.name)}</span>
                              {p.brand_name && (
                                <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                                  <span className="text-[8px] font-black uppercase tracking-widest">{p.brand_name}</span>
                                  {p.brand_rating > 0 && (
                                    <div className="flex items-center gap-0.5">
                                      <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
                                      <span className="text-[8px] font-black">{p.brand_rating}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {p.brand_score > 0 && (
                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                              <Trophy className="h-2.5 w-2.5 text-amber-500" />
                              <span className="text-[9px] font-black text-zinc-500">
                                {p.brand_score >= 1000 ? `${(p.brand_score / 1000).toFixed(1)}k` : p.brand_score}
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 min-w-fit">
                  <div className="relative group">
                    <Input
                      type="number"
                      min="1"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(Number(e.target.value))}
                      onFocus={handleInputFocus}
                      className={cn("w-20 h-10 text-center font-black text-xs", designSystem.components.input.root)}
                    />
                    <div className="absolute top-[-7px] left-2 bg-zinc-50 dark:bg-zinc-900 px-1 text-[7px] font-black text-zinc-400 uppercase tracking-widest">QTD</div>
                  </div>

                  <Select value={productUnit} onValueChange={(val: PricingUnit) => setProductUnit(val)}>
                    <SelectTrigger className={cn("w-28 h-10 rounded-lg font-bold text-[10px] uppercase", designSystem.components.input.root)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-800">
                      <SelectItem value="un" className="text-xs font-bold">UNIDADE</SelectItem>
                      <SelectItem value="kg" className="text-xs font-bold">QUILO (KG)</SelectItem>
                      <SelectItem value="cx" className="text-xs font-bold">CAIXA</SelectItem>
                      <SelectItem value="pct" className="text-xs font-bold">PACOTE</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleAddProduct}
                    disabled={!selectedProductToAdd}
                    className="h-10 w-10 rounded-lg bg-[#83E509] hover:bg-[#83E509]/80 text-black shadow-lg shadow-[#83E509]/10 transition-all active:scale-95 disabled:grayscale disabled:opacity-30"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[40vh] overflow-auto pr-2 custom-scrollbar">
              {products.length > 0 ? (
                products.map((p: any) => (
                  <div key={p.product_id} className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl group hover:border-[#83E509]/30 transition-all duration-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-800 shadow-sm group-hover:text-[#83E509] group-hover:border-[#83E509]/30 transition-colors">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight truncate leading-tight">{safeStr(p.product_name)}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-zinc-50 dark:bg-zinc-950 h-4 px-1.5 border-zinc-100 dark:border-zinc-800 text-zinc-500">
                            {safeStr(p.quantidade)} {safeStr(p.unidade)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveQuoteItem(p.product_id)}
                      className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Package className="h-8 w-8 text-zinc-200 mx-auto mb-2 opacity-50" />
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Aguardando produtos...</p>
                </div>
              )}
            </div>
          </div>

          {/* Gestão de Fornecedores */}
          <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-[#83E509]/10">
                  <Building2 className="h-3.5 w-3.5 text-[#83E509]" />
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Vincular Fornecedores</span>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase text-[#83E509] border-[#83E509]/20">PASSO 02</Badge>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Building2 className="h-16 w-16 text-[#83E509]" />
              </div>
              <div className="flex gap-2 relative z-10">
                <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd}>
                  <SelectTrigger className={cn("flex-1 h-10 rounded-lg font-bold text-xs", designSystem.components.input.root)}>
                    <SelectValue placeholder="Convidar fornecedor..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-800 bg-zinc-950">
                    {suppliersNotInQuote.length > 0 ? (
                      suppliersNotInQuote.map((s: any) => (
                        <SelectItem key={s.id} value={s.id} className="font-bold text-xs uppercase">{safeStr(s.nome)}</SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-center text-[9px] font-black text-zinc-600 uppercase">Todos cadastrados já participam</div>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddSupplier}
                  disabled={!selectedSupplierToAdd}
                  className="h-10 w-10 rounded-lg bg-[#83E509] hover:bg-[#83E509]/80 text-black shadow-lg shadow-[#83E509]/20 transition-all active:scale-95 disabled:grayscale disabled:opacity-30"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fornecedores.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-xl group hover:border-[#83E509]/30 transition-all duration-200 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-100 dark:border-zinc-800 shadow-sm group-hover:text-[#83E509] transition-colors">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 truncate uppercase tracking-tight leading-tight">{safeStr(f.nome)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveQuoteSupplier(f.id)}
                    className="h-8 w-8 text-zinc-300 hover:text-red-500 hover:bg-red-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
