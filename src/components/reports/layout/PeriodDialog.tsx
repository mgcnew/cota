import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
import { AlertCircle } from "lucide-react";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { cn } from "@/lib/utils";
import type { PeriodDialogProps } from "@/types/reports";

const PRESETS = [
  { days: 7,   label: "7 dias",  sub: "Última semana" },
  { days: 30,  label: "30 dias", sub: "Último mês" },
  { days: 90,  label: "90 dias", sub: "Último trimestre" },
  { days: 365, label: "1 ano",   sub: "Últimos 12 meses" },
];

export const PeriodDialog: React.FC<PeriodDialogProps> = ({
  isOpen,
  onOpenChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApplyPreset,
}) => {
  const isValidDateRange = useMemo(() => {
    if (!startDate || !endDate) return false;
    return endDate >= startDate;
  }, [startDate, endDate]);

  const daysInPeriod = useMemo(() => {
    if (!startDate || !endDate || !isValidDateRange) return 0;
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [startDate, endDate, isValidDateRange]);

  const footerContent = (
    <div className="flex items-center justify-between gap-3 w-full">
      <div className="text-xs text-muted-foreground">
        {isValidDateRange && daysInPeriod > 0
          ? `${daysInPeriod} ${daysInPeriod === 1 ? "dia" : "dias"} selecionados`
          : startDate && endDate && !isValidDateRange
          ? (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              Período inválido
            </span>
          )
          : "Selecione um período"}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={() => isValidDateRange && onOpenChange(false)}
          disabled={!isValidDateRange}
          className="bg-brand hover:bg-brand/90 text-white"
        >
          Aplicar
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Selecionar Período"
      description="Defina o intervalo de datas para os relatórios"
      footer={footerContent}
      desktopMaxWidth="md"
      className="w-[95vw] max-w-[480px]"
    >
      <div className="space-y-5">

        {/* Períodos rápidos */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Períodos rápidos</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(({ days, label, sub }) => (
              <Button
                key={days}
                variant="outline"
                size="sm"
                onClick={() => onApplyPreset(days)}
                className="h-11 flex flex-col items-center justify-center gap-0.5 hover:bg-accent hover:border-brand/40 transition-colors"
              >
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className="text-[11px] text-muted-foreground">{sub}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Período personalizado */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período personalizado</p>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={onStartDateChange}
              onEndDateChange={onEndDateChange}
            />
          </div>
        </div>

      </div>
    </ResponsiveModal>
  );
};

export function validateDateRange(startDate: Date | undefined, endDate: Date | undefined): boolean {
  if (!startDate || !endDate) return false;
  return endDate >= startDate;
}

export default PeriodDialog;
