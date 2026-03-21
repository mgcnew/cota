import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Package, Building2, DollarSign, Calendar, ClipboardList, TrendingDown, Award, Users, FileText, X, CheckCircle2, Clock, Sparkles } from "lucide-react";
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
    return products.reduce((sum: number, p: any) => {
      const precoUn = getSupplierProductValue(supplierId, p.product_id);
      const qtd = Number(p.quantidade) || 1;
      return sum + (precoUn * qtd);
    }, 0);
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

  const totalMelhorPreco = products.reduce((t: number, p: any) => {
    const best = getBestPrice(p.product_id);
    const qtd = Number(p.quantidade) || 1;
    return t + (best.price * qtd);
  }, 0);
  
  const melhorFornecedor = fornecedores.reduce((best: any, f) => {
    const total = calcularTotalFornecedor(f.id);
    if (total > 0 && (!best || total < best.total)) return { ...f, total };
    return best;
  }, null);

  // Calcula a economia preditiva exata: (Maior Preço Oferecido - Melhor Preço) * Quantidade, por item.
  let totalEconomiaPotencial = 0;
  
  // Para cada produto, acha a maior oferta válida contra a menor oferta
  products.forEach((p: any) => {
    const qtd = Number(p.quantidade) || 1;
    const prices = fornecedores
      .map(f => getSupplierProductValue(f.id, p.product_id))
      .filter(val => val > 0)
      .sort((a, b) => b - a); // Maior para o menor

    if (prices.length > 1) {
      const highestPrice = prices[0]; // Maior valor (ou segundo se usarmos a lógica de exclusão do topo)
      const bestPrice = prices[prices.length - 1]; // O menor valor daquele item
      if (highestPrice > bestPrice) {
        totalEconomiaPotencial += (highestPrice - bestPrice) * qtd;
      }
    }
  });

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      hideClose
      title="Resumo da Cotação"
      description={`#${safeStr(quote.id).slice(0, 8)}`}
      desktopMaxWidth="md"
      className={cn(
        "backdrop-blur-xl shadow-2xl [&>button]:hidden flex flex-col overflow-hidden",
        ds.colors.surface.card
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
        <div className="space-y-4 pt-1 pb-4">
          {/* Header com Status */}
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "bg-brand/10 border border-brand/20"
            )}>
              <ClipboardList className="h-4 w-4 text-brand" />
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
          <Card className={cn(ds.components.card.root, "shadow-sm border-zinc-100 dark:border-zinc-800/50")}>
            <CardContent className={cn("p-3 space-y-1.5")}>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  "bg-teal-500/10"
                )}>
                  <Package className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                </div>
                <span className={cn(
                  ds.typography.size.xs,
                  ds.typography.weight.bold,
                  "text-teal-600 dark:text-teal-400",
                  "uppercase tracking-wider"
                )}>Produtos</span>
              </div>
              <p className={cn(
                ds.typography.size.xl,
                ds.typography.weight.bold,
                "text-teal-700 dark:text-teal-300 pl-8"
              )}>{products.length}</p>
            </CardContent>
          </Card>
          
          {/* Fornecedores */}
          <Card className={cn(ds.components.card.root, "shadow-sm border-zinc-100 dark:border-zinc-800/50")}>
            <CardContent className={cn("p-3 space-y-1.5")}>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  "bg-blue-500/10"
                )}>
                  <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className={cn(
                  ds.typography.size.xs,
                  ds.typography.weight.bold,
                  "text-blue-600 dark:text-blue-400",
                  "uppercase tracking-wider"
                )}>Fornecedores</span>
              </div>
              <p className={cn(
                ds.typography.size.xl,
                ds.typography.weight.bold,
                "text-blue-700 dark:text-blue-300 pl-8"
              )}>
                <span className="text-brand">{fornecedoresRespondidos}</span>
                <span className={ds.colors.text.secondary}>/{fornecedores.length}</span>
              </p>
            </CardContent>
          </Card>
          
          {/* Melhor Total */}
          <Card className={cn(ds.components.card.root, "shadow-sm border-zinc-100 dark:border-zinc-800/50 bg-brand/5 dark:bg-brand/10")}>
            <CardContent className={cn("p-3 space-y-1.5")}>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  "bg-brand/10"
                )}>
                  <DollarSign className="h-3.5 w-3.5 text-brand" />
                </div>
                <span className={cn(
                  ds.typography.size.xs,
                  ds.typography.weight.bold,
                  "text-brand",
                  "uppercase tracking-wider"
                )}>Melhor Total</span>
              </div>
              <p className={cn(
                ds.typography.size.lg,
                ds.typography.weight.bold,
                "text-brand pl-8"
              )}>R$ {totalMelhorPreco.toFixed(2)}</p>
            </CardContent>
          </Card>
          
          {/* Período */}
          <Card className={cn(ds.components.card.root, "shadow-sm border-zinc-100 dark:border-zinc-800/50")}>
            <CardContent className={cn("p-3 space-y-1.5")}>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  "bg-purple-500/10"
                )}>
                  <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className={cn(
                  ds.typography.size.xs,
                  ds.typography.weight.bold,
                  "text-purple-600 dark:text-purple-400",
                  "uppercase tracking-wider"
                )}>Período</span>
              </div>
              <div className="pl-8 space-y-0.5">
                <p className={cn(
                  "text-xs",
                  ds.typography.weight.bold,
                  "text-purple-700 dark:text-purple-300"
                )}>{safeStr(quote.dataInicio)}</p>
                <p className={cn(
                  "text-[10px]",
                  ds.typography.weight.medium,
                  "text-purple-600 dark:text-purple-400"
                )}>até {safeStr(quote.dataFim)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Melhor Fornecedor - Destaque */}
        {melhorFornecedor && (
          <div className="space-y-3">
            <Card className={cn(
              ds.components.card.root,
              "bg-gradient-to-br from-amber-500/10 to-amber-600/5 !border-amber-500/20"
            )}>
              <CardContent className={cn("p-3 flex items-center gap-3")}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  "bg-amber-500/20 border-2 border-amber-500/30"
                )}>
                  <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-[10px]",
                    ds.typography.weight.bold,
                    "text-amber-700 dark:text-amber-300",
                    "uppercase tracking-widest"
                  )}>🏆 Melhor Fornecedor</p>
                  <div className="flex items-baseline justify-between gap-2 mt-0.5">
                    <p className={cn(
                      ds.typography.size.sm,
                      ds.typography.weight.bold,
                      "text-amber-900 dark:text-amber-100",
                      "truncate"
                    )}>
                      {safeStr(melhorFornecedor.nome)}
                    </p>
                    <p className={cn(
                      ds.typography.size.base,
                      ds.typography.weight.bold,
                      "text-amber-600 dark:text-amber-400 flex-shrink-0"
                    )}>R$ {melhorFornecedor.total.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Análise Inteligente de Cenário (Cota Aki AI) - Agora com Quantidades Reais */}
            {totalEconomiaPotencial > 0 && (
              <Card className={cn(
                ds.components.card.root,
                "bg-brand/5 dark:bg-brand/10 !border-brand/20 shadow-sm transition-all"
              )}>
                <CardContent className="p-3.5 flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    "bg-brand/10 border border-brand/20"
                  )}>
                    <Sparkles className="h-4 w-4 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[10px]",
                      ds.typography.weight.bold,
                      "text-brand",
                      "uppercase tracking-widest leading-none mb-1.5 flex items-center gap-1"
                    )}>Análise Estratégica</p>
                    <p className={cn(
                      "text-xs leading-relaxed",
                      ds.colors.text.secondary
                    )}>
                      Cruzando a **quantidade requerida** contra o **pior e o melhor preço** oferecido em cada item, fechar esta cotação agora pelo menor conjunto te garantirá uma economia potencial bruta de <strong className="text-emerald-600 dark:text-emerald-400 font-bold">R$ {totalEconomiaPotencial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> nesta operação fiscal.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Lista de Produtos */}
        <Card className={ds.components.card.root}>
          <CardHeader className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/50">
            <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2 !text-xs uppercase tracking-wider")}>
              <Package className="h-3.5 w-3.5 text-brand" />
              <span>Produtos</span>
              <Badge className={cn(
                "bg-brand/10 text-brand border-brand/20 ml-auto flex items-center justify-center h-5 px-1.5 !text-[10px] font-bold"
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
                      "px-3.5 py-2 flex items-center gap-2.5 transition-colors",
                      ds.colors.surface.hover
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                      "text-[10px]",
                      ds.typography.weight.bold,
                      ds.colors.surface.section,
                      ds.colors.text.secondary
                    )}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-xs",
                        ds.typography.weight.bold,
                        ds.colors.text.primary,
                        "truncate"
                      )}>{safeStr(p.product_name)}</p>
                      <p className={cn(
                        "text-[10px]",
                        ds.colors.text.secondary,
                        "mt-0.25"
                      )}>{safeStr(p.quantidade)} {safeStr(p.unidade)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-xs",
                        ds.typography.weight.bold,
                        "text-brand",
                        "flex items-center justify-end gap-1"
                      )}>
                        <TrendingDown className="h-3 w-3" />
                        R$ {best.price.toFixed(2)}
                      </p>
                      <p className={cn(
                        "text-[10px]",
                        ds.colors.text.secondary,
                        "truncate max-w-[100px] mt-0.25 opacity-70"
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
          <CardHeader className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/50">
            <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2 !text-xs uppercase tracking-wider")}>
              <Building2 className="h-3.5 w-3.5 text-brand" />
              <span>Fornecedores</span>
              <Badge className={cn(
                "bg-brand/10 text-brand border-brand/20 ml-auto flex items-center justify-center h-5 px-1.5 !text-[10px] font-bold"
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
                      "px-3.5 py-2 flex items-center gap-2.5 transition-colors",
                      isBest 
                        ? "bg-amber-500/10 dark:bg-amber-500/5" 
                        : ds.colors.surface.hover
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                      isRespondido 
                        ? "bg-brand/10" 
                        : "bg-amber-500/10"
                    )}>
                      {isRespondido ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-xs",
                        ds.typography.weight.bold,
                        ds.colors.text.primary,
                        "truncate"
                      )}>{safeStr(f.nome)}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] px-1 h-4 uppercase tracking-wider",
                            isRespondido 
                              ? "text-brand border-brand/30 bg-brand/5" 
                              : "text-amber-600 border-amber-500/30 bg-amber-500/5 dark:text-amber-400"
                          )}
                        >
                          {isRespondido ? 'Respondido' : 'Pendente'}
                        </Badge>
                        {isBest && (
                          <Badge className={cn(
                            "text-[9px] px-1 h-4 bg-amber-500 text-white dark:bg-amber-600 uppercase tracking-wider"
                          )}>
                            <Award className="h-3 w-3 mr-0.5" />
                            Melhor
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className={cn(
                      "text-xs",
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
          <Card className={cn(ds.components.card.root, "shadow-sm border-zinc-100 dark:border-zinc-800/50")}>
            <CardContent className={cn("p-3 space-y-2")}>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  "bg-brand/10"
                )}>
                  <FileText className="h-3.5 w-3.5 text-brand" />
                </div>
                <span className={cn(
                  "text-[10px]",
                  ds.typography.weight.bold,
                  "uppercase tracking-wider",
                  ds.colors.text.secondary
                )}>Observações</span>
              </div>
              <p className={cn(
                "text-xs",
                ds.colors.text.primary,
                "pl-8 leading-relaxed opacity-80"
              )}>{safeStr((quote as any).observacoes)}</p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </ResponsiveModal>
  );
}
