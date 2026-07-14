import { lazy, Suspense, memo, Component } from "react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";

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

const TabLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className={cn("h-8 w-8 animate-spin", ds.colors.text.primary)} />
  </div>
);

function Compras() {
  return (
    <PageWrapper>
      <div className={ds.layout.container.page}>
        {/* Content */}
        <ChunkErrorBoundary>
          <Suspense fallback={<TabLoader />}>
            <div className="animate-page-enter">
              <ProdutosTab />
            </div>
          </Suspense>
        </ChunkErrorBoundary>
      </div>
    </PageWrapper>
  );
}

export default memo(Compras);
