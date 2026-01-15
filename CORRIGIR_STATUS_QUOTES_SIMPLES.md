# Corrigir Status do CSV de Quotes - Guia Simples

## Problema
O CSV tem valores de status que não são aceitos pelo banco:
- ❌ `concluida` (não aceito)
- ❌ `expirada` (não aceito)
- ✅ `finalizada` (aceito)
- ✅ `cancelada` (aceito)
- ✅ `aberta` (aceito)
- ✅ `em_andamento` (aceito)

## Solução Rápida - Find & Replace no Excel/Google Sheets

### Passo 1: Abrir o CSV
1. Abra o arquivo `quotes.csv` no Excel ou Google Sheets
2. Localize a coluna `status`

### Passo 2: Substituir Valores
Use **Find & Replace** (Ctrl+H no Excel, Ctrl+H no Google Sheets):

#### Substituição 1: concluida → finalizada
- **Encontrar**: `concluida`
- **Substituir por**: `finalizada`
- Clique em **Substituir Tudo**

#### Substituição 2: expirada → cancelada
- **Encontrar**: `expirada`
- **Substituir por**: `cancelada`
- Clique em **Substituir Tudo**

### Passo 3: Verificar
1. Procure na coluna `status` se ainda há valores `concluida` ou `expirada`
2. Se não houver mais, está pronto!

### Passo 4: Salvar
1. Salve o arquivo como CSV
2. Certifique-se de manter o formato CSV (não salvar como Excel)

## Importar no Supabase

Após corrigir:

1. Acesse https://okprblbcwaconccerwiw.supabase.co
2. Vá em **Table Editor** → **quotes**
3. Clique em **Insert** → **Import data from CSV**
4. Selecione o arquivo `quotes.csv` corrigido
5. Revise o mapeamento de colunas
6. Clique em **Import**

## Verificar Importação

Execute no SQL Editor:

```sql
-- Verificar total de quotes importadas
SELECT COUNT(*) as total FROM quotes;

-- Verificar distribuição por status
SELECT status, COUNT(*) as quantidade 
FROM quotes 
GROUP BY status 
ORDER BY quantidade DESC;

-- Ver primeiras 5 quotes
SELECT id, data_inicio, data_fim, status 
FROM quotes 
ORDER BY created_at DESC 
LIMIT 5;
```

## Resultado Esperado

Após a importação, você deve ver algo como:

| status | quantidade |
|--------|-----------|
| finalizada | 65 |
| cancelada | 2 |
| aberta | 5 |
| em_andamento | 4 |

**Não deve haver** `concluida` ou `expirada` na lista!

## Se Houver Erro na Importação

### Erro: "Invalid status value"
- Significa que ainda há valores incorretos
- Volte ao CSV e verifique novamente

### Erro: "Foreign key constraint"
- Significa que um `company_id` não existe
- Verifique se todos os registros têm: `31eeb636-9ec3-436c-99d0-958cf7535b03`

### Erro: "Duplicate key"
- Significa que o ID já existe
- Pode ignorar se for re-importação

## Próximos Passos

Após importar quotes com sucesso:

1. ✅ Importar `quote_items.csv`
2. ✅ Importar `quote_suppliers.csv`
3. ✅ Importar `quote_supplier_items.csv`

Siga a ordem para evitar erros de foreign key!
