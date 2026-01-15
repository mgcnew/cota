# Debug: Backup/Restore Não Restaurando Dados

## Problema
O componente de backup/restore mostra mensagem de sucesso, mas os dados não aparecem no banco.

## Causas Possíveis

### 1. Dados não estão sendo inseridos (silenciosamente)
**Sintomas**: Mensagem de sucesso, mas 0 registros importados

**Solução**:
1. Abra o DevTools (F12)
2. Vá em **Console**
3. Procure por logs `[IMPORT]` 
4. Verifique se há mensagens de erro

### 2. Dados estão sendo inseridos, mas RLS está bloqueando a leitura
**Sintomas**: Dados importados, mas não aparecem na tela

**Solução**:
1. Verifique se o usuário está associado à empresa corretamente:
```sql
SELECT cu.*, ur.* 
FROM company_users cu
LEFT JOIN user_roles ur ON cu.company_id = ur.company_id
WHERE cu.user_id = auth.uid();
```

2. Verifique se a função `get_user_company_id` está retornando a empresa correta:
```sql
SELECT get_user_company_id(auth.uid());
```

### 3. Dados estão sendo inseridos com company_id errado
**Sintomas**: Dados importados, mas com company_id diferente

**Solução**:
1. Verifique os dados importados:
```sql
SELECT company_id, COUNT(*) 
FROM suppliers 
GROUP BY company_id;
```

2. Se houver company_id errado, delete e reimporte:
```sql
DELETE FROM suppliers WHERE company_id != '31eeb636-9ec3-436c-99d0-958cf7535b03';
```

## Passos para Debug

### Passo 1: Verificar Console
1. Abra https://cotaja.vercel.app
2. Faça login
3. Vá em Configurações → Backup e Restauração
4. Selecione o arquivo de backup
5. Abra DevTools (F12) → Console
6. Procure por logs `[IMPORT]`

### Passo 2: Verificar Dados no Supabase
1. Acesse https://okprblbcwaconccerwiw.supabase.co
2. Vá em **SQL Editor**
3. Execute:
```sql
-- Verificar contagem de registros por tabela
SELECT 'suppliers' as table_name, COUNT(*) as count FROM suppliers
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;

-- Verificar company_id dos registros
SELECT company_id, COUNT(*) 
FROM suppliers 
GROUP BY company_id;
```

### Passo 3: Verificar RLS
1. Execute no SQL Editor:
```sql
-- Verificar se o usuário tem acesso aos dados
SELECT * FROM suppliers LIMIT 1;

-- Se retornar vazio, o problema é RLS
-- Verifique as políticas:
SELECT * FROM pg_policies WHERE tablename = 'suppliers';
```

## Solução Rápida

Se os dados foram importados mas não aparecem:

1. **Limpar cache do navegador**:
   - Ctrl+Shift+Delete
   - Selecione "Todos os tempos"
   - Clique em "Limpar dados"

2. **Recarregar página**:
   - Ctrl+F5 (força reload sem cache)

3. **Fazer logout e login novamente**:
   - Clique em Logout
   - Faça login novamente

## Alternativa: Importar via SQL

Se o componente não funcionar, você pode importar manualmente via SQL:

1. Acesse https://okprblbcwaconccerwiw.supabase.co
2. Vá em **SQL Editor**
3. Execute:

```sql
-- Exemplo: Importar suppliers
INSERT INTO suppliers (id, company_id, name, cnpj, email, phone, contact, address, rating)
VALUES 
  ('uuid-1', '31eeb636-9ec3-436c-99d0-958cf7535b03', 'Fornecedor 1', '12345678000190', 'email@example.com', '1234567890', 'Contato', 'Endereço', 4.5),
  ('uuid-2', '31eeb636-9ec3-436c-99d0-958cf7535b03', 'Fornecedor 2', '98765432000109', 'email2@example.com', '0987654321', 'Contato 2', 'Endereço 2', 4.0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;
```

## Próximos Passos

1. Verifique os logs no console
2. Se houver erros, compartilhe-os comigo
3. Se os dados estão no banco mas não aparecem, é problema de RLS
4. Se nada funcionar, use a importação via CSV no Supabase

## Checklist

- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Usuário associado à empresa no Supabase
- [ ] Arquivo de backup é válido (JSON)
- [ ] Backup contém dados (não vazio)
- [ ] Console não mostra erros
- [ ] Dados aparecem no SQL Editor do Supabase
- [ ] RLS não está bloqueando a leitura
