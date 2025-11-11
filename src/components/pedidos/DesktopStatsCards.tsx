import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Truck, DollarSign, Package } from "lucide-react";
import { memo } from "react";

interface Stats {
  pedidosAtivos: number;
  pedidosEntregues: number;
  pedidosCancelados: number;
  totalValueFormatado: string;
  valorMedioFormatado: string;
  totalItens: number;
  mediaItensPorPedido: number;
  percentualAtivos: number;
  taxaEntrega: number;
  totalPedidos: number;
  pedidosPendentes: number;
  pedidosProcessando: number;
}

interface Props {
  stats: Stats;
}

export default memo(function DesktopStatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
      {/* Card 1: Pedidos Ativos */}
      <Card className="group relative overflow-hidden bg-amber-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
        <svg
          className="absolute right-0 top-0 h-full w-2/3 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
          viewBox="0 0 300 200"
          fill="none"
          style={{ zIndex: 0 }}
        >
          <circle cx="220" cy="100" r="90" fill="#fff" fillOpacity="0.08" />
          <circle cx="260" cy="60" r="60" fill="#fff" fillOpacity="0.10" />
          <circle cx="200" cy="160" r="50" fill="#fff" fillOpacity="0.07" />
          <circle cx="270" cy="150" r="30" fill="#fff" fillOpacity="0.12" />
        </svg>

        <CardHeader className="border-0 z-10 relative pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-white/70 dark:text-gray-400" />
            <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
              Ativos
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 z-10 relative">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
              {stats.pedidosAtivos}
            </span>
            {stats.percentualAtivos > 0 && (
              <Badge className="bg-white/20 text-white font-semibold border-0">
                {stats.percentualAtivos}%
              </Badge>
            )}
          </div>
          <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
            <div className="flex items-center justify-between">
              <span>Em andamento:</span>
              <span className="font-medium text-white dark:text-gray-300">
                {stats.pedidosAtivos}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Percentual:</span>
              <span className="font-medium">{stats.percentualAtivos}%</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
              <span>{stats.pedidosPendentes} pendentes</span>
              <span>•</span>
              <span>{stats.pedidosProcessando} processando</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Entregues */}
      <Card className="group relative overflow-hidden bg-emerald-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
        <svg
          className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
          viewBox="0 0 200 200"
          fill="none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <filter id="blur-entregues" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <ellipse cx="170" cy="60" rx="40" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur-entregues)" />
          <rect x="120" y="20" width="60" height="20" rx="8" fill="#fff" fillOpacity="0.10" />
          <polygon points="150,0 200,0 200,50" fill="#fff" fillOpacity="0.07" />
          <circle cx="180" cy="100" r="14" fill="#fff" fillOpacity="0.16" />
        </svg>

        <CardHeader className="border-0 z-10 relative pb-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-white/70 dark:text-gray-400" />
            <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
              Entregues
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 z-10 relative">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
              {stats.pedidosEntregues}
            </span>
            {stats.taxaEntrega > 0 && (
              <Badge className="bg-white/20 text-white font-semibold border-0">
                {stats.taxaEntrega}%
              </Badge>
            )}
          </div>
          <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
            <div className="flex items-center justify-between">
              <span>Concluídos:</span>
              <span className="font-medium text-white dark:text-gray-300">
                {stats.pedidosEntregues}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Taxa de entrega:</span>
              <span className="font-medium">{stats.taxaEntrega}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Valor Total */}
      <Card className="group relative overflow-hidden bg-blue-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
        <svg
          className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
          viewBox="0 0 200 200"
          fill="none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <filter id="blur-valor-pedidos" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>
          <rect x="120" y="0" width="70" height="70" rx="35" fill="#fff" fillOpacity="0.09" filter="url(#blur-valor-pedidos)" />
          <ellipse cx="170" cy="80" rx="28" ry="12" fill="#fff" fillOpacity="0.12" />
          <polygon points="200,0 200,60 140,0" fill="#fff" fillOpacity="0.07" />
          <circle cx="150" cy="30" r="10" fill="#fff" fillOpacity="0.15" />
        </svg>

        <CardHeader className="border-0 z-10 relative pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-white/70 dark:text-gray-400" />
            <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
              Valor Total
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 z-10 relative">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-semibold tracking-tight text-white dark:text-white truncate">
              {stats.totalValueFormatado}
            </span>
          </div>
          <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
            <div className="flex items-center justify-between">
              <span>Em pedidos:</span>
              <span className="font-medium text-white dark:text-gray-300">
                {stats.totalValueFormatado}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Média por pedido:</span>
              <span className="font-medium">{stats.valorMedioFormatado}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Itens */}
      <Card className="group relative overflow-hidden bg-purple-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
        <svg
          className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
          viewBox="0 0 200 200"
          fill="none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <filter id="blur-itens-pedidos" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
          </defs>
          <polygon points="200,0 200,100 100,0" fill="#fff" fillOpacity="0.09" />
          <ellipse cx="170" cy="40" rx="30" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur-itens-pedidos)" />
          <rect x="140" y="60" width="40" height="18" rx="8" fill="#fff" fillOpacity="0.10" />
          <circle cx="150" cy="30" r="14" fill="#fff" fillOpacity="0.18" />
          <line x1="120" y1="0" x2="200" y2="80" stroke="#fff" strokeOpacity="0.08" strokeWidth="6" />
        </svg>

        <CardHeader className="border-0 z-10 relative pb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-white/70 dark:text-gray-400" />
            <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
              Itens
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 z-10 relative">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
              {stats.mediaItensPorPedido}
            </span>
            <Badge className="bg-white/20 text-white font-semibold border-0">
              Média
            </Badge>
          </div>
          <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
            <div className="flex items-center justify-between">
              <span>Média por pedido:</span>
              <span className="font-medium text-white dark:text-gray-300">
                {stats.mediaItensPorPedido}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Total de itens:</span>
              <span className="font-medium">{stats.totalItens}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
              <span>{stats.totalPedidos} pedidos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
