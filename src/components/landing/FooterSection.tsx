import { memo } from "react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface FooterSectionProps {
  onLogin?: () => void;
}

const FooterSection = memo(function FooterSection({ onLogin }: FooterSectionProps) {
  return (
    <footer className="border-t border-border dark:border-white/5 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Brand */}
          <div className="space-y-3">
            <BrandLogo className="h-8" />
            <p className={cn("text-xs max-w-xs leading-relaxed", ds.typography.weight.medium, ds.colors.text.muted)}>
              Plataforma interna de gestão de cotações e compras.
            </p>
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-6">
            <button
              onClick={onLogin}
              className={cn("text-xs hover:text-brand transition-colors", ds.typography.weight.bold, ds.colors.text.secondary)}
            >
              Entrar
            </button>
            <span className={cn("text-xs", ds.colors.text.muted)}>·</span>
            <span className={cn("text-xs", ds.typography.weight.bold, "text-brand")}>
              v2.0.0
            </span>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-8 pt-6 border-t border-border dark:border-white/5">
          <p className={cn("text-[11px]", ds.colors.text.muted)}>
            © {new Date().getFullYear()} CotaPro · Sistema de Uso Restrito
          </p>
        </div>
      </div>
    </footer>
  );
});

export default FooterSection;
