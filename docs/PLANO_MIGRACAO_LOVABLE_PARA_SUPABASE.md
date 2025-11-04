# 🚀 PLANO COMPLETO: MIGRAÇÃO DO LOVABLE CLOUD PARA SUPABASE

## 📋 VISÃO GERAL

Este plano detalha como migrar completamente o banco de dados do Lovable Cloud para o Supabase, permitindo total independência e liberdade de uso.

---

## ✅ O QUE JÁ TEMOS

- ✅ 31 migrations SQL organizadas em `supabase/migrations/`
- ✅ Estrutura completa do banco documentada
- ✅ Código já configurado para usar Supabase via variáveis de ambiente
- ✅ Configuração Supabase local (`supabase/config.toml`)

---

## 🎯 ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais Identificadas:
1. **products** - Produtos
2. **suppliers** - Fornecedores  
3. **quotes** - Cotações
4. **quote_items** - Itens de cotação
5. **quote_suppliers** - Fornecedores participantes
6. **orders** (pedidos) - Pedidos
7. **order_items** - Itens de pedidos
8. **companies** - Empresas (SaaS Multi-Tenant)
9. **company_users** - Relação usuário-empresa
10. **company_invitations** - Convites
11. **user_roles** - Roles dos usuários
12. **corporate_groups** - Grupos corporativos
13. **activity_log** - Log de atividades
14. **plan_features** - Features dos planos SaaS
15. **cotacoes** - (se diferente de quotes)
16. **pedidos** - (se diferente de orders)

---

## 📝 FASE 1: PREPARAÇÃO E EXPORTAÇÃO

### 1.1. Criar Conta/Projeto no Supabase

**Passos:**
1. Acesse: https://supabase.com
2. Crie conta gratuita (se não tiver)
3. Clique em **New Project**
4. Preencha:
   - **Nome do projeto**: `cotaja` ou `cotaja-prod`
   - **Database Password**: Anote esta senha! (vai precisar)
   - **Region**: Escolha mais próxima do Brasil (ex: `South America (São Paulo)`)
5. Aguarde ~2 minutos para criação

**Resultado:** Você terá:
- Project URL: `https://xxxxx.supabase.co`
- Anon Key: `eyJhbGc...` (chave pública)
- Service Role Key: `eyJhbGc...` (chave privada - NÃO compartilhar)

### 1.2. Exportar Dados do Lovable Cloud

**Método Recomendado: Via Supabase Dashboard do Lovable**

1. Acesse o Lovable Dashboard
2. Vá em **Database** → **SQL Editor**
3. Execute queries para exportar cada tabela:

```sql
-- Exemplo para exportar produtos
COPY products TO STDOUT WITH CSV HEADER;
```

**OU Método Alternativo: Via pg_dump (se tiver acesso)**

```bash
pg_dump -h [host-lovable] -U [user] -d [database] -t products > products.sql
```

**Tabelas para Exportar:**
- products
- suppliers
- quotes / cotacoes
- quote_items
- quote_suppliers
- orders / pedidos
- order_items
- companies
- company_users
- company_invitations
- user_roles
- corporate_groups
- activity_log
- auth.users (usuários do sistema)

**⚠️ IMPORTANTE:** 
- Exporte com **CSV** ou **SQL INSERT statements**
- Mantenha a ordem de exportação (tabelas referenciadas primeiro)
- Anote quantos registros cada tabela tem

---

## 📝 FASE 2: APLICAR MIGRATIONS NO SUPABASE

### 2.1. Aplicar Todas as Migrations

**Opção A: Via Supabase Dashboard (Recomendado para Iniciantes)**

1. Acesse seu novo projeto Supabase
2. Vá em **SQL Editor**
3. Abra cada arquivo de migration em ordem:
   - Ordem: Por data no nome do arquivo (mais antigo primeiro)
   - Exemplo: `20250930163829_...` → `20250930164337_...` → ... → `20250121000000_...`
4. Execute cada migration completa

