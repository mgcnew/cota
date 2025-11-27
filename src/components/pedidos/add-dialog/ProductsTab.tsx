import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Package, Plus, Copy, Trash2 } from "lucide-react";
import { PedidoItem } from "./types";
import { formatDecimalDisplay } from "@/lib/text-utils";

interface ProductsTabProps {
    isMobile: boolean;
    // Product selection states
    filteredProducts: any[];
    products: any[];
    selectedProduct: any;
    handleProductSelect: (product: any) => void;
    debouncedProductSearch: string;
    setProductSearch: (search: string) => void;

    // Product form states
    newProductQuantity: string;
    setNewProductQuantity: (value: string) => void;
    newProductUnit: string;
    setNewProductUnit: (value: string) => void;
    newProductPrice: string;
    setNewProductPrice: (value: string) => void;

    // Errors
    errors: Record<string, string>;
    setErrors: (errors: Record<string, string>) => void;

    // Last used prices
    lastUsedPrices: Record<string, number>;

    // Items list
    itens: PedidoItem[];
    handleAddNewProduct: () => void;
    handleRemoveItem: (index: number) => void;
    handleDuplicateItem: (index: number) => void;
    calculateTotal: () => number;
}

export function ProductsTab({
    isMobile,
    filteredProducts,
    products,
    selectedProduct,
    handleProductSelect,
    debouncedProductSearch,
    setProductSearch,
    newProductQuantity,
    setNewProductQuantity,
    newProductUnit,
    setNewProductUnit,
    newProductPrice,
    setNewProductPrice,
    errors,
    setErrors,
    lastUsedPrices,
    itens,
    handleAddNewProduct,
    handleRemoveItem,
    handleDuplicateItem,
    calculateTotal
}: ProductsTabProps) {
    return (
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-3 lg:gap-4'} max-w-full`}>
            {/* Left Column - Add Product Form */}
            <Card className={`border-gray-200 dark:border-gray-700 shadow-sm order-1 lg:order-1 h-fit dark:bg-gray-800 min-w-0 ${isMobile ? 'p-4' : 'p-2 sm:p-3'}`}>
                <div className={`${isMobile ? 'p-3 mb-3' : 'p-2 sm:p-3'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800`}>
                    <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-foreground flex items-center gap-2`}>
                        <Package className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-pink-500 dark:text-pink-400`} />
                        Adicionar Produto
                    </h3>
                </div>
                <div className={`${isMobile ? 'space-y-4' : 'space-y-2 sm:space-y-3'} pb-3 sm:pb-4 min-w-0`}>
                    <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                        <Label className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-foreground`}>Produto *</Label>
                        <div className="min-w-0">
                            <Combobox
                                options={filteredProducts.map(p => ({
                                    value: p.name,
                                    label: p.name
                                }))}
                                value={selectedProduct ? selectedProduct.name : ""}
                                onValueChange={value => {
                                    const product = products.find(p => p.name === value);
                                    if (product) handleProductSelect(product);
                                }}
                                placeholder="Digite para buscar produtos..."
                                searchPlaceholder={`Buscar entre ${products.length} produtos...`}
                                emptyText={debouncedProductSearch ? "Nenhum produto encontrado" : "Digite para ver produtos..."}
                                className={`w-full min-w-0 ${isMobile ? 'h-11 text-base' : ''}`}
                                onSearchChange={setProductSearch}
                            />
                        </div>
                        {errors.product && (
                            <p className="text-xs text-red-500 dark:text-red-400">{errors.product}</p>
                        )}
                    </div>

                    <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'sm:grid-cols-2 gap-3'} min-w-0`}>
                        <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                            <Label className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-foreground`}>Quantidade *</Label>
                            <Input
                                type="text"
                                value={newProductQuantity}
                                onChange={e => {
                                    const value = e.target.value;
                                    if (/^\d*[,.]?\d*$/.test(value) || value === '') {
                                        setNewProductQuantity(value);
                                        if (errors.quantity) setErrors({ ...errors, quantity: "" });
                                    }
                                }}
                                placeholder="Ex: 98,5 ou 100"
                                className={`${isMobile ? 'h-11 text-base' : 'text-sm'} ${errors.quantity ? 'border-red-500 dark:border-red-400' : ''}`}
                            />
                            {errors.quantity && (
                                <p className="text-xs text-red-500 dark:text-red-400">{errors.quantity}</p>
                            )}
                        </div>
                        <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                            <Label className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-foreground`}>Unidade *</Label>
                            <div className="min-w-0">
                                <Select
                                    value={newProductUnit}
                                    onValueChange={value => {
                                        setNewProductUnit(value);
                                        if (errors.unit) setErrors({ ...errors, unit: "" });
                                    }}
                                >
                                    <SelectTrigger className={`${isMobile ? 'h-11 text-base' : 'text-sm'} w-full min-w-0 ${errors.unit ? 'border-red-500 dark:border-red-400' : ''}`}>
                                        <SelectValue placeholder="Unidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="un">Unidade (un)</SelectItem>
                                        <SelectItem value="kg">Quilograma (kg)</SelectItem>
                                        <SelectItem value="pc">Peça (pc)</SelectItem>
                                        <SelectItem value="caixa">Caixa</SelectItem>
                                        <SelectItem value="litro">Litro (L)</SelectItem>
                                        <SelectItem value="metro">Metro (m)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {errors.unit && (
                                <p className="text-xs text-red-500 dark:text-red-400">{errors.unit}</p>
                            )}
                        </div>
                    </div>

                    <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} min-w-0`}>
                        <Label className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-foreground`}>Valor Unitário *</Label>
                        <Input
                            type="number"
                            value={newProductPrice}
                            onChange={e => {
                                setNewProductPrice(e.target.value);
                                if (errors.price) setErrors({ ...errors, price: "" });
                            }}
                            placeholder="0,00"
                            min="0"
                            step="0.01"
                            className={`${isMobile ? 'h-11 text-base' : 'text-sm'} w-full min-w-0 ${errors.price ? 'border-red-500 dark:border-red-400' : ''}`}
                        />
                        {errors.price && (
                            <p className="text-xs text-red-500 dark:text-red-400">{errors.price}</p>
                        )}
                        {selectedProduct && lastUsedPrices[selectedProduct.id] && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Último preço: R$ {lastUsedPrices[selectedProduct.id].toFixed(2)}
                            </p>
                        )}
                    </div>

                    <Button
                        type="button"
                        onClick={handleAddNewProduct}
                        disabled={!selectedProduct || !newProductQuantity || !newProductPrice || !newProductUnit}
                        className={`w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed ${isMobile ? 'h-11 text-base' : 'text-sm sm:text-base py-2 sm:py-2.5'} transition-all duration-200 shadow-md hover:shadow-lg`}
                    >
                        <Plus className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                        Adicionar à Lista
                    </Button>
                </div>
            </Card>

            {/* Right Column - Products List */}
            <Card className={`border-gray-200 dark:border-gray-700 shadow-sm order-2 lg:order-2 flex flex-col dark:bg-gray-800 min-w-0 ${isMobile ? 'p-4' : 'p-2 sm:p-3'}`}>
                <div className={`${isMobile ? 'p-3 mb-3' : 'p-2 sm:p-3'} border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 flex-shrink-0`}>
                    <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-foreground flex items-center gap-2`}>
                        <Package className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-pink-500 dark:text-pink-400`} />
                        Produtos Adicionados ({itens.length})
                    </h3>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className={`${isMobile ? 'p-3 space-y-3' : 'p-2 sm:p-3 space-y-2'}`}>
                        {itens.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                                    <Package className="h-8 w-8 text-pink-500 dark:text-pink-400 opacity-60" />
                                </div>
                                <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium mb-1`}>Nenhum produto adicionado</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Use o formulário ao lado para adicionar produtos ao pedido</p>
                            </div>
                        ) : (
                            itens.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className={`border border-border rounded-lg ${isMobile ? 'p-3' : 'p-2'} bg-muted/50 hover:bg-muted/70 transition-colors`}
                                >
                                    <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-1'} gap-2 min-w-0`}>
                                        <h4 className={`font-medium text-foreground ${isMobile ? 'text-sm' : 'text-xs'} flex-1 truncate min-w-0`}>
                                            {item.produto || 'Produto não encontrado'}
                                        </h4>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDuplicateItem(index)}
                                                className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} p-0 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50`}
                                                title="Duplicar produto"
                                            >
                                                <Copy className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveItem(index)}
                                                className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50`}
                                                title="Remover produto"
                                            >
                                                <Trash2 className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className={`grid grid-cols-3 ${isMobile ? 'gap-2 text-sm' : 'gap-1 sm:gap-2 text-xs'} text-muted-foreground min-w-0`}>
                                        <div className="min-w-0 truncate">
                                            <span className="font-medium">Qtd: </span>
                                            <span className="truncate">{formatDecimalDisplay(item.quantidade)} {item.unidade}</span>
                                        </div>
                                        <div className="min-w-0 truncate">
                                            <span className="font-medium">Unit: </span>
                                            <span className="truncate">R$ {item.valorUnitario.toFixed(2)}</span>
                                        </div>
                                        <div className="text-right min-w-0 truncate">
                                            <span className={`font-medium text-pink-600 dark:text-pink-400 truncate ${isMobile ? 'text-base' : ''}`}>
                                                R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
                {itens.length > 0 && (
                    <div className={`${isMobile ? 'p-3' : 'p-2 sm:p-3'} border-t-2 border-pink-200 dark:border-pink-800 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 flex-shrink-0`}>
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className={`font-semibold text-foreground ${isMobile ? 'text-base' : 'text-sm'}`}>
                                    Total do Pedido
                                </span>
                                <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 dark:text-gray-400`}>
                                    {itens.length} {itens.length === 1 ? 'produto' : 'produtos'}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`${isMobile ? 'text-xl' : 'text-lg'} font-bold text-pink-600 dark:text-pink-400`}>
                                    R$ {calculateTotal().toFixed(2)}
                                </span>
                                <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 dark:text-gray-400`}>
                                    Média: R$ {(calculateTotal() / itens.length).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
