import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    onStartDateChange(start);
    onEndDateChange(end);
    setIsStartOpen(false);
    setIsEndOpen(false);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset(7)}
        >
          Últimos 7 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset(30)}
        >
          Últimos 30 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset(90)}
        >
          Últimos 3 meses
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset(365)}
        >
          Último ano
        </Button>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            Data Início
          </label>
          <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border" align="start">
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

        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            Data Fim
          </label>
          <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border" align="start">
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
    </div>
  );
}