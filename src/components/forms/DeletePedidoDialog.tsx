import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeletePedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  onDelete: () => void;
}

export default function DeletePedidoDialog({ open, onOpenChange, pedido, onDelete }: DeletePedidoDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', pedido.id);

      if (error) throw error;

      toast({
        title: "Pedido excluído",
        description: "Pedido removido com sucesso",
      });

      onDelete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl rounded-xl !bg-white/80 dark:!bg-gray-950/80 backdrop-blur-xl [&>button]:hidden">
        <DialogHeader className="px-6 py-6 border-b border-white/10 dark:border-white/5 bg-white/20 dark:bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Excluir Pedido</DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                Esta ação é irreversível e removerá todos os dados vinculados.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="bg-red-500/5 dark:bg-red-900/10 p-4 rounded-xl border border-red-500/10 backdrop-blur-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Você está prestes a excluir o pedido <span className="font-bold text-red-600 dark:text-red-400">#{pedido?.id?.substring(0, 8)}</span> do fornecedor <span className="font-bold text-gray-900 dark:text-white">{pedido?.fornecedor || pedido?.supplier_name}</span>.
            </p>
          </div>

          <div className="bg-white/40 dark:bg-gray-900/40 p-4 rounded-xl border border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest opacity-70">Fornecedor</span>
              <span className="font-bold text-gray-900 dark:text-white">{pedido?.fornecedor || pedido?.supplier_name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest opacity-70">Valor Total</span>
              <span className="font-black text-gray-900 dark:text-white">R$ {pedido?.total || pedido?.total_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest opacity-70">Status</span>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 font-bold uppercase tracking-tighter text-[10px]">
                {pedido?.status}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-white/10 dark:border-white/5 bg-white/20 dark:bg-gray-950/20 backdrop-blur-md flex flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="flex-1 h-11 border-white/20 dark:border-white/10 bg-transparent font-bold text-xs uppercase tracking-widest hover:bg-white/10 dark:hover:bg-white/5 transition-all"
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
            className="flex-1 h-11 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Exclusão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
