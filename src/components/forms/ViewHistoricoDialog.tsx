import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  ShoppingCart, 
  Building2, 
  TrendingUp, 
  History,
  Calendar,
  User,
  DollarSign
} from "lucide-react";

interface ViewHistoricoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

export default function ViewHistoricoDialog({ open, onOpenChange, item }: ViewHistoricoDialogProps) {
  const getTipoIcon = (tipo: string) => {
    const icons = {
      cotacao: FileText,
      pedido: ShoppingCart,
      fornecedor: Building2,
      produto: TrendingUp
    };
    
    const Icon = icons[tipo as keyof typeof icons] || History;
    return Icon;
  };

  const getTipoBadge = (tipo: string) => {
    const variants = {
      cotacao: "default",
      pedido: "secondary",
      fornecedor: "outline",
      produto: "secondary"
    };
    
    const labels = {
      cotacao: "Cotação",
      pedido: "Pedido", 
      fornecedor: "Fornecedor",
      produto: "Produto"
    };

    return (
      <Badge variant={variants[tipo as keyof typeof variants] as any}>
        {labels[tipo as keyof typeof labels]}
      </Badge>
    );
  };

  const Icon = item ? getTipoIcon(item.tipo) : History;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle>{item?.acao}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {item && getTipoBadge(item.tipo)}
                {item?.economia && (
                  <Badge variant="outline" className="text-success border-success">
                    Economia: {item.economia}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalhes
            </h3>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {item?.detalhes}
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Data e Hora
                </p>
                <p className="font-medium">{item?.data}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <User className="h-3.5 w-3.5" />
                  Usuário
                </p>
                <p className="font-medium">{item?.usuario}</p>
              </div>
            </div>

            <div className="space-y-3">
              {item?.valor && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Valor
                  </p>
                  <p className="font-medium text-lg">{item.valor}</p>
                </div>
              )}

              {item?.economia && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Economia
                  </p>
                  <p className="font-medium text-lg text-success">{item.economia}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">ID de Referência</p>
            <p className="font-mono text-sm font-medium">{item?.id}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
