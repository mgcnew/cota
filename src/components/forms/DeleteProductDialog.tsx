import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  category: string;
  lastQuotePrice: string;
  bestSupplier: string;
  quotesCount: number;
  lastUpdate: string;
  trend: "up" | "down" | "stable";
}

interface DeleteProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductDeleted: (productId: string) => void;
}

export function DeleteProductDialog({ 
  product, 
  open, 
  onOpenChange, 
  onProductDeleted 
}: DeleteProductDialogProps) {
  const { toast } = useToast();

  const handleDelete = () => {
    if (!product) return;

    onProductDeleted(product.id);
    
    toast({
      title: "Produto excluído",
      description: `${product.name} foi excluído com sucesso.`,
      variant: "destructive",
    });

    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
          <AlertDialogDescription>
            {product ? (
              <>
                Tem certeza que deseja excluir o produto <strong>{product.name}</strong>?
                <br />
                Esta ação não pode ser desfeita e irá remover todas as cotações associadas.
              </>
            ) : (
              "Produto não encontrado."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={!product}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}