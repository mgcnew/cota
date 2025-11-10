import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, Phone, Mail, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import type { SupplierMobile } from '@/hooks/mobile/useSuppliersMobileInfinite';

const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  contact: z.string().trim().min(1, 'Contato é obrigatório').max(100, 'Contato muito longo'),
  phone: z.string().trim().max(20, 'Telefone muito longo').optional().or(z.literal('')),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface EditSupplierMobileProps {
  supplier: SupplierMobile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Modal mobile otimizado para editar fornecedor
 * 
 * Features:
 * - Sheet responsivo para mobile
 * - Formulário pré-preenchido
 * - Validação com zod
 * - Loading states claros
 * - Ícones intuitivos
 */
export function EditSupplierMobile({ supplier, open, onOpenChange, onSuccess }: EditSupplierMobileProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact: '',
      phone: '',
      email: '',
    },
  });

  // Atualizar form quando supplier mudar
  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name || '',
        contact: supplier.contact || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
      });
    }
  }, [supplier, form]);

  const onSubmit = async (data: SupplierFormData) => {
    if (!supplier?.id) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: data.name,
          contact: data.contact,
          phone: data.phone || null,
          email: data.email || null,
        })
        .eq('id', supplier.id);

      if (error) throw error;

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['suppliers-mobile-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });

      toast({
        title: 'Fornecedor atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast({
        title: 'Erro ao atualizar fornecedor',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!supplier) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Editar Fornecedor
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome do Fornecedor */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    Nome do Fornecedor *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Distribuidora ABC"
                      className="h-12 text-base"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contato */}
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Nome do Contato *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: João Silva"
                      className="h-12 text-base"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Telefone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="(00) 00000-0000"
                      className="h-12 text-base"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-600" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="fornecedor@exemplo.com"
                      className="h-12 text-base"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
