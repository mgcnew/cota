import { PricingUnit } from "@/utils/priceNormalization";

export interface FornecedorParticipante {
  id: string;
  nome: string;
  valorOferecido: number;
  dataResposta: string | null;
  observacoes: string;
  status: "pendente" | "respondido";
  accessToken?: string;
  phone?: string;
}

export interface SupplierItemWithPricing {
  id: string;
  quote_id: string;
  supplier_id: string;
  product_id: string;
  product_name: string;
  valor_oferecido: number | null;
  valor_inicial?: number | null;
  price_history?: Array<{ old_value: number; new_value: number; date: string; by: string }>;
  unidade_preco: PricingUnit | null;
  fator_conversao: number | null;
  quantidade_por_embalagem: number | null;
  brand_id: string | null;
  brand_name?: string;
  brand_rating?: number | null;
  updated_by_type: "comprador" | "fornecedor" | null;
  observacoes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Quote {
  id: string;
  produto: string;
  produtoResumo: string;
  produtosLista: string[];
  quantidade: string;
  status: string;
  statusReal: string;
  dataInicio: string;
  dataFim: string;
  dataPlanejada?: string;
  fornecedores: number;
  melhorPreco: string;
  melhorFornecedor: string;
  economia: string;
  fornecedoresParticipantes: FornecedorParticipante[];
}
