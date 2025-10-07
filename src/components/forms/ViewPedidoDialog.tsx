import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Building2, Calendar, DollarSign, Truck, FileText, Clock, MapPin, Phone, Mail, User, Hash, CheckCircle, XCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
interface ViewPedidoDialogProps {
  pedido: any;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export default function ViewPedidoDialog({ pedido, trigger, open: externalOpen, onOpenChange }: ViewPedidoDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { 
        variant: "outline" as const, 
        label: "Pendente", 
        icon: Clock, 
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        dotColor: "bg-yellow-500"
      },
      processando: { 
        variant: "default" as const, 
        label: "Processando", 
        icon: Loader, 
        color: "text-blue-600 bg-blue-50 border-blue-200",
        dotColor: "bg-blue-500"
      },
      confirmado: { 
        variant: "secondary" as const, 
        label: "Confirmado", 
        icon: CheckCircle, 
        color: "text-green-600 bg-green-50 border-green-200",
        dotColor: "bg-green-500"
      },
      entregue: { 
        variant: "secondary" as const, 
        label: "Entregue", 
        icon: CheckCircle, 
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        dotColor: "bg-emerald-500"
      },
      cancelado: { 
        variant: "destructive" as const, 
        label: "Cancelado", 
        icon: XCircle, 
        color: "text-red-600 bg-red-50 border-red-200",
        dotColor: "bg-red-500"
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    const IconComponent = config.icon;

    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium text-sm", config.color)}>
        <div className={cn("w-2 h-2 rounded-full", config.dotColor, status === "processando" && "animate-pulse")}></div>
        <IconComponent className="h-3.5 w-3.5" />
        <span>{config.label}</span>
      </div>
    );
  };

