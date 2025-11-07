# 💳 GUIA COMPLETO: INTEGRAÇÃO STRIPE

## 📋 PRÉ-REQUISITOS

1. ✅ Conta Stripe criada: https://stripe.com
2. ✅ Conta Supabase (já tem)
3. ✅ Variáveis de ambiente configuráveis no Lovable

---

## FASE 1: CONFIGURAR STRIPE

### 1.1. Criar Conta Stripe

1. Acesse: https://stripe.com
2. Crie uma conta (use modo Test primeiro)
3. Complete o onboarding

### 1.2. Obter Chaves de API

1. No Dashboard Stripe: **Developers → API keys**
2. Copie:
   - **Publishable key** (começa com `pk_test_...`)
   - **Secret key** (começa com `sk_test_...`) - CLIQUE EM "REVEAL"

### 1.3. Configurar Variáveis de Ambiente no Lovable

No Lovable: **Settings → Environment Variables**

Adicione:
- `STRIPE_SECRET_KEY` = `sk_test_...` (do Stripe)
- `STRIPE_PUBLISHABLE_KEY` = `pk_test_...` (do Stripe)
- `STRIPE_WEBHOOK_SECRET` = (vamos criar depois)

---

## FASE 2: CRIAR EDGE FUNCTIONS NO SUPABASE

### 2.1. Instalar Deno CLI (Local) ou usar Supabase Dashboard

**Opção A: Via Supabase Dashboard (Mais Fácil)**
1. Acesse seu projeto Supabase
2. Vá em **Edge Functions**
3. Clique em **Create Function**

---

### 2.2. Edge Function 1: `create-checkout-session`

**Nome:** `create-checkout-session`

**Código completo:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlanPrice {
  plan: string;
  priceId: string; // ID do preço no Stripe
}

