import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Building2 } from "lucide-react";

interface SupplierTabProps {
    isMobile: boolean;
    suppliers: any[];
    debouncedSupplierSearch: string;
    fornecedor: string;
    setFornecedor: (value: string) => void;
    setSupplierSearch: (value: string) => void;
    dataEntrega: string;
    setDataEntrega: (value: string) => void;
}

export function SupplierTab({
    isMobile,
    suppliers,
    debouncedSupplierSearch,
    fornecedor,
    setFornecedor,
    setSupplierSearch,
    dataEntrega,
    setDataEntrega
}: SupplierTabProps) {
    return (
        <div className={`max-w-2xl mx-auto w-full ${isMobile ? 'space-y-4' : 'space-y-3 sm:space-y-4'}`}>
            <Card className={`border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 min-w-0 ${isMobile ? 'p-4' : 'p-2 sm:p-3'}`}>
                <div className={`${isMobile ? 'p-3 mb-3' : 'p-2 sm:p-3'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800`}>
                    <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-900 dark:text-white flex items-center gap-2`}>
                        <Building2 className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-pink-500`} />
                        Informações do Fornecedor
                    </h3>
                    <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 dark:text-gray-400 mt-1`}>
                        Selecione o fornecedor e defina a data de entrega
                    </p>
                </div>
                <div className={`${isMobile ? 'p-4 space-y-4' : 'p-3 sm:p-4 space-y-3 sm:space-y-4'} min-w-0`}>
                    <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                        <Label htmlFor="fornecedor" className={`${isMobile ? 'text-base' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>
                            Fornecedor *
                        </Label>
                        <div className="min-w-0">
                            <Combobox
                                options={suppliers
                                    .filter(s =>
                                        !debouncedSupplierSearch ||
                                        s.name.toLowerCase().includes(debouncedSupplierSearch.toLowerCase()) ||
                                        (s.contact && s.contact.toLowerCase().includes(debouncedSupplierSearch.toLowerCase()))
                                    )
                                    .map(s => ({
                                        value: s.id,
                                        label: s.contact ? `${s.name} (${s.contact})` : s.name
                                    }))}
                                value={fornecedor}
                                onValueChange={setFornecedor}
                                placeholder="Selecione um fornecedor..."
                                searchPlaceholder="Buscar por nome ou vendedor..."
                                emptyText="Nenhum fornecedor encontrado"
                                className={`w-full ${isMobile ? 'h-11 text-base' : 'text-sm'} min-w-0`}
                                onSearchChange={setSupplierSearch}
                            />
                        </div>
                    </div>

                    <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                        <Label htmlFor="dataEntrega" className={`${isMobile ? 'text-base' : 'text-xs'} font-medium text-gray-700 dark:text-gray-300`}>
                            Data de Entrega *
                        </Label>
                        <Input
                            id="dataEntrega"
                            type="date"
                            value={dataEntrega}
                            onChange={e => setDataEntrega(e.target.value)}
                            className={`w-full ${isMobile ? 'h-11 text-base' : 'text-sm'} min-w-0`}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}
