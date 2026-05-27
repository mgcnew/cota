import { useState, memo } from "react";
import { cn } from "@/lib/utils";
import CotacoesTab from "./CotacoesTab";
import PedidosTab from "./PedidosTab";

type ViewType = "cotacoes" | "pedidos";

const VIEWS = [
  { value: "cotacoes" as ViewType, label: "Cotações" },
  { value: "pedidos" as ViewType, label: "Pedidos" },
];

function ProdutosTab() {
  const [view, setView] = useState<ViewType>("cotacoes");

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            onClick={() => setView(v.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border touch-manipulation active:scale-95",
              view === v.value
                ? "bg-brand text-white border-brand shadow-md"
                : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "cotacoes" && <CotacoesTab />}
      {view === "pedidos" && <PedidosTab />}
    </div>
  );
}

export default memo(ProdutosTab);
