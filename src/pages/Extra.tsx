import { Card, CardContent } from "@/components/ui/card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useNavigate } from 'react-router-dom';
import { Mic, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const funcionalidades = [
  {
    id: 'locucoes',
    titulo: 'Locuções AI',
    descricao: 'Gere locuções profissionais com inteligência artificial',
    icon: Mic,
    rota: '/dashboard/locucoes',
    gradient: 'from-primary to-primary-light',
    bgGradient: 'from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-700 dark:text-purple-300'
  },
  {
    id: 'copywriting-produtos',
    titulo: 'Agente de Copywriting',
    descricao: 'Crie copywriting profissional de locuções para seus produtos',
    icon: Sparkles,
    rota: '/dashboard/agente-copywriting',
    gradient: 'from-primary to-primary-light',
    bgGradient: 'from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-700 dark:text-orange-300'
  },
  {
    id: 'whatsapp',
    titulo: 'WhatsApp em Massa',
    descricao: 'Envie mensagens e imagens para múltiplos contatos',
    icon: MessageSquare,
    rota: '/dashboard/whatsapp-mensagens',
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-700 dark:text-green-300'
  }
];

export default function Extra() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg flex-shrink-0">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Funcionalidades Extra</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Ferramentas e recursos adicionais do sistema</p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {funcionalidades.map((func) => {
            const IconComponent = func.icon;
            return (
              <Card 
                key={func.id}
                className={`relative overflow-hidden border ${func.borderColor} bg-white dark:bg-gray-900 hover:shadow-md dark:hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
                onClick={() => navigate(func.rota)}
              >
                {/* Background Gradient - Sutil */}
                <div className={`absolute inset-0 bg-gradient-to-br ${func.bgGradient} opacity-30 dark:opacity-20`} />
                
                <CardContent className="relative p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    {/* Icon Container */}
                    <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br ${func.gradient} flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h2 className={`text-lg sm:text-xl font-semibold mb-2 ${func.textColor}`}>
                        {func.titulo}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3 sm:mb-4">
                        {func.descricao}
                      </p>
                      
                      {/* Action Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${func.textColor} hover:bg-gray-50 dark:hover:bg-gray-800/50 -ml-2 transition-colors duration-200`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(func.rota);
                        }}
                      >
                        Acessar
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
}
