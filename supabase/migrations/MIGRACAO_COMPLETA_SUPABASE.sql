-- =====================================================
-- MIGRAÇÃO COMPLETA DO SISTEMA COTAJÁ
-- Para Supabase Próprio
-- Data: 2026-01-14
-- =====================================================
-- INSTRUÇÕES:
-- 1. Crie um novo projeto no Supabase (https://supabase.com)
-- 2. Vá em SQL Editor
-- 3. Execute este script COMPLETO
-- 4. Depois importe os CSVs de cada tabela
-- =====================================================

-- =====================================================
-- PARTE 1: EXTENSÕES E CONFIGURAÇÕES INICIAIS
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PARTE 2: ENUM TYPES
-- =====================================================

-- Tipo de role do usuário
CREATE TYPE app_role AS ENUM ('owner', 'admin', 'member', 'system_admin');

-- =====================================================
-- PARTE 3: FUNÇÕES AUXILIARES (ANTES DAS TABELAS)
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 4: TABELAS (ORDEM DE DEPENDÊNCIA)
-- =====================================================

-- 4.1 PROFILES (depende de auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4.2 CORPORATE_GROUPS (sem dependências)
CREATE TABLE IF NOT EXISTS corporate_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    discount_percentage NUMERIC DEFAULT 0,
    max_companies INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE corporate_groups ENABLE ROW LEVEL SECURITY;

-- 4.3 COMPANIES (depende de corporate_groups)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    corporate_group_id UUID REFERENCES corporate_groups(id),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
    subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
    subscription_expires_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    max_users INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.4 COMPANY_USERS (depende de companies)
CREATE TABLE IF NOT EXISTS company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    invited_by UUID,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_user ON company_users(user_id);

-- 4.5 USER_ROLES (depende de companies)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 4.6 COMPANY_INVITATIONS (depende de companies)
CREATE TABLE IF NOT EXISTS company_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role app_role DEFAULT 'member',
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- 4.7 PLAN_FEATURES (sem dependências)
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

-- Inserir features padrão
INSERT INTO plan_features (plan_name, max_users, max_products, max_suppliers, max_quotes_per_month, api_access, advanced_analytics, priority_support) 
VALUES
    ('basic', 5, 100, 50, 100, FALSE, FALSE, FALSE),
    ('professional', 15, 500, 200, 1000, TRUE, TRUE, FALSE),
    ('enterprise', 100, -1, -1, -1, TRUE, TRUE, TRUE)
ON CONFLICT (plan_name) DO NOTHING;

-- 4.8 SUPPLIERS (depende de companies)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    contact TEXT,
    address TEXT,
    rating NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_suppliers_company ON suppliers(company_id);

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.9 PRODUCTS (depende de companies)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT DEFAULT 'un',
    weight TEXT,
    barcode TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_products_company ON products(company_id);

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.10 QUOTES (depende de companies)
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    data_planejada DATE,
    status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'finalizada', 'cancelada')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_quotes_company ON quotes(company_id);

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.11 QUOTE_ITEMS (depende de quotes, products)
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantidade TEXT NOT NULL,
    unidade TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);

-- 4.12 QUOTE_SUPPLIERS (depende de quotes, suppliers)
CREATE TABLE IF NOT EXISTS quote_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'respondido', 'sem_resposta')),
    valor_oferecido NUMERIC,
    data_resposta TIMESTAMPTZ,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quote_suppliers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_quote_suppliers_quote ON quote_suppliers(quote_id);

CREATE TRIGGER update_quote_suppliers_updated_at
    BEFORE UPDATE ON quote_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.13 QUOTE_SUPPLIER_ITEMS (depende de quotes, suppliers, products)
CREATE TABLE IF NOT EXISTS quote_supplier_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    valor_oferecido NUMERIC,
    unidade_preco TEXT,
    quantidade_por_embalagem NUMERIC,
    fator_conversao NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quote_supplier_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_quote_supplier_items_quote ON quote_supplier_items(quote_id);

CREATE TRIGGER update_quote_supplier_items_updated_at
    BEFORE UPDATE ON quote_supplier_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.14 ORDERS (depende de companies, suppliers, quotes)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name TEXT NOT NULL,
    quote_id UUID REFERENCES quotes(id),
    order_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'entregue', 'cancelado', 'pago')),
    total_value NUMERIC DEFAULT 0,
    economia_estimada NUMERIC DEFAULT 0,
    economia_real NUMERIC DEFAULT 0,
    diferenca_preco_kg NUMERIC DEFAULT 0,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_orders_company ON orders(company_id);
