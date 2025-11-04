import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, Shield, BarChart3, Users, Package, Building2, TrendingUp, Mail, Phone } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Basic",
      description: "Perfeito para começar",
      price: "Grátis",
      period: "/ trial",
      popular: false,
      features: [
        "5 usuários",
        "100 produtos",
        "50 fornecedores",
        "100 cotações/mês",
        "Gestão básica",
        "Relatórios simples",
      ],
      cta: "Começar Grátis",
      ctaLink: "/auth?mode=signup",
      ctaVariant: "outline" as const,
    },
    {
      name: "Professional",
      description: "Para equipes em crescimento",
      price: "R$ 299",
      period: "/ mês",
      popular: true,
      features: [
        "15 usuários",
        "500 produtos",
        "200 fornecedores",
        "1.000 cotações/mês",
        "API Access",
        "Analytics avançado",
        "Suporte por email",
        "Relatórios customizados",
      ],
      cta: "Assinar Agora",
      ctaLink: "/pricing",
      ctaVariant: "default" as const,
    },
    {
      name: "Enterprise",
      description: "Para grandes empresas",
      price: "Custom",
      period: "",
      popular: false,
      features: [
        "100+ usuários",
        "Produtos ilimitados",
        "Fornecedores ilimitados",
        "Cotações ilimitadas",
        "API Access",
        "Analytics avançado",
        "Suporte prioritário",
        "Onboarding dedicado",
        "Integrações customizadas",
      ],
      cta: "Falar com Vendas",
      ctaLink: "/pricing",
      ctaVariant: "outline" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-xl font-bold">Cotaja</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost">Início</Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="gradient-primary">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge className="mb-4">✨ Teste grátis por 14 dias</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Planos que se adaptam ao seu negócio
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Comece grátis e faça upgrade quando precisar de mais recursos
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 py-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? "border-orange-500 border-2 relative" : ""}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange-500">Mais Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.ctaLink} className="block">
                  <Button
                    className="w-full"
                    variant={plan.ctaVariant}
                    size="lg"
                  >
                    {plan.cta}
                    {plan.ctaVariant === "default" && (
                      <ArrowRight className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso cancelar a qualquer momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sim! Você pode cancelar sua assinatura a qualquer momento sem multas ou taxas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">O trial é realmente grátis?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sim! Oferecemos 14 dias de teste grátis sem necessidade de cartão de crédito.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso mudar de plano depois?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Claro! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preciso de ajuda? Como posso entrar em contato?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Entre em contato conosco por email ou telefone. Planos Professional e Enterprise têm suporte prioritário.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-3xl mx-auto bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4 text-white">
              Ainda tem dúvidas?
            </CardTitle>
            <CardDescription className="text-white/90">
              Entre em contato com nossa equipe e tire todas as suas dúvidas
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg">
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email
              </Button>
              <Button variant="secondary" size="lg">
                <Phone className="mr-2 h-4 w-4" />
                Ligar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                  C
                </div>
                <span className="font-bold">Cotaja</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistema completo de gestão de cotações e compras
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground">Início</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground">Preços</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentação</a></li>
                <li><a href="#" className="hover:text-foreground">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground">Termos</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 Cotaja. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

