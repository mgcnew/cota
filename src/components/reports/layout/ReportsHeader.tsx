/**
 * ReportsHeader Component
 * 
 * Header component for the Reports page with period selector, refresh and export buttons.
 * Extracted from Relatorios.tsx for better modularity.
 * 
 * @module components/reports/layout/ReportsHeader
 * Requirements: 1.1, 1.3, 5.4
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw, Download } from "lucide-react";
import type { ReportsHeaderProps } from "@/types/reports";

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  dateRangeText,
  onOpenPeriodDialog,
  onRefresh,
  onExportAll,
  isRefreshing,
  isExporting,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Period Selector Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onOpenPeriodDialog}
        className="btn-outline-enhanced"
      >
        <Calendar className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
        <span className="hidden sm:inline">{dateRangeText}</span>
        <span className="sm:hidden">Período</span>
      </Button>

      {/* Refresh Button - Hidden on mobile */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh} 
        disabled={isRefreshing} 
        className="hidden sm:flex btn-outline-enhanced"
      >
        <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-200 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
        Atualizar
      </Button>

      {/* Export Button - Hidden on mobile */}
      <Button 
        size="sm" 
        onClick={onExportAll} 
        disabled={isExporting} 
        className={`hidden sm:flex btn-primary-enhanced ${isExporting ? 'btn-loading' : ''}`}
      >
        <Download className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:translate-y-0.5" />
        {isExporting ? 'Gerando...' : 'Exportar'}
      </Button>
    </div>
  );
};

export default ReportsHeader;
