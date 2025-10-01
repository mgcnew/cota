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
  return <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
      <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => onViewChange("grid")} className="h-8 bg-white">
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Cards</span>
      </Button>
      <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" onClick={() => onViewChange("table")} className="h-8 bg-white">
        <Table className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Tabela</span>
      </Button>
    </div>;
}