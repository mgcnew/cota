import { useState, useMemo, useRef, useEffect } from "react";
import { Trash2, Package, Building2, Search, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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

type Result =
  | { type: "supplier"; id: string; item: any }
  | { type: "product"; id: string; item: any };

const UNIT_OPTIONS = [
  { value: "un", label: "UN" },
  { value: "kg", label: "KG" },
  { value: "cx", label: "CX" },
  { value: "pct", label: "PCT" },
  { value: "metade", label: "MT" },
];

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

  // Busca única: rota o resultado (produto -> produtos, fornecedor -> fornecedores)
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 150);
  const searchRef = useRef<HTMLInputElement>(null);

  const [dynamicProducts, setDynamicProducts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isAdding, setIsAdding] = useState(false);

  const [savingQuantity, setSavingQuantity] = useState<string | null>(null);
  const [editQuantities, setEditQuantities] = useState<Record<string, string>>({});

  // Busca de produtos no catálogo completo (Supabase) além dos locais
  useEffect(() => {
    const run = async () => {
      if (!debouncedSearch || debouncedSearch.trim().length < 1) {
        setDynamicProducts([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, brand_name, unit, barcode")
          .or(`name.ilike.%${debouncedSearch}%,barcode.ilike.%${debouncedSearch}%`)
          .limit(30);
        if (error) throw error;
        setDynamicProducts(data || []);
      } catch (e) {
        console.error("Erro na busca de produtos:", e);
      } finally {
        setIsSearching(false);
      }
    };
    run();
  }, [debouncedSearch]);

  useEffect(() => { setHighlightedIndex(-1); }, [debouncedSearch]);

  const productsNotInQuote = useMemo(
    () => availableProducts.filter(p => !products.some(pi => pi.product_id === p.id)),
    [availableProducts, products]
  );

  const suppliersNotInQuote = useMemo(
    () => availableSuppliers.filter(s => !fornecedores.some(f => f.id === s.id)),
    [availableSuppliers, fornecedores]
  );

  const productMatches = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const local = productsNotInQuote.filter(p =>
      safeStr(p.name).toLowerCase().includes(q) ||
      (p.barcode && String(p.barcode).toLowerCase().includes(q))
    );
    const combined = [...dynamicProducts];
    local.forEach(p => { if (!combined.some(c => c.id === p.id)) combined.push(p); });
    return combined.filter(p => !products.some(pi => pi.product_id === p.id)).slice(0, 20);
  }, [dynamicProducts, productsNotInQuote, search, products, safeStr]);

  const supplierMatches = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return suppliersNotInQuote.filter(s => safeStr(s.name).toLowerCase().includes(q)).slice(0, 10);
  }, [suppliersNotInQuote, search, safeStr]);

  // Fornecedores primeiro (poucos, match exato), depois produtos
  const results: Result[] = useMemo(() => [
    ...supplierMatches.map(s => ({ type: "supplier" as const, id: s.id, item: s })),
    ...productMatches.map(p => ({ type: "product" as const, id: p.id, item: p })),
  ], [supplierMatches, productMatches]);

  const addProduct = async (product: any) => {
    setIsAdding(true);
    try {
      // Adiciona com qtd 1 + unidade padrão; ajuste fino é feito inline na lista
      await onAddQuoteItem({ quoteId, productId: product.id, productName: product.name, quantidade: 1, unidade: product.unit || "un" });
      toast({ title: "Produto adicionado", description: safeStr(product.name) });
      setSearch(""); setHighlightedIndex(-1);
      searchRef.current?.focus();
    } catch {
      toast({ title: "Erro ao adicionar produto", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const addSupplier = async (supplier: any) => {
    setIsAdding(true);
    try {
      await onAddQuoteSupplier(supplier.id);
      toast({ title: "Fornecedor adicionado", description: safeStr(supplier.name) });
      setSearch(""); setHighlightedIndex(-1);
      searchRef.current?.focus();
    } catch {
      toast({ title: "Erro ao adicionar fornecedor", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelect = (r: Result) => (r.type === "supplier" ? addSupplier(r.item) : addProduct(r.item));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightedIndex(i => (i < results.length - 1 ? i + 1 : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightedIndex(i => (i > 0 ? i - 1 : results.length - 1)); }
    else if (e.key === "Enter" && highlightedIndex >= 0) { e.preventDefault(); handleSelect(results[highlightedIndex]); }
    else if (e.key === "Escape") { e.preventDefault(); setSearch(""); setHighlightedIndex(-1); }
  };

  return (
    <div className="bg-transparent w-full h-full min-h-0 flex flex-col">
      <div className="p-4 space-y-4 flex-1 min-h-0 flex flex-col">
        {/* Busca unificada */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchRef}
            placeholder="Buscar produto ou fornecedor para adicionar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(designSystem.components.input.root, "pl-9 h-10 rounded-xl text-sm bg-muted/30")}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground/40" />
          )}

          {search.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[1000] mt-1.5 bg-popover border border-border dark:border-white/5 shadow-2xl rounded-xl max-h-[340px] overflow-y-auto overflow-x-hidden custom-scrollbar p-1 animate-in fade-in zoom-in-95 duration-150">
              {results.length > 0 ? (
                results.map((r, index) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    disabled={isAdding}
                    className={cn(
                      "w-full px-2.5 py-2 text-left flex items-center gap-2.5 rounded-lg transition-colors disabled:opacity-50",
                      highlightedIndex === index ? "bg-brand/10" : "hover:bg-accent"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                      r.type === "supplier"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-brand/10 text-brand border-brand/20"
                    )}>
                      {r.type === "supplier" ? <Building2 className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                    </div>
                    <span className="flex-1 min-w-0 truncate text-xs font-semibold text-foreground">
                      {safeStr(r.item.name)}
                    </span>
                    <Badge className={cn(
                      "text-[9px] font-bold uppercase tracking-wide shrink-0 border-none",
                      r.type === "supplier" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-brand/10 text-brand"
                    )}>
                      {r.type === "supplier" ? "Fornecedor" : "Produto"}
                    </Badge>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-[11px] text-muted-foreground">
                  {isSearching ? "Buscando..." : "Nada encontrado. Tente outro termo."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Duas colunas: Produtos | Fornecedores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto md:overflow-visible">
          {/* Produtos */}
          <div className="flex flex-col gap-2 rounded-xl border border-border dark:border-white/5 bg-card/30 p-3 min-h-0">
            <div className="flex items-center gap-2 px-1">
              <div className="p-1 rounded-lg bg-brand/10"><Package className="h-3.5 w-3.5 text-brand" /></div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Produtos</span>
              <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">{products.length}</span>
            </div>

            <div className="space-y-1 flex-1 min-h-0 overflow-y-auto -mr-1 pr-1">
              {products.length > 0 ? (
                products.map((p: any) => (
                  <div key={p.product_id} className="flex items-center gap-2 px-2 py-1 bg-muted/20 border border-border dark:border-white/5 rounded-lg group hover:border-brand/30 transition-colors">
                    <div className="w-5 h-5 rounded-md bg-background flex items-center justify-center border border-border dark:border-white/5 text-muted-foreground group-hover:text-brand transition-colors shrink-0">
                      <Package className="h-3 w-3" />
                    </div>
                    <span className="flex-1 min-w-0 truncate text-[11px] font-bold text-foreground uppercase" title={safeStr(p.product_name)}>
                      {safeStr(p.product_name)}
                    </span>
                    <div className="relative shrink-0">
                      <Input
                        type="number"
                        value={editQuantities[p.product_id] ?? String(p.quantidade)}
                        onChange={(e) => setEditQuantities(prev => ({ ...prev, [p.product_id]: e.target.value }))}
                        className={cn(
                          "w-11 h-6 text-[10px] p-1 text-center font-black bg-background border-border/50 focus:border-brand/50 focus:ring-0 rounded-md",
                          savingQuantity === p.product_id && "opacity-50 pointer-events-none"
                        )}
                        onBlur={async (e) => {
                          const val = Number(e.target.value);
                          if (val > 0 && val !== Number(p.quantidade)) {
                            setSavingQuantity(p.product_id);
                            try {
                              await onUpdateQuoteItemQuantity(p.product_id, val, p.unidade);
                              toast({ title: "Quantidade atualizada!" });
                            } catch {
                              toast({ title: "Erro ao atualizar quantidade", variant: "destructive" });
                              setEditQuantities(prev => ({ ...prev, [p.product_id]: String(p.quantidade) }));
                            } finally {
                              setSavingQuantity(null);
                            }
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      />
                      {savingQuantity === p.product_id && (
                        <Loader2 className="absolute right-0.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-brand" />
                      )}
                    </div>
                    <Select defaultValue={p.unidade || "un"} onValueChange={(val) => onUpdateQuoteItemQuantity(p.product_id, Number(p.quantidade), val)}>
                      <SelectTrigger className="w-14 h-6 text-[9px] font-black uppercase p-1 bg-background border-border/50 focus:border-brand/50 rounded-md shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        {UNIT_OPTIONS.map(u => (
                          <SelectItem key={u.value} value={u.value} className="text-[10px] font-bold">{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => onRemoveQuoteItem(p.product_id)} className="h-6 w-6 shrink-0 text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center rounded-xl border border-dashed border-border">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nenhum produto</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Use a busca acima</p>
                </div>
              )}
            </div>
          </div>

          {/* Fornecedores */}
          <div className="flex flex-col gap-2 rounded-xl border border-border dark:border-white/5 bg-card/30 p-3 min-h-0">
            <div className="flex items-center gap-2 px-1">
              <div className="p-1 rounded-lg bg-brand/10"><Building2 className="h-3.5 w-3.5 text-brand" /></div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fornecedores</span>
              <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">{fornecedores.length}</span>
            </div>

            <div className="space-y-1 flex-1 min-h-0 overflow-y-auto -mr-1 pr-1">
              {fornecedores.length > 0 ? (
                fornecedores.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-2 px-2 py-1 bg-muted/20 border border-border dark:border-white/5 rounded-lg group hover:border-brand/30 transition-colors">
                    <div className="w-5 h-5 rounded-md bg-background flex items-center justify-center border border-border dark:border-white/5 text-muted-foreground group-hover:text-brand transition-colors shrink-0">
                      <Building2 className="h-3 w-3" />
                    </div>
                    <span className="flex-1 min-w-0 truncate text-[11px] font-bold text-foreground uppercase" title={safeStr(f.nome)}>
                      {safeStr(f.nome)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => onRemoveQuoteSupplier(f.id)} className="h-6 w-6 shrink-0 text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center rounded-xl border border-dashed border-border">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nenhum fornecedor</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Use a busca acima</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
