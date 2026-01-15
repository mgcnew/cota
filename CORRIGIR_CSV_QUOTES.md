# Corrigir CSV de Quotes

## Problema Identificado

O CSV de quotes está **sem separadores** (vírgulas). As colunas estão todas juntas em uma única linha:

```
2026-01-05finalizada2026-01-02 16:31:16.109389+00...
```

Deveria estar assim:
```
id,company_id,data_inicio,data_fim,data_planejada,status,observacoes,created_at,updated_at
a96063ff-bd66-4768-9ed9-81e9b8d7aaa9,31eeb636-9ec3-436c-99d0-958cf7535b03,2025-11-12,2025-11-19,2025-11-13 03:00:00+00,finalizada,,2025-11-12 18:00:47.751424+00,2025-11-18 16:22:21.744159+00
```

## Solução

### Opção 1: Exportar Novamente do Lovable (Recomendado)

1. Acesse o Lovable antigo
2. Vá em **Table Editor** → **quotes**
3. Clique em **Export** → **CSV**
4. Certifique-se de que o formato está correto (com vírgulas)
5. Salve como `quotes_corrigido.csv`

### Opção 2: Usar Script Python para Corrigir

Se não conseguir exportar novamente, use este script Python:

```python
import re
import csv

# Ler o arquivo problemático
with open('quotes.csv', 'r', encoding='utf-8') as f:
    content = f.read()

# Padrão para identificar cada registro
# UUID + data + status + timestamps + company_id
pattern = r'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})'

# Dividir em registros
records = []
lines = content.split('\n')

for line in lines:
    if not line.strip():
        continue
    
    # Encontrar todos os UUIDs na linha
    uuids = re.findall(pattern, line)
    
    if len(uuids) >= 2:
        # Primeiro UUID é o ID, último é o company_id
        record_id = uuids[0]
        company_id = uuids[-1]
        
        # Extrair datas e status
        # Padrão: YYYY-MM-DD
        dates = re.findall(r'\d{4}-\d{2}-\d{2}', line)
        
        # Extrair status (concluida, finalizada, expirada)
        status_match = re.search(r'(concluida|finalizada|expirada|aberta|em_andamento)', line)
        status = status_match.group(1) if status_match else 'aberta'
        
        # Corrigir status
        if status == 'concluida':
            status = 'finalizada'
        
        # Extrair timestamps
        timestamps = re.findall(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+\+\d{2}', line)
        
        if len(dates) >= 2:
            data_inicio = dates[0]
            data_fim = dates[1]
            data_planejada = dates[2] if len(dates) > 2 else ''
            
            created_at = timestamps[0] if len(timestamps) > 0 else ''
            updated_at = timestamps[1] if len(timestamps) > 1 else ''
            
            # Extrair observações (texto entre status e timestamps)
            obs_match = re.search(rf'{status}(.*?){timestamps[0] if timestamps else ""}', line)
            observacoes = obs_match.group(1).strip() if obs_match else ''
            
            records.append({
                'id': record_id,
                'company_id': company_id,
                'data_inicio': data_inicio,
                'data_fim': data_fim,
                'data_planejada': data_planejada,
                'status': status,
                'observacoes': observacoes,
                'created_at': created_at,
                'updated_at': updated_at
            })

# Escrever CSV corrigido
with open('quotes_corrigido.csv', 'w', newline='', encoding='utf-8') as f:
    if records:
        writer = csv.DictWriter(f, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)

print(f'✅ {len(records)} registros corrigidos!')
print('Arquivo salvo como: quotes_corrigido.csv')
```

### Opção 3: Corrigir Manualmente no Excel

1. Abra o arquivo `quotes.csv` no Excel
2. Selecione toda a coluna A
3. Vá em **Dados** → **Texto para Colunas**
4. Escolha **Largura Fixa**
5. Defina as posições das colunas manualmente:
   - Posição 36: ID (UUID)
   - Posição 46: data_inicio
   - Posição 56: data_fim
   - Posição 66: status
   - etc.

**⚠️ Muito trabalhoso e propenso a erros!**

### Opção 4: Usar SQL Direto (Mais Rápido)

Se você tem os dados no Lovable antigo, pode usar SQL para copiar diretamente:

```sql
-- No Lovable antigo, execute:
SELECT 
  id,
  company_id,
  data_inicio,
  data_fim,
  data_planejada,
  CASE 
    WHEN status = 'concluida' THEN 'finalizada'
    WHEN status = 'expirada' THEN 'cancelada'
    ELSE status
  END as status,
  observacoes
FROM quotes
WHERE company_id = '31eeb636-9ec3-436c-99d0-958cf7535b03'
ORDER BY created_at;

-- Copie o resultado
-- Cole no novo Supabase como INSERT
```

## Estrutura Correta do CSV

O CSV deve ter estas colunas (separadas por vírgula):

```csv
id,company_id,data_inicio,data_fim,data_planejada,status,observacoes
a96063ff-bd66-4768-9ed9-81e9b8d7aaa9,31eeb636-9ec3-436c-99d0-958cf7535b03,2025-11-12,2025-11-19,2025-11-13,finalizada,
495037c6-74f9-4e53-8c6c-f94b8aa874f6,31eeb636-9ec3-436c-99d0-958cf7535b03,2025-11-17,2025-11-18,,finalizada,
```

## Valores de Status para Corrigir

| Valor Atual | Valor Correto |
|-------------|---------------|
| `concluida` | `finalizada` |
| `expirada` | `cancelada` |
| `finalizado` | `finalizada` |
| `em andamento` | `em_andamento` |

## Após Corrigir

1. Verifique se o arquivo tem vírgulas separando as colunas
2. Verifique se a primeira linha é o header
3. Verifique se os status estão corretos
4. Importe no Supabase

## Importar no Supabase

```sql
-- Ou use a interface:
-- Table Editor → quotes → Insert → Import data from CSV
```

## Verificar Importação

```sql
SELECT COUNT(*) as total FROM quotes;
SELECT status, COUNT(*) FROM quotes GROUP BY status;
```

## Alternativa Rápida: Criar Quotes Manualmente via SQL

Se tiver poucos registros, pode criar diretamente via SQL:

```sql
INSERT INTO quotes (id, company_id, data_inicio, data_fim, status)
VALUES 
  ('a96063ff-bd66-4768-9ed9-81e9b8d7aaa9', '31eeb636-9ec3-436c-99d0-958cf7535b03', '2025-11-12', '2025-11-19', 'finalizada'),
  ('495037c6-74f9-4e53-8c6c-f94b8aa874f6', '31eeb636-9ec3-436c-99d0-958cf7535b03', '2025-11-17', '2025-11-18', 'finalizada'),
  ('3aaef26f-1b38-434c-a8f4-b1bc4ac5c7f4', '31eeb636-9ec3-436c-99d0-958cf7535b03', '2026-01-12', '2026-01-12', 'finalizada')
-- ... adicione mais registros
ON CONFLICT (id) DO NOTHING;
```

## Recomendação

**Use a Opção 1** (exportar novamente do Lovable) se possível. É a mais confiável e rápida.

Se não tiver acesso ao Lovable, **use a Opção 2** (script Python) para processar o arquivo automaticamente.
