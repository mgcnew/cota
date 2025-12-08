import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className
}: DateRangePickerProps) {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const isMobile = useIsMobile();

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    onStartDateChange(start);
    onEndDateChange(end);
    setIsStartOpen(false);
    setIsEndOpen(false);
  };

  // Mobile: Use bottom sheet for date selection (Requirement 6.4)
  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 gap-3">
          {/* Start Date - Mobile */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Data de Início
            </label>
            <Button
              variant="outline"
              onClick={() => setIsStartOpen(true)}
              className={cn(
                "w-full justify-start text-left font-normal h-12 touch-target",
                !startDate && "text-gray-500",
                startDate && "border-purple-300 bg-purple-50 text-purple-700"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
            </Button>
            <ResponsiveModal
              open={isStartOpen}
              onOpenChange={setIsStartOpen}
              title="Data de Início"
              description="Selecione a data inicial do período"
            >
              <div className="flex justify-center py-2">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    onStartDateChange(date);
                    setIsStartOpen(false);
                  }}
                  initialFocus
                  className="rounded-md border-0"
                />
              </div>
            </ResponsiveModal>
          </div>

          {/* End Date - Mobile */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Data de Fim
            </label>
            <Button
              variant="outline"
              onClick={() => setIsEndOpen(true)}
              className={cn(
                "w-full justify-start text-left font-normal h-12 touch-target",
                !endDate && "text-gray-500",
                endDate && "border-purple-300 bg-purple-50 text-purple-700"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
            </Button>
            <ResponsiveModal
              open={isEndOpen}
              onOpenChange={setIsEndOpen}
              title="Data de Fim"
              description="Selecione a data final do período"
            >
              <div className="flex justify-center py-2">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    onEndDateChange(date);
                    setIsEndOpen(false);
                  }}
                  disabled={(date) => startDate ? date < startDate : false}
                  initialFocus
                  className="rounded-md border-0"
                />
              </div>
            </ResponsiveModal>
          </div>
        </div>

        {/* Validation visual - Mobile */}
        {startDate && endDate && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4" />
            <span>
              Período válido: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} dias
            </span>
          </div>
        )}
        
        {startDate && !endDate && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <Clock className="h-4 w-4" />
            <span>Selecione a data de fim para completar o período</span>
          </div>
        )}
      </div>
    );
  }

  // Desktop: Use Popover for date selection
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Data de Início
          </label>
          <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10",
                  !startDate && "text-gray-500",
                  startDate && "border-purple-300 bg-purple-50 text-purple-700"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-xl rounded-xl" align="start">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-gray-900">Data de Início</span>
                </div>
              </div>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  onStartDateChange(date);
                  setIsStartOpen(false);
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Data de Fim
          </label>
          <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10",
                  !endDate && "text-gray-500",
                  endDate && "border-purple-300 bg-purple-50 text-purple-700"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-xl rounded-xl" align="start">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-gray-900">Data de Fim</span>
                </div>
              </div>
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  onEndDateChange(date);
                  setIsEndOpen(false);
                }}
                disabled={(date) => startDate ? date < startDate : false}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Validação visual */}
      {startDate && endDate && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
          <CheckCircle className="h-4 w-4" />
          <span>
            Período válido: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} dias
          </span>
        </div>
      )}
      
      {startDate && !endDate && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          <Clock className="h-4 w-4" />
          <span>Selecione a data de fim para completar o período</span>
        </div>
      )}
    </div>
  );
}