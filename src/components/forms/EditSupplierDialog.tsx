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

  // Mobile: Usar Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent
          className="rounded-t-2xl flex flex-col p-0 bg-background border-t border-border"
          style={{
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            paddingBottom: 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Usar Dialog
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(designSystem.components.modal.content, "h-[85vh] max-h-[700px] p-0 overflow-hidden flex flex-col")}>
        <div className="flex flex-col h-full overflow-hidden">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
