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
    <div className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 p-1 shadow-sm">
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
        className={`h-9 px-3 rounded-lg transition-all duration-200 ${
          view === "grid"
            ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-md hover:shadow-lg"
            : "hover:bg-orange-100 hover:text-orange-700"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline font-medium">Cards</span>
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className={`h-9 px-3 rounded-lg transition-all duration-200 ${
          view === "table"
            ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-md hover:shadow-lg"
            : "hover:bg-orange-100 hover:text-orange-700"
        }`}
      >
        <Table className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline font-medium">Tabela</span>
      </Button>
    </div>
  );
}