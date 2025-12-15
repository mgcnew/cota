import { memo } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, BarChart3, Package, Building2, TrendingUp, FileText } from "lucide-react";

const FeaturesSection = memo(function FeaturesSection() {
  return (
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
              Copywriting com IA e muito mais para economizar tempo
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
});

export default FeaturesSection;