CREATE INDEX idx_orders_quote_id ON orders(quote_id);

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.15 ORDER_ITEMS (depende de orders, products)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT DEFAULT 'un',
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    quantidade_pedida NUMERIC,
    unidade_pedida TEXT,
    quantidade_entregue NUMERIC,
    unidade_entregue TEXT,
    valor_unitario_cotado NUMERIC,
    maior_valor_cotado NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- 4.16 PACKAGING_ITEMS (depende de companies)
CREATE TABLE IF NOT EXISTS packaging_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    reference_unit TEXT DEFAULT 'un',
    package_quantity NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE packaging_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_packaging_items_company ON packaging_items(company_id);

-- 4.17 PACKAGING_QUOTES (depende de companies)
CREATE TABLE IF NOT EXISTS packaging_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status TEXT DEFAULT 'aberta',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE packaging_quotes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_packaging_quotes_company ON packaging_quotes(company_id);

-- 4.18 PACKAGING_QUOTE_ITEMS (depende de packaging_quotes, packaging_items)
CREATE TABLE IF NOT EXISTS packaging_quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES packaging_quotes(id) ON DELETE CASCADE,
    packaging_id UUID NOT NULL REFERENCES packaging_items(id) ON DELETE CASCADE,
    packaging_name TEXT NOT NULL,
    quantidade_necessaria NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE packaging_quote_items ENABLE ROW LEVEL SECURITY;

-- 4.19 PACKAGING_QUOTE_SUPPLIERS (depende de packaging_quotes, suppliers)
CREATE TABLE IF NOT EXISTS packaging_quote_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES packaging_quotes(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    data_resposta TIMESTAMPTZ,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE packaging_quote_suppliers ENABLE ROW LEVEL SECURITY;

-- 4.20 PACKAGING_SUPPLIER_ITEMS (depende de packaging_quotes, suppliers, packaging_items)
CREATE TABLE IF NOT EXISTS packaging_supplier_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES packaging_quotes(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    packaging_id UUID NOT NULL REFERENCES packaging_items(id) ON DELETE CASCADE,
    packaging_name TEXT NOT NULL,
    quantidade_venda NUMERIC,
    unidade_venda TEXT,
    valor_total NUMERIC,
    custo_por_unidade NUMERIC,
    quantidade_unidades_estimada NUMERIC,
    gramatura NUMERIC,
    dimensoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE packaging_supplier_items ENABLE ROW LEVEL SECURITY;

-- 4.21 PACKAGING_ORDERS (depende de companies, suppliers, packaging_quotes)
CREATE TABLE IF NOT EXISTS packaging_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    supplier_name TEXT NOT NULL,
    quote_id UUID REFERENCES packaging_quotes(id),
    order_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    status TEXT DEFAULT 'pendente',
    total_value NUMERIC,
    economia_estimada NUMERIC DEFAULT 0,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE packaging_orders ENABLE ROW LEVEL SECURITY;

-- 4.22 PACKAGING_ORDER_ITEMS (depende de packaging_orders, packaging_items)
CREATE TABLE IF NOT EXISTS packaging_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES packaging_orders(id) ON DELETE CASCADE,
    packaging_id UUID NOT NULL REFERENCES packaging_items(id),
    packaging_name TEXT NOT NULL,
    quantidade NUMERIC NOT NULL,
    quantidade_por_unidade NUMERIC,
    unidade_compra TEXT,
    valor_unitario NUMERIC,
    valor_total NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE packaging_order_items ENABLE ROW LEVEL SECURITY;

-- 4.23 ACTIVITY_LOG (depende de companies)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    acao TEXT NOT NULL,
    detalhes TEXT NOT NULL,
    valor NUMERIC,
    economia NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_activity_log_company ON activity_log(company_id);

-- 4.24 NOTES (depende de companies)
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    importance TEXT DEFAULT 'normal',
    observation TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 4.25 SHOPPING_LIST (depende de companies, products)
CREATE TABLE IF NOT EXISTS shopping_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit TEXT DEFAULT 'un',
    category TEXT,
    priority TEXT DEFAULT 'normal',
    estimated_price NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- 4.26 STOCK_SECTORS (depende de companies)
CREATE TABLE IF NOT EXISTS stock_sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_sectors ENABLE ROW LEVEL SECURITY;

-- 4.27 STOCK_COUNTS (depende de companies, orders)
CREATE TABLE IF NOT EXISTS stock_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    order_id UUID REFERENCES orders(id),
    count_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizada', 'cancelada')),
    notes TEXT,
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;

-- 4.28 STOCK_COUNT_ITEMS (depende de stock_counts, stock_sectors, products, order_items)
CREATE TABLE IF NOT EXISTS stock_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
    sector_id UUID NOT NULL REFERENCES stock_sectors(id),
    product_id UUID REFERENCES products(id),
    order_item_id UUID REFERENCES order_items(id),
    product_name TEXT NOT NULL,
    quantity_existing NUMERIC,
    quantity_ordered NUMERIC,
    quantity_counted NUMERIC,
    notes TEXT,
    photo_url TEXT
);

ALTER TABLE stock_count_items ENABLE ROW LEVEL SECURITY;

-- 4.29 WHATSAPP_CONFIG (depende de companies)
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    instance_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- 4.30 WHATSAPP_TEMPLATES (depende de companies)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_text TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- 4.31 WHATSAPP_MESSAGES (depende de companies, suppliers, quotes, packaging_quotes)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    quote_id UUID REFERENCES quotes(id),
    packaging_quote_id UUID REFERENCES packaging_quotes(id),
    phone_number TEXT NOT NULL,
    message_text TEXT NOT NULL,
    message_id TEXT,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- 4.32 WHATSAPP_RESPONSES (depende de companies, suppliers, quotes, packaging_quotes, whatsapp_messages)
CREATE TABLE IF NOT EXISTS whatsapp_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    quote_id UUID REFERENCES quotes(id),
    packaging_quote_id UUID REFERENCES packaging_quotes(id),
    whatsapp_message_id UUID REFERENCES whatsapp_messages(id),
    phone_number TEXT NOT NULL,
    response_text TEXT NOT NULL,
    parsed_data JSONB,
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_responses ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- PARTE 5: FUNÇÕES AUXILIARES (SECURITY DEFINER)
-- =====================================================

-- 5.1 Função para obter company_id do usuário
CREATE OR REPLACE FUNCTION get_user_company_id(p_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT company_id 
    FROM company_users 
    WHERE user_id = p_user_id 
    LIMIT 1;
$$;

-- 5.2 Função para verificar se usuário tem determinada role
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_id = _user_id 
        AND role = _role
    );
$$;

-- 5.3 Função para obter role do usuário
CREATE OR REPLACE FUNCTION get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role 
    FROM user_roles 
    WHERE user_id = _user_id 
    LIMIT 1;
$$;

-- 5.4 Função para verificar se é system admin
-- IMPORTANTE: Altere o email para o seu email de admin
CREATE OR REPLACE FUNCTION is_system_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = p_user_id 
        AND email = 'mgc.info.new@gmail.com'  -- ALTERE PARA SEU EMAIL
    );
