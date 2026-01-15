# Ordem de Importação CSV - Atualizada

## Status Atual da Importação

| Tabela | Status | Quantidade | Observação |
|--------|--------|-----------|------------|
| suppliers | ✅ Completo | 104 | Já importado |
| products | ⚠️ Parcial | 500/2381 | Faltam 1881 produtos |
| quotes | ❌ Pendente | 0 | Não importado |
| orders | ✅ Completo | 120 | Já importado |
| packaging_items | ✅ Completo | 49 | Já importado |
| packaging_quotes | ✅ Completo | 2 | Já importado |
| packaging_orders | ✅ Completo | 2 | Já importado |

## Próximos Passos de Importação

### 1. Products (Restantes - 1881 produtos)

**Limite do Supabase**: 1000 linhas por importação

**Dividir em 2 arquivos**:

#### Arquivo 1: products_part2.csv (linhas 501-1500)
- Abra o CSV original no Excel/Google Sheets
- Copie a linha 1 (header)
- Copie as linhas 501-1500 (1000 produtos)
- Cole em novo arquivo
- Salve como `products_part2.csv`

#### Arquivo 2: products_part3.csv (linhas 1501-2381)
- Abra o CSV original no Excel/Google Sheets
- Copie a linha 1 (header)
- Copie as linhas 1501-2381 (881 produtos)
- Cole em novo arquivo
- Salve como `products_part3.csv`

**Importar no Supabase**:
1. Acesse https://okprblbcwaconccerwiw.supabase.co
2. Vá em **Table Editor** → **products**
3. Clique em **Insert** → **Import data from CSV**
4. Selecione `products_part2.csv`
5. Clique em **Import**
6. Aguarde conclusão
7. Repita com `products_part3.csv`

**Verificar**:
```sql
SELECT COUNT(*) as total FROM products;
-- Deve retornar 2381
```

---

### 2. Quotes (Cotações)

**⚠️ IMPORTANTE**: Corrigir valores de `status` antes de importar!

#### Valores Válidos de Status:
- `aberta` - Cotação aberta
- `em_andamento` - Em andamento
- `finalizada` - Finalizada
- `cancelada` - Cancelada

#### Correções Necessárias:
Use Find & Replace (Ctrl+H) no Excel/Google Sheets:

| Encontrar | Substituir por |
|-----------|----------------|
| `finalizado` | `finalizada` |
| `concluida` | `finalizada` |
| `concluída` | `finalizada` |
| `em andamento` | `em_andamento` |
| `andamento` | `em_andamento` |
| Qualquer outro | `aberta` |

#### Estrutura do CSV:
```csv
id,company_id,data_inicio,data_fim,data_planejada,status,observacoes
uuid-1,31eeb636-9ec3-436c-99d0-958cf7535b03,2026-01-01,2026-01-31,,aberta,Cotação 1
```

**Importar no Supabase**:
1. Acesse https://okprblbcwaconccerwiw.supabase.co
2. Vá em **Table Editor** → **quotes**
3. Clique em **Insert** → **Import data from CSV**
4. Selecione `quotes.csv` (corrigido)
5. Clique em **Import**

**Verificar**:
```sql
SELECT COUNT(*) as total FROM quotes;
SELECT status, COUNT(*) FROM quotes GROUP BY status;
```

---

### 3. Quote Items (Itens de Cotação)

**Depende de**: quotes, products

**Estrutura do CSV**:
```csv
id,quote_id,product_id,product_name,quantidade,unidade
uuid-1,uuid-quote-1,uuid-product-1,Produto 1,100,kg
```

**Importar**:
1. Table Editor → **quote_items**
2. Import data from CSV
3. Selecione `quote_items.csv`

**Verificar**:
```sql
SELECT COUNT(*) as total FROM quote_items;
```

---

### 4. Quote Suppliers (Fornecedores de Cotação)

**Depende de**: quotes, suppliers

**Estrutura do CSV**:
```csv
id,quote_id,supplier_id,supplier_name,status,valor_oferecido,data_resposta,observacoes
uuid-1,uuid-quote-1,uuid-supplier-1,Fornecedor 1,respondido,1000.00,2026-01-15,
```

**Valores válidos de status**:
- `pendente`
- `respondido`
- `sem_resposta`

**Importar**:
1. Table Editor → **quote_suppliers**
2. Import data from CSV
3. Selecione `quote_suppliers.csv`

**Verificar**:
```sql
SELECT COUNT(*) as total FROM quote_suppliers;
```

---

### 5. Quote Supplier Items (Preços por Fornecedor)

**Depende de**: quotes, suppliers, products

**Estrutura do CSV**:
```csv
id,quote_id,supplier_id,product_id,product_name,valor_oferecido,unidade_preco,quantidade_por_embalagem,fator_conversao
uuid-1,uuid-quote-1,uuid-supplier-1,uuid-product-1,Produto 1,10.00,kg,1,1
```

**Importar**:
1. Table Editor → **quote_supplier_items**
2. Import data from CSV
3. Selecione `quote_supplier_items.csv`

**Verificar**:
```sql
SELECT COUNT(*) as total FROM quote_supplier_items;
```

---

## Ordem Completa de Importação (Referência)

Para referência futura, esta é a ordem completa respeitando foreign keys:

