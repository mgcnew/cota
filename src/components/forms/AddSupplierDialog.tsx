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

  // Shared Header Component
  const Header = (
    <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            {isMobile ? (
              <DrawerTitle className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                Novo Fornecedor
              </DrawerTitle>
            ) : (
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                Novo Fornecedor
              </DialogTitle>
            )}
          </div>
        </div>
        
        <Button type="button" variant="ghost" size="icon" onClick={() => handleOpenChange(false)}
          className="h-9 w-9 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Conteúdo do formulário (reutilizado em mobile e desktop)
  const content = (
    <>
      {Header}
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-950" id="add-supplier-form">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
            {/* Alerta de limite de fornecedores */}
            <LimitAlert 
              resource="suppliers"
              current={subscriptionLimits.currentSuppliers}
              max={subscriptionLimits.maxSuppliers}
            />
            {/* Seção: Informações da Empresa */}
            <div className="space-y-3">
              <h3 className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2`}>
                <span className="w-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></span>
                Informações da Empresa
              </h3>
              
              <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'lg:grid-cols-2 gap-3.5'}`}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Nome do Fornecedor *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Holambra Distribuidora" 
                          className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
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
                      <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>CNPJ</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00.000.000/0000-00" 
                          className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
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
                    <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Endereço Completo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Rua das Flores, 123, Centro, São Paulo - SP" 
                        className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
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
            <div className="space-y-3">
              <h3 className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2`}>
                <span className="w-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></span>
                Informações de Contato
              </h3>

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Nome do Contato Principal *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: João Silva Santos" 
                        className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                        onFocus={handleInputFocus}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'sm:grid-cols-2 gap-3.5'}`}>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Telefone / WhatsApp</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(11) 99999-9999" 
                          className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
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
                      <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Email Comercial</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="comercial@empresa.com" 
                          type="email" 
                          className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
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

            {/* Dica de preenchimento - Ocultar no mobile */}
            {!isMobile && (
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-lg">💡</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-300 text-xs mb-1.5">Dicas Rápidas</h4>
                    <ul className="text-xs text-orange-800 dark:text-orange-400 space-y-0.5">
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
          <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-3' : 'px-4 sm:px-5 py-3 sm:py-4'} border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900`}>
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2 justify-end'}`}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                className={`${isMobile ? 'h-11 w-full text-base' : 'h-9 text-sm px-4'} rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white`}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                form="add-supplier-form"
                className={`${isMobile ? 'h-11 w-full text-base' : 'h-9 text-sm px-6'} bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm transition-colors duration-200`}
              >
                <Plus className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                Adicionar
              </Button>
              {!isMobile && (
                <Button 
                  type="button"
                  onClick={() => form.handleSubmit((data) => onSubmit(data, true))()}
                  variant="outline"
                  className="h-9 rounded-lg border-orange-500 dark:border-orange-400 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-sm px-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Mais
                </Button>
              )}
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
          className="rounded-t-2xl pb-8 overflow-hidden flex flex-col p-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 transition-all duration-200"
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
    <Dialog open={open} onOpenChange={handleSetOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent hideClose className="w-[90vw] max-w-[520px] h-[85vh] max-h-[700px] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md rounded-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-950 [&>button]:hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
}
