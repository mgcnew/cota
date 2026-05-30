import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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
  className,
}: DateRangePickerProps) {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const isMobile = useIsMobile();

  const triggerClass = (hasValue: boolean) =>
    cn(
      "w-full justify-start text-left font-normal",
      hasValue
        ? "border-brand/50 bg-brand/5 text-brand"
        : "text-muted-foreground"
    );

  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="grid grid-cols-1 gap-2">

          {/* Data início — mobile */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Data de início
            </label>
            <Button
              variant="outline"
              onClick={() => setIsStartOpen(true)}
              className={cn(triggerClass(!!startDate), "h-10")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
            </Button>
            <ResponsiveModal
              open={isStartOpen}
              onOpenChange={setIsStartOpen}
              title="Data de início"
              description="Selecione a data inicial do período"
            >
              <div className="flex justify-center py-2">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => { onStartDateChange(date); setIsStartOpen(false); }}
                  initialFocus
                  className="rounded-md border-0"
                />
              </div>
            </ResponsiveModal>
          </div>

          {/* Data fim — mobile */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Data de fim
            </label>
            <Button
              variant="outline"
              onClick={() => setIsEndOpen(true)}
              className={cn(triggerClass(!!endDate), "h-10")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
            </Button>
            <ResponsiveModal
              open={isEndOpen}
              onOpenChange={setIsEndOpen}
              title="Data de fim"
              description="Selecione a data final do período"
            >
              <div className="flex justify-center py-2">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => { onEndDateChange(date); setIsEndOpen(false); }}
                  disabled={(date) => (startDate ? date < startDate : false)}
                  initialFocus
                  className="rounded-md border-0"
                />
              </div>
            </ResponsiveModal>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: popovers
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">

        {/* Data início — desktop */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Data de início
          </label>
          <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(triggerClass(!!startDate), "h-9")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border shadow-lg rounded-xl" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => { onStartDateChange(date); setIsStartOpen(false); }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data fim — desktop */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Data de fim
          </label>
          <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(triggerClass(!!endDate), "h-9")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border shadow-lg rounded-xl" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => { onEndDateChange(date); setIsEndOpen(false); }}
                disabled={(date) => (startDate ? date < startDate : false)}
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
