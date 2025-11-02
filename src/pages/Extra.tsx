import { Card } from "@/components/ui/card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

const funcionalidades = [
  {
    id: 'locucoes',
    titulo: 'Locuções AI',
    descricao: 'Geração de locuções com inteligência artificial',
    icon: 'fluent:mic-32-filled',
    rota: '/locucoes',
    gradient: 'from-purple-500 to-pink-500'
  }
  // Adicione mais funcionalidades aqui no futuro
];

export default function Extra() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Icon icon="fluent:star-32-filled" width="24" height="24" className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Funcionalidades Extra</h1>
            <p className="text-gray-600 dark:text-gray-400">Ferramentas e recursos adicionais</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {funcionalidades.map((func) => (
            <Card 
              key={func.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer group hover:scale-105"
              onClick={() => navigate(func.rota)}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${func.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon icon={func.icon} width="32" height="32" className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
                {func.titulo}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                {func.descricao}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
