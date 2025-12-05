import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, Target, BarChart3 } from "lucide-react";

interface Insight {
  id: string;
  categoria: 'economia' | 'performance' | 'recomendacao' | 'tendencia';
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  acaoSugerida?: string;
}

interface InsightCardProps {
  insight: Insight;
}

const categoriaConfig = {
  economia: {
    icon: TrendingUp,
    label: 'Economia',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  performance: {
    icon: Zap,
    label: 'Performance',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
  recomendacao: {
    icon: Target,
    label: 'Recomendação',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  tendencia: {
    icon: BarChart3,
    label: 'Tendência',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
};

const prioridadeConfig = {
  alta: { label: 'Alta', variant: 'destructive' as const },
  media: { label: 'Média', variant: 'default' as const },
  baixa: { label: 'Baixa', variant: 'secondary' as const },
};

export function InsightCard({ insight }: InsightCardProps) {
  const config = categoriaConfig[insight.categoria];
  const Icon = config.icon;
  const prioridade = prioridadeConfig[insight.prioridade];

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
                <Badge variant={prioridade.variant} className="text-xs">
                  {prioridade.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground">
                {insight.titulo}
              </h3>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight.descricao}
          </p>
          
          {insight.acaoSugerida && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium text-foreground">
                💡 Ação Sugerida:
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {insight.acaoSugerida}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
