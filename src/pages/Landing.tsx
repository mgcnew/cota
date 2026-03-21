import { Link } from "react-router-dom";
import { useState, lazy, Suspense, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection"));
const FooterSection = lazy(() => import("@/components/landing/FooterSection"));

const SectionSkeleton = memo(() => (
  <div className="max-w-6xl mx-auto px-6 py-16">
    <div className="text-center mb-12">
      <Skeleton className="h-6 w-52 mx-auto mb-3" />
      <Skeleton className="h-4 w-80 mx-auto" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 rounded-xl" />
      ))}
    </div>
  </div>
));

SectionSkeleton.displayName = "SectionSkeleton";

const prefetchAuth = () => import("./Auth");

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchAuth().catch(() => { });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn("min-h-screen flex flex-col", ds.colors.surface.page)}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/logo-cotapro.png"
              alt="CotaPro"
              className="h-40 -my-[52px] translate-y-1 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center">
            <Link to="/auth?mode=login">
              <Button className={cn(ds.components.button.variants.primary, "h-9 px-5 text-sm gap-2")}>
                Acessar Sistema
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4 animate-in slide-in-from-top-2 duration-200">
            <Link to="/auth?mode=login" className="block">
              <Button className={cn(ds.components.button.variants.primary, "w-full h-10 text-sm gap-2")}>
                Acessar Sistema
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:56px_56px]" />
        {/* Gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 md:py-36 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              Sistema Interno
            </div>

            {/* Title */}
            <h1 className={cn(
              "text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[1.05]",
              ds.typography.weight.extrabold,
              ds.colors.text.primary
            )}>
              Gestão de Cotações{" "}
              <span className="text-brand">Inteligente</span>
            </h1>

            {/* Subtitle */}
            <p className={cn(
              "text-base sm:text-lg md:text-xl max-w-xl mx-auto leading-relaxed",
              ds.typography.weight.medium,
              ds.colors.text.secondary
            )}>
              Plataforma centralizada para controle de produtos, fornecedores e processos de compras.
            </p>

            {/* CTA */}
            <div className="pt-2">
              <Link to="/auth?mode=login">
                <Button
                  size="lg"
                  className={cn(
                    ds.components.button.variants.primary,
                    "h-12 px-8 text-base font-bold gap-2 rounded-xl transition-all hover:-translate-y-0.5"
                  )}
                >
                  Acessar Plataforma
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTIONS ── */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FooterSection />
      </Suspense>
    </div>
  );
}
