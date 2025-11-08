# 🚀 PLANO DE IMPLEMENTAÇÃO SAAS NO LOVABLE

## 📋 VISÃO GERAL
Plano completo para transformar o sistema MVP em SaaS completo usando as ferramentas do Lovable.

---

## FASE 1: ESTRUTURA DE DADOS NO SUPABASE (VIA LOVABLE)

### 1.1. Criar Tabela `plan_features`
```sql
-- Executar no SQL Editor do Supabase (via Lovable)
CREATE TABLE IF NOT EXISTS plan_features (
  plan_name TEXT PRIMARY KEY,
  max_users INTEGER DEFAULT 5,
  max_products INTEGER DEFAULT 100,
  max_suppliers INTEGER DEFAULT 50,
  max_quotes_per_month INTEGER DEFAULT 100,
  api_access BOOLEAN DEFAULT FALSE,
  advanced_analytics BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir planos padrão
INSERT INTO plan_features (plan_name, max_users, max_products, max_suppliers, max_quotes_per_month, api_access, advanced_analytics, priority_support) 
VALUES
  ('basic', 5, 100, 50, 100, FALSE, FALSE, FALSE),
  ('professional', 15, 500, 200, 1000, TRUE, TRUE, FALSE),
  ('enterprise', 100, -1, -1, -1, TRUE, TRUE, TRUE)
ON CONFLICT (plan_name) DO NOTHING;
```

### 1.2. Adicionar Campos na Tabela `companies`
No Lovable: **Database → Tables → companies → Add Column**
- `trial_ends_at` (TIMESTAMPTZ, nullable)
- `subscription_expires_at` (TIMESTAMPTZ, nullable) - já existe, verificar
- `subscription_status` (TEXT) - já existe, verificar valores: 'trial', 'active', 'suspended', 'cancelled'
- `subscription_plan` (TEXT) - já existe, verificar valores: 'basic', 'professional', 'enterprise'

### 1.3. Criar Triggers SQL
No Lovable: **Database → SQL Editor → New Query**

Copiar e executar o conteúdo completo de:
`supabase/migrations/20250120000000_subscription_limits_and_guards.sql`

---

## FASE 2: COMPONENTES REACT (JÁ CRIADOS - VERIFICAR)

### 2.1. Verificar se os arquivos existem:
- ✅ `src/hooks/useSubscriptionGuard.tsx`
- ✅ `src/hooks/useSubscriptionLimits.ts`
- ✅ `src/components/billing/SubscriptionBlocked.tsx`
- ✅ `src/components/billing/LimitAlert.tsx`

### 2.2. Verificar integração em:
- ✅ `src/components/auth/ProtectedRoute.tsx`
- ✅ `src/components/forms/AddProductDialog.tsx`
- ✅ `src/components/forms/AddSupplierDialog.tsx`
- ✅ `src/components/settings/CompanyUsersManager.tsx`

**Se algum arquivo não existir no Lovable:**
- Copiar o código do repositório local
- Criar o arquivo no Lovable via **Code → New File**

---

## FASE 3: LANDING PAGE PÚBLICA

### 3.1. Criar Rota `/` (Landing Page)
No Lovable: **Pages → New Page → `Landing.tsx`**

**Estrutura:**
```
/ (Landing Page)
├── Hero Section (CTA principal)
├── Features Section
├── Pricing Section (link para /pricing)
├── Testimonials Section
├── FAQ Section
└── Footer (Sign Up / Login)
```

### 3.2. Usar Componentes do Lovable:
- **Hero Card** (shadcn/ui)
- **Feature Cards** (shadcn/ui Card)
- **Pricing Cards** (shadcn/ui Card + Badge)
- **Testimonials** (shadcn/ui Card)
- **FAQ Accordion** (shadcn/ui Accordion)

### 3.3. Integração:
- Botão "Começar Grátis" → `/auth?mode=signup`
- Botão "Entrar" → `/auth?mode=login`
- Link "Ver Preços" → `/pricing`

---

## FASE 4: PÁGINA DE PREÇOS

