import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { LimitAlert } from "@/components/billing/LimitAlert";
import { useQueryClient } from '@tanstack/react-query';
import { useUserRole } from "@/hooks/useUserRole";

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
}

export default function AddSupplierDialog({ onAdd, trigger }: AddSupplierDialogProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
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
        setOpen(false);
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
    if (newOpen) {
      // Salvar posição do scroll ao abrir
      scrollPositionRef.current = window.scrollY;
    } else {
      // Restaurar posição do scroll ao fechar
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 100);
    }
    setOpen(newOpen);
  };

  // Conteúdo do formulário (reutilizado em mobile e desktop)
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="flex flex-col h-full">
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4 space-y-4' : 'p-5 space-y-5'}`}>
          {/* Alerta de limite de fornecedores */}
          <LimitAlert 
            resource="suppliers"
            current={subscriptionLimits.currentSuppliers}
            max={subscriptionLimits.maxSuppliers}
          />
          {/* Seção: Informações da Empresa */}
          <div className={isMobile ? 'space-y-3' : 'space-y-3.5'}>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-1">
              <span className="w-1 h-4 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></span>
              Informações da Empresa
            </h3>
            
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'lg:grid-cols-2 gap-3.5'}`}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Nome do Fornecedor *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Holambra Distribuidora" 
                        className={`${isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'} rounded-lg border-gray-200 dark:border-gray-700 focus:border-green-400 dark:focus:border-green-500 focus:ring-1 focus:ring-green-400/20 dark:bg-gray-800 dark:text-white`}
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
                    <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">CNPJ</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00.000.000/0000-00" 
                        className={`${isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'} rounded-lg border-gray-200 dark:border-gray-700 focus:border-green-400 dark:focus:border-green-500 focus:ring-1 focus:ring-green-400/20 dark:bg-gray-800 dark:text-white`}
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
                  <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Endereço Completo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Rua das Flores, 123, Centro, São Paulo - SP" 
                      className={`${isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'} rounded-lg border-gray-200 dark:border-gray-700 focus:border-green-400 dark:focus:border-green-500 focus:ring-1 focus:ring-green-400/20 dark:bg-gray-800 dark:text-white`}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Seção: Informações de Contato */}
          <div className={isMobile ? 'space-y-3' : 'space-y-3.5'}>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-1">
              <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></span>
              Informações de Contato
            </h3>

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Nome do Contato Principal *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: João Silva Santos" 
                      className={`${isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'} rounded-lg border-gray-200 dark:border-gray-700 focus:border-green-400 dark:focus:border-green-500 focus:ring-1 focus:ring-green-400/20 dark:bg-gray-800 dark:text-white`}
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
                    <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Telefone / WhatsApp</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(11) 99999-9999" 
                        className={`${isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'} rounded-lg border-gray-200 dark:border-gray-700 focus:border-green-400 dark:focus:border-green-500 focus:ring-1 focus:ring-green-400/20 dark:bg-gray-800 dark:text-white`}
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
                    <FormLabel className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Email Comercial</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="comercial@empresa.com" 
                        type="email" 
                        className={`${isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'} rounded-lg border-gray-200 dark:border-gray-700 focus:border-green-400 dark:focus:border-green-500 focus:ring-1 focus:ring-green-400/20 dark:bg-gray-800 dark:text-white`}
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200/50 dark:border-green-800/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="text-lg">💡</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-300 text-xs mb-1.5">Dicas Rápidas</h4>
                  <ul className="text-xs text-green-800 dark:text-green-400 space-y-0.5">
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
        <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-4' : 'px-4 sm:px-5 py-3 sm:py-4'} border-t border-gray-200/60 dark:border-gray-700/40 bg-gray-50/30 dark:bg-gray-800/30`}>
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className={`${isMobile ? 'h-11 w-full text-base' : 'h-9 text-sm px-4'} rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white`}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={() => form.handleSubmit((data) => onSubmit(data, false))()}
              className={`${isMobile ? 'h-11 w-full text-base' : 'h-9 text-sm px-6'} bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}
            >
              <Plus className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
              Adicionar
            </Button>
            {!isMobile && (
              <Button 
                type="button"
                onClick={() => form.handleSubmit((data) => onSubmit(data, true))()}
                variant="outline"
                className="h-9 rounded-lg border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 text-sm px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Mais
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );

  // Mobile: Usar Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          {trigger || (
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="h-[90vh] rounded-t-2xl pb-8 overflow-hidden flex flex-col p-0">
          <DrawerHeader className="flex-shrink-0 px-4 py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                  <Plus className="h-5 w-5" />
                </div>
                <DrawerTitle className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  Novo Fornecedor
                </DrawerTitle>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="h-9 w-9 p-0 flex-shrink-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DrawerHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Usar Dialog
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[520px] h-[85vh] max-h-[700px] overflow-hidden border border-gray-200/60 dark:border-gray-700/30 shadow-xl rounded-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-900 [&>button]:hidden">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                Novo Fornecedor
              </DialogTitle>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="h-8 w-8 p-0 flex-shrink-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex flex-col flex-1 overflow-hidden">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
