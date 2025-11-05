-- Função RPC alternativa para aplicar a correção do limite de produtos
-- Esta função pode ser chamada via código se as migrações não forem aplicadas automaticamente

CREATE OR REPLACE FUNCTION public.apply_product_limit_fix()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário é system admin
  IF NOT is_system_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas system admin pode executar esta função';
  END IF;

  -- Atualizar a função check_max_products
  -- Nota: Não podemos usar CREATE OR REPLACE dentro de uma função RPC
  -- Então vamos retornar o SQL para ser executado manualmente
  
  RETURN 'Esta função não pode modificar outras funções diretamente. Use a migração 20250121000001_fix_product_limit_for_owners.sql';
END;
$$;

-- Mas vamos criar a função correta diretamente aqui também
CREATE OR REPLACE FUNCTION public.check_max_products()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_plan_name TEXT;
  v_max_products INTEGER;
  v_current_products INTEGER;
  v_user_id UUID;
  v_is_owner BOOLEAN;
BEGIN
  -- Obter user_id atual
  v_user_id := auth.uid();
  
  -- Verificar se o usuário é owner (super admin ou system admin)
  -- Primeiro verifica pela função is_super_admin (owners em user_roles)
  SELECT is_super_admin(v_user_id) INTO v_is_owner;
  
  -- Se não for owner, verifica se é system admin (mgc.info.new@gmail.com)
  IF NOT v_is_owner THEN
    SELECT is_system_admin(v_user_id) INTO v_is_owner;
  END IF;
  
  -- Se não encontrou, verifica diretamente na tabela user_roles
  IF NOT v_is_owner THEN
    SELECT EXISTS (
      SELECT 1 
      FROM user_roles 
      WHERE user_id = v_user_id 
        AND role = 'owner'::app_role
    ) INTO v_is_owner;
  END IF;
  
  -- Se for owner ou system admin, permitir sem verificar limite
  IF v_is_owner THEN
    RETURN NEW;
  END IF;
  
  -- Obter company_id do novo registro
  v_company_id := NEW.company_id;
  
  -- Obter plano da empresa
  SELECT subscription_plan INTO v_plan_name
  FROM public.companies
  WHERE id = v_company_id;
  
  -- Se não encontrou plano, usar basic
  v_plan_name := COALESCE(v_plan_name, 'basic');
  
  -- Obter limite do plano
  SELECT max_products INTO v_max_products
  FROM public.get_plan_features(v_plan_name);
  
  -- Se ilimitado (-1), permitir
  IF v_max_products = -1 THEN
    RETURN NEW;
  END IF;
  
  -- Contar produtos atuais
  SELECT COUNT(*) INTO v_current_products
  FROM public.products
  WHERE company_id = v_company_id;
  
  -- Verificar se atingiu o limite
  IF v_current_products >= v_max_products THEN
    RAISE EXCEPTION 'Limite de produtos atingido (%/%). Faça upgrade do plano para adicionar mais produtos.', v_current_products, v_max_products;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Comentário atualizado
COMMENT ON FUNCTION public.check_max_products() IS 'Valida limite de produtos antes de inserir em products. Owners não têm limites.';

