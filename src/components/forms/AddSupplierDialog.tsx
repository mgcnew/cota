import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";

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
  const [open, setOpen] = useState(false);
  const { logActivity } = useActivityLog();

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

  const onSubmit = async (data: SupplierFormData) => {
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

      const { error } = await supabase
        .from('suppliers')
        .insert({
          name: data.name,
          cnpj: data.cnpj || null,
          contact: data.contact,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          user_id: userData.user.id,
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
        description: `${data.name} foi adicionado com sucesso.`,
      });
      
      onAdd();
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[600px] h-[85vh] max-h-[800px] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 flex flex-col">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-teal-50/40 backdrop-blur-sm relative overflow-hidden">
          {/* Efeitos decorativos de fundo */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-400/10 to-cyan-400/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg shadow-green-500/25 ring-2 ring-white/20 backdrop-blur-sm flex-shrink-0">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
                Novo Fornecedor
              </DialogTitle>
              <DialogDescription className="text-gray-600/80 text-sm font-medium mt-1">
                Cadastre um novo fornecedor no sistema
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col flex-1 overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Seção: Informações da Empresa */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 pb-2 sm:pb-3 border-b border-gray-200/60">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md text-sm">
                      🏢
                    </div>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">Informações da Empresa</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">Nome do Fornecedor *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Holambra Distribuidora" 
                              className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400/20"
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
                          <FormLabel className="text-sm font-semibold text-gray-700">CNPJ</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00.000.000/0000-00" 
                              className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400/20"
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
                        <FormLabel className="text-sm font-semibold text-gray-700">Endereço Completo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Rua das Flores, 123, Centro, São Paulo - SP" 
                            className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400/20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Seção: Informações de Contato */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 pb-2 sm:pb-3 border-b border-gray-200/60">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md text-sm">
                      👤
                    </div>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">Informações de Contato</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">Nome do Contato Principal *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: João Silva Santos" 
                            className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400/20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">Telefone / WhatsApp</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
                              className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400/20"
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
                          <FormLabel className="text-sm font-semibold text-gray-700">Email Comercial</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="comercial@empresa.com" 
                              type="email" 
                              className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400/20"
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
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-xl p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                      💡
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1 text-sm sm:text-base">Dicas de Cadastro</h4>
                      <ul className="text-xs sm:text-sm text-green-800 space-y-0.5 sm:space-y-1">
                        <li>• Campos com * são obrigatórios</li>
                        <li>• Email será usado para envio de cotações</li>
                        <li>• Mantenha dados atualizados</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer com botões */}
              <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100/60 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    className="rounded-xl border-gray-200 hover:bg-gray-50 text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Adicionar Fornecedor
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
