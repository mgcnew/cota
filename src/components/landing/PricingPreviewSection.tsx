import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PricingPreviewSection = memo(function PricingPreviewSection() {
  return (
    <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
      <div className="bg-muted/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 md:p-12">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Planos que cabem no seu bolso
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            Comece grátis e faça upgrade quando precisar
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {/* Basic Plan */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Basic</CardTitle>
              <CardDescription>Para começar</CardDescription>
              <div className="mt-3 sm:mt-4">
                <span className="text-2xl sm:text-3xl font-bold">Grátis</span>
                <span className="text-muted-foreground text-sm"> / trial</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">5 usuários</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">100 produtos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">50 fornecedores</span>
                </li>
              </ul>
              <Link to="/auth?mode=signup" className="block">
                <Button className="w-full">Começar Grátis</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card className="border-orange-500 border-2 relative hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <Badge className="w-fit mb-2 text-xs">Mais Popular</Badge>
              <CardTitle className="text-lg sm:text-xl">Professional</CardTitle>
              <CardDescription>Para equipes</CardDescription>
              <div className="mt-3 sm:mt-4">
                <span className="text-2xl sm:text-3xl font-bold">R$ 299</span>
                <span className="text-muted-foreground text-sm"> / mês</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">15 usuários</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">500 produtos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">200 fornecedores</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">API Access</span>
                </li>
              </ul>
              <Link to="/pricing" className="block">
                <Button className="w-full gradient-primary">Assinar Agora</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Enterprise</CardTitle>
              <CardDescription>Para grandes empresas</CardDescription>
              <div className="mt-3 sm:mt-4">
                <span className="text-2xl sm:text-3xl font-bold">Custom</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">100+ usuários</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Ilimitado</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Suporte prioritário</span>
                </li>
              </ul>
              <Link to="/pricing" className="block">
                <Button className="w-full" variant="outline">Falar com Vendas</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
});

export default PricingPreviewSection;
