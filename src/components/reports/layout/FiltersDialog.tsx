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
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
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

  const footerContent = (
    <div className="flex items-center justify-between">
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
  );

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Filtros Avançados"
      description="Personalize os dados dos seus relatórios"
      footer={footerContent}
      desktopMaxWidth="lg"
      className="w-[95vw] max-w-[600px]"
    >
      <ReportFilters 
        selectedFornecedores={selectedFornecedores} 
        selectedProdutos={selectedProdutos} 
        onFornecedoresChange={onFornecedoresChange} 
        onProdutosChange={onProdutosChange} 
        onReset={onReset} 
      />
    </ResponsiveModal>
  );
};

export default FiltersDialog;
