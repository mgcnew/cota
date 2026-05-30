import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { designSystem as ds } from "@/styles/design-system";

const EmbalagensTab = lazy(() => import("@/components/compras/EmbalagensTab"));

export default function Embalagens() {
  return (
    <PageWrapper>
      <div className={ds.layout.container.page}>
        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        }>
          <EmbalagensTab />
        </Suspense>
      </div>
    </PageWrapper>
  );
}
