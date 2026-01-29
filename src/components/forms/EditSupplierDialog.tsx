import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
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
import { toast } from "@/hooks/use-toast";
import { Building2, X } from "lucide-react";

const supplierSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  contact: z.string().trim().min(1, "Contato é obrigatório").max(100, "Contato muito longo"),
  phone: z.string().trim().max(20, "Telefone muito longo").optional(),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo").optional().or(z.literal("")),
  address: z.string().trim().max(200, "Endereço muito longo").optional(),
  limit: z.string().trim().min(1, "Limite é obrigatório"),
  status: z.enum(["active", "inactive", "pending"]),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone?: string;
  email?: string;
  address?: string;
  limit: string;
  status: "active" | "inactive" | "pending";
}

interface EditSupplierDialogProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string, data: SupplierFormData) => void;
}

export default function EditSupplierDialog({
  supplier,
  open,
  onOpenChange,
  onEdit,
}: EditSupplierDialogProps) {
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  const scrollPositionRef = useRef<number>(0);

  // Salvar posição de scroll quando abrir o modal
   useEffect(() => {
     if (open) {
       scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
     } else {
       // Restaurar posição de scroll quando fechar o modal
       // Usar setTimeout para garantir que o DOM foi atualizado
       setTimeout(() => {
         window.scrollTo({
           top: scrollPositionRef.current,
           behavior: 'instant' as ScrollBehavior
         });
       }, 0);
     }
   }, [open]);

   const form = useForm<SupplierFormData>({
     resolver: zodResolver(supplierSchema),
     defaultValues: {
       name: "",
       contact: "",
       phone: "",
       email: "",
       address: "",
       limit: "",
       status: "active",
     },
   });

    useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        contact: supplier.contact,
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        limit: supplier.limit,
        status: supplier.status,
      });
    }
  }, [supplier, form]);

  const onSubmit = (data: SupplierFormData) => {
    if (supplier) {
      onEdit(supplier.id, data);
      toast({
        title: "Fornecedor atualizado",
        description: `${data.name} foi atualizado com sucesso.`,
      });
      onOpenChange(false);
    }
  };

  // Função para gerenciar abertura/fechamento
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  // Scroll into view helper para inputs
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isMobile) return;
    // Reduzido o delay para resposta mais rápida
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'auto', block: 'center' });
    }, 150);
  }, [isMobile]);

  // Shared Header Component memoized
  const Header = useMemo(() => (
    <div className={designSystem.components.modal.header}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg border", designSystem.colors.surface.card, designSystem.colors.border.subtle)}>
          <Building2 className={cn("h-4 w-4", designSystem.colors.text.primary)} />
        </div>
        <DialogTitle className={cn(designSystem.typography.size.lg, designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
          Editar Fornecedor
        </DialogTitle>
      </div>
    </div>
  ), []);

  const formContent = useMemo(() => (
    <>
      {Header}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={cn("flex flex-col h-full overflow-hidden", designSystem.colors.surface.page)} id="edit-supplier-form">
          <div className={cn(designSystem.components.modal.body, "flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4 sm:p-6")}>

            {/* Seção: Informações Principais */}
            <div className={cn(designSystem.components.card.flat, "p-4 sm:p-5 space-y-4")}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={designSystem.typography.size.sm}>Nome do Fornecedor*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Holambra"
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
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={designSystem.typography.size.sm}>Nome do Contato*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: João Silva"
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

            {/* Seção: Contato & Localização */}
            <div className={cn(designSystem.components.card.flat, "p-4 sm:p-5 space-y-4")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>Telefone</FormLabel>
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
                      <FormLabel className={designSystem.typography.size.sm}>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contato@empresa.com"
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

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={designSystem.typography.size.sm}>Endereço</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rua, número, bairro, cidade"
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

            {/* Seção: Status & Limites */}
            <div className={cn(designSystem.components.card.flat, "p-4 sm:p-5 space-y-4")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>Limite de Crédito*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 25.000"
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={designSystem.typography.size.sm}>Status*</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={designSystem.components.input.root}>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-50">
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
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
              <Button
                type="submit"
                form="edit-supplier-form"
                className={designSystem.components.button.primary}
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  ), [Header, form, isMobile, handleInputFocus, onSubmit]);

  // Mobile: Usar Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} repositionInputs={false}>
        <DrawerContent
          className="rounded-t-2xl flex flex-col p-0 bg-background border-t border-border"
          style={{
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            paddingBottom: 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Usar Dialog
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(designSystem.components.modal.content, "h-[85vh] max-h-[700px] p-0 overflow-hidden flex flex-col")}>
        <div className="flex flex-col h-full overflow-hidden">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
