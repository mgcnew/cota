import { memo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

const FooterSection = memo(function FooterSection() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Brand */}
          <div className="space-y-2">
            <div className="flex items-center">
              <img
                src="/logo-cotapro.png"
                alt="CotaPro"
                className="h-40 -my-[52px] translate-y-1 w-auto object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className={cn("text-xs max-w-xs leading-relaxed", ds.typography.weight.medium, ds.colors.text.muted)}>
              Plataforma interna de gestão de cotações e compras.
            </p>
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/auth?mode=login"
              className={cn("text-xs hover:text-brand transition-colors", ds.typography.weight.bold, ds.colors.text.secondary)}
            >
              Entrar no Sistema
            </Link>
            <span className={cn("text-xs", ds.colors.text.muted)}>·</span>
            <span className={cn("text-xs", ds.typography.weight.bold, "text-brand")}>
              v2.0.0
            </span>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/60">
          <p className={cn("text-[11px]", ds.colors.text.muted)}>
            © {new Date().getFullYear()} CotaJá · Sistema de Uso Restrito
          </p>
        </div>
      </div>
    </footer>
  );
});

export default FooterSection;
