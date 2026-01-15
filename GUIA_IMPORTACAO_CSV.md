# Guia de Importação de Dados CSV para Supabase

## Status Atual
- ✅ Usuário criado e associado à empresa
- ✅ Banco de dados migrado com sucesso
- ⏳ Aguardando importação de dados

## Ordem Correta de Importação

Respeite esta ordem para evitar erros de foreign key:

1. **corporate_groups** (se houver)
2. **companies** (se houver)
3. **company_users** (se houver)
4. **user_roles** (se houver)
5. **suppliers** ✅ (104 registros já importados)
6. **products** ⚠️ (2381 registros - DIVIDIR EM 3 PARTES)
7. **quotes** ⚠️ (CORRIGIR STATUS)
8. **quote_items**
9. **quote_suppliers**
10. **quote_supplier_items**
11. **orders**
12. **order_items**
13. **packaging_items**
14. **packaging_quotes**
15. **packaging_quote_items**
16. **packaging_quote_suppliers**
17. **packaging_supplier_items**
18. **packaging_orders**
19. **packaging_order_items**
20. **stock_sectors**
21. **stock_counts**
22. **stock_count_items**
23. **activity_log**
24. **notes**
25. **shopping_list**
26. **whatsapp_config**
27. **whatsapp_templates**
28. **whatsapp_messages**
29. **whatsapp_responses**

## Problemas Conhecidos e Soluções

### 1. CSV de Products (2381 linhas)
**Problema**: Supabase tem limite de 1000 linhas por importação

**Solução**: Dividir em 3 arquivos:
- `products_part1.csv` (linhas 1-1000)
- `products_part2.csv` (linhas 1001-2000)
- `products_part3.csv` (linhas 2001-2381)

**Como fazer**:
1. Abra o CSV original no Excel/Google Sheets
2. Copie as linhas 1-1000 (incluindo header) → salve como `products_part1.csv`
3. Copie as linhas 1-1 (header) + 1001-2000 → salve como `products_part2.csv`
4. Copie as linhas 1-1 (header) + 2001-2381 → salve como `products_part3.csv`
5. Importe cada arquivo separadamente no Supabase

### 2. CSV de Quotes (Valores de Status Inválidos)
**Problema**: O banco espera valores: `aberta`, `em_andamento`, `finalizada`, `cancelada`

**Valores encontrados no CSV**: `finalizado`, `concluida`, etc.

**Solução**: Corrigir os valores antes de importar:
- `finalizado` → `finalizada`
- `concluida` → `finalizada`
- `em andamento` → `em_andamento`
- Qualquer outro valor → `aberta` (padrão)

**Como fazer**:
1. Abra o CSV de quotes no Excel/Google Sheets
2. Use Find & Replace (Ctrl+H):
   - Find: `finalizado` → Replace: `finalizada`
   - Find: `concluida` → Replace: `finalizada`
   - Find: `em andamento` → Replace: `em_andamento`
3. Salve o arquivo corrigido
4. Importe no Supabase

## Passos para Importar no Supabase

1. Acesse: https://okprblbcwaconccerwiw.supabase.co
2. Vá em **SQL Editor**
3. Para cada tabela (na ordem acima):
   - Clique em **New Query**
   - Selecione a tabela
   - Clique em **Import data**
   - Selecione o arquivo CSV
   - Revise o mapeamento de colunas
   - Clique em **Import**

## Alternativa: Usar Backup/Restore do App

Se preferir, após importar os dados básicos (suppliers, products, quotes), você pode:

1. Fazer login no app com: `mgc.info.new@gmail.com` / `Mg435425.0`
2. Ir em **Configurações** → **Backup e Restauração**
3. Clicar em **Exportar Dados** (do Lovable antigo)
4. Clicar em **Restaurar Backup** (no novo Supabase)

## Verificação Após Importação

Execute estas queries para verificar:

```sql
-- Verificar contagem de registros
SELECT 'suppliers' as table_name, COUNT(*) as count FROM suppliers
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;

-- Verificar se há erros de foreign key
SELECT * FROM quotes WHERE status NOT IN ('aberta', 'em_andamento', 'finalizada', 'cancelada');
```

## Próximos Passos

1. ✅ Corrigir CSV de quotes (status)
2. ✅ Dividir CSV de products em 3 partes
3. ✅ Importar na ordem correta
4. ✅ Testar login no app
5. ✅ Usar Backup/Restore para dados restantes (opcional)
