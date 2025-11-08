# Script de Exportação de Dados do Lovable

## Como Usar

Este guia explica como exportar dados do Lovable Cloud para importar no Supabase.

## Método 1: Via SQL Editor (Recomendado)

1. Acesse o Lovable Dashboard → Database → SQL Editor
2. Execute as queries do arquivo `docs/QUERIES_EXPORTACAO_LOVABLE.sql`
3. Copie os resultados de cada query
4. Salve em arquivos CSV ou JSON

## Método 2: Via pg_dump (Avançado)

Se você tiver acesso SSH ao banco do Lovable:

```bash
pg_dump -h [host-lovable] -U [user] -d [database] \
  --data-only \
  --column-inserts \
  > lovable-backup.sql
```

## Método 3: Via COPY (CSV)

No SQL Editor do Lovable:

```sql
-- Exportar produtos
COPY products TO STDOUT WITH CSV HEADER;

-- Exportar fornecedores
COPY suppliers TO STDOUT WITH CSV HEADER;

-- Continue para outras tabelas...
```

## Ordem de Exportação

Exporte nesta ordem (tabelas referenciadas primeiro):

1. companies
2. company_users
3. user_roles
4. corporate_groups
5. products
6. suppliers
7. quotes
8. quote_items
9. quote_suppliers
10. orders
11. order_items
12. company_invitations
13. activity_log (opcional)

## Importação no Supabase

Depois de exportar, use o guia de importação em:
`docs/PLANO_MIGRACAO_LOVABLE_PARA_SUPABASE.md`






