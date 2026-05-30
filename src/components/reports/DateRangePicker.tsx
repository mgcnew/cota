import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [openField, setOpenField] = useState<"start" | "end" | null>(null);
  const isMobile = useIsMobile();

  const triggerClass = (hasValue: boolean) =>
    cn(
      "w-full justify-start text-left font-normal h-9",
      hasValue
        ? "border-brand/50 bg-brand/5 text-brand"
        : "text-muted-foreground"
    );

  // Mobile: calendário inline — sem modal aninhado dentro do drawer
  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>

        {/* Data de início */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Data de início
          </label>
          <Button
            variant="outline"
            onClick={() => setOpenField(openField === "start" ? null : "start")}
            className={cn(triggerClass(!!startDate), "justify-between")}
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", openField === "start" && "rotate-180")} />
          </Button>

          {openField === "start" && (
            <div className="rounded-lg border border-border bg-popover overflow-hidden">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  onStartDateChange(date);
                  setOpenField(null);
                }}
                initialFocus
                className="mx-auto"
              />
            </div>
          )}
        </div>

        {/* Data de fim */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Data de fim
          </label>
          <Button
            variant="outline"
            onClick={() => setOpenField(openField === "end" ? null : "end")}
            className={cn(triggerClass(!!endDate), "justify-between")}
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", openField === "end" && "rotate-180")} />
          </Button>

          {openField === "end" && (
            <div className="rounded-lg border border-border bg-popover overflow-hidden">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  onEndDateChange(date);
                  setOpenField(null);
                }}
                disabled={(date) => (startDate ? date < startDate : false)}
                initialFocus
                className="mx-auto"
              />
            </div>
          )}
        </div>

      </div>
    );
  }

  // Desktop: popovers normais
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">

        {/* Data início */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Data de início
          </label>
          <Popover
            open={openField === "start"}
            onOpenChange={(o) => setOpenField(o ? "start" : null)}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" className={triggerClass(!!startDate)}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border shadow-lg rounded-xl" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => { onStartDateChange(date); setOpenField(null); }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data fim */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Data de fim
          </label>
          <Popover
            open={openField === "end"}
            onOpenChange={(o) => setOpenField(o ? "end" : null)}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" className={triggerClass(!!endDate)}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border shadow-lg rounded-xl" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => { onEndDateChange(date); setOpenField(null); }}
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