1. ✅ **corporate_groups** (se houver)
2. ✅ **companies** (se houver)
3. ✅ **company_users** (se houver)
4. ✅ **user_roles** (se houver)
5. ✅ **suppliers** (104 - completo)
6. ⚠️ **products** (500/2381 - importar restantes)
7. ❌ **quotes** (0 - importar)
8. ❌ **quote_items** (0 - importar após quotes)
9. ❌ **quote_suppliers** (0 - importar após quotes)
10. ❌ **quote_supplier_items** (0 - importar após quotes)
11. ✅ **orders** (120 - completo)
12. ✅ **order_items** (completo)
13. ✅ **packaging_items** (49 - completo)
14. ✅ **packaging_quotes** (2 - completo)
15. ✅ **packaging_quote_items** (completo)
16. ✅ **packaging_quote_suppliers** (completo)
17. ✅ **packaging_supplier_items** (completo)
18. ✅ **packaging_orders** (2 - completo)
19. ✅ **packaging_order_items** (completo)
20. **stock_sectors** (se houver)
21. **stock_counts** (se houver)
22. **stock_count_items** (se houver)
23. **activity_log** (opcional)
24. **notes** (se houver)
25. **shopping_list** (se houver)
26. **whatsapp_config** (se houver)
27. **whatsapp_templates** (se houver)
28. **whatsapp_messages** (se houver)
29. **whatsapp_responses** (se houver)

---

## Checklist de Importação

### Antes de Importar
- [ ] Backup dos CSVs originais
- [ ] Corrigir valores de `status` em quotes
- [ ] Dividir products em 2 arquivos (part2 e part3)
- [ ] Verificar se `company_id` está correto: `31eeb636-9ec3-436c-99d0-958cf7535b03`
- [ ] Verificar se todos os IDs são UUIDs válidos

### Durante a Importação
- [ ] Importar products_part2.csv (linhas 501-1500)
- [ ] Importar products_part3.csv (linhas 1501-2381)
- [ ] Importar quotes.csv (corrigido)
- [ ] Importar quote_items.csv
- [ ] Importar quote_suppliers.csv
- [ ] Importar quote_supplier_items.csv

### Após Importação
- [ ] Verificar contagem de registros
- [ ] Testar no app se dados aparecem
- [ ] Verificar se não há erros de foreign key
- [ ] Limpar cache do navegador (Ctrl+Shift+Delete)
- [ ] Recarregar app (Ctrl+F5)

---

## Script de Verificação Completa

Execute no SQL Editor após importar tudo:

```sql
-- Verificar contagem de todas as tabelas
SELECT 
  'suppliers' as table_name, COUNT(*) as count FROM suppliers
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'quote_items', COUNT(*) FROM quote_items
UNION ALL
SELECT 'quote_suppliers', COUNT(*) FROM quote_suppliers
UNION ALL
SELECT 'quote_supplier_items', COUNT(*) FROM quote_supplier_items
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
ORDER BY table_name;

-- Verificar integridade de foreign keys
SELECT 
  'quote_items sem quote' as issue,
  COUNT(*) as count
FROM quote_items qi
WHERE NOT EXISTS (SELECT 1 FROM quotes q WHERE q.id = qi.quote_id)
UNION ALL
SELECT 'quote_items sem product', COUNT(*)
FROM quote_items qi
WHERE qi.product_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = qi.product_id)
UNION ALL
SELECT 'quote_suppliers sem quote', COUNT(*)
FROM quote_suppliers qs
WHERE NOT EXISTS (SELECT 1 FROM quotes q WHERE q.id = qs.quote_id)
UNION ALL
SELECT 'quote_suppliers sem supplier', COUNT(*)
FROM quote_suppliers qs
WHERE NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.id = qs.supplier_id);

-- Verificar valores de status
SELECT 'quotes' as table_name, status, COUNT(*) as count
FROM quotes
GROUP BY status
UNION ALL
SELECT 'quote_suppliers', status, COUNT(*)
FROM quote_suppliers
GROUP BY status
ORDER BY table_name, status;
```

---

## Troubleshooting

### Erro: "Duplicate key value"
- Significa que o ID já existe
- Solução: Remova linhas duplicadas do CSV

### Erro: "Foreign key constraint violation"
- Significa que um ID referenciado não existe
- Solução: Importe as tabelas na ordem correta

### Erro: "Invalid status value"
- Significa que o valor de `status` não é válido
- Solução: Corrija os valores conforme tabela acima

### Erro: "Row count exceeds 1000"
- Significa que o CSV tem mais de 1000 linhas
- Solução: Divida o CSV em arquivos menores

### Dados não aparecem no app
- Limpe o cache: Ctrl+Shift+Delete
- Recarregue: Ctrl+F5
- Verifique no SQL Editor se foram importados

---

## Próximos Passos

1. **Dividir** products em 2 arquivos (part2 e part3)
2. **Corrigir** status em quotes.csv
3. **Importar** products_part2.csv
4. **Importar** products_part3.csv
5. **Importar** quotes.csv
6. **Importar** quote_items.csv
7. **Importar** quote_suppliers.csv
8. **Importar** quote_supplier_items.csv
9. **Verificar** com script SQL
10. **Testar** no app

Boa sorte com a importação! 🚀