### 4.1. Criar Rota `/pricing`
No Lovable: **Pages → New Page → `Pricing.tsx`**

### 4.2. Estrutura de Cards:
```tsx
<PricingCard 
  plan="basic"
  price={0} // ou R$ 99/mês
  features={[...]}
  cta="Começar Grátis"
/>
<PricingCard 
  plan="professional"
  price={299}
  features={[...]}
  cta="Assinar Agora"
  popular={true}
/>
<PricingCard 
  plan="enterprise"
  price="Custom"
  features={[...]}
  cta="Falar com Vendas"
/>
```

### 4.3. Integração com Stripe:
- Botão "Assinar" → Redireciona para checkout do Stripe
- Ou → Modal de checkout (Stripe Elements)

---

## FASE 5: INTEGRAÇÃO STRIPE

### 5.1. Configurar Stripe no Lovable:
1. **Settings → Environment Variables**
   - `STRIPE_SECRET_KEY` (servidor)
   - `STRIPE_PUBLISHABLE_KEY` (cliente)
   - `STRIPE_WEBHOOK_SECRET` (webhooks)

### 5.2. Criar Edge Function (Supabase):
No Lovable: **Database → Edge Functions → New Function**

**`create-checkout-session`**
```typescript
// Criar sessão de checkout do Stripe
// Retornar sessionId para redirecionar
```

**`handle-webhook`**
```typescript
// Processar eventos do Stripe:
// - checkout.session.completed → Ativar assinatura
// - invoice.payment_succeeded → Renovar assinatura
// - customer.subscription.deleted → Cancelar assinatura
```

### 5.3. Hook React para Stripe:
```tsx
// src/hooks/useStripe.ts
export function useStripeCheckout() {
  const createCheckoutSession = async (plan: string) => {
    // Chamar edge function
    // Redirecionar para Stripe Checkout
  };
}
```

---

## FASE 6: DASHBOARD DE BILLING

### 6.1. Criar Rota `/billing` ou `/configuracoes/billing`
No Lovable: **Pages → New Page ou Settings → Billing Tab**

### 6.2. Componentes:
- **Current Plan Card** (mostra plano atual)
- **Usage Stats** (usuários/produtos/fornecedores usados)
- **Upgrade Button** (se não for enterprise)
- **Payment Method** (Stripe Elements)
- **Billing History** (tabela de faturas)
- **Cancel Subscription** (modal de confirmação)

### 6.3. Integração:
- Usar `useSubscriptionLimits()` para mostrar uso atual
- Usar `useSubscriptionGuard()` para mostrar status
- Botão "Upgrade" → Redireciona para `/pricing`

---

## FASE 7: EMAIL MARKETING E ONBOARDING

### 7.1. Configurar Resend (Recomendado para Lovable):
No Lovable: **Settings → Integrations → Resend**

### 7.2. Templates de Email:
1. **Welcome Email** (após signup)
2. **Trial Ending** (3 dias antes)
3. **Trial Expired** (quando expira)
4. **Payment Failed** (quando falha pagamento)
5. **Subscription Activated** (quando paga)

### 7.3. Criar Edge Function:
**`send-email`**
```typescript
// Enviar emails via Resend
// Chamar após eventos importantes (signup, payment, etc)
```

---

## FASE 8: PROTEGER ROTAS E APLICAR LIMITES

### 8.1. Verificar `ProtectedRoute.tsx`:
- ✅ Já deve estar bloqueando acesso se `!subscriptionStatus.canAccess`

### 8.2. Verificar Componentes de Criação:
- ✅ `AddProductDialog` - já tem validação
- ✅ `AddSupplierDialog` - já tem validação
- ✅ `CompanyUsersManager` - já tem validação

### 8.3. Adicionar Validações em Outros Pontos:
- Importação em massa (se existir)
- Convites múltiplos (se existir)
- APIs públicas (se existir)

---

## FASE 9: TESTES E VALIDAÇÃO

### 9.1. Testar Limites:
- [ ] Criar empresa trial
- [ ] Tentar adicionar 6 usuários → Deve bloquear
- [ ] Tentar adicionar 101 produtos → Deve bloquear
- [ ] Tentar adicionar 51 fornecedores → Deve bloquear

