import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, DollarSign } from 'lucide-react';

interface Props {
  id: string;
  supplier: string;
  status: string;
  items: number;
  total: string;
  deliveryDate: string;
  onClick?: () => void;
}

export function OrderMobileCard({ supplier, status, items, total, deliveryDate, onClick }: Props) {
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'entregue':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Entregue</Badge>;
      case 'confirmado':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Confirmado</Badge>;
      case 'processando':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Processando</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <Card onClick={onClick} className="border border-gray-200/60 bg-white dark:bg-gray-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold truncate">{supplier}</CardTitle>
          {getStatusBadge(status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>{items} itens</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{total}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Entrega: {deliveryDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
