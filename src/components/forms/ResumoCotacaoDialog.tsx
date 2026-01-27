import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Package, Building2, DollarSign, Calendar, ClipboardList, TrendingDown, Award, Users, FileText, X, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import type { Quote } from "@/hooks/useCotacoes";

interface ResumoCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
}

/**
 * ResumoCotacaoDialog - Quote summary dialog using ResponsiveModal
 * 
 * Requirements: 3.5 - Bottom sheet no mobile, dialog no desktop
 */
export default function ResumoCotacaoDialog({ open, onOpenChange, quote }: ResumoCotacaoDialogProps) {
  // Dados da cotação
  const products = (quote as any)?._raw?.quote_items || [];
  const fornecedores = quote.fornecedoresParticipantes || [];
  const fornecedoresRespondidos = fornecedores.filter(f => f.status === "respondido").length;
  
  // Helpers
  const safeStr = (val: any): string => typeof val === 'string' ? val : String(val || '');
  
  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    const raw = quote as any;
    const items = raw._supplierItems || raw._raw?.quote_supplier_items || [];
    return items.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId)?.valor_oferecido || 0;
  };

  const calcularTotalFornecedor = (supplierId: string): number => {
    return products.reduce((sum: number, p: any) => sum + getSupplierProductValue(supplierId, p.product_id), 0);
  };

  const getBestPrice = (productId: string) => {
    let best = { price: 0, supplier: '-' };
    fornecedores.forEach(f => {
      const val = getSupplierProductValue(f.id, productId);
      if (val > 0 && (best.price === 0 || val < best.price)) {
        best = { price: val, supplier: safeStr(f.nome) };
      }
    });
    return best;
  };

  const totalMelhorPreco = products.reduce((t: number, p: any) => t + getBestPrice(p.product_id).price, 0);
  
  const melhorFornecedor = fornecedores.reduce((best: any, f) => {
    const total = calcularTotalFornecedor(f.id);
    if (total > 0 && (!best || total < best.total)) return { ...f, total };
    return best;
  }, null);


  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      hideClose
      title="Resumo da Cotação"
      description={`#${safeStr(quote.id).slice(0, 8)}`}
      desktopMaxWidth="lg"
      className={cn(
        "backdrop-blur-xl shadow-2xl [&>button]:hidden flex flex-col overflow-hidden",
        ds.colors.surface.page
      )}
      footer={
        <Button 
          onClick={() => onOpenChange(false)} 
          size="sm" 
          className={ds.components.button.secondary}
        >
          Fechar
        </Button>
      }
    >
      {/* Close Button */}
      <div className="absolute right-4 top-4 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onOpenChange(false)} 
          className={cn(
            ds.components.button.ghost,
            ds.components.button.size.icon,
            "!bg-transparent"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="space-y-6 pt-2 pb-4">
          {/* Header com Status */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-brand/10 border border-brand/20"
            )}>
              <ClipboardList className="h-5 w-5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                ds.typography.size.sm,
                ds.typography.weight.bold,
                ds.colors.text.secondary,
                "uppercase tracking-wider"
              )}>Status da Cotação</h3>
              <div className="mt-1">
                <StatusBadge status={quote.status} />
              </div>
            </div>
          </div>

        {/* Stats Grid - Melhorado */}
        <div className="grid grid-cols-2 gap-4">
          {/* Produtos */}
          <Card className={ds.components.card.root}>
            <CardContent className={cn(ds.components.card.body, "space-y-2")}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  "bg-teal-500/10"
                )}>
                  <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <span className={cn(
                  ds.typography.size.xs,
                  ds.typography.weight.bold,
                  "text-teal-600 dark:text-teal-400",
                  "uppercase tracking-wider"
                )}>Produtos</span>
              </div>
              <p className={cn(
                ds.typography.size["2xl"],
                ds.typography.weight.bold,
                "text-teal-700 dark:text-teal-300"
              )}>{products.length}</p>
            </CardContent>
          </Card>
          
          {/* Fornecedores */}
          <Card className={ds.components.card.root}>
            <CardContent className={cn(ds.components.card.body, "space-y-2")}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  "bg-blue-500/10"
                )}>
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className={cn(
                  ds.typography.size.xs,
                  ds.typography.weight.bold,
                  "text-blue-600 dark:text-blue-400",
                  "uppercase tracking-wider"
                )}>Fornecedores</span>
              </div>
              <p className={cn(
                ds.typography.size["2xl"],
                ds.typography.weight.bold,
                "text-blue-700 dark:text-blue-300"
              )}>
                <span className="text-brand">{fornecedoresRespondidos}</span>
                <span className={ds.colors.text.secondary}>/{fornecedores.length}</span>
              </p>
            </CardContent>
          </Card>
          
          {/* Melhor Total */}
          <Card className={ds.components.card.root}>
            <CardContent className={cn(ds.components.card.body, "space-y-2")}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  "bg-brand/10"
                )}>
                  <DollarSign className="h-4 w-4 text-brand" />
                </div>
                <span className={cn(
                  ds.typography.size.xs,
                  ds.typography.weight.bold,
                  "text-brand",
                  "uppercase tracking-wider"
                )}>Melhor Total</span>
              </div>
              <p className={cn(
                ds.typography.size.xl,
                ds.typography.weight.bold,
                "text-brand"
              )}>R$ {totalMelhorPreco.toFixed(2)}</p>
            </CardContent>
          </Card>
          
          {/* Período */}
          <Card className={ds.components.card.root}>
            <CardContent className={cn(ds.components.card.body, "space-y-2")}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  "bg-purple-500/10"
                )}>
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className={cn(
                  ds.typography.size.xs,
                  ds.typography.weight.bold,
                  "text-purple-600 dark:text-purple-400",
                  "uppercase tracking-wider"
                )}>Período</span>
              </div>
              <div className="space-y-0.5">
                <p className={cn(
                  ds.typography.size.sm,
                  ds.typography.weight.bold,
                  "text-purple-700 dark:text-purple-300"
                )}>{safeStr(quote.dataInicio)}</p>
                <p className={cn(
                  ds.typography.size.xs,
                  ds.typography.weight.medium,
                  "text-purple-600 dark:text-purple-400"
                )}>até {safeStr(quote.dataFim)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Melhor Fornecedor - Destaque */}
        {melhorFornecedor && (
          <Card className={cn(
            ds.components.card.root,
            "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20"
          )}>
            <CardContent className={cn(ds.components.card.body, "flex items-center gap-4")}>
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                "bg-amber-500/20 border-2 border-amber-500/30"
              )}>
                <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn(
                  ds.typography.size.xs,
                  ds.typography.weight.bold,
                  "text-amber-700 dark:text-amber-300",
                  "uppercase tracking-widest mb-1"
                )}>🏆 Melhor Fornecedor</p>
                <p className={cn(
                  ds.typography.size.base,
                  ds.typography.weight.bold,
                  "text-amber-900 dark:text-amber-100",
                  "truncate"
                )}>
                  {safeStr(melhorFornecedor.nome)}
                </p>
                <p className={cn(
                  ds.typography.size.lg,
                  ds.typography.weight.bold,
                  "text-amber-600 dark:text-amber-400",
                  "mt-1"
                )}>R$ {melhorFornecedor.total.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Produtos */}
        <Card className={ds.components.card.root}>
          <CardHeader className={ds.components.card.header}>
            <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
              <Package className="h-4 w-4 text-brand" />
              <span>Produtos</span>
              <Badge className={cn(
                ds.components.badge.base,
                "bg-brand/10 text-brand border-brand/20 ml-auto"
              )}>{products.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className={cn(
              "divide-y max-h-[280px] overflow-y-auto custom-scrollbar",
              ds.colors.border.default
            )}>
              {products.map((p: any, i: number) => {
                const best = getBestPrice(p.product_id);
                return (
                  <div 
                    key={p.product_id} 
                    className={cn(
                      "px-4 py-3 flex items-center gap-3 transition-colors",
                      ds.colors.surface.hover
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      ds.typography.size.xs,
                      ds.typography.weight.bold,
                      ds.colors.surface.section,
                      ds.colors.text.secondary
                    )}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        ds.typography.size.sm,
                        ds.typography.weight.bold,
                        ds.colors.text.primary,
                        "truncate"
                      )}>{safeStr(p.product_name)}</p>
                      <p className={cn(
                        ds.typography.size.xs,
                        ds.colors.text.secondary,
                        "mt-0.5"
                      )}>{safeStr(p.quantidade)} {safeStr(p.unidade)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(
                        ds.typography.size.sm,
                        ds.typography.weight.bold,
                        "text-brand",
                        "flex items-center justify-end gap-1"
                      )}>
                        <TrendingDown className="h-3.5 w-3.5" />
                        R$ {best.price.toFixed(2)}
                      </p>
                      <p className={cn(
                        ds.typography.size.xs,
                        ds.colors.text.secondary,
                        "truncate max-w-[120px] mt-0.5"
                      )}>{best.supplier}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Fornecedores */}
        <Card className={ds.components.card.root}>
          <CardHeader className={ds.components.card.header}>
            <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
              <Building2 className="h-4 w-4 text-brand" />
              <span>Fornecedores</span>
              <Badge className={cn(
                ds.components.badge.base,
                "bg-brand/10 text-brand border-brand/20 ml-auto"
              )}>{fornecedores.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className={cn(
              "divide-y max-h-[240px] overflow-y-auto custom-scrollbar",
              ds.colors.border.default
            )}>
              {fornecedores.map((f) => {
                const total = calcularTotalFornecedor(f.id);
                const isBest = melhorFornecedor?.id === f.id;
                const isRespondido = f.status === 'respondido';
                
                return (
                  <div 
                    key={f.id} 
                    className={cn(
                      "px-4 py-3 flex items-center gap-3 transition-colors",
                      isBest 
                        ? "bg-amber-500/10 dark:bg-amber-500/5" 
                        : ds.colors.surface.hover
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      isRespondido 
                        ? "bg-brand/10" 
                        : "bg-amber-500/10"
                    )}>
                      {isRespondido ? (
                        <CheckCircle2 className="h-4 w-4 text-brand" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        ds.typography.size.sm,
                        ds.typography.weight.bold,
                        ds.colors.text.primary,
                        "truncate"
                      )}>{safeStr(f.nome)}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            ds.typography.size.xs,
                            "h-5 uppercase tracking-wider",
                            isRespondido 
                              ? "text-brand border-brand/30 bg-brand/5" 
                              : "text-amber-600 border-amber-500/30 bg-amber-500/5 dark:text-amber-400"
                          )}
                        >
                          {isRespondido ? 'Respondido' : 'Pendente'}
                        </Badge>
                        {isBest && (
                          <Badge className={cn(
                            ds.typography.size.xs,
                            "h-5 bg-amber-500 text-white dark:bg-amber-600 uppercase tracking-wider"
                          )}>
                            <Award className="h-3 w-3 mr-1" />
                            Melhor
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className={cn(
                      ds.typography.size.sm,
                      ds.typography.weight.bold,
                      "shrink-0",
                      total > 0 
                        ? (isBest ? "text-amber-600 dark:text-amber-400" : ds.colors.text.primary)
                        : ds.colors.text.secondary
                    )}>
                      {total > 0 ? `R$ ${total.toFixed(2)}` : '-'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {(quote as any).observacoes && (
          <Card className={ds.components.card.root}>
            <CardContent className={cn(ds.components.card.body, "space-y-3")}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  "bg-brand/10"
                )}>
                  <FileText className="h-4 w-4 text-brand" />
                </div>
                <span className={cn(
                  ds.typography.size.sm,
                  ds.typography.weight.bold,
                  ds.colors.text.primary
                )}>Observações</span>
              </div>
              <p className={cn(
                ds.typography.size.sm,
                ds.colors.text.primary,
                "pl-10 leading-relaxed"
              )}>{safeStr((quote as any).observacoes)}</p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </ResponsiveModal>
  );
}
