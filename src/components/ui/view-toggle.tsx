import { memo, useCallback } from "react";
import { LayoutGrid, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewMode } from "@/types/pagination";

import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export const ViewToggle = memo(function ViewToggle({
  view,
  onViewChange,
  className
}: ViewToggleProps) {
  const handleGridClick = useCallback(() => onViewChange("grid"), [onViewChange]);
  const handleTableClick = useCallback(() => onViewChange("table"), [onViewChange]);

  return (
    <div className={cn("flex items-center gap-0.5 rounded-lg bg-muted/50 border border-border dark:border-white/5 p-0.5", className)}>
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={handleGridClick}
        className={`h-7 w-7 p-0 rounded-md transition-colors duration-150 ${
          view === "grid"
            ? "bg-orange-600 hover:bg-orange-700 text-white"
            : "hover:bg-accent text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={handleTableClick}
        className={`h-7 w-7 p-0 rounded-md transition-colors duration-150 ${
          view === "table"
            ? "bg-orange-600 hover:bg-orange-700 text-white"
            : "hover:bg-accent text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400"
        }`}
      >
        <Table className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
});
