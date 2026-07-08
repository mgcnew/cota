import { useState, lazy, Suspense, memo, Component } from "react";
import type { ReactNode } from "react";
import { ShoppingBag, Calculator, Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

class ChunkErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    const isChunkError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Importing a module script failed');
    if (isChunkError && !sessionStorage.getItem('chunk-reload')) {
      sessionStorage.setItem('chunk-reload', '1');
      window.location.reload();
    }
    return { hasError: true };
  }

  componentDidUpdate() {
    if (this.state.hasError) sessionStorage.removeItem('chunk-reload');
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const ProdutosTab = lazy(() => import("@/components/compras/ProdutosTab"));
const ProcurementCalculator = lazy(() => import("@/components/compras/ProcurementCalculator"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className={cn("h-8 w-8 animate-spin", ds.colors.text.primary)} />
  </div>
);

function Compras() {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <PageWrapper>
      <div className={ds.layout.container.page}>
        {/* Page Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-border dark:border-zinc-800">
          <div className="hidden sm:flex p-2.5 rounded-xl border transition-all bg-card border-border">
            <ShoppingBag className="h-5 w-5 text-brand" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCalcOpen(true)}
            className="ml-auto h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
            title="Calculadora"
          >
            <Calculator className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ChunkErrorBoundary>
          <Suspense fallback={<TabLoader />}>
            <div className="animate-page-enter">
              <ProdutosTab />
            </div>
          </Suspense>
        </ChunkErrorBoundary>
      </div>

      {/* Calculator Modal */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent className="max-w-[360px] p-0 overflow-hidden rounded-2xl" hideClose>
          <DialogHeader className="sr-only">
            <DialogTitle>Calculadora</DialogTitle>
          </DialogHeader>
          <ChunkErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <ProcurementCalculator />
            </Suspense>
          </ChunkErrorBoundary>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

export default memo(Compras);
