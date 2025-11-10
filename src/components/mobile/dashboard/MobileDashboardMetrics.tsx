import { memo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Building2, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsData {
  cotacoesAtivas: number;
  fornecedores: number;
  produtosCadastrados: number;
  pedidosMes: number;
  totalPedidosMes: number;
  economiaGerada: number;
  economiaPotencial: number;
}

interface MobileDashboardMetricsProps {
  metrics: MetricsData;
  isLoading?: boolean;
}

/**
 * Componente de métricas otimizado para mobile
 * 
 * Features:
 * - Carousel horizontal com navegação por setas
 * - Cards leves sem animações pesadas
 * - Sem gráficos complexos
 * - CSS puro para performance
 * - Memoizado para evitar re-renders
 */
export const MobileDashboardMetrics = memo<MobileDashboardMetricsProps>(
  function MobileDashboardMetrics({ metrics, isLoading }) {
    const [activeCardIndex, setActiveCardIndex] = useState(0);

    const handlePrevCard = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveCardIndex((prev) => (prev === 0 ? 3 : prev - 1));
    }, []);

    const handleNextCard = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveCardIndex((prev) => (prev === 3 ? 0 : prev + 1));
    }, []);

    const formatCurrency = (value: number) => {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    if (isLoading) {
      return (
        <div className="mb-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      );
    }

    const cards = [
      {
        title: 'Cotações Ativas',
        value: metrics.cotacoesAtivas,
        icon: FileText,
        bgColor: 'bg-teal-600 dark:bg-[#1C1F26]',
        borderColor: 'border-teal-500/30 dark:border-gray-800',
      },
      {
        title: 'Fornecedores',
        value: metrics.fornecedores,
        icon: Building2,
        bgColor: 'bg-blue-600 dark:bg-[#1C1F26]',
        borderColor: 'border-blue-500/30 dark:border-gray-800',
      },
      {
        title: 'Produtos',
        value: metrics.produtosCadastrados,
        icon: Package,
        bgColor: 'bg-purple-600 dark:bg-[#1C1F26]',
        borderColor: 'border-purple-500/30 dark:border-gray-800',
      },
      {
        title: 'Economia',
        value: formatCurrency(metrics.economiaGerada),
        icon: DollarSign,
        bgColor: 'bg-green-600 dark:bg-[#1C1F26]',
        borderColor: 'border-green-500/30 dark:border-gray-800',
        badge: 'Gerada',
      },
    ];

    return (
      <div className="mb-6">
        {/* Navegação do carousel */}
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-2 pt-3 pb-2 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevCard}
              className="h-8 w-8 p-0 rounded-full bg-white/20 dark:bg-gray-900/40 hover:bg-white/30 dark:hover:bg-gray-900/60 text-white dark:text-gray-200 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 shadow-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 dark:bg-gray-900/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 shadow-lg">
              <span className="text-xs font-semibold text-white dark:text-gray-200">
                {activeCardIndex + 1} / 4
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextCard}
              className="h-8 w-8 p-0 rounded-full bg-white/20 dark:bg-gray-900/40 hover:bg-white/30 dark:hover:bg-gray-900/60 text-white dark:text-gray-200 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 shadow-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Container do carousel */}
          <div className="relative overflow-hidden rounded-xl" style={{ minHeight: '180px' }}>
            <div 
              className="flex"
              style={{ 
                transform: `translateX(-${activeCardIndex * 100}%)`,
                transition: 'none', // Sem transição para melhor performance
              }}
            >
              {cards.map((card, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <Card className={cn(
                    card.bgColor,
                    'border',
                    card.borderColor,
                    'rounded-lg hover:border-opacity-50 transition-colors duration-200'
                  )}>
                    <CardHeader className="pb-3 border-0">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-white/10 dark:bg-gray-800">
                          <card.icon className="h-4 w-4 text-white dark:text-gray-400" />
                        </div>
                        <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
                          {card.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2.5 pt-0">
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
                          {card.value}
                        </span>
                        {card.badge && (
                          <Badge className="bg-white/20 text-white font-medium border-0 px-2 py-0.5 text-xs">
                            {card.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
                        <div className="flex items-center justify-between">
                          <span>Atualizado agora</span>
                          <TrendingUp className="h-3 w-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
