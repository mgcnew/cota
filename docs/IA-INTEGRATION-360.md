# Integração IA COTA 360º - Documentação Técnica

## 1. Arquitetura de Integração
A IA (Groq/Llama-3) atua como um Orquestrador de Negócios 360º, conectando-se a todos os módulos do sistema através de uma camada de contexto dinâmico e execução de ferramentas (Function Calling).

### Fluxo de Dados
1. **Entrada**: O usuário faz uma pergunta ou comando em linguagem natural.
2. **Contextualização**: O sistema identifica o tipo de consulta e extrai dados relevantes dos módulos (Produtos, Fornecedores, Compras, Estoque, Auditoria).
3. **Processamento (LLM)**: O modelo Groq analisa os dados e decide se precisa apenas responder ou executar uma ação.
4. **Execução de Ferramentas**: Se uma ação for necessária (ex: criar contagem), a IA emite um `tool_call`.
5. **Saída**: O sistema executa a ação via hooks/API e retorna uma resposta estruturada (tabelas, insights) para o usuário.

## 2. Conectores por Módulo
Cada módulo fornece dados específicos para a IA:
- **Produtos**: `products`, `order_items` (histórico de preços).
- **Fornecedores**: `suppliers`, `order_history`.
- **Compras**: `quotes`, `orders`, `packaging_quotes/orders`.
- **Estoque**: `stock_counts`, `stock_count_items`.
- **Auditoria**: `activity_log`.

## 3. Comandos Naturais e Ações
A IA está habilitada para interpretar e executar:
- **"Inicie uma contagem de estoque"** -> Chama `create_stock_count`.
- **"Quanto gastei com X no mês Y?"** -> Analisa `orders` e `order_items`.
- **"Qual o melhor fornecedor para o produto Z?"** -> Compara `quote_supplier_items`.
- **"Quem alterou o status da cotação 123?"** -> Consulta `activity_log`.

## 4. Segurança e Permissões
- A IA respeita o `company_id` do usuário logado (via Supabase RLS e filtros nos hooks).
- Ações críticas (como criar cotações) são preparadas pela IA mas requerem validação no módulo correspondente para garantir integridade.

## 5. Exemplos de Uso
- *"Quais produtos estão com preço 10% acima da média?"*
- *"Gere um relatório de economia real nas últimas 5 cotações."*
- *"Crie uma contagem de estoque para o setor Depósito."*
- *"Quem finalizou o último pedido do fornecedor Holambra?"*
