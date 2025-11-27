import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Clock } from "lucide-react";
import { PedidoItem } from "./types";
import { formatDecimalDisplay } from "@/lib/text-utils";

interface DetailsTabProps {
    isMobile: boolean;
    observacoes: string;
    setObservacoes: (value: string) => void;
    itens: PedidoItem[];
    fornecedor: string;
    suppliers: any[];
    dataEntrega: string;
    calculateTotal: () => number;
}

export function DetailsTab({
    isMobile,
    observacoes,
    setObservacoes,
    itens,
    fornecedor,
    suppliers,
    dataEntrega,
    calculateTotal
}: DetailsTabProps) {
    return (
        <div className={`max-w-4xl mx-auto w-full ${isMobile ? 'space-y-4' : 'space-y-3 sm:space-y-4'}`}>
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-3 sm:gap-4'} w-full max-w-full`}>
                {/* Observações */}
                <Card className={`border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 min-w-0 ${isMobile ? 'p-4' : 'p-2 sm:p-3'}`}>
                    <div className={`${isMobile ? 'p-3 mb-3' : 'p-2 sm:p-3'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800`}>
                        <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-900 dark:text-white flex items-center gap-2`}>
                            <FileText className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-pink-500 dark:text-pink-400`} />
                            Observações
                        </h3>
                    </div>
                    <div className={`${isMobile ? 'p-3' : 'p-2 sm:p-3'} min-w-0`}>
                        <Textarea
                            value={observacoes}
                            onChange={e => setObservacoes(e.target.value)}
                            placeholder="Observações adicionais sobre o pedido..."
                            className={`${isMobile ? 'min-h-[120px] text-base' : 'min-h-[80px] sm:min-h-[100px] text-sm'} resize-none w-full min-w-0 dark:bg-gray-900 dark:border-gray-600 dark:text-white`}
                        />
                    </div>
                </Card>

                {/* Resumo do Pedido */}
                <Card className={`border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 min-w-0 ${isMobile ? 'p-4' : 'p-2 sm:p-3'}`}>
                    <div className={`${isMobile ? 'p-3 mb-3' : 'p-2 sm:p-3'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800`}>
                        <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-900 dark:text-white flex items-center gap-2`}>
                            <Clock className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-pink-500 dark:text-pink-400`} />
                            Resumo do Pedido
                        </h3>
                    </div>
                    <div className={`${isMobile ? 'p-3 space-y-3' : 'p-2 sm:p-3 space-y-2 sm:space-y-3'}`}>
                        <div className={`grid grid-cols-1 ${isMobile ? 'sm:grid-cols-2 gap-3' : 'sm:grid-cols-2 gap-2 sm:gap-3'} ${isMobile ? 'text-sm' : 'text-xs'} min-w-0`}>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Produtos:</span>
                                <div className={`font-medium dark:text-gray-200 ${isMobile ? 'text-base' : ''}`}>{itens.length} itens</div>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Fornecedor:</span>
                                <div className={`font-medium ${isMobile ? 'text-sm' : 'text-xs'} truncate dark:text-gray-200`}>
                                    {fornecedor ? suppliers.find(s => s.id === fornecedor)?.name : 'Não selecionado'}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Data de Entrega:</span>
                                <div className={`font-medium dark:text-gray-200 ${isMobile ? 'text-base' : ''}`}>
                                    {dataEntrega ? new Date(dataEntrega).toLocaleDateString('pt-BR') : 'Não definida'}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Valor Total:</span>
                                <div className={`font-bold text-pink-600 ${isMobile ? 'text-lg' : 'text-sm sm:text-base'}`}>
                                    R$ {calculateTotal().toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {itens.length > 0 && <div className={`border-t border-gray-200 dark:border-gray-700 ${isMobile ? 'pt-3' : 'pt-2 sm:pt-3'}`}>
                            <h4 className={`font-medium text-gray-900 dark:text-white ${isMobile ? 'mb-2' : 'mb-1'} ${isMobile ? 'text-sm' : 'text-xs'}`}>Produtos Selecionados:</h4>
                            <div className={`${isMobile ? 'h-24' : 'h-20 sm:h-24'} overflow-y-auto`}>
                                <div className={isMobile ? 'space-y-2' : 'space-y-1'}>
                                    {itens.map((item, index) => <div key={index} className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 dark:text-gray-400 flex justify-between gap-2`}>
                                        <span className="truncate flex-1">{item.produto}</span>
                                        <span className="flex-shrink-0">{formatDecimalDisplay(item.quantidade)} {item.unidade}</span>
                                    </div>)}
                                </div>
                            </div>
                        </div>}
                    </div>
                </Card>
            </div>
        </div>
    );
}
