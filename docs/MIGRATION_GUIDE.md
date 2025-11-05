# 🚀 GUIA DE APLICAÇÃO DA MIGRAÇÃO SQL

## 📋 Passo a Passo para Aplicar a Migração

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `20250120000000_subscription_limits_and_guards.sql`
6. Clique em **Run** ou pressione `Ctrl+Enter`
7. Verifique se não há erros

### Opção 2: Via Supabase CLI (Se preferir instalar)

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Aplicar migrações
cd cotaja
supabase db push
```

## ✅ Verificação Pós-Migração

Após aplicar a migração, verifique se:

1. ✅ Tabela `plan_features` foi criada
2. ✅ Triggers foram criados:
   - `enforce_max_users` em `company_users`
   - `enforce_max_products` em `products`
   - `enforce_max_suppliers` em `suppliers`
3. ✅ Funções foram criadas:
   - `check_max_users()`
   - `check_max_products()`
   - `check_max_suppliers()`
   - `is_subscription_active(UUID)`
   - `get_plan_features(TEXT)`

### Query de Verificação

Execute no SQL Editor:

```sql
-- Verificar se tabela plan_features existe e tem dados
SELECT * FROM plan_features;

-- Verificar triggers
SELECT 
  trigger_name, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name IN ('enforce_max_users', 'enforce_max_products', 'enforce_max_suppliers');

-- Verificar funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('check_max_users', 'check_max_products', 'check_max_suppliers', 'is_subscription_active', 'get_plan_features');
```

## 🧪 Testes Recomendados

Após aplicar a migração, teste:

1. **Limite de Usuários:**
   - Crie uma empresa com plano `basic` (max_users = 5)
   - Tente adicionar 6 usuários → Deve bloquear

2. **Limite de Produtos:**
   - Tente adicionar mais de 100 produtos → Deve bloquear

3. **Limite de Fornecedores:**
   - Tente adicionar mais de 50 fornecedores → Deve bloquear

4. **Bloqueio por Assinatura:**
   - Altere `subscription_status` para `'suspended'` → Deve mostrar tela de bloqueio

## ⚠️ Importante

- A migração é **segura** e não afeta dados existentes
- Todos os triggers são aplicados **antes** da inserção (BEFORE INSERT)
- Se houver erro, a transação será revertida automaticamente

## 📝 Próximos Passos

Após aplicar a migração com sucesso:
1. ✅ Testar validações de limites
2. ✅ Criar landing page pública
3. ✅ Criar página de preços
4. ✅ Integrar Stripe para pagamentos