$$;

-- 5.5 Função helper para verificar se usuário atual é system admin
CREATE OR REPLACE FUNCTION is_current_user_system_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT is_system_admin(auth.uid());
$$;

-- 5.6 Função para verificar se é super admin
CREATE OR REPLACE FUNCTION is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_id = _user_id 
        AND role = 'system_admin'
    );
$$;

-- 5.7 Função para verificar se assinatura está ativa
CREATE OR REPLACE FUNCTION is_subscription_active(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        CASE 
            WHEN subscription_status = 'suspended' THEN FALSE
            WHEN subscription_status = 'cancelled' THEN FALSE
            WHEN subscription_status = 'trial' AND subscription_expires_at < NOW() THEN FALSE
            WHEN subscription_status = 'trial' AND trial_ends_at < NOW() THEN FALSE
            WHEN subscription_status = 'active' AND subscription_expires_at IS NOT NULL 
                 AND subscription_expires_at < NOW() THEN FALSE
            ELSE TRUE
        END
    FROM companies
    WHERE id = p_company_id;
$$;

-- 5.8 Função para obter corporate_group_id do usuário
CREATE OR REPLACE FUNCTION get_user_corporate_group_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT c.corporate_group_id
    FROM companies c
    JOIN company_users cu ON cu.company_id = c.id
    WHERE cu.user_id = _user_id
    LIMIT 1;
$$;

-- 5.9 Função para calcular desconto do grupo
CREATE OR REPLACE FUNCTION calculate_group_discount(_corporate_group_id UUID)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(discount_percentage, 0)
    FROM corporate_groups
    WHERE id = _corporate_group_id;
$$;

-- 5.10 Função para obter features do plano
CREATE OR REPLACE FUNCTION get_plan_features(p_plan_name TEXT)
RETURNS TABLE (
    max_users INTEGER,
    max_products INTEGER,
    max_suppliers INTEGER,
    max_quotes_per_month INTEGER,
    api_access BOOLEAN,
    advanced_analytics BOOLEAN,
    priority_support BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        COALESCE(max_users, 5),
        COALESCE(max_products, 100),
        COALESCE(max_suppliers, 50),
        COALESCE(max_quotes_per_month, 100),
        COALESCE(api_access, FALSE),
        COALESCE(advanced_analytics, FALSE),
        COALESCE(priority_support, FALSE)
    FROM plan_features
    WHERE plan_name = p_plan_name;
$$;

-- 5.11 Função para obter todas as empresas (system admin)
CREATE OR REPLACE FUNCTION get_all_companies_for_admin()
RETURNS TABLE (
    id UUID,
    name TEXT,
    cnpj TEXT,
    subscription_status TEXT,
    subscription_plan TEXT,
    subscription_expires_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    users_count BIGINT,
    products_count BIGINT,
    suppliers_count BIGINT,
    corporate_group_id UUID
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        c.id,
        c.name,
        c.cnpj,
        c.subscription_status,
        c.subscription_plan,
        c.subscription_expires_at,
        c.trial_ends_at,
        c.created_at,
        c.updated_at,
        (SELECT COUNT(*) FROM company_users WHERE company_id = c.id) as users_count,
        (SELECT COUNT(*) FROM products WHERE company_id = c.id) as products_count,
        (SELECT COUNT(*) FROM suppliers WHERE company_id = c.id) as suppliers_count,
        c.corporate_group_id
    FROM companies c
    ORDER BY c.created_at DESC;
$$;

-- 5.12 Função para obter estatísticas do sistema
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE (
    total_companies BIGINT,
    active_companies BIGINT,
    trial_companies BIGINT,
    suspended_companies BIGINT,
    cancelled_companies BIGINT,
    basic_plan_count BIGINT,
    professional_plan_count BIGINT,
    enterprise_plan_count BIGINT,
    total_users BIGINT,
    total_products BIGINT,
    total_suppliers BIGINT,
    total_quotes BIGINT,
    total_orders BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        (SELECT COUNT(*) FROM companies) as total_companies,
        (SELECT COUNT(*) FROM companies WHERE subscription_status = 'active') as active_companies,
        (SELECT COUNT(*) FROM companies WHERE subscription_status = 'trial') as trial_companies,
        (SELECT COUNT(*) FROM companies WHERE subscription_status = 'suspended') as suspended_companies,
        (SELECT COUNT(*) FROM companies WHERE subscription_status = 'cancelled') as cancelled_companies,
        (SELECT COUNT(*) FROM companies WHERE subscription_plan = 'basic') as basic_plan_count,
        (SELECT COUNT(*) FROM companies WHERE subscription_plan = 'professional') as professional_plan_count,
        (SELECT COUNT(*) FROM companies WHERE subscription_plan = 'enterprise') as enterprise_plan_count,
        (SELECT COUNT(DISTINCT user_id) FROM company_users) as total_users,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM suppliers) as total_suppliers,
        (SELECT COUNT(*) FROM quotes) as total_quotes,
        (SELECT COUNT(*) FROM orders) as total_orders;
$$;

-- 5.13 Função para atualizar plano da empresa (system admin)
CREATE OR REPLACE FUNCTION update_company_plan(
    p_company_id UUID,
    p_new_plan TEXT,
    p_new_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_system_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Apenas system admin pode atualizar planos de empresas';
    END IF;

    IF p_new_plan NOT IN ('basic', 'professional', 'enterprise') THEN
        RAISE EXCEPTION 'Plano inválido. Use: basic, professional ou enterprise';
    END IF;

    UPDATE companies
    SET 
        subscription_plan = p_new_plan,
        subscription_status = COALESCE(p_new_status, subscription_status),
        updated_at = NOW()
    WHERE id = p_company_id;

    RETURN FOUND;
END;
$$;

-- 5.14 Função para atualizar status de assinatura (system admin)
CREATE OR REPLACE FUNCTION update_company_subscription_status(
    p_company_id UUID,
    p_new_status TEXT,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_system_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Apenas system admin pode atualizar status de assinatura';
    END IF;

    IF p_new_status NOT IN ('trial', 'active', 'suspended', 'cancelled') THEN
        RAISE EXCEPTION 'Status inválido. Use: trial, active, suspended ou cancelled';
    END IF;

    UPDATE companies
    SET 
        subscription_status = p_new_status,
        subscription_expires_at = COALESCE(p_expires_at, subscription_expires_at),
        updated_at = NOW()
    WHERE id = p_company_id;

    RETURN FOUND;
END;
$$;

-- 5.15 Função para obter resumo de contagem de estoque por setor
CREATE OR REPLACE FUNCTION get_stock_count_sector_summary(p_stock_count_id UUID)
RETURNS TABLE (
    sector_id UUID,
    sector_name TEXT,
    total_items BIGINT,
    total_existing NUMERIC,
    total_ordered NUMERIC,
    total_counted NUMERIC,
    discrepancies BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        ss.id as sector_id,
        ss.name as sector_name,
        COUNT(sci.id) as total_items,
        COALESCE(SUM(sci.quantity_existing), 0) as total_existing,
        COALESCE(SUM(sci.quantity_ordered), 0) as total_ordered,
        COALESCE(SUM(sci.quantity_counted), 0) as total_counted,
        COUNT(CASE WHEN sci.quantity_counted != sci.quantity_ordered THEN 1 END) as discrepancies
    FROM stock_sectors ss
    LEFT JOIN stock_count_items sci ON sci.sector_id = ss.id AND sci.stock_count_id = p_stock_count_id
    WHERE ss.company_id = (SELECT company_id FROM stock_counts WHERE id = p_stock_count_id)
    GROUP BY ss.id, ss.name
    ORDER BY ss.name;
$$;

-- 5.16 Função user_has_role (alias para has_role)
CREATE OR REPLACE FUNCTION user_has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT has_role(_role, _user_id);
$$;


-- =====================================================
-- PARTE 6: TRIGGERS DE VALIDAÇÃO DE LIMITES
-- =====================================================

-- 6.1 Trigger para validar limite de usuários
CREATE OR REPLACE FUNCTION check_max_users()
RETURNS TRIGGER AS $$
DECLARE
    v_max_users INTEGER;
    v_current_users INTEGER;
    v_plan_name TEXT;
BEGIN
    SELECT c.subscription_plan, pf.max_users INTO v_plan_name, v_max_users
    FROM companies c
    JOIN plan_features pf ON c.subscription_plan = pf.plan_name
    WHERE c.id = NEW.company_id;
    
    IF v_max_users IS NULL THEN
        v_max_users := 5;
    END IF;
    
    SELECT COUNT(*) INTO v_current_users
    FROM company_users
    WHERE company_id = NEW.company_id;
    
    IF v_current_users >= v_max_users THEN
        RAISE EXCEPTION 'Limite de usuários atingido (%/%). Faça upgrade do plano.', 
            v_current_users, v_max_users;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_max_users ON company_users;
CREATE TRIGGER enforce_max_users
    BEFORE INSERT ON company_users
    FOR EACH ROW
    EXECUTE FUNCTION check_max_users();

-- 6.2 Trigger para validar limite de produtos
CREATE OR REPLACE FUNCTION check_max_products()
RETURNS TRIGGER AS $$
DECLARE
    v_max_products INTEGER;
    v_current_products INTEGER;
    v_plan_name TEXT;
BEGIN
    SELECT c.subscription_plan, pf.max_products INTO v_plan_name, v_max_products
    FROM companies c
    JOIN plan_features pf ON c.subscription_plan = pf.plan_name
    WHERE c.id = NEW.company_id;
    
    IF v_max_products IS NULL THEN
        v_max_products := 100;
    END IF;
    
    IF v_max_products = -1 THEN
        RETURN NEW;
    END IF;
    
    SELECT COUNT(*) INTO v_current_products
    FROM products
    WHERE company_id = NEW.company_id;
    
    IF v_current_products >= v_max_products THEN
        RAISE EXCEPTION 'Limite de produtos atingido (%/%). Faça upgrade do plano.', 
            v_current_products, v_max_products;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_max_products ON products;
CREATE TRIGGER enforce_max_products
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_max_products();

-- 6.3 Trigger para validar limite de fornecedores
CREATE OR REPLACE FUNCTION check_max_suppliers()
RETURNS TRIGGER AS $$
DECLARE
    v_max_suppliers INTEGER;
    v_current_suppliers INTEGER;
    v_plan_name TEXT;
BEGIN
    SELECT c.subscription_plan, pf.max_suppliers INTO v_plan_name, v_max_suppliers
    FROM companies c
    JOIN plan_features pf ON c.subscription_plan = pf.plan_name
    WHERE c.id = NEW.company_id;
    
    IF v_max_suppliers IS NULL THEN
        v_max_suppliers := 50;
    END IF;
    
    IF v_max_suppliers = -1 THEN
        RETURN NEW;
    END IF;
    
    SELECT COUNT(*) INTO v_current_suppliers
    FROM suppliers
    WHERE company_id = NEW.company_id;
    
    IF v_current_suppliers >= v_max_suppliers THEN
        RAISE EXCEPTION 'Limite de fornecedores atingido (%/%). Faça upgrade do plano.', 
            v_current_suppliers, v_max_suppliers;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_max_suppliers ON suppliers;
CREATE TRIGGER enforce_max_suppliers
    BEFORE INSERT ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION check_max_suppliers();

-- 6.4 Trigger para calcular economia real automaticamente
CREATE OR REPLACE FUNCTION calcular_economia_real()
RETURNS TRIGGER AS $$
DECLARE
    v_economia_real NUMERIC := 0;
    v_item RECORD;
BEGIN
    IF NEW.quote_id IS NOT NULL AND NEW.status = 'entregue' THEN
        FOR v_item IN 
            SELECT 
                quantidade_entregue,
                valor_unitario_cotado,
                maior_valor_cotado
            FROM order_items 
            WHERE order_id = NEW.id 
            AND quantidade_entregue IS NOT NULL
            AND quantidade_entregue > 0
            AND maior_valor_cotado IS NOT NULL
            AND valor_unitario_cotado IS NOT NULL
        LOOP
            v_economia_real := v_economia_real + 
                ((v_item.maior_valor_cotado - v_item.valor_unitario_cotado) * v_item.quantidade_entregue);
        END LOOP;
        
        NEW.economia_real := v_economia_real;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_economia_real ON orders;
CREATE TRIGGER trigger_calcular_economia_real
    BEFORE UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'entregue')
    EXECUTE FUNCTION calcular_economia_real();

-- =====================================================
-- PARTE 7: POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- 7.1 PROFILES
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 7.2 COMPANIES
CREATE POLICY "Users can view their company"
ON companies FOR SELECT
TO authenticated
USING (id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));

CREATE POLICY "Owners can update their company"
ON companies FOR UPDATE
TO authenticated
USING (
    id IN (
        SELECT company_id 
        FROM company_users cu
        JOIN user_roles ur ON ur.user_id = cu.user_id AND ur.company_id = cu.company_id
        WHERE cu.user_id = auth.uid() AND ur.role = 'owner'
    )
);

CREATE POLICY "System admin can view all companies"
ON companies FOR SELECT
TO authenticated
USING (is_system_admin(auth.uid()));

CREATE POLICY "System admin can update all companies"
ON companies FOR UPDATE
TO authenticated
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- 7.3 COMPANY_USERS
CREATE POLICY "Users can view company members"
ON company_users FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Owners and admins can add members"
ON company_users FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT cu.company_id 
        FROM company_users cu
        JOIN user_roles ur ON ur.user_id = cu.user_id AND ur.company_id = cu.company_id
        WHERE cu.user_id = auth.uid() 
        AND ur.role IN ('owner', 'admin')
    )
);

CREATE POLICY "Owners and admins can update members"
ON company_users FOR UPDATE
TO authenticated
USING (
    company_id IN (
        SELECT cu.company_id 
        FROM company_users cu
        JOIN user_roles ur ON ur.user_id = cu.user_id AND ur.company_id = cu.company_id
        WHERE cu.user_id = auth.uid() 
        AND ur.role IN ('owner', 'admin')
    )
);

CREATE POLICY "Owners and admins can remove members"
ON company_users FOR DELETE
TO authenticated
USING (
    company_id IN (
        SELECT cu.company_id 
        FROM company_users cu
        JOIN user_roles ur ON ur.user_id = cu.user_id AND ur.company_id = cu.company_id
        WHERE cu.user_id = auth.uid() 
        AND ur.role IN ('owner', 'admin')
    )
    AND user_id != auth.uid()
);

-- 7.4 USER_ROLES
CREATE POLICY "Users can view company roles"
ON user_roles FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Owners can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (
    company_id IN (
        SELECT cu.company_id 
        FROM company_users cu
        JOIN user_roles ur ON ur.user_id = cu.user_id AND ur.company_id = cu.company_id
        WHERE cu.user_id = auth.uid() 
        AND ur.role = 'owner'
    )
);

-- 7.5 PRODUCTS
CREATE POLICY "Users can view company products"
ON products FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company products"
ON products FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company products"
ON products FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company products"
ON products FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.6 SUPPLIERS
CREATE POLICY "Users can view company suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company suppliers"
ON suppliers FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company suppliers"
ON suppliers FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company suppliers"
ON suppliers FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.7 QUOTES
CREATE POLICY "Users can view company quotes"
ON quotes FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company quotes"
ON quotes FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company quotes"
ON quotes FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company quotes"
ON quotes FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.8 QUOTE_ITEMS
CREATE POLICY "Users can view company quote items"
ON quote_items FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_items.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company quote items"
ON quote_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_items.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company quote items"
ON quote_items FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_items.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company quote items"
ON quote_items FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_items.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

-- 7.9 QUOTE_SUPPLIERS
CREATE POLICY "Users can view company quote suppliers"
ON quote_suppliers FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_suppliers.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company quote suppliers"
ON quote_suppliers FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_suppliers.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company quote suppliers"
ON quote_suppliers FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_suppliers.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company quote suppliers"
ON quote_suppliers FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_suppliers.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

-- 7.10 QUOTE_SUPPLIER_ITEMS
CREATE POLICY "Users can view company quote supplier items"
ON quote_supplier_items FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_supplier_items.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company quote supplier items"
ON quote_supplier_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_supplier_items.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company quote supplier items"
ON quote_supplier_items FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_supplier_items.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company quote supplier items"
ON quote_supplier_items FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_supplier_items.quote_id 
    AND quotes.company_id = get_user_company_id(auth.uid())
));

