import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, DollarSign, TrendingUp, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  id: string;
  supplier: string;
  status: string;
  items: number;
  total: string;
  deliveryDate: string;
  onClick?: () => void;
}

/**
 * Card de pedido mobile otimizado
 * - Memoizado para evitar re-renders
 * - GPU acceleration
 * - Touch optimization
 * - Visual moderno com gradientes
 */
export const OrderMobileCard = memo<Props>(function OrderMobileCard({ 
  id,
  supplier, 
  status, 
  items, 
  total, 
  deliveryDate, 
  onClick 
}) {
  // Configurações de status com cores e ícones
  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'entregue':
        return {
          badge: <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 font-medium">Entregue</Badge>,
          gradient: 'from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10',
          border: 'border-emerald-200/60 dark:border-emerald-800/40',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          icon: Truck,
        };
      case 'confirmado':
        return {
          badge: <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 font-medium">Confirmado</Badge>,
          gradient: 'from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10',
          border: 'border-blue-200/60 dark:border-blue-800/40',
          iconBg: 'bg-blue-100 dark:bg-blue-900/40',
          iconColor: 'text-blue-600 dark:text-blue-400',
          icon: TrendingUp,
        };
      case 'processando':
        return {
          badge: <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 font-medium">Processando</Badge>,
          gradient: 'from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10',
          border: 'border-amber-200/60 dark:border-amber-800/40',
          iconBg: 'bg-amber-100 dark:bg-amber-900/40',
          iconColor: 'text-amber-600 dark:text-amber-400',
          icon: Package,
        };
      case 'cancelado':
        return {
          badge: <Badge variant="destructive" className="font-medium">Cancelado</Badge>,
          gradient: 'from-red-50/50 to-pink-50/30 dark:from-red-950/20 dark:to-pink-950/10',
          border: 'border-red-200/60 dark:border-red-800/40',
          iconBg: 'bg-red-100 dark:bg-red-900/40',
          iconColor: 'text-red-600 dark:text-red-400',
          icon: Package,
        };
      default:
        return {
          badge: <Badge variant="secondary" className="font-medium">Pendente</Badge>,
          gradient: 'from-gray-50/50 to-slate-50/30 dark:from-gray-950/20 dark:to-slate-950/10',
          border: 'border-gray-200/60 dark:border-gray-800/40',
          iconBg: 'bg-gray-100 dark:bg-gray-900/40',
          iconColor: 'text-gray-600 dark:text-gray-400',
          icon: Package,
        };
    }
  };

  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <Card 
      onClick={onClick} 
      className={cn(
        "group relative overflow-hidden border backdrop-blur-sm",
        "bg-gradient-to-br",
        config.gradient,
        config.border,
        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        "transition-all duration-200 ease-out",
        "touch-manipulation cursor-pointer"
      )}
      style={{
        contain: 'layout style paint',
        transform: 'translateZ(0)',
      }}
    >
      {/* Brilho sutil no topo */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Ícone de status */}
            <div className={cn(
              "p-2.5 rounded-xl shrink-0",
              config.iconBg,
              "group-hover:scale-110 transition-transform duration-200"
            )}>
              <StatusIcon className={cn("h-5 w-5", config.iconColor)} />
            </div>
            
            {/* Nome do fornecedor */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
                {supplier}
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Pedido #{id.substring(0, 8)}
              </p>
            </div>
          </div>
          
          {/* Badge de status */}
          <div className="shrink-0">
            {config.badge}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {/* Informações principais em grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Itens */}
          <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-700/30">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Itens</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{items}</p>
          </div>
          
          {/* Valor total */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50/80 to-green-50/60 dark:from-emerald-900/20 dark:to-green-900/10 border border-emerald-200/40 dark:border-emerald-700/30">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Total</span>
            </div>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 truncate">{total}</p>
          </div>
        </div>
        
        {/* Data de entrega */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/40 dark:border-blue-700/30">
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Entrega prevista</p>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">{deliveryDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
