import { memo } from "react";
import { Zap, BarChart3, Package, Building2, TrendingUp, FileText } from "lucide-react";
import { designSystem } from "@/styles/design-system";

const features = [
  {
    icon: <Package className="h-6 w-6 text-brand" />,
    title: "Gestão de Produtos",
    description: "Cadastre e organize todos os seus produtos com categorias, códigos de barras e imagens em uma interface de alta performance."
  },
  {
    icon: <Building2 className="h-6 w-6 text-brand" />,
    title: "Gestão de Fornecedores",
    description: "Mantenha um histórico completo de fornecedores, avaliações e performance de entrega para decisões baseadas em dados."
  },
  {
    icon: <FileText className="h-6 w-6 text-brand" />,
    title: "Cotações Inteligentes",
    description: "Compare preços automaticamente entre múltiplos fornecedores e encontre a melhor opção de custo-benefício em segundos."
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-brand" />,
    title: "Analytics Avançado",
    description: "Visualize tendências de mercado e comportamento de preços com dashboards intuitivos e relatórios de inteligência."
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-brand" />,
    title: "Relatórios de Economia",
    description: "Gere relatórios detalhados de KPIs, eficiência operacional e economia real gerada pelo sistema de cotação."
  },
  {
    icon: <Zap className="h-6 w-6 text-brand" />,
    title: "Automação com IA",
    description: "Utilize inteligência artificial para otimizar processos repetitivos e garantir a precisão nas suas cotações diárias."
  }
];

const FeaturesSection = memo(function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-20 sm:py-32">
      <div className="text-center mb-16 sm:mb-24">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          Plataforma <span className="text-brand">Full-Stack</span> para Compras
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto px-4 leading-relaxed font-medium">
          Tudo o que sua empresa precisa para uma gestão de cotações profissional,
          unificado em um sistema robusto e elegante.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`${designSystem.components.card.root} group p-8 space-y-4 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}
          >
            {/* Subtle Gradient Hover Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              {feature.title}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium text-[15px]">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
});

export default FeaturesSection;
