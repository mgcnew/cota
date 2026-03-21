import { memo } from "react";
import { Zap, BarChart3, Package, Building2, TrendingUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

const features = [
  {
    icon: Package,
    title: "Produtos",
    description: "Cadastro completo com categorias, códigos de barras e imagens. Tudo organizado para consulta rápida."
  },
  {
    icon: Building2,
    title: "Fornecedores",
    description: "Histórico de performance, avaliações e contato centralizado para decisões baseadas em dados."
  },
  {
    icon: FileText,
    title: "Cotações",
    description: "Compare preços entre múltiplos fornecedores automaticamente. Encontre o melhor custo-benefício."
  },
  {
    icon: TrendingUp,
    title: "Análise de Preços",
    description: "Tendências de mercado e comportamento de preços com dashboards intuitivos e alertas."
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "KPIs, economia acumulada e eficiência operacional em relatórios prontos para decisão."
  },
  {
    icon: Zap,
    title: "Automação",
    description: "Processos otimizados com inteligência artificial para agilizar o dia a dia de compras."
  }
];

const FeaturesSection = memo(function FeaturesSection() {
  return (
    <section className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-14">
          <p className={cn(
            "text-[11px] uppercase tracking-widest mb-3 text-brand",
            ds.typography.weight.bold
          )}>
            Plataforma Completa
          </p>
          <h2 className={cn(
            "text-2xl sm:text-3xl md:text-4xl tracking-tight mb-3",
            ds.typography.weight.extrabold,
            ds.colors.text.primary
          )}>
            Tudo que sua equipe precisa
          </h2>
          <p className={cn(
            "text-sm sm:text-base max-w-lg mx-auto leading-relaxed",
            ds.typography.weight.medium,
            ds.colors.text.secondary
          )}>
            Módulos integrados para gestão eficiente do ciclo completo de compras.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={cn(
                  ds.components.card.root,
                  "group p-5 sm:p-6 space-y-3 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                )}
              >
                {/* Hover glow */}
                <div className="absolute top-0 right-0 w-28 h-28 bg-brand/5 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center group-hover:bg-brand/10 transition-colors duration-300">
                  <Icon className="h-5 w-5 text-zinc-500 group-hover:text-brand transition-colors duration-300" />
                </div>

                {/* Content */}
                <h3 className={cn(
                  "text-sm sm:text-base tracking-tight",
                  ds.typography.weight.bold,
                  ds.colors.text.primary
                )}>
                  {feature.title}
                </h3>
                <p className={cn(
                  "text-xs sm:text-sm leading-relaxed",
                  ds.typography.weight.medium,
                  ds.colors.text.secondary
                )}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default FeaturesSection;
