import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Quote {
  id: string;
  produto: string;
}

interface DeleteQuoteDialogProps {
  quote: Quote | null;
  onDelete: (id: string) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isDeleting?: boolean;
}

export default function DeleteQuoteDialog({
  quote,
  onDelete,
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  isDeleting = false,
}: DeleteQuoteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!quote) return;
    
    onDelete(quote.id);
  };

  if (!quote && !trigger) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <AlertDialogTrigger asChild>
          {trigger}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent className="rounded-3xl border-gray-200 dark:border-gray-800 shadow-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Confirmar Exclusão</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Tem certeza que deseja excluir a cotação <strong className="text-gray-900 dark:text-white">#{quote?.id.substring(0, 8)}</strong>?
            <br />
            Esta ação removerá permanentemente todos os preços e fornecedores vinculados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel disabled={isDeleting} className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            asChild
          >
            <Button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 transition-all duration-200 font-semibold shadow-lg shadow-red-500/20"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
