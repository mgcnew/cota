import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  FileText, 
  Package, 
  Building2, 
  ShoppingCart,
  ClipboardList,
  TrendingUp 
} from 'lucide-react';

/**
 * Ações rápidas otimizadas para mobile
 * 
 * Features:
 * - Grid 2x3 de botões principais
 * - Navegação direta para páginas
 * - Sem animações pesadas
 * - Ícones leves
 */
export const MobileDashboardQuickActions = memo(
  function MobileDashboardQuickActions() {
    const navigate = useNavigate();

    const actions = [
      {
        title: 'Nova Cotação',
        icon: Plus,
        color: 'bg-teal-600 hover:bg-teal-700',
        onClick: () => navigate('/dashboard/cotacoes'),
      },
      {
        title: 'Cotações',
        icon: FileText,
        color: 'bg-blue-600 hover:bg-blue-700',
        onClick: () => navigate('/dashboard/cotacoes'),
      },
      {
        title: 'Produtos',
        icon: Package,
        color: 'bg-purple-600 hover:bg-purple-700',
        onClick: () => navigate('/dashboard/produtos'),
      },
      {
        title: 'Fornecedores',
        icon: Building2,
        color: 'bg-orange-600 hover:bg-orange-700',
        onClick: () => navigate('/dashboard/fornecedores'),
      },
      {
        title: 'Pedidos',
        icon: ShoppingCart,
        color: 'bg-green-600 hover:bg-green-700',
        onClick: () => navigate('/dashboard/pedidos'),
      },
      {
        title: 'Relatórios',
        icon: TrendingUp,
        color: 'bg-pink-600 hover:bg-pink-700',
        onClick: () => navigate('/dashboard/relatorios'),
      },
    ];

    return (
      <Card className="mb-6 bg-white dark:bg-[#1C1F26] border border-gray-200/80 dark:border-gray-700/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                className={`${action.color} text-white h-20 flex flex-col items-center justify-center gap-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200`}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
);
