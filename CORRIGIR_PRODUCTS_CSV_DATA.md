# Corrigir CSV de Products - Problema de Data

## Problema
O Supabase está rejeitando a importação porque as colunas de data (`created_at` e `updated_at`) estão em formato incompatível.

**Erro**: "The data that you are trying to import is incompatible with your table structure"

## Solução Rápida: Remover Colunas de Data

As colunas `created_at` e `updated_at` são geradas automaticamente pelo banco. Você não precisa importá-las!

### Passo 1: Abrir o CSV no Excel/Google Sheets

1. Abra `products_part2.csv` (ou o arquivo que está tentando importar)
2. Localize as colunas `created_at` e `updated_at`

### Passo 2: Deletar as Colunas

1. Clique no cabeçalho da coluna `created_at`
2. Clique com botão direito → **Excluir**
3. Repita para a coluna `updated_at`

### Passo 3: Salvar

1. Salve o arquivo como CSV
2. Certifique-se de manter o formato CSV

### Passo 4: Repetir para Todos os Arquivos

Faça o mesmo para:
- `products_part2.csv`
- `products_part3.csv`

## Colunas Necessárias para Products

O CSV deve ter **apenas** estas colunas:

```csv
id,company_id,name,category,unit,weight,barcode,image_url
```

**Não inclua**:
- ❌ `created_at`
- ❌ `updated_at`

Essas colunas serão preenchidas automaticamente pelo banco.

## Exemplo de CSV Correto

```csv
id,company_id,name,category,unit,weight,barcode,image_url
060bec5e-78f8-4a8b-b5e8-9b688f,31eeb636-9ec3-436c-99d0-958cf7535b03,FRANGO A PASSARINHO TEMP 8,14-GELADEIRA,kg,,
856d541a-d876-4a81-a404-06e,31eeb636-9ec3-436c-99d0-958cf7535b03,FRICASSE DE FRANGO 300G,14-GELADEIRA,un,,
```

## Importar no Supabase

Após remover as colunas de data:

1. Acesse https://okprblbcwaconccerwiw.supabase.co
2. Vá em **Table Editor** → **products**
3. Clique em **Insert** → **Import data from CSV**
4. Selecione `products_part2.csv` (corrigido)
5. Revise o mapeamento de colunas
6. Clique em **Import data**
7. Aguarde conclusão
8. Repita com `products_part3.csv`

## Verificar Importação

```sql
-- Verificar total de produtos
SELECT COUNT(*) as total FROM products;
-- Deve retornar 2381 (500 + 1000 + 881)

-- Ver últimos produtos importados
SELECT id, name, category, created_at 
FROM products 
ORDER BY created_at DESC 
LIMIT 10;
```

## Alternativa: Importar via SQL (Se CSV Continuar Dando Erro)

Se mesmo removendo as colunas de data ainda der erro, use SQL:

```sql
-- Desabilitar temporariamente os triggers de data
ALTER TABLE products DISABLE TRIGGER ALL;

-- Importar dados (exemplo com alguns registros)
INSERT INTO products (id, company_id, name, category, unit, weight, barcode, image_url)
VALUES 
  ('060bec5e-78f8-4a8b-b5e8-9b688f', '31eeb636-9ec3-436c-99d0-958cf7535b03', 'FRANGO A PASSARINHO TEMP 8', '14-GELADEIRA', 'kg', NULL, NULL, NULL),
  ('856d541a-d876-4a81-a404-06e', '31eeb636-9ec3-436c-99d0-958cf7535b03', 'FRICASSE DE FRANGO 300G', '14-GELADEIRA', 'un', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Reabilitar triggers
ALTER TABLE products ENABLE TRIGGER ALL;
```

## Outros Problemas Comuns

### Erro: "Invalid UUID"
- Verifique se a coluna `id` tem UUIDs válidos
- Formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Erro: "Foreign key constraint"
- Verifique se `company_id` é: `31eeb636-9ec3-436c-99d0-958cf7535b03`

### Erro: "Duplicate key"
- Significa que o produto já foi importado
- Pode ignorar ou deletar os produtos existentes primeiro

## Limpar Produtos Existentes (Se Necessário)

Se quiser recomeçar a importação:

```sql
-- ⚠️ CUIDADO: Isso vai deletar TODOS os produtos!
DELETE FROM products WHERE company_id = '31eeb636-9ec3-436c-99d0-958cf7535b03';

-- Verificar
SELECT COUNT(*) FROM products;
-- Deve retornar 0
```

## Próximos Passos

1. ✅ Remover colunas `created_at` e `updated_at` dos CSVs
2. ✅ Importar `products_part2.csv`
3. ✅ Importar `products_part3.csv`
4. ✅ Verificar total: deve ter 2381 produtos
5. ✅ Continuar com importação de `quotes.csv`

Boa sorte! 🚀
