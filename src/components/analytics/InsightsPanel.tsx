import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightCard } from "./InsightCard";
import { Sparkles, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Insight {
  id: string;
  categoria: 'economia' | 'performance' | 'recomendacao' | 'tendencia';
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  acaoSugerida?: string;
}

interface InsightsPanelProps {
  insights: Insight[];
  isGenerating: boolean;
  lastGenerated: Date | null;
  onGenerate: () => void;
}

export function InsightsPanel({
  insights,
  isGenerating,
  lastGenerated,
  onGenerate,
}: InsightsPanelProps) {
  const hasInsights = insights.length > 0;

  // Agrupar insights por categoria
  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.categoria]) {
      acc[insight.categoria] = [];
    }
    acc[insight.categoria].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  const categoriaLabels = {
    economia: '💰 Oportunidades de Economia',
    performance: '⚡ Melhorias de Performance',
    recomendacao: '🎯 Recomendações Estratégicas',
    tendencia: '📊 Tendências e Padrões',
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de gerar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Insights com IA
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Análises inteligentes geradas com Gemini
          </p>
          {lastGenerated && (
            <p className="text-xs text-muted-foreground mt-1">
              Gerado {formatDistanceToNow(lastGenerated, { addSuffix: true, locale: ptBR })}
            </p>
          )}
        </div>
        
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {hasInsights ? 'Gerar Novos Insights' : 'Gerar Insights'}
            </>
          )}
        </Button>
      </div>

      {/* Loading state */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto text-primary animate-pulse mb-4" />
            <p className="text-lg font-medium text-foreground">
              IA analisando seus dados...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Isso pode levar alguns segundos
            </p>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isGenerating && !hasInsights && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum insight gerado ainda
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Clique em "Gerar Insights" para que a IA analise seus dados e forneça
            recomendações personalizadas para otimizar suas cotações e economias.
          </p>
        </div>
      )}

      {/* Insights agrupados por categoria */}
      {!isGenerating && hasInsights && (
        <div className="space-y-8">
          {Object.entries(categoriaLabels).map(([categoria, label]) => {
            const categoryInsights = groupedInsights[categoria];
            if (!categoryInsights || categoryInsights.length === 0) return null;

            return (
              <div key={categoria} className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  {label}
                </h3>
                <div className="grid gap-4">
                  {categoryInsights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
