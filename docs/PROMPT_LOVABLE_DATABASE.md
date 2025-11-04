# 🎯 PROMPT PARA LOVABLE CRIAR ESTRUTURA DE BANCO DE DADOS SAAS

## 📋 INSTRUÇÕES PARA COPIAR E COLAR NO LOVABLE

---

## PROMPT COMPLETO:

```
Preciso que você crie uma estrutura completa de banco de dados para transformar meu sistema em SaaS com planos de assinatura. Siga exatamente estas instruções:

## 1. CRIAR TABELA plan_features

Criar uma nova tabela chamada `plan_features` com os seguintes campos:
- plan_name (TEXT, PRIMARY KEY) - nome do plano: 'basic', 'professional', 'enterprise'
- max_users (INTEGER, DEFAULT 5) - limite máximo de usuários
- max_products (INTEGER, DEFAULT 100) - limite máximo de produtos
- max_suppliers (INTEGER, DEFAULT 50) - limite máximo de fornecedores
- max_quotes_per_month (INTEGER, DEFAULT 100) - limite de cotações por mês
- api_access (BOOLEAN, DEFAULT FALSE) - acesso à API
- advanced_analytics (BOOLEAN, DEFAULT FALSE) - analytics avançados
- priority_support (BOOLEAN, DEFAULT FALSE) - suporte prioritário
- created_at (TIMESTAMPTZ, DEFAULT NOW()) - data de criação

Após criar a tabela, inserir 3 planos padrão:
- Plan 'basic': max_users=5, max_products=100, max_suppliers=50, max_quotes_per_month=100, todos os booleanos FALSE
- Plan 'professional': max_users=15, max_products=500, max_suppliers=200, max_quotes_per_month=1000, api_access=TRUE, advanced_analytics=TRUE, priority_support=FALSE
- Plan 'enterprise': max_users=100, max_products=-1 (ilimitado), max_suppliers=-1 (ilimitado), max_quotes_per_month=-1 (ilimitado), todos os booleanos TRUE

## 2. ATUALIZAR TABELA companies

Verificar se a tabela `companies` já existe e adicionar/modificar os seguintes campos (se não existirem):
- trial_ends_at (TIMESTAMPTZ, nullable) - data de término do trial
- subscription_expires_at (TIMESTAMPTZ, nullable) - data de expiração da assinatura
- subscription_status (TEXT) - status: 'trial', 'active', 'suspended', 'cancelled'
- subscription_plan (TEXT) - plano: 'basic', 'professional', 'enterprise'

Se os campos subscription_status e subscription_plan não existirem, criar com DEFAULT 'trial' e 'basic' respectivamente.

## 3. CRIAR FUNÇÕES SQL

Criar as seguintes funções PostgreSQL:

### Função check_max_users()
Esta função deve ser executada ANTES de inserir um novo registro em `company_users`. Ela deve:
- Obter o plano da empresa (companies.subscription_plan)
- Buscar o limite max_users na tabela plan_features
- Contar quantos usuários a empresa já tem
- Se o número atual >= limite, lançar uma exceção com mensagem: "Limite de usuários atingido (X/Y). Faça upgrade do plano para adicionar mais usuários."
- Se não encontrar plano, usar limite padrão de 5

### Função check_max_products()
Similar à anterior, mas para produtos:
- Validar antes de inserir em `products`
- Mensagem: "Limite de produtos atingido (X/Y). Faça upgrade do plano para adicionar mais produtos."
- Limite padrão: 100
- Se max_products = -1, permite inserção (ilimitado)

### Função check_max_suppliers()
Similar, mas para fornecedores:
- Validar antes de inserir em `suppliers`
- Mensagem: "Limite de fornecedores atingido (X/Y). Faça upgrade do plano para adicionar mais fornecedores."
- Limite padrão: 50
- Se max_suppliers = -1, permite inserção (ilimitado)

### Função is_subscription_active(company_id UUID)
Retorna BOOLEAN indicando se a assinatura está ativa:
- Retorna FALSE se subscription_status = 'suspended'
- Retorna FALSE se subscription_status = 'cancelled'
- Retorna FALSE se subscription_status = 'trial' E subscription_expires_at < NOW()
- Retorna FALSE se subscription_status = 'trial' E trial_ends_at < NOW()
- Retorna FALSE se subscription_status = 'active' E subscription_expires_at < NOW()
- Retorna TRUE caso contrário

### Função get_plan_features(plan_name TEXT)
Retorna uma tabela com os limites do plano:
- Retorna max_users, max_products, max_suppliers, max_quotes_per_month
- Se não encontrar plano, retorna valores padrão (5, 100, 50, 100)

## 4. CRIAR TRIGGERS

Criar triggers que executam ANTES de inserir registros:

### Trigger enforce_max_users
- Tabela: company_users
- Timing: BEFORE INSERT
- Função: check_max_users()

### Trigger enforce_max_products
- Tabela: products
- Timing: BEFORE INSERT
- Função: check_max_products()

### Trigger enforce_max_suppliers
- Tabela: suppliers
- Timing: BEFORE INSERT
- Função: check_max_suppliers()

## 5. CONFIGURAR RLS (Row Level Security)

Garantir que:
- A tabela plan_features seja pública para leitura (qualquer usuário autenticado pode ler)
- As funções sejam SECURITY DEFINER para funcionar corretamente

## IMPORTANTE:
- Todas as funções devem usar LANGUAGE plpgsql (exceto is_subscription_active e get_plan_features que podem ser SQL)
- Usar SECURITY DEFINER nas funções que precisam acessar dados sem restrições RLS
- Os triggers devem usar DROP TRIGGER IF EXISTS antes de criar (para evitar erros se já existirem)
- Se a coluna trial_ends_at não existir em companies, adicionar com ALTER TABLE

Por favor, execute tudo isso e me confirme quando terminar. Se houver algum erro, me informe qual tabela/campo/função deu problema.
```