**Opção B: Via Supabase CLI (Mais Rápido)**

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login no Supabase
supabase login

# 3. Link ao projeto (use o project ID do Supabase Dashboard)
supabase link --project-ref seu-project-id

# 4. Aplicar todas as migrations de uma vez
supabase db push
```

**⚠️ ATENÇÃO:**
- Execute na ordem correta (por data)
- Se alguma migration falhar, corrija antes de continuar
- Verifique se todas as tabelas foram criadas

### 2.2. Verificar Estrutura Criada

Execute no SQL Editor do Supabase:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar funções criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

---

## 📝 FASE 3: IMPORTAR DADOS

### 3.1. Preparar Dados para Importação

**Se exportou em CSV:**
- Verificar encoding (UTF-8)
- Verificar delimitadores
- Remover headers se necessário

**Se exportou em SQL:**
- Verificar sintaxe
- Remover comandos de criação de tabela (já temos)
- Manter apenas INSERT statements

### 3.2. Importar Dados (Ordem Importante!)

**Ordem de Importação:**
1. **auth.users** (usuários do sistema) - Via Supabase Dashboard → Authentication → Import users
2. **companies** (empresas)
3. **company_users** (relação usuário-empresa)
4. **user_roles** (roles)
5. **corporate_groups** (grupos)
6. **plan_features** (planos - pode já estar criado)
7. **products** (produtos)
8. **suppliers** (fornecedores)
9. **quotes / cotacoes** (cotações)
10. **quote_items** (itens de cotação)
11. **quote_suppliers** (fornecedores participantes)
12. **orders / pedidos** (pedidos)
13. **order_items** (itens de pedidos)
14. **company_invitations** (convites)
15. **activity_log** (log - opcional)

### 3.3. Métodos de Importação

**Método 1: Via SQL Editor (Pequenos Volumes)**

```sql
-- Exemplo: Importar produtos
INSERT INTO products (id, user_id, name, category, weight, created_at, updated_at, company_id)
VALUES 
  ('uuid-1', 'user-uuid', 'Produto 1', 'Categoria', '1kg', NOW(), NOW(), 'company-uuid'),
  ('uuid-2', 'user-uuid', 'Produto 2', 'Categoria', '2kg', NOW(), NOW(), 'company-uuid');
```

**Método 2: Via CSV Import (Médios Volumes)**

1. Supabase Dashboard → **Table Editor**
2. Selecione a tabela
3. Clique em **Import data from CSV**
4. Faça upload do arquivo CSV
5. Mapeie as colunas
6. Clique em **Import**

**Método 3: Via Supabase CLI (Grandes Volumes)**

```bash
# Preparar arquivo CSV
# Importar via psql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -c "\COPY products FROM 'products.csv' WITH CSV HEADER"
```

---

## 📝 FASE 4: VERIFICAÇÃO E VALIDAÇÃO

### 4.1. Verificar Integridade dos Dados

```sql
-- Contar registros por tabela
SELECT 
  'products' as tabela, COUNT(*) as total FROM products
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'company_users', COUNT(*) FROM company_users;

-- Verificar foreign keys
SELECT 
  COUNT(*) as total_products,
  COUNT(DISTINCT company_id) as empresas_com_produtos
FROM products
WHERE company_id IS NOT NULL;

-- Verificar usuários
SELECT COUNT(*) as total_users FROM auth.users;
```

### 4.2. Testar Funções SQL

```sql
-- Testar função de limites
SELECT * FROM get_plan_features('basic');

-- Testar função de assinatura
SELECT is_subscription_active('company-uuid-aqui');

-- Testar função system admin (se aplicado)
SELECT is_system_admin(auth.uid());
```

### 4.3. Verificar RLS (Row Level Security)

```sql
-- Verificar políticas RLS ativas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 📝 FASE 5: CONFIGURAR VARIÁVEIS DE AMBIENTE

### 5.1. Obter Credenciais do Supabase

