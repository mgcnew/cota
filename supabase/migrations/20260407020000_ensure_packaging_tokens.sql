-- Migration: Garantir tokens únicos para todos os fornecedores de embalagens
-- Objetivo: Corrigir o erro "Acesso Indisponível" causado por tokens nulos ou fallbacks incorretos.

-- 1. Preencher tokens nulos com UUIDs aleatórios
UPDATE packaging_quote_suppliers 
SET access_token = gen_random_uuid() 
WHERE access_token IS NULL;

-- 2. Garantir que a coluna não aceite nulos e tenha o default correto
ALTER TABLE packaging_quote_suppliers 
ALTER COLUMN access_token SET DEFAULT gen_random_uuid(),
ALTER COLUMN access_token SET NOT NULL;

-- 3. Garantir unicidade (opcional mas recomendado para tokens de acesso)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'packaging_quote_suppliers_access_token_key') THEN
        ALTER TABLE packaging_quote_suppliers ADD CONSTRAINT packaging_quote_suppliers_access_token_key UNIQUE (access_token);
    END IF;
END $$;
