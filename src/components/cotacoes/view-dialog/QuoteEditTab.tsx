import { useState, useMemo } from "react";
import { Plus, Trash2, Package, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { PricingUnit } from "@/utils/priceNormalization";

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

  const suppliersNotInQuote = useMemo(() => 
    availableSuppliers.filter((s: any) => !fornecedores.some((f: any) => f.id === s.id)),
    [availableSuppliers, fornecedores]
  );

  const availableProductsNotInQuote = useMemo(() => 
    availableProducts.filter((p: any) => !products.some((qp: any) => qp.product_id === p.id)),
    [availableProducts, products]
  );

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
            <Package className="h-3 w-3 text-teal-500" />
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Adicionar Produtos</span>
          </div>
          <Card className="p-2 bg-white/40 dark:bg-gray-900/40 border-white/30 dark:border-white/10 backdrop-blur-2xl rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedProductToAdd} onValueChange={setSelectedProductToAdd}>
                <SelectTrigger className="flex-1 h-8 text-[10px] font-bold bg-white/60 dark:bg-white/5 border-white/30 rounded-lg">
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl">
                  {availableProductsNotInQuote.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold">{safeStr(p.nome)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  className="h-8 w-8 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          <div className="space-y-1">
            {products.map((p: any) => (
              <div key={p.product_id} className="flex items-center justify-between p-2 bg-white/20 dark:bg-white/5 rounded-lg border border-white/10 hover:border-teal-500/30 transition-all group">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-teal-500/10 flex items-center justify-center text-teal-600">
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
                    className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gestão de Fornecedores */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 px-1">
            <Building2 className="h-3 w-3 text-amber-500" />
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
                className="h-8 w-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            {fornecedores.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between p-2 bg-white/20 dark:bg-white/5 rounded-lg border border-white/10 hover:border-amber-500/30 transition-all group">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Building2 className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">{safeStr(f.nome)}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRemoveQuoteSupplier(f.id)}
                  className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
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
