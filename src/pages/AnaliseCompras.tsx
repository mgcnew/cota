import { lazy, Suspense } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";

const AnaliseTab = lazy(() => import("@/components/compras/AnaliseTab"));

export default function AnaliseCompras() {
  return (
    <PageWrapper>
      <div className={ds.layout.container.page}>
        <div className="flex items-center gap-3 pb-5 border-b border-border dark:border-zinc-800">
          <div className={cn("hidden sm:flex p-2.5 rounded-xl border transition-all", ds.components.card.root)}>
            <BarChart3 className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-foreground leading-tight">Análise de Compras</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Histórico e análise de cotações e pedidos</p>
          </div>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        }>
          <AnaliseTab />
        </Suspense>
      </div>
    </PageWrapper>
  );
}
