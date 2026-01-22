import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
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

  // Função para gerenciar abertura/fechamento e manter scroll
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      scrollPositionRef.current = window.scrollY;
    } else {
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 100);
    }
    onOpenChange(newOpen);
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
                Editar Fornecedor
              </DrawerTitle>
            ) : (
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                Editar Fornecedor
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-950" id="edit-supplier-form">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Nome do Fornecedor*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Holambra" 
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
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Nome do Contato*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: João Silva" 
                      className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                      onFocus={handleInputFocus}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Telefone</FormLabel>
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
                    <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="contato@empresa.com" 
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

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Endereço</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Rua, número, bairro, cidade" 
                      className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                      onFocus={handleInputFocus}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Limite de Crédito*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="R$ 25.000" 
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>Status*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={`${isMobile ? 'h-11 text-base' : 'h-9 text-sm'} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 dark:text-white`}>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50 rounded-lg shadow-lg">
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
                form="edit-supplier-form"
                className={`${isMobile ? 'h-11 w-full text-base' : 'h-9 text-sm px-6'} bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm transition-colors duration-200`}
              >
                Salvar Alterações
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideClose className="w-[90vw] max-w-[520px] h-[85vh] max-h-[700px] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md rounded-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-950 [&>button]:hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
}
