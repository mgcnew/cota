-- =====================================================
-- Extend handle_new_user trigger to also auto-create a company
-- when the user signs up directly (not via invitation).
-- Data: 2026-05-26
--
-- Antes: a empresa era criada pelo hook client-side `useCompanySetup`,
-- que tinha race condition (StrictMode/dupla execução) e dependia das
-- RLS aceitarem o insert do próprio usuário em companies/company_users/
-- user_roles. Agora roda no servidor como SECURITY DEFINER e é atômico.
--
-- Convidados (AcceptInvite) chegam com raw_user_meta_data.invited=true
-- e são ignorados aqui — a aceitação do convite os adiciona à empresa.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_invited BOOLEAN;
  v_company_id UUID;
  v_trial_end TIMESTAMPTZ;
BEGIN
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
  v_invited := COALESCE((new.raw_user_meta_data->>'invited')::boolean, FALSE);

  -- 1) Profile (mantém comportamento original)
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    v_full_name,
    new.raw_user_meta_data->>'avatar_url'
  );

  -- 2) Auto-setup de empresa (apenas para signup direto, não convidados)
  IF NOT v_invited THEN
    -- Defesa extra: se de algum modo o usuário já tem empresa, não duplica.
    IF NOT EXISTS (SELECT 1 FROM public.company_users WHERE user_id = new.id) THEN
      v_trial_end := NOW() + INTERVAL '14 days';

      INSERT INTO public.companies (
        name,
        subscription_status,
        subscription_plan,
        max_users,
        trial_ends_at,
        subscription_expires_at
      ) VALUES (
        'Empresa de ' || v_full_name,
        'trial',
        'basic',
        5,
        v_trial_end,
        v_trial_end
      )
      RETURNING id INTO v_company_id;

      INSERT INTO public.company_users (company_id, user_id, invited_by)
      VALUES (v_company_id, new.id, new.id);

      INSERT INTO public.user_roles (user_id, company_id, role)
      VALUES (new.id, v_company_id, 'owner'::app_role);
    END IF;
  END IF;

  RETURN new;
END;
$$;

-- O trigger on_auth_user_created já existe (criado em 20251103112051).
-- Como usamos CREATE OR REPLACE FUNCTION ele passa a usar esta nova versão
-- automaticamente; nada mais a fazer.