  const formatCurrency = (value: string | number) => {
    if (typeof value === 'string') {
      // Se já está formatado, retorna como está
      if (value.includes('R$')) return value;
      // Se é um número em string, converte
      const num = parseFloat(value);
      return isNaN(num) ? value : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[900px] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-pink-50/80 via-rose-50/60 to-red-50/40 backdrop-blur-sm relative overflow-hidden flex-shrink-0">
          {/* Efeitos decorativos de fundo */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-rose-500/5 to-red-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-rose-400/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-400/10 to-pink-400/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 text-white shadow-lg shadow-pink-500/25 ring-2 ring-white/20 backdrop-blur-sm flex-shrink-0">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-pink-900 via-rose-800 to-red-800 bg-clip-text text-transparent truncate">
                  Detalhes do Pedido
                </DialogTitle>
                <p className="text-gray-600/80 text-xs sm:text-sm font-medium mt-0.5 truncate">
                  Visualize informações completas do pedido
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 self-start sm:self-center">
              {pedido && getStatusBadge(pedido.status)}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          <Tabs defaultValue="detalhes" className="w-full flex flex-col h-full">
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-100/60 bg-gradient-to-r from-gray-50/80 to-slate-50/60 backdrop-blur-sm flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-lg border border-gray-200/40">
                <TabsTrigger 
                  value="detalhes" 
                  className="rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-pink-500/25 px-2 sm:px-3 py-2 sm:py-2.5"
                >
                  <span className="hidden sm:inline">📋 Detalhes</span>
                  <span className="sm:hidden">📋</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="itens" 
                  className="rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/25 px-2 sm:px-3 py-2 sm:py-2.5"
                >
                  <span className="hidden sm:inline">📦 Itens</span>
                  <span className="sm:hidden">📦</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="entrega" 
                  className="rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-green-500/25 px-2 sm:px-3 py-2 sm:py-2.5"
                >
                  <span className="hidden sm:inline">🚚 Entrega</span>
                  <span className="sm:hidden">🚚</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="detalhes" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-pink-50/60 to-rose-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 text-white shadow-lg flex-shrink-0">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Fornecedor</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg truncate">{pedido?.fornecedor}</p>
                      {pedido?.contatoFornecedor && (
                        <p className="text-xs text-gray-500 truncate mt-1">{pedido.contatoFornecedor}</p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-green-50/60 to-emerald-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg flex-shrink-0">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Valor Total</p>
                      <p className="font-bold text-green-600 text-sm sm:text-base lg:text-lg truncate">{formatCurrency(pedido?.total)}</p>
                      {pedido?.desconto && (
                        <p className="text-xs text-gray-500 mt-1">Desconto: {formatCurrency(pedido.desconto)}</p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-blue-50/60 to-indigo-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Data do Pedido</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{formatDate(pedido?.dataPedido)}</p>
                      {pedido?.horaPedido && (
                        <p className="text-xs text-gray-500 mt-1">{pedido.horaPedido}</p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-purple-50/60 to-violet-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg flex-shrink-0">
                      <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Data de Entrega</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{formatDate(pedido?.dataEntrega)}</p>
                      {pedido?.prazoEntrega && (
                        <p className="text-xs text-gray-500 mt-1">Prazo: {pedido.prazoEntrega} dias</p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Informações adicionais */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {pedido?.numeroNF && (
                  <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-orange-50/60 to-amber-50/40 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 text-white shadow-lg flex-shrink-0">
                        <Hash className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">Nota Fiscal</p>
                        <p className="font-bold text-gray-900 text-sm truncate">#{pedido.numeroNF}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {pedido?.responsavel && (
                  <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-indigo-50/60 to-blue-50/40 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">Responsável</p>
                        <p className="font-bold text-gray-900 text-sm truncate">{pedido.responsavel}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {pedido?.formaPagamento && (
                  <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-teal-50/60 to-cyan-50/40 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg flex-shrink-0">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">Pagamento</p>
                        <p className="font-bold text-gray-900 text-sm truncate">{pedido.formaPagamento}</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Resumo do pedido */}
              <Card className="p-4 sm:p-6 border-0 shadow-xl bg-gradient-to-br from-rose-50 via-pink-50/60 to-red-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl border-l-4 border-l-rose-500">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-600 to-red-600 text-white shadow-xl flex-shrink-0">
                      <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg sm:text-xl text-gray-900">Pedido #{pedido?.id}</h3>
                      <p className="text-rose-600 font-bold text-xl sm:text-2xl truncate">{formatCurrency(pedido?.total)}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Status: {pedido?.status}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-rose-100 rounded-full">
                      <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                      <span className="text-rose-700 font-semibold text-xs sm:text-sm">Pedido Ativo</span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="itens" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <Card className="p-4 sm:p-6 border-0 shadow-xl bg-gradient-to-br from-white via-gray-50/30 to-blue-50/20 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 rounded-xl sm:rounded-2xl border border-blue-100/60">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg flex-shrink-0">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Itens do Pedido</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {pedido?.detalhesItens?.length || pedido?.produtos?.length || 0} item(s) no pedido
                      </p>
                    </div>
                  </div>

                  {pedido?.detalhesItens ? (
                    <div className="rounded-xl sm:rounded-2xl border-0 shadow-lg overflow-hidden bg-white/60 backdrop-blur-sm overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                            <th className="p-3 sm:p-4 text-left font-bold text-xs sm:text-sm">
                              <span className="hidden sm:inline">📦 Produto</span>
                              <span className="sm:hidden">📦</span>
                            </th>
                            <th className="p-3 sm:p-4 text-right font-bold text-xs sm:text-sm">
                              <span className="hidden sm:inline">📏 Quantidade</span>
                              <span className="sm:hidden">📏</span>
                            </th>
                            <th className="p-3 sm:p-4 text-right font-bold text-xs sm:text-sm">
                              <span className="hidden sm:inline">💰 Valor Unit.</span>
                              <span className="sm:hidden">💰</span>
                            </th>
                            <th className="p-3 sm:p-4 text-right font-bold text-xs sm:text-sm">
                              <span className="hidden sm:inline">💵 Subtotal</span>
                              <span className="sm:hidden">💵</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pedido.detalhesItens.map((item: any, index: number) => (
                            <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors">
                              <td className="p-3 sm:p-4">
                                <div className="font-semibold text-gray-900 text-xs sm:text-sm">{item.produto}</div>
                              </td>
                              <td className="p-3 sm:p-4 text-right">
                                <span className="font-medium text-xs sm:text-sm">{item.quantidade}</span>
                              </td>
                              <td className="p-3 sm:p-4 text-right">
                                <span className="font-bold text-blue-600 text-xs sm:text-sm">
                                  R$ {item.valorUnitario.toFixed(2)}
                                </span>
                              </td>
                              <td className="p-3 sm:p-4 text-right">
                                <span className="font-bold text-green-600 text-xs sm:text-sm">
                                  R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pedido?.produtos?.map((produto: string, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900">{produto}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="entrega" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <Card className="p-4 sm:p-6 border-0 shadow-xl bg-gradient-to-br from-white via-gray-50/30 to-green-50/20 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-green-50/60 to-emerald-50/40 rounded-xl sm:rounded-2xl border border-green-100/60">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg flex-shrink-0">
                      <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Informações de Entrega</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Detalhes sobre prazo, endereço e observações
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-green-50/60 to-emerald-50/40 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg flex-shrink-0">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-green-700">Data de Entrega</span>
                      </div>
                      <p className="font-bold text-green-800 text-lg">{formatDate(pedido?.dataEntrega)}</p>
                      {pedido?.horaEntrega && (
                        <p className="text-sm text-green-600 mt-1">Horário: {pedido.horaEntrega}</p>
                      )}
                    </Card>

                    <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-blue-50/60 to-indigo-50/40 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg flex-shrink-0">
                          <Truck className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-blue-700">Status da Entrega</span>
                      </div>
                      <div className="font-bold text-blue-800">
                        {getStatusBadge(pedido?.status)}
                      </div>
                    </Card>
                  </div>

                  {/* Endereço de entrega */}
                  {pedido?.enderecoEntrega && (
                    <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-purple-50/60 to-violet-50/40 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg flex-shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-purple-700">Endereço de Entrega</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{pedido.enderecoEntrega.rua}</p>
                        {pedido.enderecoEntrega.numero && (
                          <p className="text-sm text-gray-600">Nº {pedido.enderecoEntrega.numero}</p>
                        )}
                        {pedido.enderecoEntrega.complemento && (
                          <p className="text-sm text-gray-600">{pedido.enderecoEntrega.complemento}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {pedido.enderecoEntrega.bairro} - {pedido.enderecoEntrega.cidade}
                        </p>
                        {pedido.enderecoEntrega.cep && (
                          <p className="text-sm text-gray-600">CEP: {pedido.enderecoEntrega.cep}</p>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Informações de contato */}
                  {(pedido?.contatoEntrega || pedido?.telefoneEntrega) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {pedido?.contatoEntrega && (
                        <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-orange-50/60 to-amber-50/40 backdrop-blur-sm rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 text-white shadow-lg flex-shrink-0">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-600">Contato</p>
                              <p className="font-bold text-gray-900 text-sm truncate">{pedido.contatoEntrega}</p>
                            </div>
                          </div>
                        </Card>
                      )}

                      {pedido?.telefoneEntrega && (
                        <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-teal-50/60 to-cyan-50/40 backdrop-blur-sm rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg flex-shrink-0">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-600">Telefone</p>
                              <p className="font-bold text-gray-900 text-sm truncate">{pedido.telefoneEntrega}</p>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Observações */}
                  {pedido?.observacoes && (
                    <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-gray-50/60 to-slate-50/40 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-gray-600 to-slate-600 text-white shadow-lg flex-shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Observações</span>
                      </div>
                      <div className="bg-white/60 p-3 rounded-lg border border-gray-200/60">
                        <p className="text-sm text-gray-800 leading-relaxed">{pedido.observacoes}</p>
                      </div>
                    </Card>
                  )}

                  {/* Timeline de entrega (se disponível) */}
                  {pedido?.timelineEntrega && (
                    <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-indigo-50/60 to-blue-50/40 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg flex-shrink-0">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-indigo-700">Timeline de Entrega</span>
                      </div>
                      <div className="space-y-3">
                        {pedido.timelineEntrega.map((evento: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-indigo-100/60">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">{evento.evento}</p>
                              <p className="text-xs text-gray-600">{formatDate(evento.data)} - {evento.hora}</p>
                              {evento.observacao && (
                                <p className="text-xs text-gray-500 mt-1">{evento.observacao}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botões de ação */}
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-100/60 bg-gradient-to-r from-gray-50/80 to-slate-50/60 backdrop-blur-sm flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-center">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Última atualização: {formatDate(pedido?.dataAtualizacao || pedido?.dataPedido)}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {pedido?.status !== 'cancelado' && pedido?.status !== 'entregue' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/60 backdrop-blur-sm border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Gerar Relatório</span>
                      <span className="sm:hidden">Relatório</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/60 backdrop-blur-sm border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Enviar por Email</span>
                      <span className="sm:hidden">Email</span>
                    </Button>
                  </>
                )}
                
                <Button 
                  onClick={() => setOpen(false)}
                  className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  size="sm"
                >
                  <span className="hidden sm:inline">Fechar</span>
                  <span className="sm:hidden">OK</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}