-- 7.11 ORDERS
CREATE POLICY "Users can view company orders"
ON orders FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company orders"
ON orders FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company orders"
ON orders FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.12 ORDER_ITEMS
CREATE POLICY "Users can view company order items"
ON order_items FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company order items"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company order items"
ON order_items FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company order items"
ON order_items FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.company_id = get_user_company_id(auth.uid())
));

-- 7.13 ACTIVITY_LOG
CREATE POLICY "Users can view company activity log"
ON activity_log FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id 
        FROM company_users 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create company activity log"
ON activity_log FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT company_id 
        FROM company_users 
        WHERE user_id = auth.uid()
    )
);


-- 7.14 NOTES
CREATE POLICY "Users can view company notes"
ON notes FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company notes"
ON notes FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company notes"
ON notes FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company notes"
ON notes FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.15 SHOPPING_LIST
CREATE POLICY "Users can view company shopping list"
ON shopping_list FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company shopping list"
ON shopping_list FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company shopping list"
ON shopping_list FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company shopping list"
ON shopping_list FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.16 PACKAGING_ITEMS
CREATE POLICY "Users can view company packaging items"
ON packaging_items FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company packaging items"
ON packaging_items FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company packaging items"
ON packaging_items FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company packaging items"
ON packaging_items FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.17 PACKAGING_QUOTES
CREATE POLICY "Users can view company packaging quotes"
ON packaging_quotes FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company packaging quotes"
ON packaging_quotes FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company packaging quotes"
ON packaging_quotes FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company packaging quotes"
ON packaging_quotes FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.18 PACKAGING_QUOTE_ITEMS
CREATE POLICY "Users can view company packaging quote items"
ON packaging_quote_items FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company packaging quote items"
ON packaging_quote_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company packaging quote items"
ON packaging_quote_items FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company packaging quote items"
ON packaging_quote_items FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

