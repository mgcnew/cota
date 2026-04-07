import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Loader2, Package, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";

interface QuickCreateProductProps {
  initialName: string;
  onCreated: (product: { id: string; name: string; unit: string }) => void;
  onCancel: () => void;
}

export function QuickCreateProduct({ initialName, onCreated, onCancel }: QuickCreateProductProps) {
  const [name, setName] = useState(initialName);
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from('products')
        .select('category');

      if (error) throw error;

      const uniqueCategories = Array.from(new Set(data.map(p => p.category)))
        .filter(c => c && c.trim() !== '')
        .sort();
      setCategories(uniqueCategories);
    } catch {
      setCategories(["Frango", "Embutidos", "Frios", "Bovino", "Suíno"]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Categoria obrigatória", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) throw new Error("Empresa não encontrada");

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          company_id: companyData.company_id,
          name: name.trim(),
          category: category,
          unit: unit,
        })
        .select('id, name, unit')
        .single();

      if (error) throw error;

      toast({
        title: "✅ Produto cadastrado!",
        description: `${product.name} criado e disponível para seleção`,
        className: "border-green-200 bg-green-50",
        duration: 2000,
      });

      onCreated(product);
    } catch (error: any) {
      let msg = "Erro ao cadastrar produto";
      if (error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
        msg = "Já existe um produto com esse nome";
      }
      toast({ title: msg, description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    if (e.key === 'Enter' && name.trim() && category) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        "animate-in slide-in-from-top-2 fade-in duration-200",
        "w-full rounded-2xl shadow-2xl overflow-hidden mb-4",
        "border-2 border-brand/40",
        ds.colors.surface.card,
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3",
        "bg-brand/5 dark:bg-brand/10 border-b border-brand/20"
      )}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand/10">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
          </div>
          <span className={cn(ds.typography.size.sm, ds.typography.weight.bold, "text-brand")}>
            Cadastro Rápido de Produto
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-6 w-6 rounded-full hover:bg-brand/10"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className={ds.components.input.group}>
          <label className={cn(ds.typography.size.xs, ds.typography.weight.bold, "uppercase tracking-wider", ds.colors.text.muted)}>
            Nome do Produto *
          </label>
          <Input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Peito de Frango"
            className={cn(ds.components.input.root, "h-9 text-sm")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={ds.components.input.group}>
            <label className={cn(ds.typography.size.xs, ds.typography.weight.bold, "uppercase tracking-wider", ds.colors.text.muted)}>
              Categoria *
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={cn(ds.components.input.root, "h-9 text-sm")}>
                <SelectValue placeholder={loadingCategories ? "Carregando..." : "Selecione"} />
              </SelectTrigger>
              <SelectContent className={cn(ds.colors.surface.card, ds.colors.border.default, "border z-[200]")}>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={ds.components.input.group}>
            <label className={cn(ds.typography.size.xs, ds.typography.weight.bold, "uppercase tracking-wider", ds.colors.text.muted)}>
              Unidade *
            </label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className={cn(ds.components.input.root, "h-9 text-sm")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn(ds.colors.surface.card, ds.colors.border.default, "border z-[200]")}>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="un">un</SelectItem>
                <SelectItem value="cx">cx</SelectItem>
                <SelectItem value="pct">pct</SelectItem>
                <SelectItem value="l">l</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="metade">metade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className={cn(ds.components.button.secondary, "flex-1 h-9 text-sm")}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !name.trim() || !category}
            className={cn(ds.components.button.primary, "flex-1 h-9 text-sm")}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Criar Produto
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
