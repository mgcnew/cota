/**
 * Forms and Dialogs Index
 * 
 * This module exports both regular and lazy-loaded versions of dialog components.
 * Use lazy-loaded versions for better performance when dialogs are not immediately needed.
 * 
 * Requirements: 12.3 - Load dialog components on first interaction
 */

// Lazy-loaded dialogs (recommended for most use cases)
export {
  // Product Dialogs
  AddProductDialogLazy,
  EditProductDialogLazy,
  DeleteProductDialogLazy,
  ImportProductsDialogLazy,
  ProductPriceHistoryDialogLazy,
  DeleteDuplicateProductsDialogLazy,
  
  // Supplier Dialogs
  AddSupplierDialogLazy,
  EditSupplierDialogLazy,
  DeleteSupplierDialogLazy,
  ImportSuppliersDialogLazy,
  SupplierQuoteHistoryDialogLazy,
  
  // Quote Dialogs
  AddQuoteDialogLazy,
  DeleteQuoteDialogLazy,
  ResumoCotacaoDialogLazy,
  GerenciarCotacaoDialogLazy,
  ViewQuoteDialogLazy,
  CotacaoDialogLazy,
  
  // Order Dialogs
  AddPedidoDialogLazy,
  PedidoDialogLazy,
  DeletePedidoDialogLazy,
  ConvertToOrderDialogLazy,
  ConvertToMultipleOrdersDialogLazy,
  SelectSupplierPerProductDialogLazy,
  
  // History Dialogs
  ViewHistoricoDialogLazy,
  
  // Utility functions
  createLazyDialog,
  createDeferredLazyDialog,
} from './LazyDialogs';
