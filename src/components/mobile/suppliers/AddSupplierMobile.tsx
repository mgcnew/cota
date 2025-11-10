import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, Phone, Mail, MapPin, User } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  contact: z.string().trim().min(1, 'Contato é obrigatório').max(100, 'Contato muito longo'),
  phone: z.string().trim().max(20, 'Telefone muito longo').optional().or(z.literal('')),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface AddSupplierMobileProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

/**
 * Modal mobile otimizado para adicionar fornecedor
 * 
 * Features:
 * - Sheet responsivo para mobile
 * - Formulário simplificado (apenas campos essenciais)
 * - Validação com zod
 * - Loading states claros
 * - Ícones intuitivos
 */
export function AddSupplierMobile({ trigger, onSuccess }: AddSupplierMobileProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact: '',
      phone: '',
      email: '',
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para adicionar fornecedores.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar company_id do usuário
      const { data: companyUser, error: companyError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (companyError || !companyUser?.company_id) {
        throw new Error('Empresa não encontrada para o usuário');
      }

      // Criar fornecedor
      const { error } = await supabase.from('suppliers').insert([
        {
          name: data.name,
          contact: data.contact,
          phone: data.phone || null,
          email: data.email || null,
          company_id: companyUser.company_id,
        },
      ]);

      if (error) throw error;

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['suppliers-mobile-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });

      toast({
        title: 'Fornecedor criado',
        description: 'O fornecedor foi adicionado com sucesso.',
      });

      // Reset e fechar
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      toast({
        title: 'Erro ao criar fornecedor',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Building2 className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Novo Fornecedor
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
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-orange-600 hover:bg-orange-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