### 9.2. Testar Bloqueio por Assinatura:
- [ ] Alterar `subscription_status` para `'suspended'`
- [ ] Tentar acessar sistema → Deve mostrar `SubscriptionBlocked`
- [ ] Alterar para `'trial'` com `trial_ends_at` no passado
- [ ] Tentar acessar → Deve mostrar tela de bloqueio

### 9.3. Testar Fluxo de Pagamento:
- [ ] Acessar `/pricing`
- [ ] Clicar em "Assinar" → Deve redirecionar para Stripe
- [ ] Completar pagamento teste → Deve ativar assinatura
- [ ] Verificar `subscription_status` mudou para `'active'`

---

## FASE 10: DEPLOY E GO-LIVE

### 10.1. Configurar Domínio:
- No Lovable: **Settings → Domain**
- Configurar domínio customizado (ex: `cotaja.com.br`)

### 10.2. Configurar Stripe Webhooks:
- No Stripe Dashboard: **Webhooks → Add endpoint**
- URL: `https://seu-projeto.supabase.co/functions/v1/handle-webhook`
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

### 10.3. Configurar Variáveis de Ambiente:
- No Lovable: **Settings → Environment Variables**
- Verificar todas as variáveis necessárias

### 10.4. Monitoramento:
- Configurar logs no Supabase
- Configurar alertas no Stripe
- Monitorar uso de recursos

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados:
- [ ] Tabela `plan_features` criada
- [ ] Campos adicionados em `companies`
- [ ] Triggers SQL aplicados
- [ ] Funções SQL criadas

### Frontend:
- [ ] Landing page criada (`/`)
- [ ] Página de preços criada (`/pricing`)
- [ ] Dashboard de billing criado (`/billing`)
- [ ] Componentes de validação integrados
- [ ] Rotas protegidas funcionando

### Pagamentos:
- [ ] Stripe configurado
- [ ] Edge Functions criadas
- [ ] Webhooks configurados
- [ ] Checkout funcionando

### Email:
- [ ] Resend configurado
- [ ] Templates criados
- [ ] Edge Functions de email criadas

### Testes:
- [ ] Limites testados
- [ ] Bloqueios testados
- [ ] Pagamentos testados
- [ ] Emails testados

---

## 🎯 PRIORIDADES SUGERIDAS

### PRIORIDADE 1 (Crítico):
1. ✅ Estrutura de dados (já feito)
2. ✅ Validações frontend (já feito)
3. 🚧 Aplicar migração SQL no Supabase
4. 🚧 Landing page básica

### PRIORIDADE 2 (Importante):
5. Página de preços
6. Integração Stripe básica
7. Dashboard de billing

### PRIORIDADE 3 (Nice to Have):
8. Email marketing
9. Analytics avançados
10. Funcionalidades premium

---

## 💡 DICAS PARA LOVABLE

1. **Usar Componentes Pré-construídos:**
   - Lovable tem muitos componentes prontos
   - Usar shadcn/ui via Lovable UI Library

2. **Edge Functions:**
   - Criar no Supabase Dashboard diretamente
   - Ou usar Lovable Database → Edge Functions

3. **Environment Variables:**
   - Sempre usar variáveis de ambiente
   - Não hardcodar secrets

4. **Testing:**
   - Usar Stripe Test Mode primeiro
   - Testar todas as validações antes de produção

5. **Documentação:**
   - Documentar cada etapa no Lovable
   - Usar comentários no código

---

## 📚 RECURSOS ÚTEIS

- **Lovable Docs:** https://docs.lovable.dev
- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Resend Docs:** https://resend.com/docs

---

## ✅ PRÓXIMA AÇÃO IMEDIATA

1. **Aplicar migração SQL no Supabase** (via Lovable Database → SQL Editor)
2. **Criar Landing Page** (`/`) no Lovable
3. **Testar validações** de limites

**Quer que eu detalhe alguma fase específica ou tem dúvidas sobre algum passo?**






