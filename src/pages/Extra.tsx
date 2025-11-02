import { Card } from "@/components/ui/card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Icon } from '@iconify/react';

export default function Extra() {
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

        <Card className="p-8 text-center">
          <Icon icon="fluent:apps-32-filled" width="48" height="48" className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Área em Desenvolvimento
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aqui serão adicionadas funcionalidades extras que não têm ligação direta com o sistema de cotações.
          </p>
        </Card>
      </div>
    </PageWrapper>
  );
}