-- 7.19 PACKAGING_QUOTE_SUPPLIERS
CREATE POLICY "Users can view company packaging quote suppliers"
ON packaging_quote_suppliers FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_suppliers.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company packaging quote suppliers"
ON packaging_quote_suppliers FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_suppliers.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company packaging quote suppliers"
ON packaging_quote_suppliers FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_suppliers.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company packaging quote suppliers"
ON packaging_quote_suppliers FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_suppliers.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

-- 7.20 PACKAGING_SUPPLIER_ITEMS
CREATE POLICY "Users can view company packaging supplier items"
ON packaging_supplier_items FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_supplier_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company packaging supplier items"
ON packaging_supplier_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_supplier_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company packaging supplier items"
ON packaging_supplier_items FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_supplier_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company packaging supplier items"
ON packaging_supplier_items FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_supplier_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
));

-- 7.21 PACKAGING_ORDERS
CREATE POLICY "Users can view company packaging orders"
ON packaging_orders FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company packaging orders"
ON packaging_orders FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company packaging orders"
ON packaging_orders FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company packaging orders"
ON packaging_orders FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.22 PACKAGING_ORDER_ITEMS
CREATE POLICY "Users can view company packaging order items"
ON packaging_order_items FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_orders 
    WHERE packaging_orders.id = packaging_order_items.order_id 
    AND packaging_orders.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company packaging order items"
