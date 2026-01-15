# Dividir CSV de Products Corretamente

## Problema
Os IDs estão sendo cortados quando você divide o CSV manualmente, resultando em UUIDs inválidos.

**Erro**: `ERROR: 22P02: invalid input syntax for type uuid: "id"`

## Causa
Ao copiar e colar linhas no Excel/Google Sheets, os IDs longos (UUIDs) podem ser truncados.

## Solução: Usar Script ou Ferramenta

### Opção 1: Usar Python (Recomendado)

Crie um arquivo `dividir_products.py`:

```python
import csv

# Ler o CSV original
with open('products.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    headers = reader.fieldnames

print(f'Total de produtos: {len(rows)}')

# Dividir em 3 partes
part1 = rows[0:500]      # Já importado
part2 = rows[500:1500]   # 1000 produtos
part3 = rows[1500:]      # Restante (881 produtos)

# Salvar part2
with open('products_part2.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(part2)
    print(f'✅ products_part2.csv criado com {len(part2)} produtos')

# Salvar part3
with open('products_part3.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(part3)
    print(f'✅ products_part3.csv criado com {len(part3)} produtos')

print('Pronto! Agora você pode importar os arquivos.')
```

**Como usar**:
1. Salve o script como `dividir_products.py`
2. Coloque na mesma pasta do `products.csv`
3. Execute: `python dividir_products.py`
4. Serão criados `products_part2.csv` e `products_part3.csv`

### Opção 2: Usar Excel com Cuidado

Se não puder usar Python:

1. Abra `products.csv` no Excel
2. **NÃO copie e cole!** Use **Filtro** em vez disso:
   - Selecione todas as colunas
   - Vá em **Dados** → **Filtro**
   - Na coluna de linha, filtre linhas 501-1500
   - Copie **TODAS as colunas visíveis**
   - Cole em novo arquivo
   - Salve como CSV

3. **Importante**: Verifique se os IDs estão completos:
   - Um UUID tem 36 caracteres
   - Formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Exemplo: `2ee403f6-cf14-4434-a543-2f4f12ab34cd`

### Opção 3: Usar Comando de Linha (Windows PowerShell)

```powershell
# Dividir em part2 (linhas 501-1500)
Get-Content products.csv | Select-Object -First 1501 | Select-Object -Last 1000 | Out-File products_part2.csv -Encoding UTF8

# Dividir em part3 (linhas 1501 até o fim)
Get-Content products.csv | Select-Object -Skip 1500 | Out-File products_part3.csv -Encoding UTF8
```

### Opção 4: Importar Direto via SQL (Mais Confiável)

Se continuar tendo problemas, use SQL direto:

```sql
-- Copie os dados do CSV original
-- Cole aqui como INSERT

INSERT INTO products (id, company_id, name, category, unit, weight, barcode, image_url)
VALUES 
  ('2ee403f6-cf14-4434-a543-2f4f12ab34cd', '31eeb636-9ec3-436c-99d0-958cf7535b03', 'Língua bovina', 'Bovino', 'kg', NULL, NULL, NULL),
  ('eed1c392-ef23-4b6c-b1f6-38f1ab12cd34', '31eeb636-9ec3-436c-99d0-958cf7535b03', 'Coxa com sobrecoxa', 'Frango', 'kg', NULL, NULL, NULL)
  -- ... adicione mais linhas
ON CONFLICT (id) DO NOTHING;
```

## Verificar IDs no CSV

Antes de importar, verifique se os IDs estão corretos:

1. Abra o CSV no editor de texto (Notepad++)
2. Procure por um ID na primeira linha
3. Conte os caracteres: deve ter **36 caracteres** (incluindo os hífens)

**Exemplo de ID correto**:
```
2ee403f6-cf14-4434-a543-2f4f12ab34cd
12345678901234567890123456789012345678
         1         2         3
```

**Exemplo de ID errado** (truncado):
```
2ee403f6-cf14-4434-a543-2f4f
123456789012345678901234567
         1         2
```

## Alternativa: Remover Coluna ID e Deixar o Banco Gerar

Se os IDs não forem importantes (não há referências em outras tabelas):

1. Remova a coluna `id` do CSV
2. O Supabase vai gerar novos UUIDs automaticamente
3. **⚠️ Cuidado**: Isso vai quebrar referências em `quote_items`, `order_items`, etc.

## Solução Temporária: Importar Sem Dividir

Se tiver menos de 1000 produtos restantes:

1. Filtre apenas os produtos que ainda não foram importados
2. Exporte apenas esses produtos
3. Importe de uma vez

```sql
-- Ver quantos produtos já foram importados
SELECT COUNT(*) FROM products;

-- Se tiver 500, faltam 1881
-- Você pode importar em 2 lotes de 1000 e 881
```

## Recomendação Final

**Use a Opção 1 (Python)** se possível. É a mais confiável e garante que os IDs não serão truncados.

Se não puder usar Python, **use a Opção 4 (SQL direto)** copiando os dados do CSV original e colando como INSERT.

**Evite** copiar e colar manualmente no Excel, pois isso pode truncar os IDs.
