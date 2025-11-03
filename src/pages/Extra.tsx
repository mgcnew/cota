import { Card } from "@/components/ui/card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { IconExamples } from '@/examples/IconExamples';
import { SidebarIconRecommendations } from '@/examples/SidebarIconRecommendations';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const funcionalidades = [
  {
    id: 'locucoes',
    titulo: 'Locuções AI',
    descricao: 'Geração de locuções com inteligência artificial',
    icon: 'fluent:mic-32-filled',
    rota: '/locucoes',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'whatsapp',
    titulo: 'WhatsApp em Massa',
    descricao: 'Envio de mensagens e imagens para múltiplos contatos',
    icon: 'fluent:chat-multiple-32-filled',
    rota: '/whatsapp-mensagens',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    id: 'icones',
    titulo: 'Exemplos de Ícones',
    descricao: 'Veja exemplos de bibliotecas de ícones disponíveis',
    icon: 'lucide:palette',
    rota: null,
    gradient: 'from-blue-500 to-indigo-500',
    isModal: true,
    component: 'IconExamples'
  },
  {
    id: 'sidebar-icons',
    titulo: 'Ícones Sidebar',
    descricao: 'Recomendações de ícones para a sidebar',
    icon: 'lucide:layout-dashboard',
    rota: null,
    gradient: 'from-purple-500 to-pink-500',
    isModal: true,
    component: 'SidebarIconRecommendations'
  }
];

export default function Extra() {
  const navigate = useNavigate();
  const [showIconExamples, setShowIconExamples] = useState(false);
  const [showSidebarIcons, setShowSidebarIcons] = useState(false);

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
              onClick={() => {
                if (func.isModal) {
                  if (func.component === 'IconExamples') {
                    setShowIconExamples(true);
                  } else if (func.component === 'SidebarIconRecommendations') {
                    setShowSidebarIcons(true);
                  }
                } else if (func.rota) {
                  navigate(func.rota);
                }
              }}
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

      {/* Modal de Exemplos de Ícones */}
      <Dialog open={showIconExamples} onOpenChange={setShowIconExamples}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Exemplos de Bibliotecas de Ícones</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowIconExamples(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <IconExamples />
        </DialogContent>
      </Dialog>

      {/* Modal de Recomendações de Ícones para Sidebar */}
      <Dialog open={showSidebarIcons} onOpenChange={setShowSidebarIcons}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recomendações de Ícones para Sidebar</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebarIcons(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SidebarIconRecommendations />
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
