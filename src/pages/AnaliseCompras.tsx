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
