/**
 * FiltersDialog Component
 * 
 * Dialog for advanced filtering of reports by suppliers and products.
 * Extracted from Relatorios.tsx for better modularity.
 * 
 * @module components/reports/layout/FiltersDialog
 * Requirements: 1.4
 */

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Filter, CheckCircle } from "lucide-react";
import { ReportFilters } from "@/components/reports/ReportFilters";
import type { FiltersDialogProps } from "@/types/reports";

export const FiltersDialog: React.FC<FiltersDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedFornecedores,
  selectedProdutos,
  onFornecedoresChange,
  onProdutosChange,
  onReset,
}) => {
  // Calculate total active filters
  const totalFilters = useMemo(() => {
    return selectedFornecedores.length + selectedProdutos.length;
  }, [selectedFornecedores.length, selectedProdutos.length]);

  const hasFilters = totalFilters > 0;

  // Handle apply button click
  const handleApply = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-purple-50/80 via-violet-50/60 to-purple-50/40 backdrop-blur-sm relative overflow-hidden">
          {/* Decorative background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-purple-500/5"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg ring-2 ring-purple-100/50">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Filtros Avançados</DialogTitle>
              <p className="text-sm text-gray-600 mt-0.5">Personalize os dados dos seus relatórios</p>
            </div>
          </div>
        </DialogHeader>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ReportFilters 
            selectedFornecedores={selectedFornecedores} 
            selectedProdutos={selectedProdutos} 
            onFornecedoresChange={onFornecedoresChange} 
            onProdutosChange={onProdutosChange} 
            onReset={onReset} 
          />
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {hasFilters ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {totalFilters} filtro{totalFilters > 1 ? 's' : ''} aplicado{totalFilters > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-gray-500">Nenhum filtro aplicado</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReset} 
                className="text-gray-600 hover:text-gray-800"
              >
                Limpar todos
              </Button>
            )}
            <Button 
              onClick={handleApply} 
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FiltersDialog;
