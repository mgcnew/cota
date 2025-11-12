import { memo, useState, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  X, Edit3, Save, Building2, Calendar, Package, 
  DollarSign, FileText, Truck, ChevronRight, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  produto: string;
  quantidade: number;
  valorUnitario: number;
}

interface OrderDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  onEdit?: () => void;
}

/**
 * Modal de detalhes de pedido otimizado para mobile
 * - Design limpo e moderno
 * - Navegação rápida por abas
 * - Edição inline
 * - Performance otimizada
 */
export const OrderDetailSheet = memo<OrderDetailSheetProps>(
  function OrderDetailSheet({ open, onOpenChange, pedido, onEdit }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'items' | 'notes'>('info');

    const handleClose = useCallback(() => {
      setIsEditMode(false);
      setActiveTab('info');
      onOpenChange(false);
    }, [onOpenChange]);

    const handleSave = useCallback(() => {
      // Lógica de salvar
      setIsEditMode(false);
      onEdit?.();
    }, [onEdit]);

    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'entregue':
          return {
            badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            color: 'text-emerald-600',
          };
        case 'confirmado':
          return {
            badge: 'bg-blue-100 text-blue-800 border-blue-300',
            color: 'text-blue-600',
          };
        case 'processando':
          return {
            badge: 'bg-amber-100 text-amber-800 border-amber-300',
            color: 'text-amber-600',
          };
        case 'cancelado':
          return {
            badge: 'bg-red-100 text-red-800 border-red-300',
            color: 'text-red-600',
          };
        default:
          return {
            badge: 'bg-gray-100 text-gray-800 border-gray-300',
            color: 'text-gray-600',
          };
      }
    };

    const statusConfig = getStatusConfig(pedido?.status || 'pendente');

    const tabs = [
      { id: 'info', label: 'Informações', icon: FileText },
      { id: 'items', label: 'Itens', icon: Package, count: pedido?.itens || 0 },
      { id: 'notes', label: 'Observações', icon: FileText },
    ];

    const formatCurrency = (value: number) => {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      try {
        return new Date(dateString).toLocaleDateString('pt-BR');
      } catch {
        return dateString;
      }
    };

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[92vh] max-h-[92vh] p-0 flex flex-col bg-gray-50 dark:bg-gray-950 rounded-t-3xl border-t-4 border-primary"
          style={{
            contain: 'layout style paint',
            transform: 'translateZ(0)',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header Fixo */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            {/* Título e Ações */}
            <div className="px-4 pt-3 pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white shadow-lg">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {pedido?.fornecedor || 'Pedido'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      #{pedido?.id?.substring(0, 8)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                      className="h-9 px-3 text-primary hover:bg-primary/10"
                    >
                      <Edit3 className="h-4 w-4 mr-1.5" />
                      Editar
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      className="h-9 px-3 bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-1.5" />
                      Salvar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-9 w-9 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge className={cn("font-medium", statusConfig.badge)}>
                  {pedido?.status || 'Pendente'}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(pedido?.dataPedido)}
                </span>
              </div>
            </div>

            {/* Tabs de Navegação */}
            <div className="flex border-t border-gray-200 dark:border-gray-800">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative",
                      isActive
                        ? "text-primary bg-primary/5"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-xs font-bold",
                        isActive ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      )}>
                        {tab.count}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo Scrollável */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* Tab: Informações */}
              {activeTab === 'info' && (
                <div className="space-y-3">
                  {/* Card de Resumo Rápido */}
                  <Card className="p-4 bg-gradient-to-br from-primary/5 to-orange-500/5 border-primary/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
                        <p className="text-xl font-bold text-primary">
                          {pedido?.total || 'R$ 0,00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Itens</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {pedido?.itens || 0}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Detalhes */}
                  <Card className="p-4 bg-white dark:bg-gray-900">
                    <div className="space-y-3">
                      {/* Fornecedor */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Fornecedor</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {pedido?.fornecedor || '-'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Data de Entrega */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                          <Truck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Entrega Prevista</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDate(pedido?.dataEntrega)}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Data do Pedido */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Data do Pedido</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDate(pedido?.dataPedido)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Tab: Itens */}
              {activeTab === 'items' && (
                <div className="space-y-2">
                  {pedido?.detalhesItens?.length > 0 ? (
                    pedido.detalhesItens.map((item: any, index: number) => (
                      <Card key={index} className="p-3 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                              {item.produto || item.product_name}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                              <div>
                                <span className="font-medium">Qtd:</span> {item.quantidade || item.quantity}
                              </div>
                              <div>
                                <span className="font-medium">Unit:</span> R$ {Number(item.valorUnitario || item.unit_price).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                            <p className="text-base font-bold text-primary">
                              R$ {((item.quantidade || item.quantity) * (item.valorUnitario || item.unit_price)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum item encontrado</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Observações */}
              {activeTab === 'notes' && (
                <Card className="p-4 bg-white dark:bg-gray-900">
                  {pedido?.observacoes || pedido?.observations ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {pedido.observacoes || pedido.observations}
                    </p>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma observação</p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Footer com Ações Rápidas */}
          {!isEditMode && (
            <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(true)}
                  className="h-11 text-base font-medium"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="default"
                  onClick={handleClose}
                  className="h-11 text-base font-medium bg-primary hover:bg-primary/90"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Concluído
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }
);
