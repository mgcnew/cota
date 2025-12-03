/**
 * PeriodDialog Component
 * 
 * Dialog for selecting date periods with presets and custom date selection.
 * Includes validation to ensure end date is after start date.
 * Extracted from Relatorios.tsx for better modularity.
 * 
 * @module components/reports/layout/PeriodDialog
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import type { PeriodDialogProps } from "@/types/reports";

export const PeriodDialog: React.FC<PeriodDialogProps> = ({
  isOpen,
  onOpenChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApplyPreset,
}) => {
  // Validate that end date is after start date
  const isValidDateRange = useMemo(() => {
    if (!startDate || !endDate) return false;
    return endDate >= startDate;
  }, [startDate, endDate]);

  // Calculate days in selected period
  const daysInPeriod = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  // Handle preset selection and close dialog
  const handlePresetClick = (days: number) => {
    onApplyPreset(days);
  };

  // Handle apply button click
  const handleApply = () => {
    if (isValidDateRange) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-purple-50/80 via-violet-50/60 to-purple-50/40 backdrop-blur-sm relative overflow-hidden">
          {/* Decorative background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-purple-500/5"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg ring-2 ring-purple-100/50">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Selecionar Período</DialogTitle>
              <p className="text-sm text-gray-600 mt-0.5">Defina o intervalo de datas para os relatórios</p>
            </div>
          </div>
        </DialogHeader>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Presets */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Períodos Rápidos</h3>
                <p className="text-xs text-gray-600">Selecione um período predefinido</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePresetClick(7)} 
                className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <span className="font-medium">7 dias</span>
                <span className="text-xs text-gray-500">Última semana</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePresetClick(30)} 
                className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <span className="font-medium">30 dias</span>
                <span className="text-xs text-gray-500">Último mês</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePresetClick(90)} 
                className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <span className="font-medium">90 dias</span>
                <span className="text-xs text-gray-500">Último trimestre</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePresetClick(365)} 
                className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <span className="font-medium">1 ano</span>
                <span className="text-xs text-gray-500">Últimos 12 meses</span>
              </Button>
            </div>
          </div>

          {/* Custom Date Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Período Personalizado</h3>
                <p className="text-xs text-gray-600">Escolha datas específicas</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <DateRangePicker 
                startDate={startDate} 
                endDate={endDate} 
                onStartDateChange={onStartDateChange} 
                onEndDateChange={onEndDateChange} 
              />
            </div>
          </div>

          {/* Period Summary */}
          {startDate && endDate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Período Selecionado</h3>
                  <p className="text-xs text-gray-600">Resumo do intervalo escolhido</p>
                </div>
              </div>
              
              <div className={`rounded-xl p-4 border ${isValidDateRange ? 'bg-purple-50 border-purple-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className={`text-sm font-medium ${isValidDateRange ? 'text-purple-900' : 'text-red-900'}`}>
                      {startDate.toLocaleDateString('pt-BR')} - {endDate.toLocaleDateString('pt-BR')}
                    </div>
                    <div className={`text-xs ${isValidDateRange ? 'text-purple-700' : 'text-red-700'}`}>
                      {isValidDateRange 
                        ? `${daysInPeriod} dias selecionados`
                        : 'Data final deve ser posterior à data inicial'
                      }
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${
                    isValidDateRange 
                      ? 'bg-gradient-to-br from-purple-500 to-violet-500' 
                      : 'bg-gradient-to-br from-red-500 to-rose-500'
                  }`}>
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {startDate && endDate && isValidDateRange ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Período definido
              </span>
            ) : startDate && endDate && !isValidDateRange ? (
              <span className="text-red-500">Período inválido</span>
            ) : (
              <span className="text-gray-500">Selecione um período</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={!isValidDateRange}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white disabled:opacity-50"
            >
              Aplicar período
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Validates that the end date is after the start date.
 * Exported for use in property-based testing.
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns true if the date range is valid (end >= start), false otherwise
 */
export function validateDateRange(startDate: Date | undefined, endDate: Date | undefined): boolean {
  if (!startDate || !endDate) return false;
  return endDate >= startDate;
}

export default PeriodDialog;