ON packaging_order_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM packaging_orders 
    WHERE packaging_orders.id = packaging_order_items.order_id 
    AND packaging_orders.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company packaging order items"
ON packaging_order_items FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_orders 
    WHERE packaging_orders.id = packaging_order_items.order_id 
    AND packaging_orders.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company packaging order items"
ON packaging_order_items FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM packaging_orders 
    WHERE packaging_orders.id = packaging_order_items.order_id 
    AND packaging_orders.company_id = get_user_company_id(auth.uid())
));

-- 7.23 STOCK_SECTORS
CREATE POLICY "Users can view company stock sectors"
ON stock_sectors FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company stock sectors"
ON stock_sectors FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company stock sectors"
ON stock_sectors FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company stock sectors"
ON stock_sectors FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.24 STOCK_COUNTS
CREATE POLICY "Users can view company stock counts"
ON stock_counts FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company stock counts"
ON stock_counts FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company stock counts"
ON stock_counts FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company stock counts"
ON stock_counts FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.25 STOCK_COUNT_ITEMS
CREATE POLICY "Users can view company stock count items"
ON stock_count_items FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM stock_counts 
    WHERE stock_counts.id = stock_count_items.stock_count_id 
    AND stock_counts.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company stock count items"
ON stock_count_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM stock_counts 
    WHERE stock_counts.id = stock_count_items.stock_count_id 
    AND stock_counts.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company stock count items"