// Mapear planos para preços do Stripe
// VOCÊ PRECISA CRIAR ESTES PREÇOS NO STRIPE DASHBOARD PRIMEIRO
const PLAN_PRICES: Record<string, PlanPrice> = {
  basic: {
    plan: 'basic',
    priceId: 'price_xxxxx', // SUBSTITUA pelo ID real do Stripe
  },
  professional: {
    plan: 'professional',
    priceId: 'price_xxxxx', // SUBSTITUA pelo ID real do Stripe
  },
  enterprise: {
    plan: 'enterprise',
    priceId: 'price_xxxxx', // SUBSTITUA pelo ID real do Stripe
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Obter company_id do usuário
    const { data: companyUser } = await supabaseClient
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!companyUser) {
      throw new Error('Company not found');
    }

    // Obter dados do corpo da requisição
    const { plan } = await req.json();

    if (!plan || !PLAN_PRICES[plan]) {
      throw new Error('Invalid plan');
    }

    const planPrice = PLAN_PRICES[plan];

    // Criar sessão de checkout no Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'subscription',
        line_items: JSON.stringify([{
          price: planPrice.priceId,
          quantity: 1,
        }]),
        success_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/dashboard/configuracoes?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/pricing`,
        customer_email: user.email || '',
        metadata: JSON.stringify({
          company_id: companyUser.company_id,
          plan: plan,
          user_id: user.id,
        }),
      }),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      throw new Error(session.error?.message || 'Failed to create checkout session');
    }

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
```

---

### 2.3. Edge Function 2: `handle-webhook`

**Nome:** `handle-webhook`

**Código completo:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature');
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // Verificar assinatura do webhook
    const stripe = await import('https://esm.sh/stripe@13.6.0');
    const stripeClient = stripe.default(Deno.env.get('STRIPE_SECRET_KEY') || '');

    let event;
    try {
      event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret || '');
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata;

        if (metadata && metadata.company_id) {
          // Atualizar empresa com plano ativo
          await supabaseAdmin
            .from('companies')
            .update({
              subscription_status: 'active',
              subscription_plan: metadata.plan,
              subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
            })
            .eq('id', metadata.company_id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Buscar empresa pelo customer_id do Stripe
        // Você precisa salvar customer_id na tabela companies
        const { data: company } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (company) {
          await supabaseAdmin
            .from('companies')
            .update({
              subscription_status: 'active',
              subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', company.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: company } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (company) {
          await supabaseAdmin
            .from('companies')
            .update({
              subscription_status: 'cancelled',
            })
            .eq('id', company.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
```

---

## FASE 3: CRIAR PRODUTOS E PREÇOS NO STRIPE

### 3.1. Criar Produtos

No Stripe Dashboard: **Products → Add Product**

Crie 3 produtos:

1. **Basic Plan**
   - Name: `Basic Plan`
   - Description: `Plano básico do Cotaja`
   - Pricing: `Recurring` → R$ 0/mês (ou R$ 99 se quiser cobrar)

2. **Professional Plan**
   - Name: `Professional Plan`
   - Description: `Plano profissional do Cotaja`
   - Pricing: `Recurring` → R$ 299/mês

3. **Enterprise Plan**
   - Name: `Enterprise Plan`
   - Description: `Plano enterprise do Cotaja`
   - Pricing: `Recurring` → Contato (ou preço customizado)

### 3.2. Copiar Price IDs

Após criar cada produto:
1. Clique no produto
2. Copie o **Price ID** (começa com `price_...`)
3. Atualize no código da Edge Function `create-checkout-session`

---

## FASE 4: CONFIGURAR WEBHOOKS NO STRIPE

### 4.1. Criar Webhook Endpoint

1. No Stripe Dashboard: **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://seu-projeto.supabase.co/functions/v1/handle-webhook`
3. Events to send:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
4. Copie o **Signing secret** (começa com `whsec_...`)
5. Adicione como `STRIPE_WEBHOOK_SECRET` no Lovable

---

## FASE 5: ATUALIZAR TABELA COMPANIES

### 5.1. Adicionar Campo `stripe_customer_id`

No SQL Editor do Supabase:

```sql
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
```

---

## FASE 6: CRIAR HOOK REACT PARA STRIPE

### 6.1. Criar `src/hooks/useStripe.ts`

```typescript
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useStripeCheckout() {
  const { toast } = useToast();

  const createCheckoutSession = useMutation({
    mutationFn: async (plan: string) => {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { plan },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Redirecionar para Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar checkout",
        description: error.message || "Não foi possível iniciar o pagamento.",
        variant: "destructive",
      });
    },
  });

  return {
    createCheckoutSession: createCheckoutSession.mutate,
    isLoading: createCheckoutSession.isPending,
  };
}
```

---

## FASE 7: ATUALIZAR PÁGINA DE PREÇOS

### 7.1. Adicionar Integração Stripe

No arquivo `src/pages/Pricing.tsx`, adicione:

```typescript
import { useStripeCheckout } from "@/hooks/useStripe";

// Dentro do componente:
const { createCheckoutSession, isLoading } = useStripeCheckout();

// No botão "Assinar Agora":
<Button
  onClick={() => createCheckoutSession('professional')}
  disabled={isLoading}
  className="w-full gradient-primary"
>
  {isLoading ? 'Processando...' : 'Assinar Agora'}
  <ArrowRight className="ml-2 h-4 w-4" />
</Button>
```

---

## ✅ CHECKLIST FINAL

- [ ] Conta Stripe criada
- [ ] Variáveis de ambiente configuradas
- [ ] Edge Functions criadas
- [ ] Produtos criados no Stripe
- [ ] Price IDs atualizados no código
- [ ] Webhook configurado
- [ ] Campo `stripe_customer_id` adicionado
- [ ] Hook `useStripe.ts` criado
- [ ] Página de Preços atualizada
- [ ] Testado em modo sandbox

---

## 🧪 TESTAR

1. Acesse `/pricing`
2. Clique em "Assinar Agora"
3. Deve redirecionar para Stripe Checkout
4. Use cartão de teste: `4242 4242 4242 4242`
5. Complete o pagamento
6. Deve redirecionar de volta e ativar assinatura

---

**Pronto! Agora você pode receber pagamentos!** 🎉





