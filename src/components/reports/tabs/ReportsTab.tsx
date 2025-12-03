/**
 * ReportsTab Component
 * 
 * Orchestrates the ReportGenerator and ReportPreview components for the Reports tab.
 * Provides a unified interface for generating and previewing reports.
 * 
 * @module components/reports/tabs/ReportsTab
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */

import { useState, useCallback } from "react";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { ReportPreview } from "@/components/reports/ReportPreview";
import type { ReportsTabProps } from "@/types/reports";

export function ReportsTab({ startDate, endDate, onOpenPeriodDialog }: ReportsTabProps) {
  const [previewState, setPreviewState] = useState<{
    isOpen: boolean;
    type: string;
    data: any;
  }>({
    isOpen: false,
    type: '',
    data: null
  });

  const handleOpenPreview = useCallback((reportType: string, data: any) => {
    setPreviewState({
      isOpen: true,
      type: reportType,
      data
    });
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const handleDownload = useCallback(async (format: 'pdf' | 'excel') => {
    // Download is handled by ReportGenerator internally
    // This is a placeholder for future enhancements
    console.log(`Download requested in format: ${format}`);
  }, []);

  return (
    <div className="space-y-6">
      <ReportGenerator
        startDate={startDate}
        endDate={endDate}
        onOpenPeriodDialog={onOpenPeriodDialog}
      />

      <ReportPreview
        isOpen={previewState.isOpen}
        onClose={handleClosePreview}
        reportType={previewState.type}
        reportData={previewState.data}
        onDownload={handleDownload}
      />
    </div>
  );
}

export default ReportsTab;
