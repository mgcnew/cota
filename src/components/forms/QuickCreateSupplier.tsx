import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, Building2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";

interface QuickCreateSupplierProps {
  initialName: string;
  onCreated: (supplier: { id: string; name: string; contact: string | null }) => void;
  onCancel: () => void;
}

export function QuickCreateSupplier({ initialName, onCreated, onCancel }: QuickCreateSupplierProps) {
  const [name, setName] = useState(initialName);
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    if (!contact.trim()) {
      toast({ title: "Contato obrigatório", variant: "destructive" });
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

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .insert({
          company_id: companyData.company_id,
          name: name.trim(),
          contact: contact.trim(),
          phone: phone.trim() || null,
        })
        .select('id, name, contact')
        .single();

      if (error) throw error;

      toast({
        title: "✅ Fornecedor cadastrado!",
        description: `${supplier.name} criado e disponível para seleção`,
        className: "border-green-200 bg-green-50",
        duration: 2000,
      });

      onCreated(supplier);
    } catch (error: any) {
      let msg = "Erro ao cadastrar fornecedor";
      if (error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
        msg = "Já existe um fornecedor com esse nome";
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
  };

  const handleLastFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && contact.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn(
      "animate-in slide-in-from-top-2 fade-in duration-200",
      "rounded-2xl shadow-2xl overflow-hidden",
      "border-2 border-brand/40 mx-2 mt-2",
      ds.colors.surface.card,
    )}>
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
            Cadastro Rápido de Fornecedor
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
      <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
        <div className={ds.components.input.group}>
          <label className={cn(ds.typography.size.xs, ds.typography.weight.bold, "uppercase tracking-wider", ds.colors.text.muted)}>
            Nome do Fornecedor *
          </label>
          <Input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Distribuidora ABC"
            className={cn(ds.components.input.root, "h-9 text-sm")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={ds.components.input.group}>
            <label className={cn(ds.typography.size.xs, ds.typography.weight.bold, "uppercase tracking-wider", ds.colors.text.muted)}>
              Contato *
            </label>
            <Input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Nome do contato"
              className={cn(ds.components.input.root, "h-9 text-sm")}
            />
          </div>

          <div className={ds.components.input.group}>
            <label className={cn(ds.typography.size.xs, ds.typography.weight.bold, "uppercase tracking-wider", ds.colors.text.muted)}>
              Telefone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={handleLastFieldKeyDown}
              placeholder="(11) 99999-9999"
              className={cn(ds.components.input.root, "h-9 text-sm")}
            />
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
            disabled={isLoading || !name.trim() || !contact.trim()}
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
                Criar Fornecedor
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
