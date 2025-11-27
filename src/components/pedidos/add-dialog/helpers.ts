import { PedidoItem, TabConfig, TabStatus } from "./types";

/**
 * Calcula o valor total do pedido
 */
export function calculateTotal(itens: PedidoItem[]): number {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);
}

/**
 * Valida se pode avançar para a próxima tab
 */
export function canProceedToNext(
    activeTab: string,
    itens: PedidoItem[],
    fornecedor: string,
    dataEntrega: string
): boolean {
    switch (activeTab) {
        case "produtos":
            return itens.length > 0 && itens.every(item => item.produto && item.quantidade > 0);
        case "fornecedor":
            return !!fornecedor && !!dataEntrega;
        case "detalhes":
            return true;
        default:
            return false;
    }
}

/**
 * Retorna o status de uma tab
 */
export function getTabStatus(
    tabId: string,
    tabs: TabConfig[],
    currentTabIndex: number
): TabStatus {
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex < currentTabIndex) return "completed";
    if (tabIndex === currentTabIndex) return "current";
    return "pending";
}

/**
 * Valida os dados do produto antes de adicionar
 */
export function validateProduct(
    selectedProduct: any,
    quantity: string,
    unit: string,
    price: string
): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!selectedProduct) {
        errors.product = "Selecione um produto";
    }
    if (!quantity || parseFloat(quantity) <= 0) {
        errors.quantity = "Quantidade deve ser maior que 0";
    }
    if (!unit) {
        errors.unit = "Selecione uma unidade";
    }
    if (!price || parseFloat(price) <= 0) {
        errors.price = "Preço deve ser maior que 0";
    }

    return errors;
}