ON stock_count_items FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM stock_counts 
    WHERE stock_counts.id = stock_count_items.stock_count_id 
    AND stock_counts.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company stock count items"
ON stock_count_items FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM stock_counts 
    WHERE stock_counts.id = stock_count_items.stock_count_id 
    AND stock_counts.company_id = get_user_company_id(auth.uid())
));

-- 7.26 WHATSAPP_CONFIG
CREATE POLICY "Users can view company whatsapp config"
ON whatsapp_config FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company whatsapp config"
ON whatsapp_config FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company whatsapp config"
ON whatsapp_config FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company whatsapp config"
ON whatsapp_config FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.27 WHATSAPP_TEMPLATES
CREATE POLICY "Users can view company whatsapp templates"
ON whatsapp_templates FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company whatsapp templates"
ON whatsapp_templates FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company whatsapp templates"
ON whatsapp_templates FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company whatsapp templates"
ON whatsapp_templates FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.28 WHATSAPP_MESSAGES
CREATE POLICY "Users can view company whatsapp messages"
ON whatsapp_messages FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company whatsapp messages"
ON whatsapp_messages FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company whatsapp messages"
ON whatsapp_messages FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company whatsapp messages"
ON whatsapp_messages FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.29 WHATSAPP_RESPONSES
CREATE POLICY "Users can view company whatsapp responses"
ON whatsapp_responses FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company whatsapp responses"
ON whatsapp_responses FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company whatsapp responses"
ON whatsapp_responses FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company whatsapp responses"
ON whatsapp_responses FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- 7.30 COMPANY_INVITATIONS
CREATE POLICY "Users can view company invitations"
ON company_invitations FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Owners and admins can create invitations"
ON company_invitations FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT cu.company_id 
        FROM company_users cu
        JOIN user_roles ur ON ur.user_id = cu.user_id AND ur.company_id = cu.company_id
        WHERE cu.user_id = auth.uid() 
        AND ur.role IN ('owner', 'admin')
    )
);

