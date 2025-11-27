export interface PedidoItem {
    produto: string;
    quantidade: number;
    valorUnitario: number;
    unidade: string;
}

export interface PreSelectedProduct {
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    estimated_price?: number;
}

export interface AddPedidoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (pedido: any) => void;
    preSelectedProducts?: PreSelectedProduct[];
}

export interface TabConfig {
    id: string;
    label: string;
    icon: any;
}

export type TabStatus = "completed" | "current" | "pending";