1. Acesse Supabase Dashboard
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon public key** → `eyJhbGc...`

### 5.2. Criar Arquivo .env Local

Crie arquivo `cotaja/.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-publica-aqui
```

**⚠️ IMPORTANTE:**
- Adicione `.env` ao `.gitignore` (não commitar!)
- Use apenas a chave `anon/public` (nunca a `service_role`)

### 5.3. Atualizar Código (se necessário)

O código já está configurado para usar essas variáveis em:
- `src/integrations/supabase/client.ts`

Nenhuma mudança necessária se as variáveis estiverem corretas.

---

## 📝 FASE 6: TESTAR CONEXÃO

### 6.1. Testar Localmente

```bash
cd cotaja
npm install
npm run dev
```

**Verificações:**
- ✅ App carrega sem erros
- ✅ Login funciona
- ✅ Dados aparecem corretamente
- ✅ Criação/edição de registros funciona

### 6.2. Testar Queries

Teste no navegador (DevTools → Console):

```javascript
// Verificar conexão
const { data, error } = await supabase.from('products').select('*').limit(5);
console.log('Produtos:', data);
console.log('Erro:', error);
```

---

## 📝 FASE 7: ATUALIZAR CONFIGURAÇÕES

### 7.1. Atualizar supabase/config.toml

```toml
project_id = "seu-novo-project-id-do-supabase"
```

### 7.2. Atualizar Edge Functions (se houver)

Se você tiver Edge Functions:
1. Supabase Dashboard → **Edge Functions**
2. Faça deploy das functions:
   - `generate-analytics-insights`
   - `generate-product-image`

---

## 🚨 CHECKLIST FINAL

### Antes de Migrar:
- [ ] Dados exportados do Lovable Cloud
- [ ] Projeto Supabase criado
- [ ] Senha do banco anotada
- [ ] Credenciais copiadas

### Durante Migração:
- [ ] Todas as migrations aplicadas
- [ ] Estrutura verificada
- [ ] Dados importados na ordem correta
- [ ] Foreign keys verificadas

### Após Migração:
- [ ] Variáveis de ambiente configuradas
- [ ] App testado localmente
- [ ] Login funciona
- [ ] Dados aparecem corretamente
- [ ] Criação/edição funciona
- [ ] RLS políticas funcionando

---

## 💡 DICAS IMPORTANTES

1. **Backup Primeiro**: Sempre faça backup antes de migrar
2. **Teste em Ambiente de Desenvolvimento**: Crie um projeto Supabase de teste primeiro
3. **Migrations em Ordem**: Execute migrations na ordem correta (por data)
4. **Dados em Lotes**: Se tiver muitos dados, importe em lotes
5. **Validação**: Sempre valide os dados após importação
6. **Documentação**: Anote problemas e soluções encontradas

---

## 🆘 PROBLEMAS COMUNS E SOLUÇÕES

### Erro: "Foreign key constraint violation"
**Solução**: Importe tabelas relacionadas primeiro (companies antes de products)

### Erro: "RLS policy violation"
**Solução**: Desabilite temporariamente RLS durante importação, depois reative

### Erro: "UUID format invalid"
**Solução**: Verifique formato dos UUIDs exportados

### Erro: "Column does not exist"
**Solução**: Verifique se migration foi aplicada corretamente

---

## 📚 RECURSOS ÚTEIS

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Dashboard**: https://supabase.com/dashboard
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Supabase CLI**: https://supabase.com/docs/guides/cli

---

## ✅ PRÓXIMOS PASSOS APÓS MIGRAÇÃO

1. ✅ Atualizar variáveis de ambiente em produção (Vercel, Netlify, etc.)
2. ✅ Fazer deploy da aplicação
3. ✅ Testar em produção
4. ✅ Monitorar logs e erros
5. ✅ Desativar banco do Lovable (após confirmar que tudo funciona)

---

**Quer ajuda com alguma fase específica? Posso criar scripts ou queries SQL personalizadas!**


