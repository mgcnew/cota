import { Link } from "react-router-dom";
import { useState, lazy, Suspense, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load below-the-fold sections for faster FCP
const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection"));
const PricingPreviewSection = lazy(() => import("@/components/landing/PricingPreviewSection"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
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

// Prefetch Auth page after Landing loads (Requirements 16.5)
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-lg sm:text-xl font-bold">Cotaja</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/pricing">
              <Button variant="ghost">Preços</Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="gradient-primary">Começar Grátis</Button>
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
          <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
            <Link to="/pricing" className="block">
              <Button variant="ghost" className="w-full justify-start">Preços</Button>
            </Link>
            <Link to="/auth?mode=login" className="block">
              <Button variant="outline" className="w-full">Entrar</Button>
            </Link>
            <Link to="/auth?mode=signup" className="block">
              <Button className="gradient-primary w-full">Começar Grátis</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Gerencie suas cotações de forma
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent"> inteligente</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Sistema completo para gestão de produtos, fornecedores e cotações. 
            Economize tempo e dinheiro com automação inteligente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link to="/auth?mode=signup" className="w-full sm:w-auto">
              <Button size="lg" className="gradient-primary text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link to="/pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                Ver Planos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Below-the-fold content - lazy loaded for faster FCP */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <PricingPreviewSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CTASection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FooterSection />
      </Suspense>
    </div>
  );
}
