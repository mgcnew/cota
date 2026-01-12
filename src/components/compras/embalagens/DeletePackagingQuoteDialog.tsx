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
import type { PackagingQuoteDisplay } from "@/types/packaging";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PackagingQuoteDisplay | null;
  onConfirm: () => void;
}

export function DeletePackagingQuoteDialog({ open, onOpenChange, quote, onConfirm }: Props) {
  if (!quote) return null;

  const itemNames = quote.itens.map(i => i.packagingName).join(', ');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir cotação de embalagem?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a cotação de <strong>{itemNames || 'embalagens'}</strong>?
            <br /><br />
            Esta ação não pode ser desfeita. Todos os valores e respostas de fornecedores serão perdidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
