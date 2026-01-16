import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
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

  // Conteúdo do formulário (reutilizado em mobile e desktop)
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`flex flex-col h-full ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 py-4' : 'px-4 sm:px-5 py-4 sm:py-5'}`}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={isMobile ? 'text-sm font-semibold' : ''}>Nome do Fornecedor*</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Holambra" 
                    className={isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'}
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
                <FormLabel className={isMobile ? 'text-sm font-semibold' : ''}>Nome do Contato*</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: João Silva" 
                    className={isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'}
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
                  <FormLabel className={isMobile ? 'text-sm font-semibold' : ''}>Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(11) 99999-9999" 
                      className={isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'}
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
                  <FormLabel className={isMobile ? 'text-sm font-semibold' : ''}>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="contato@empresa.com" 
                      type="email" 
                      className={isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'}
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
                <FormLabel className={isMobile ? 'text-sm font-semibold' : ''}>Endereço</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Rua, número, bairro, cidade" 
                    className={isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'}
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
                  <FormLabel className={isMobile ? 'text-sm font-semibold' : ''}>Limite de Crédito*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="R$ 25.000" 
                      className={isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'}
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
                  <FormLabel className={isMobile ? 'text-sm font-semibold' : ''}>Status*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={isMobile ? 'h-11 text-base px-4' : 'h-10 text-sm px-3.5'}>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

        <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-4 flex flex-col gap-2' : 'flex justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200/60 dark:border-gray-700/40'}`}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            className={isMobile ? 'h-11 w-full text-base' : 'h-9 rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm dark:text-white px-4'}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            className={isMobile ? 'h-11 w-full text-base' : 'h-9 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm px-6'}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );

  // Mobile: Usar Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="h-[90vh] rounded-t-2xl pb-8 overflow-hidden flex flex-col p-0">
          <DrawerHeader className="flex-shrink-0 px-4 py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                  <Building2 className="h-5 w-5" />
                </div>
                <DrawerTitle className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  Editar Fornecedor
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
      <DialogContent className="w-[90vw] max-w-[520px] h-[85vh] max-h-[700px] overflow-hidden border border-gray-200/60 dark:border-gray-700/30 shadow-xl rounded-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-900 [&>button]:hidden">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white flex-shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                Editar Fornecedor
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
