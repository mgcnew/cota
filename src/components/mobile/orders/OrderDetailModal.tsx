import { memo, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  X, ChevronLeft, ChevronRight, Check, Building2, Calendar, 
  Package, DollarSign, FileText, Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  onEdit?: () => void;
}

type Step = 'info' | 'items' | 'notes';

/**
 * Modal de detalhes de pedido otimizado para mobile
 * - Modal centralizado com padding
 * - Backdrop blur
 * - Navegação por etapas
 * - Barra de progresso
 */
export const OrderDetailModal = memo<OrderDetailModalProps>(
  function OrderDetailModal({ open, onOpenChange, pedido, onEdit }) {
    const [currentStep, setCurrentStep] = useState<Step>('info');

    const steps: { id: Step; title: string; description: string }[] = [
      { id: 'info', title: 'Informações', description: 'Dados do pedido' },
      { id: 'items', title: 'Itens', description: 'Produtos do pedido' },
      { id: 'notes', title: 'Observações', description: 'Notas adicionais' },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;

    const handleNext = useCallback(() => {
      if (isLastStep) {
        onEdit?.();
        onOpenChange(false);
      } else {
        setCurrentStep(steps[currentStepIndex + 1].id);
      }
    }, [currentStepIndex, isLastStep, steps, onEdit, onOpenChange]);

    const handlePrevious = useCallback(() => {
      if (!isFirstStep) {
        setCurrentStep(steps[currentStepIndex - 1].id);
      }
    }, [currentStepIndex, isFirstStep, steps]);

    const handleClose = useCallback(() => {
      setCurrentStep('info');
      onOpenChange(false);
    }, [onOpenChange]);

    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'entregue':
          return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'confirmado':
          return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300';
        case 'processando':
          return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300';
        case 'cancelado':
          return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300';
      }
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="w-[calc(100vw-32px)] max-w-md p-0 gap-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-0 overflow-hidden"
          style={{
            contain: 'layout style paint',
            transform: 'translateZ(0)',
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-primary/5 to-orange-500/5">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Badge className={cn("font-medium", getStatusConfig(pedido?.status))}>
              {pedido?.status || 'Pendente'}
            </Badge>
          </div>

          {/* Progress Bar e Navegação */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className={cn(
                  "h-8 w-8 p-0 rounded-full",
                  isFirstStep 
                    ? "opacity-40 cursor-not-allowed" 
                    : "hover:bg-primary/10 hover:text-primary"
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {steps[currentStepIndex].title}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {currentStepIndex + 1}/{steps.length}
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className={cn(
                  "h-8 w-8 p-0 rounded-full",
                  isLastStep
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "hover:bg-primary/10 hover:text-primary"
                )}
              >
                {isLastStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {steps[currentStepIndex].description}
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {/* Etapa 1: Informações */}
            {currentStep === 'info' && (
              <div className="space-y-3">
                {/* Card de Resumo */}
                <Card className="p-4 bg-gradient-to-br from-primary/10 to-orange-500/10 border-primary/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total do Pedido</p>
                      <p className="text-xl font-bold text-primary">
                        {pedido?.total || 'R$ 0,00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quantidade</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {pedido?.itens || 0} itens
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Detalhes */}
                <div className="space-y-3">
                  {/* Fornecedor */}
                  <Card className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Fornecedor</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {pedido?.fornecedor || '-'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Data de Entrega */}
                  <Card className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Entrega Prevista</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDate(pedido?.dataEntrega)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Data do Pedido */}
                  <Card className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Data do Pedido</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDate(pedido?.dataPedido)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Etapa 2: Itens */}
            {currentStep === 'items' && (
              <div className="space-y-2">
                {pedido?.detalhesItens?.length > 0 ? (
                  pedido.detalhesItens.map((item: any, index: number) => (
                    <Card key={index} className="p-3 hover:shadow-md transition-shadow">
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
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum item encontrado</p>
                  </div>
                )}
              </div>
            )}

            {/* Etapa 3: Observações */}
            {currentStep === 'notes' && (
              <Card className="p-4">
                {pedido?.observacoes || pedido?.observations ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Observações</p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {pedido.observacoes || pedido.observations}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma observação</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);
