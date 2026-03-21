import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Users, Clock, TrendingDown, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Quote } from "./types";

interface QuoteDetailsTabProps {
    products: any[];
    currentQuote: Quote | null;
    bestSupplier: { id: string; nome: string; totalValue: number } | null;
    getSupplierProductValue: (supplierId: string, productId: string) => number;
}

export function QuoteDetailsTab({
    products,
    currentQuote,
    bestSupplier,
    getSupplierProductValue
}: QuoteDetailsTabProps) {
    if (!currentQuote) return null;

    // Calcula os totais de todos os fornecedores que responderam para traçar a estatística da IA multiplicando pela quantidade
    const supplierTotals = currentQuote.fornecedoresParticipantes
        .filter(f => f.status === 'respondido')
        .map(fornecedor => {
            let total = 0;
            products.forEach(p => {
                const value = getSupplierProductValue(fornecedor.id, p.product_id) || 0;
                const qtd = Number(p.quantidade) || 1;
                total += value * qtd;
            });
            return { ...fornecedor, total };
        })
        .filter(f => f.total > 0)
        .sort((a, b) => a.total - b.total);

    return (
        <ScrollArea className="h-full">
            <div className="p-2.5 sm:p-3 md:p-4">
                {/* Layout otimizado e compacto */}
                <div className="max-w-5xl mx-auto space-y-3">

                    {/* Seção 1: Resumo Executivo - Grid Compacto */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
                        <Card className="p-2 sm:p-2.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/50 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-200 rounded-lg shadow-sm dark:shadow-none">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-950 flex-shrink-0">
                                    <Package className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Produtos</p>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{products.length}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-2 sm:p-2.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all rounded-lg shadow-sm dark:shadow-none">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-950 flex-shrink-0">
                                    <Users className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Fornecedores</p>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{currentQuote?.fornecedores || 0}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-2 sm:p-2.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all rounded-lg shadow-sm dark:shadow-none">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-950 flex-shrink-0">
                                    <Clock className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Prazo</p>
                                    <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">{currentQuote?.dataFim || 'N/A'}</p>
                                    {currentQuote?._raw?.data_planejada && (
                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                            {new Date(currentQuote._raw.data_planejada).toLocaleDateString("pt-BR")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-2 sm:p-2.5 border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all rounded-lg shadow-sm dark:shadow-none">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1.5 rounded-lg bg-emerald-600 text-white flex-shrink-0">
                                    <TrendingDown className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">Economia</p>
                                    <p className="font-bold text-xs text-emerald-900 dark:text-white truncate">{currentQuote?.economia || 'N/A'}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Seção 2: Melhor Oferta Destaque */}
                    {bestSupplier && (
                        <div className="space-y-2">
                            <Card className="p-3 sm:p-4 border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-lg shadow-sm dark:shadow-none">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                        <div className="p-2 rounded-lg bg-emerald-600 text-white flex-shrink-0">
                                            <Star className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase mb-0.5">Melhor Fornecedor</p>
                                            <p className="font-bold text-sm text-emerald-900 dark:text-white truncate">{bestSupplier.nome}</p>
                                            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">R$ {bestSupplier.totalValue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mb-0.5">Economia</p>
                                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{currentQuote?.economia || 'N/A'}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Análise Inteligente de Cenário (Cota Aki AI) */}
                            {supplierTotals.length > 1 && (() => {
                                const cheapest = supplierTotals[0];
                                const mostExpensive = supplierTotals[supplierTotals.length - 1];
                                
                                // Média dos outros fornecedores
                                const otherSuppliers = supplierTotals.slice(1);
                                const otherAverage = otherSuppliers.reduce((acc, curr) => acc + curr.total, 0) / otherSuppliers.length;

                                const savingsAgainstHighest = mostExpensive.total - cheapest.total;
                                const savingsAgainstAverage = otherAverage - cheapest.total;

                                if (savingsAgainstHighest <= 0) return null;

                                return (
                                    <div className="flex items-start gap-4 p-4 bg-brand/5 rounded-xl border border-brand/20 shadow-sm">
                                        <div className="p-2 rounded-xl bg-brand/10 shrink-0 border border-brand/20 shadow-sm mt-0.5">
                                            <Sparkles className="h-5 w-5 text-brand" />
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-bold flex items-center gap-1.5 text-foreground tracking-tight text-[15px] mb-1">
                                                Análise Inteligente 
                                            </p>
                                            <p className="font-medium text-muted-foreground leading-relaxed">
                                                Se os preços forem mantidos, fechando esta cotação agora com <strong className="text-foreground">{cheapest.nome}</strong>, você economizará <strong className="text-emerald-600 dark:text-emerald-400 font-bold">R$ {savingsAgainstHighest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> comparado com o cenário mais caro oferecido{supplierTotals.length > 2 ? `, garantindo impressionantes R$ ${savingsAgainstAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a menos em relação à média de preço das outras ofertas` : ''}.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Seção 3: Fornecedores Participantes - Tabela Compacta */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                Fornecedores Participantes
                            </h3>
                            <Badge variant="secondary" className="text-[10px] dark:bg-gray-700 dark:text-gray-200">
                                {currentQuote.fornecedoresParticipantes.length}
                            </Badge>
                        </div>

                        <Card className="border border-slate-200/80 dark:border-gray-700/60 bg-white dark:bg-[#1C1F26] rounded-lg sm:rounded-xl overflow-hidden shadow-md dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-200">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-slate-700 dark:text-gray-300">Fornecedor</th>
                                            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-slate-700 dark:text-gray-300">Status</th>
                                            <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-slate-700 dark:text-gray-300">Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                        {currentQuote.fornecedoresParticipantes.map((fornecedor, index) => {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const totalValue = products.reduce((sum: number, product: any) => {
                                                const value = getSupplierProductValue(fornecedor.id, product.product_id);
                                                const qtd = Number(product.quantidade) || 1;
                                                return sum + ((value || 0) * qtd);
                                            }, 0);
                                            const isBest = bestSupplier && fornecedor.id === bestSupplier.id;

                                            return (
                                                <tr key={fornecedor.id} className={cn(
                                                    "hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors",
                                                    isBest && "bg-emerald-50 dark:bg-emerald-900/20"
                                                )}>
                                                    <td className="px-2 py-1.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={cn(
                                                                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                                                fornecedor.status === 'respondido' ? "bg-emerald-500" : "bg-gray-400"
                                                            )}></div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                                                    {fornecedor.nome}
                                                                    {isBest && <Star className="inline-block h-2.5 w-2.5 ml-0.5 text-emerald-600 dark:text-emerald-400" />}
                                                                </p>
                                                                {fornecedor.dataResposta && (
                                                                    <p className="text-[10px] text-slate-500 dark:text-gray-400 truncate">{fornecedor.dataResposta}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <Badge
                                                            variant={fornecedor.status === 'respondido' ? 'default' : 'outline'}
                                                            className={cn(
                                                                "text-[10px] h-4 px-1.5",
                                                                fornecedor.status === 'respondido'
                                                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                                                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50"
                                                            )}
                                                        >
                                                            {fornecedor.status === 'respondido' ? 'OK' : 'Pend.'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-2 py-1.5 text-right">
                                                        {totalValue > 0 ? (
                                                            <p className={cn(
                                                                "font-bold text-xs",
                                                                isBest ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                                                            )}>
                                                                R$ {totalValue.toFixed(2)}
                                                            </p>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 dark:text-gray-500">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}
