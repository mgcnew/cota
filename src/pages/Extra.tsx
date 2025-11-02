import { Card } from "@/components/ui/card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

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

        <Card 
          className="p-8 hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => navigate('/locucoes')}
        >
          <Icon icon="fluent:mic-32-filled" width="48" height="48" className="mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Locuções AI
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Geração de locuções com inteligência artificial
          </p>
        </Card>
      </div>
    </PageWrapper>
  );
}
