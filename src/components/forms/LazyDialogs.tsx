/**
 * Lazy Loading for Dialogs (Requirements 12.3)
 * 
 * This module provides lazy-loaded versions of all dialog components.
 * Dialogs are loaded only on first user interaction, reducing initial bundle size.
 * 
 * Usage:
 * ```tsx
 * import { AddProductDialogLazy } from '@/components/forms/LazyDialogs';
 * 
 * // Use like the regular dialog, but it will be loaded on demand
 * <AddProductDialogLazy open={isOpen} onOpenChange={setIsOpen} />
 * ```
 */

import { lazy, Suspense, ComponentType, useState, useEffect, FC } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

// Loading fallback for dialogs
function DialogLoader() {
  const isMobile = useIsMobile();
  
  const LoadingContent = (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open>
        <DrawerContent>{LoadingContent}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open>
      <DialogContent>{LoadingContent}</DialogContent>
    </Dialog>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProps = any;

/**
 * Creates a lazy-loaded dialog component that only loads when first rendered
 */
function createLazyDialog(
  importFn: () => Promise<{ default: ComponentType<AnyProps> } | Record<string, ComponentType<AnyProps>>>,
  exportName?: string
): FC<AnyProps> {
  const LazyComponent = lazy(() =>
    importFn().then((module) => {
      if (exportName && exportName in module) {
        return { default: (module as Record<string, ComponentType<AnyProps>>)[exportName] };
      }
      return module as { default: ComponentType<AnyProps> };
    })
  );

  return function LazyDialog(props: AnyProps) {
    return (
      <Suspense fallback={<DialogLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Creates a lazy-loaded dialog that only imports when `open` prop becomes true
 * This provides even better performance by deferring the import until needed
 * 
 * Fixed: Removed intermediate loader to prevent "flash" effect
 */
function createDeferredLazyDialog(
  importFn: () => Promise<{ default: ComponentType<AnyProps> } | Record<string, ComponentType<AnyProps>>>,
  exportName?: string
): FC<AnyProps> {
  return function DeferredLazyDialog(props: AnyProps) {
    const [LazyComponent, setLazyComponent] = useState<ComponentType<AnyProps> | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      // Only start loading when dialog opens and component isn't loaded yet
      if (props.open && !LazyComponent && !isLoading) {
        setIsLoading(true);
        importFn().then((module) => {
          if (exportName && exportName in module) {
            setLazyComponent(() => (module as Record<string, ComponentType<AnyProps>>)[exportName]);
          } else {
            setLazyComponent(() => (module as { default: ComponentType<AnyProps> }).default);
          }
          setIsLoading(false);
        }).catch(() => {
          setIsLoading(false);
        });
      }
    }, [props.open, LazyComponent, isLoading]);

    // Don't render anything until component is loaded
    // This prevents the "flash" of the loader dialog
    if (!LazyComponent) {
      return null;
    }

    return <LazyComponent {...props} />;
  };
}

// ============================================================================
// Product Dialogs
// ============================================================================

export const AddProductDialogLazy = createDeferredLazyDialog(
  () => import('./AddProductDialog'),
  'AddProductDialog'
);

export const EditProductDialogLazy = createDeferredLazyDialog(
  () => import('./EditProductDialog'),
  'EditProductDialog'
);

export const DeleteProductDialogLazy = createDeferredLazyDialog(
  () => import('./DeleteProductDialog'),
  'DeleteProductDialog'
);

export const ImportProductsDialogLazy = createDeferredLazyDialog(
  () => import('./ImportProductsDialog'),
  'ImportProductsDialog'
);

export const ProductPriceHistoryDialogLazy = createDeferredLazyDialog(
  () => import('./ProductPriceHistoryDialog'),
  'ProductPriceHistoryDialog'
);

export const DeleteDuplicateProductsDialogLazy = createDeferredLazyDialog(
  () => import('./DeleteDuplicateProductsDialog'),
  'DeleteDuplicateProductsDialog'
);

// ============================================================================
// Supplier Dialogs
// ============================================================================

export const AddSupplierDialogLazy = createDeferredLazyDialog(
  () => import('./AddSupplierDialog')
);

export const EditSupplierDialogLazy = createDeferredLazyDialog(
  () => import('./EditSupplierDialog')
);

export const DeleteSupplierDialogLazy = createDeferredLazyDialog(
  () => import('./DeleteSupplierDialog')
);

export const ImportSuppliersDialogLazy = createDeferredLazyDialog(
  () => import('./ImportSuppliersDialog'),
  'ImportSuppliersDialog'
);

export const SupplierQuoteHistoryDialogLazy = createDeferredLazyDialog(
  () => import('./SupplierQuoteHistoryDialog'),
  'SupplierQuoteHistoryDialog'
);

// ============================================================================
// Quote Dialogs
// ============================================================================

export const AddQuoteDialogLazy = createDeferredLazyDialog(
  () => import('./AddQuoteDialog')
);

export const DeleteQuoteDialogLazy = createDeferredLazyDialog(
  () => import('./DeleteQuoteDialog')
);

export const ResumoCotacaoDialogLazy = createDeferredLazyDialog(
  () => import('./ResumoCotacaoDialog')
);

export const GerenciarCotacaoDialogLazy = createDeferredLazyDialog(
  () => import('./GerenciarCotacaoDialog'),
  'GerenciarCotacaoDialog'
);

export const ViewQuoteDialogLazy = createDeferredLazyDialog(
  () => import('./ViewQuoteDialog')
);

export const CotacaoDialogLazy = createDeferredLazyDialog(
  () => import('./CotacaoDialog')
);

// ============================================================================
// Order Dialogs
// ============================================================================

export const AddPedidoDialogLazy = createDeferredLazyDialog(
  () => import('./AddPedidoDialog')
);

export const PedidoDialogLazy = createDeferredLazyDialog(
  () => import('./PedidoDialog')
);

export const DeletePedidoDialogLazy = createDeferredLazyDialog(
  () => import('./DeletePedidoDialog')
);

export const ConvertToOrderDialogLazy = createDeferredLazyDialog(
  () => import('./ConvertToOrderDialog')
);

export const ConvertToMultipleOrdersDialogLazy = createDeferredLazyDialog(
  () => import('./ConvertToMultipleOrdersDialog')
);

export const SelectSupplierPerProductDialogLazy = createDeferredLazyDialog(
  () => import('./SelectSupplierPerProductDialog'),
  'SelectSupplierPerProductDialog'
);

// ============================================================================
// History Dialogs
// ============================================================================

export const ViewHistoricoDialogLazy = createDeferredLazyDialog(
  () => import('./ViewHistoricoDialog')
);

// ============================================================================
// List Dialogs
// ============================================================================

export const AddListDialogLazy = createDeferredLazyDialog(
  () => import('./AddListDialog')
);

// ============================================================================
// Utility exports
// ============================================================================

export { createLazyDialog, createDeferredLazyDialog };
