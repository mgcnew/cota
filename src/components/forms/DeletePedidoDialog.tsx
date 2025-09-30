import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface DeletePedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  onDelete: (id: string) => void;
}

export default function DeletePedidoDialog({ open, onOpenChange, pedido, onDelete }: DeletePedidoDialogProps) {
  const { toast } = useToast();

  const handleDelete = () => {
    onDelete(pedido.id);
    toast({
      title: "Pedido excluído",
      description: "O pedido foi removido com sucesso",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Excluir Pedido</DialogTitle>
          </div>
          <DialogDescription>
            Tem certeza que deseja excluir o pedido <strong>{pedido?.id}</strong> do fornecedor <strong>{pedido?.fornecedor}</strong>?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fornecedor:</span>
            <span className="font-medium">{pedido?.fornecedor}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-medium">{pedido?.total}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium capitalize">{pedido?.status}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Excluir Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
