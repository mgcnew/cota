-- =====================================================
-- Enforce server-side: bloquear mutações quando a assinatura
-- da empresa não está ativa (trial expirado, suspended, cancelled, expired).
-- Data: 2026-05-26
--
-- Antes: o gate vivia só no client (useSubscriptionGuard.tsx), bypassável
-- via DevTools usando a anon key. Agora o DB recusa INSERT/UPDATE/DELETE
-- nas tabelas de negócio se is_subscription_active() retorna false.
--
-- Leitura continua liberada (RLS por company_id já fazia o trabalho).
-- =====================================================

-- 1) Função do trigger ------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_active_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Determinar o company_id alvo (varia entre INSERT/UPDATE e DELETE)
  IF TG_OP = 'DELETE' THEN
    v_company_id := OLD.company_id;
  ELSE
    v_company_id := NEW.company_id;
  END IF;

  -- Empresas sem company_id (linhas órfãs / admin) não passam pelo gate
  IF v_company_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF NOT public.is_subscription_active(v_company_id) THEN
    RAISE EXCEPTION 'SUBSCRIPTION_INACTIVE: a assinatura da empresa não está ativa. Renove o plano para continuar.'
      USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- 2) Helper para anexar o trigger sem repetir DDL ---------------------
DO $$
DECLARE
  t TEXT;
  protected_tables CONSTANT TEXT[] := ARRAY[
    'products',
    'suppliers',
    'brands',
    'quotes',
    'orders',
    'shopping_list',
    'stock_sectors',
    'stock_counts',
    'stock_count_items',
    'activity_log'
  ];
BEGIN
  FOREACH t IN ARRAY protected_tables LOOP
    -- Só anexa se a tabela existir e tiver coluna company_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t
        AND column_name = 'company_id'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS enforce_active_subscription_trg ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER enforce_active_subscription_trg
           BEFORE INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.enforce_active_subscription()',
        t
      );
    END IF;
  END LOOP;
END $$;

-- 3) Tabelas opcionais (só adicionam trigger se existirem no DB)
-- packaging_* e notes podem não existir em todas as instâncias.
DO $$
DECLARE
  t TEXT;
  optional_tables CONSTANT TEXT[] := ARRAY[
    'notes',
    'packaging_quotes',
    'packaging_orders',
    'packaging_quote_items',
    'packaging_quote_suppliers',
    'packaging_supplier_items'
  ];
BEGIN
  FOREACH t IN ARRAY optional_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t
        AND column_name = 'company_id'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS enforce_active_subscription_trg ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER enforce_active_subscription_trg
           BEFORE INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.enforce_active_subscription()',
        t
      );
    END IF;
  END LOOP;
END $$;

COMMENT ON FUNCTION public.enforce_active_subscription IS
  'BEFORE trigger que bloqueia mutações quando is_subscription_active(company_id) é falso. Não afeta SELECT.';
