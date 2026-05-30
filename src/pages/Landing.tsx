import { Link } from "react-router-dom";
import { useState, lazy, Suspense, memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { HeroPreview } from "@/components/landing/HeroPreview";

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

export default function Landing() {
  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = () => setLoginOpen(true);

  return (
    <div className={cn("min-h-screen flex flex-col", ds.colors.surface.page)}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-border dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <BrandLogo className="h-7" />
          </Link>

          {/* Entrar — visível em todas as telas */}
          <Button onClick={openLogin} className="bg-brand hover:bg-brand/90 text-white h-9 px-5 text-sm gap-2">
            Entrar
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:56px_56px]" />
        {/* Gradient orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-12 sm:pt-28 md:pt-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border dark:border-white/5 bg-white dark:bg-zinc-900 px-3 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
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
              <Button
                onClick={openLogin}
                className="bg-brand hover:bg-brand/90 text-white h-12 px-8 text-base font-bold gap-2 rounded-xl transition-all hover:-translate-y-0.5"
              >
                Entrar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product preview */}
          <div className="mt-14 sm:mt-16">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ── SECTIONS ── */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FooterSection onLogin={openLogin} />
      </Suspense>

      {/* Login modal */}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
