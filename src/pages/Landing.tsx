import { Link } from "react-router-dom";
import { useState, lazy, Suspense, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load below-the-fold sections for faster FCP
const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection"));
const FooterSection = lazy(() => import("@/components/landing/FooterSection"));

// Skeleton for lazy-loaded sections
const SectionSkeleton = memo(() => (
  <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
    <div className="text-center mb-10 sm:mb-16">
      <Skeleton className="h-8 w-64 mx-auto mb-4" />
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-48 rounded-lg" />
      ))}
    </div>
  </div>
));

SectionSkeleton.displayName = "SectionSkeleton";

// Prefetch Auth page after Landing loads
const prefetchAuth = () => import("./Auth");

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prefetch Auth page after a short delay for faster navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchAuth().catch(() => {
        // Silently fail - prefetch is an optimization
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-zinc-950 font-bold">
              C
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight">CotaJá</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth?mode=login">
              <Button variant="ghost" className="font-medium">Entrar</Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button className="bg-brand hover:bg-brand-hover text-zinc-950 font-bold border-none">
                Acessar Sistema
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <Link to="/auth?mode=login" className="block">
              <Button variant="outline" className="w-full justify-center">Entrar</Button>
            </Link>
            <Link to="/auth?mode=login" className="block">
              <Button className="bg-brand text-zinc-950 w-full font-bold">Acessar Sistema</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-100 dark:border-zinc-900">


        <div className="container mx-auto px-4 py-16 sm:py-24 md:py-32 lg:py-40 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-10">
            <div className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-500 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              Sistema Interno de Cotações
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1]">
              Gestão de Cotações de Forma
              <span className="block text-brand"> Totalmente Inteligente</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto px-4 leading-relaxed font-medium">
              A plataforma centralizada para controle total de produtos, fornecedores e processos de compras da empresa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 pt-4">
              <Link to="/auth?mode=login" className="w-full sm:w-auto">
                <Button size="lg" className="bg-brand hover:bg-brand-hover text-zinc-950 text-base sm:text-lg px-8 sm:px-12 w-full sm:w-auto font-bold h-14 transition-all transform hover:-translate-y-1">
                  Acessar Plataforma
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Below-the-fold content - lazy loaded for faster FCP */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FooterSection />
      </Suspense>
    </div>
  );
}
