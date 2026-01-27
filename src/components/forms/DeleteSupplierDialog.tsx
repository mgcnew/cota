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
import { toast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
}

interface DeleteSupplierDialogProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

export default function DeleteSupplierDialog({
  supplier,
  open,
  onOpenChange,
  onDelete,
}: DeleteSupplierDialogProps) {
  const handleDelete = () => {
    if (supplier) {
      onDelete(supplier.id);
      toast({
        title: "Fornecedor excluído",
        description: `${supplier.name} foi excluído com sucesso.`,
        variant: "destructive",
      });
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="!bg-white/80 dark:!bg-gray-950/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="dark:text-white">Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription className="dark:text-gray-400">
            Tem certeza que deseja excluir o fornecedor{" "}
            <strong className="dark:text-gray-200">{supplier?.name}</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm dark:text-gray-300 border-gray-200 dark:border-gray-700">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-500/20 transition-all duration-200 active:scale-95">
            Excluir Fornecedor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
