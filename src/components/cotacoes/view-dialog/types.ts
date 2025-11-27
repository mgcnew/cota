import * as z from "zod";

// Schemas de validação para edição
export const productLineSchema = z.object({
    produtoId: z.string().min(1, "Produto é obrigatório"),
    produtoNome: z.string().min(1, "Produto é obrigatório"),
    quantidade: z.string().min(1, "Quantidade é obrigatória"),
    unidade: z.string().min(1, "Unidade é obrigatória"),
});

export const quoteSchema = z.object({
    produtos: z.array(productLineSchema).min(1, "Adicione pelo menos um produto"),
    dataInicio: z.date({ required_error: "Data de início é obrigatória" }),
    dataFim: z.date({ required_error: "Data de fim é obrigatória" }),
    dataPlanejada: z.date().optional(),
    fornecedoresIds: z.array(z.string()).optional(),
    observacoes: z.string().optional(),
    status: z.string().min(1, "Status é obrigatório"),
}).refine((data) => data.dataFim > data.dataInicio, {
    message: "Data de fim deve ser posterior à data de início",
    path: ["dataFim"],
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

export interface FornecedorParticipante {
    id: string;
    nome: string;
    valorOferecido: number;
    dataResposta: string | null;
    observacoes: string;
    status: "pendente" | "respondido";
}

export interface Quote {
    id: string;
    produto: string;
    produtoResumo: string;
    produtosLista: string[];
    quantidade: string;
    status: string;
    statusReal?: string;
    dataInicio: string;
    dataFim: string;
    dataPlanejada?: string;
    fornecedores: number;
    melhorPreco: string;
    melhorFornecedor: string;
    economia: string;
    fornecedoresParticipantes: FornecedorParticipante[];
    _raw?: any;
    _supplierItems?: any[];
}

export interface ViewQuoteDialogProps {
    quote?: Quote; // Opcional para mobile (usar quoteId)
    quoteId?: string; // Para mobile: carregar dados com hook
    onUpdateSupplierProductValue?: (quoteId: string, supplierId: string, productId: string, newValue: number) => void;
    onConvertToOrder?: (quoteId: string, orders: Array<{
        supplierId: string;
        productIds: string[];
        deliveryDate: string;
        observations?: string;
    }>) => void;
    onEdit?: (quoteId: string, data: QuoteFormData) => void;
    trigger?: React.ReactNode;
    isUpdating?: boolean;
    defaultTab?: string;
    readOnly?: boolean;
    open?: boolean; // Controle externo do modal
    onOpenChange?: (open: boolean) => void; // Callback para mudanças no estado
}

export type EditSection = "detalhes" | "fornecedores" | "observacoes";
