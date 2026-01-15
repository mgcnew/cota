# Importar Cotações via CSV

## Problema
O backup do Lovable não continha nenhuma cotação. Você precisa importar as cotações manualmente via CSV.

## Passo 1: Exportar Cotações do Lovable

1. Acesse o Lovable antigo (se ainda tiver acesso)
2. Vá em **Compras** → **Cotações**
3. Selecione todas as cotações (Ctrl+A)
4. Exporte como CSV:
   - Clique em **⋮** (menu)
   - Selecione **Exportar como CSV**
   - Salve como `quotes.csv`

## Passo 2: Preparar o CSV

### Estrutura esperada do CSV:
```
id,company_id,data_inicio,data_fim,data_planejada,status,observacoes
uuid-1,31eeb636-9ec3-436c-99d0-958cf7535b03,2026-01-01,2026-01-31,,aberta,Cotação 1
uuid-2,31eeb636-9ec3-436c-99d0-958cf7535b03,2026-02-01,2026-02-28,,em_andamento,Cotação 2
```

### Valores válidos para `status`:
- `aberta` - Cotação aberta
- `em_andamento` - Em andamento
- `finalizada` - Finalizada
- `cancelada` - Cancelada

### Se o CSV tiver valores diferentes:
Use Find & Replace para corrigir:
- `finalizado` → `finalizada`
- `concluida` → `finalizada`
- `em andamento` → `em_andamento`
- Qualquer outro valor → `aberta`

### Importante:
- Certifique-se de que `company_id` é: `31eeb636-9ec3-436c-99d0-958cf7535b03`
- Se estiver vazio, preencha com o ID acima
- Cada linha precisa de um `id` único (UUID)

## Passo 3: Importar no Supabase

### Opção A: Via Interface Supabase (Recomendado)

1. Acesse https://okprblbcwaconccerwiw.supabase.co
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Selecione a tabela `quotes`
5. Clique em **Import data**
6. Selecione o arquivo `quotes.csv`
7. Revise o mapeamento de colunas
8. Clique em **Import**

### Opção B: Via SQL (Se houver erro na importação)

```sql
-- Limpar cotações antigas (se houver)
DELETE FROM quotes WHERE company_id = '31eeb636-9ec3-436c-99d0-958cf7535b03';

-- Importar via COPY (se tiver acesso ao arquivo)
COPY quotes (id, company_id, data_inicio, data_fim, data_planejada, status, observacoes)
FROM '/path/to/quotes.csv'
WITH (FORMAT csv, HEADER true);
```

### Opção C: Via Supabase CLI

```bash
# Se tiver Supabase CLI instalado
supabase db push

# Depois importar via:
supabase db seed
```

## Passo 4: Importar Itens de Cotação

Após importar as cotações, você precisa importar os itens relacionados:

1. **quote_items** - Itens de cada cotação
2. **quote_suppliers** - Fornecedores convidados
3. **quote_supplier_items** - Preços oferecidos por fornecedor

### Estrutura de quote_items:
```
id,quote_id,product_id,product_name,quantidade,unidade
uuid-1,uuid-quote-1,uuid-product-1,Produto 1,100,kg
```

### Estrutura de quote_suppliers:
```
id,quote_id,supplier_id,supplier_name,status,valor_oferecido,data_resposta,observacoes
uuid-1,uuid-quote-1,uuid-supplier-1,Fornecedor 1,respondido,1000.00,2026-01-15,Preço negociado
```

### Estrutura de quote_supplier_items:
```
id,quote_id,supplier_id,product_id,product_name,valor_oferecido,unidade_preco,quantidade_por_embalagem,fator_conversao
uuid-1,uuid-quote-1,uuid-supplier-1,uuid-product-1,Produto 1,10.00,kg,1,1
```

## Passo 5: Verificar Importação

Execute no SQL Editor:

```sql
-- Verificar cotações importadas
SELECT COUNT(*) as total_quotes FROM quotes;

-- Verificar itens de cotação
SELECT COUNT(*) as total_items FROM quote_items;

-- Verificar fornecedores de cotação
SELECT COUNT(*) as total_suppliers FROM quote_suppliers;

-- Ver amostra de cotações
SELECT id, data_inicio, data_fim, status FROM quotes LIMIT 5;
```

## Passo 6: Testar no App

1. Acesse https://cotaja.vercel.app
2. Faça login
3. Vá em **Compras** → **Cotações**
4. Verifique se as cotações aparecem

## Troubleshooting

### Erro: "Duplicate key value violates unique constraint"
- Significa que o ID já existe
- Solução: Gere novos UUIDs para as cotações

### Erro: "Foreign key constraint violation"
- Significa que um `product_id` ou `supplier_id` não existe
- Solução: Verifique se os produtos e fornecedores foram importados

### Erro: "Invalid status value"
- Significa que o valor de `status` não é válido
- Solução: Use apenas: `aberta`, `em_andamento`, `finalizada`, `cancelada`

### Cotações não aparecem no app
- Verifique se foram realmente importadas: `SELECT COUNT(*) FROM quotes;`
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Recarregue a página (Ctrl+F5)

## Próximos Passos

1. **Exporte** as cotações do Lovable como CSV
2. **Corrija** os valores de `status` se necessário
3. **Importe** no Supabase
4. **Verifique** se foram importadas corretamente
5. **Teste** no app

## Dúvidas?

Se tiver problemas na importação, compartilhe:
- O arquivo CSV (ou primeiras 5 linhas)
- A mensagem de erro exata
- Quantas cotações você espera importar