---

## 🎯 VERSÃO RESUMIDA (SE O LOVABLE TIVER LIMITE DE CARACTERES):

```
Criar estrutura de banco de dados SaaS:

1. TABELA plan_features:
   - Campos: plan_name (PK), max_users, max_products, max_suppliers, max_quotes_per_month, api_access, advanced_analytics, priority_support, created_at
   - Inserir 3 planos: basic (5/100/50/100), professional (15/500/200/1000), enterprise (100/-1/-1/-1)

2. ATUALIZAR companies:
   - Adicionar: trial_ends_at, subscription_expires_at, subscription_status, subscription_plan

3. FUNÇÕES SQL:
   - check_max_users() - valida limite antes de inserir em company_users
   - check_max_products() - valida limite antes de inserir em products
   - check_max_suppliers() - valida limite antes de inserir em suppliers
   - is_subscription_active(company_id) - retorna se assinatura está ativa
   - get_plan_features(plan_name) - retorna limites do plano

4. TRIGGERS:
   - enforce_max_users (BEFORE INSERT em company_users)
   - enforce_max_products (BEFORE INSERT em products)
   - enforce_max_suppliers (BEFORE INSERT em suppliers)

Todas as funções devem usar SECURITY DEFINER e LANGUAGE plpgsql.
```

---

## 📝 CHECKLIST APÓS LOVABLE EXECUTAR:

- [ ] Tabela `plan_features` criada
- [ ] 3 planos inseridos na tabela
- [ ] Campos adicionados em `companies`
- [ ] 3 funções de validação criadas
- [ ] 2 funções helper criadas
- [ ] 3 triggers criados
- [ ] RLS configurado corretamente

---

## 🔍 QUERIES DE VERIFICAÇÃO (executar depois):

```sql
-- Verificar plan_features
SELECT * FROM plan_features;

-- Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'enforce_%';

-- Verificar funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'check_%' OR routine_name LIKE 'is_%' OR routine_name LIKE 'get_%';

-- Verificar campos em companies
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name IN ('trial_ends_at', 'subscription_expires_at', 'subscription_status', 'subscription_plan');
```

---

## 💡 DICAS:

1. **Se o Lovable perguntar sobre algo específico:**
   - Diga para usar os valores padrão que mencionei
   - Diga para criar tudo mesmo que já exista (usar IF NOT EXISTS)

2. **Se der erro em alguma função:**
   - Peça para mostrar o erro completo
   - Pode ser problema de sintaxe SQL

3. **Se não criar os triggers:**
   - Peça explicitamente para criar os triggers
   - Mencione que são essenciais para validar limites

4. **Se perguntar sobre RLS:**
   - Diga para permitir leitura pública em plan_features (qualquer autenticado pode ler)
   - As funções devem ser SECURITY DEFINER

---

## ✅ PRÓXIMO PASSO APÓS CRIAR:

Depois que o Lovable criar tudo, você pode testar:

1. Verificar se os planos foram criados:
   ```sql
   SELECT * FROM plan_features;
   ```

2. Testar limite de usuários:
   - Tentar adicionar mais usuários que o limite permite
   - Deve dar erro com mensagem de limite

3. Verificar se as funções estão funcionando:
   ```sql
   SELECT is_subscription_active('uuid-da-empresa');
   SELECT * FROM get_plan_features('basic');
   ```

---

**Copie o prompt completo acima e cole no chat do Lovable!**


