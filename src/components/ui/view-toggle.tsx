import { LayoutGrid, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewMode } from "@/types/pagination";

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({
  view,
  onViewChange
}: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-0.5">
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
        className={`h-7 w-7 p-0 rounded-md transition-all duration-200 ${
          view === "grid"
            ? "bg-orange-600 hover:bg-orange-700 text-white"
            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className={`h-7 w-7 p-0 rounded-md transition-all duration-200 ${
          view === "table"
            ? "bg-orange-600 hover:bg-orange-700 text-white"
            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
        }`}
      >
        <Table className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}