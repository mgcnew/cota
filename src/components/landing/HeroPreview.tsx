import { memo } from "react";
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const bars = [42, 68, 55, 80, 60, 92, 74];

const metrics = [
  { label: "Economia", value: "R$ 48,2k", accent: "text-emerald-500" },
  { label: "Cotações", value: "127", accent: "text-brand" },
  { label: "Fornecedores", value: "34", accent: "text-foreground" },
];

const sidebarIcons = [LayoutDashboard, Package, ShoppingCart, Building2, BarChart3];

/**
 * Mockup estilizado do dashboard para o hero da landing.
 * Construído em HTML/CSS (sem screenshot), adaptável ao tema.
 */
export const HeroPreview = memo(function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Glow */}
      <div className="absolute -inset-x-10 -top-10 bottom-0 bg-brand/10 blur-[80px] rounded-[40px] pointer-events-none" />

      <div className="relative rounded-2xl border border-border dark:border-white/10 bg-white dark:bg-zinc-900 shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 h-10 border-b border-border dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/50">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          <div className="ml-4 h-5 w-48 sm:w-64 rounded-md bg-zinc-200/70 dark:bg-zinc-800" />
        </div>

        {/* Body */}
        <div className="flex">
          {/* Sidebar */}
          <div className="hidden sm:flex flex-col items-center gap-3 w-14 py-4 border-r border-border dark:border-white/5 bg-zinc-50/60 dark:bg-zinc-950/30">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-brand" />
            </div>
            {sidebarIcons.slice(1).map((Icon, i) => (
              <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5 space-y-4">
            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-border dark:border-white/5 bg-card p-3">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
                    {m.label}
                  </div>
                  <div className={cn("text-sm sm:text-lg font-extrabold tracking-tight mt-1", m.accent)}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + list */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Bar chart */}
              <div className="md:col-span-3 rounded-xl border border-border dark:border-white/5 bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-10 rounded bg-brand/20" />
                </div>
                <div className="flex items-end gap-2 h-24 sm:h-28">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-brand/40 to-brand"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Mini list */}
              <div className="md:col-span-2 rounded-xl border border-border dark:border-white/5 bg-card p-4 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand/10 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 rounded bg-zinc-200 dark:bg-zinc-800" style={{ width: `${70 - i * 12}%` }} />
                      <div className="h-2 rounded bg-zinc-100 dark:bg-zinc-800/60" style={{ width: `${50 - i * 8}%` }} />
                    </div>
                    <div className="h-3 w-10 rounded bg-emerald-500/15" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