CREATE POLICY "Owners and admins can update invitations"
ON company_invitations FOR UPDATE
TO authenticated
USING (
    company_id IN (
        SELECT cu.company_id 
        FROM company_users cu
        JOIN user_roles ur ON ur.user_id = cu.user_id AND ur.company_id = cu.company_id
        WHERE cu.user_id = auth.uid() 
        AND ur.role IN ('owner', 'admin')
    )
);

CREATE POLICY "Owners and admins can delete invitations"
ON company_invitations FOR DELETE
TO authenticated
USING (
    company_id IN (
        SELECT cu.company_id 
        FROM company_users cu
        JOIN user_roles ur ON ur.user_id = cu.user_id AND ur.company_id = cu.company_id
        WHERE cu.user_id = auth.uid() 
        AND ur.role IN ('owner', 'admin')
    )
);

-- =====================================================
-- PARTE 8: VIEWS ÚTEIS
-- =====================================================

-- 8.1 View de economia em pedidos
CREATE OR REPLACE VIEW vw_economia_pedidos AS
SELECT 
    o.id,
    o.supplier_name,
    o.order_date,
    o.delivery_date,
    o.status,
    o.total_value,
    o.quote_id,
    CASE WHEN o.quote_id IS NOT NULL THEN 'Cotação' ELSE 'Direto' END as origem,
    o.economia_estimada,
    o.economia_real,
    o.diferenca_preco_kg,
    COALESCE(o.economia_real, o.economia_estimada, 0) as economia_final,
    o.company_id
FROM orders o
ORDER BY o.created_at DESC;

-- =====================================================
-- PARTE 9: GRANTS E PERMISSÕES
-- =====================================================

-- Garantir permissões para usuários autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- PARTE 10: TRIGGER PARA CRIAR PROFILE AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
-- PRÓXIMOS PASSOS:
-- 1. Execute este SQL no SQL Editor do Supabase
-- 2. Vá em Authentication > Providers e configure os provedores (Google, etc)
-- 3. Importe os CSVs de cada tabela na ordem:
--    a) corporate_groups
--    b) companies
--    c) profiles (se tiver)
--    d) company_users
--    e) user_roles
--    f) suppliers
--    g) products
--    h) quotes
--    i) quote_items
--    j) quote_suppliers
--    k) quote_supplier_items
--    l) orders
--    m) order_items
--    n) packaging_items
--    o) packaging_quotes
--    p) packaging_quote_items
--    q) packaging_quote_suppliers
--    r) packaging_supplier_items
--    s) packaging_orders
--    t) packaging_order_items
--    u) activity_log
--    v) notes
--    w) shopping_list
--    x) stock_sectors
--    y) stock_counts
--    z) stock_count_items
--    aa) whatsapp_config
--    ab) whatsapp_templates
--    ac) whatsapp_messages
--    ad) whatsapp_responses
--    ae) company_invitations
-- 4. Atualize as variáveis de ambiente no seu app:
--    - VITE_SUPABASE_URL
--    - VITE_SUPABASE_ANON_KEY
-- =====================================================
