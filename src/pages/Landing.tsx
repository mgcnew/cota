import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, BarChart3, Package, Building2, TrendingUp, FileText, Menu, X } from "lucide-react";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-4">
            Funcionalidades poderosas para transformar sua gestão de compras
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500 mb-2" />
              <CardTitle className="text-base sm:text-lg">Gestão de Produtos</CardTitle>
              <CardDescription className="text-sm">
                Cadastre e organize todos os seus produtos com categorias, códigos de barras e imagens
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-500 mb-2" />
              <CardTitle className="text-base sm:text-lg">Gestão de Fornecedores</CardTitle>
              <CardDescription className="text-sm">
                Mantenha histórico completo de fornecedores, avaliações e performance de entrega
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mb-2" />
              <CardTitle className="text-base sm:text-lg">Cotações Inteligentes</CardTitle>
              <CardDescription className="text-sm">
                Compare preços automaticamente e encontre a melhor opção para cada produto
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500 mb-2" />
              <CardTitle className="text-base sm:text-lg">Analytics Avançado</CardTitle>
              <CardDescription className="text-sm">
                Relatórios detalhados e insights para tomar decisões mais inteligentes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-500 mb-2" />
              <CardTitle className="text-base sm:text-lg">Relatórios Customizados</CardTitle>
              <CardDescription className="text-sm">
                Gere relatórios de economia, eficiência e comparação de fornecedores
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-500 mb-2" />
              <CardTitle className="text-base sm:text-lg">Automação Completa</CardTitle>
              <CardDescription className="text-sm">
                Integração com WhatsApp, locuções com IA e muito mais para economizar tempo
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Preview */}
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

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <Card className="max-w-3xl mx-auto bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0">
          <CardHeader className="text-center p-6 sm:p-8 pb-2 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-4 text-white">
              Pronto para começar?
            </CardTitle>
            <CardDescription className="text-white/90 text-sm sm:text-base">
              Comece seu teste grátis de 14 dias hoje mesmo. Sem cartão de crédito.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center p-6 sm:p-8 pt-2 sm:pt-4">
            <Link to="/auth?mode=signup">
              <Button size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                  C
                </div>
                <span className="font-bold">Cotaja</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Sistema completo de gestão de cotações e compras
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Produto</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Preços</Link></li>
                <li><Link to="/auth?mode=signup" className="hover:text-foreground transition-colors">Começar Grátis</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Suporte</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Termos</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center text-xs sm:text-sm text-muted-foreground">
            © 2024 Cotaja. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
