import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { LimitAlert } from "@/components/billing/LimitAlert";
import { useQueryClient } from '@tanstack/react-query';
import { useUserRole } from "@/hooks/useUserRole";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";

const supplierSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  cnpj: z.string().trim().max(18, "CNPJ muito longo").optional().or(z.literal("")),
  contact: z.string().trim().min(1, "Contato é obrigatório").max(100, "Contato muito longo"),
  phone: z.string().trim().max(20, "Telefone muito longo").optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo").optional().or(z.literal("")),
  address: z.string().trim().max(200, "Endereço muito longo").optional().or(z.literal("")),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface AddSupplierDialogProps {
  onAdd: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AddSupplierDialog({ onAdd, trigger, open: externalOpen, onOpenChange: externalOnOpenChange }: AddSupplierDialogProps) {
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const handleSetOpen = externalOnOpenChange || ((newOpen: boolean) => setInternalOpen(newOpen));
  const scrollPositionRef = useRef<number>(0);
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const subscriptionLimits = useSubscriptionLimits();
  const queryClient = useQueryClient();
  const { isOwner } = useUserRole();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      contact: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  // Salvar posição de scroll quando abrir o modal
  useEffect(() => {
    if (open) {
      scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    } else {
      // Restaurar posição de scroll quando fechar o modal
      setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant' as ScrollBehavior
        });
      }, 0);
    }
  }, [open]);

  const onSubmit = async (data: SupplierFormData, keepOpen = false) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado.",
          variant: "destructive",
        });
        return;
      }

      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Get company_id
      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) {
        throw new Error("Empresa não encontrada");
      }

      // Verificar limite antes de inserir (validação adicional no frontend)
      // Owners não têm limites
      if (!isOwner && !subscriptionLimits.canAddSupplier) {
        toast({
          title: "Limite atingido",
          description: `Você atingiu o limite de ${subscriptionLimits.maxSuppliers} fornecedores. Faça upgrade do plano para adicionar mais fornecedores.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('suppliers')
        .insert({
          company_id: companyData.company_id,
          name: data.name,
          cnpj: data.cnpj || null,
          contact: data.contact,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
        });

      if (error) throw error;

      // Log activity
      await logActivity({
        tipo: "fornecedor",
        acao: "Fornecedor adicionado",
        detalhes: `${data.name}${data.contact ? ` - Contato: ${data.contact}` : ""}${data.phone ? ` - Tel: ${data.phone}` : ""}`
      });

      toast({
        title: "Fornecedor adicionado",
        description: keepOpen
          ? `${data.name} foi adicionado! Adicione outro fornecedor.`
          : `${data.name} foi adicionado com sucesso.`,
      });

      // Invalidar queries para atualizar dados em tempo real
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-limits'] });

      onAdd();
      form.reset();

      if (!keepOpen) {
        handleOpenChange(false);
      } else {
        // Focar no primeiro campo
        setTimeout(() => {
          document.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
        }, 100);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Função para gerenciar abertura/fechamento e manter scroll
  const handleOpenChange = (newOpen: boolean) => {
    handleSetOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant' as ScrollBehavior
        });
      }, 0);
      form.reset();
    }
  };

  // Scroll into view helper para inputs
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isMobile) return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const DialogTitleComponent = isMobile ? DrawerTitle : DialogTitle;

  // Shared Header Component
  const Header = (
    <div className={designSystem.components.modal.header}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg border", designSystem.colors.surface.card, designSystem.colors.border.subtle)}>
          <Building2 className={cn("h-4 w-4", designSystem.colors.text.primary)} />
        </div>
        <DialogTitleComponent className={cn(designSystem.typography.size.lg, designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
          Novo Fornecedor
        </DialogTitleComponent>
      </div>
      {/* Botão de fechar removido - usando o nativo do DialogContent */}
    </div>
  );

  // Conteúdo do formulário (reutilizado em mobile e desktop)
  const content = (
    <>
      {Header}
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className={cn("flex flex-col h-full overflow-hidden", designSystem.colors.surface.page)} id="add-supplier-form">
          <div className={cn(designSystem.components.modal.body, "flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4 sm:p-6")}>
            {/* Alerta de limite de fornecedores */}
            <LimitAlert
              resource="suppliers"
              current={subscriptionLimits.currentSuppliers}
              max={subscriptionLimits.maxSuppliers}
            />

            {/* Seção: Informações da Empresa */}
            <div className={cn(designSystem.components.card.flat, "p-4 sm:p-5 space-y-4")}>
              <h3 className={cn(designSystem.typography.size.xs, designSystem.typography.weight.bold, "uppercase tracking-wider flex items-center gap-2", designSystem.colors.text.muted)}>
                <span className="w-1 h-4 bg-primary/20 rounded-full"></span>
                Informações da Empresa
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>Nome do Fornecedor *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Holambra Distribuidora"
                          className={designSystem.components.input.root}
                          onFocus={handleInputFocus}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>CNPJ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00.000.000/0000-00"
                          className={designSystem.components.input.root}
                          onFocus={handleInputFocus}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={designSystem.typography.size.sm}>Endereço Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rua das Flores, 123, Centro, São Paulo - SP"
                        className={designSystem.components.input.root}
                        onFocus={handleInputFocus}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seção: Informações de Contato */}
            <div className={cn(designSystem.components.card.flat, "p-4 sm:p-5 space-y-4")}>
              <h3 className={cn(designSystem.typography.size.xs, designSystem.typography.weight.bold, "uppercase tracking-wider flex items-center gap-2", designSystem.colors.text.muted)}>
                <span className="w-1 h-4 bg-primary/20 rounded-full"></span>
                Informações de Contato
              </h3>

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={designSystem.typography.size.sm}>Nome do Contato Principal *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: João Silva Santos"
                        className={designSystem.components.input.root}
                        onFocus={handleInputFocus}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>Telefone / WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-9999"
                          className={designSystem.components.input.root}
                          onFocus={handleInputFocus}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>Email Comercial</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="comercial@empresa.com"
                          type="email"
                          className={designSystem.components.input.root}
                          onFocus={handleInputFocus}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dica de preenchimento */}
            {!isMobile && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-lg">💡</div>
                  <div className="flex-1">
                    <h4 className={cn("font-semibold text-xs mb-1.5", designSystem.colors.text.primary)}>Dicas Rápidas</h4>
                    <ul className={cn("text-xs space-y-0.5", designSystem.colors.text.secondary)}>
                      <li>• Campos com * são obrigatórios</li>
                      <li>• Email usado para cotações</li>
                      <li>• Mantenha dados atualizados</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer com botões */}
          <div className={cn(designSystem.components.modal.footer, "py-3 sm:py-4")}>
            <div className={cn("flex w-full gap-2", isMobile ? "flex-col" : "justify-end")}>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className={designSystem.components.button.secondary}
              >
                Cancelar
              </Button>

              {!isMobile && (
                <Button
                  type="button"
                  onClick={() => form.handleSubmit((data) => onSubmit(data, true))()}
                  variant="outline"
                  className={cn(designSystem.components.button.secondary, "border-primary/50 text-primary hover:bg-primary/10")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Mais
                </Button>
              )}

              <Button
                type="submit"
                form="add-supplier-form"
                className={designSystem.components.button.primary}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );

  // Mobile: Usar Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        {trigger && (
          <DrawerTrigger asChild>
            {trigger}
          </DrawerTrigger>
        )}
        <DrawerContent
          className="rounded-t-2xl pb-8 overflow-hidden flex flex-col p-0 bg-background border-t border-border transition-all duration-200"
          style={{
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            paddingBottom: keyboardOffset > 0 ? 0 : 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Usar Dialog
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className={designSystem.components.modal.content}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
