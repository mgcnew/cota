/**
 * HistoryTab Component
 * 
 * Wrapper component for the ActivityHistory component.
 * Provides a unified interface for displaying activity logs in the History tab.
 * Memoizado para evitar re-renders desnecessários.
 * 
 * @module components/reports/tabs/HistoryTab
 * 
 * Requirements: 4.1, 6.5
 */

import { memo } from "react";
import { ActivityHistory } from "@/components/reports/ActivityHistory";
import type { HistoryTabProps } from "@/types/reports";

/**
 * HistoryTab - Aba de Histórico com logs de atividades
 * 
 * Componente memoizado para evitar re-renders desnecessários.
 * 
 * @param isActive - Indica se a aba está ativa
 */
export const HistoryTab = memo(function HistoryTab({ isActive }: HistoryTabProps) {
  return (
    <div className="space-y-6">
      <ActivityHistory isActive={isActive} />
    </div>
  );
});

export default HistoryTab;
