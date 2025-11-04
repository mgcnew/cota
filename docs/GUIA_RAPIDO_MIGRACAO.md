# ⚡ GUIA RÁPIDO: MIGRAÇÃO LOVABLE → SUPABASE

## 🎯 RESUMO EXECUTIVO

Este guia rápido resume os passos essenciais para migrar do Lovable Cloud para Supabase.

---

## 📋 CHECKLIST RÁPIDO

### 1. Preparação (15 min)
- [ ] Criar projeto no Supabase
- [ ] Anotar credenciais (URL + anon key)
- [ ] Exportar dados do Lovable (se possível)

### 2. Aplicar Migrations (30 min)
- [ ] Aplicar todas as 31 migrations via Supabase Dashboard
- [ ] Verificar estrutura criada

### 3. Importar Dados (varia)
- [ ] Importar usuários (via Dashboard)
- [ ] Importar dados principais (CSV ou SQL)

### 4. Configurar (5 min)
- [ ] Criar arquivo `.env` com credenciais
- [ ] Testar conexão local

### 5. Testar (15 min)
- [ ] Rodar app localmente
- [ ] Verificar login e dados

---

## 🚀 COMANDOS RÁPIDOS

### Aplicar Migrations via CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-id

# Aplicar migrations
supabase db push
```

### Exportar Dados do Lovable (SQL)

```sql
-- Exportar produtos
COPY (SELECT * FROM products) TO STDOUT WITH CSV HEADER;

-- Exportar fornecedores
COPY (SELECT * FROM suppliers) TO STDOUT WITH CSV HEADER;

-- Exportar cotações
COPY (SELECT * FROM quotes) TO STDOUT WITH CSV HEADER;

-- Exportar pedidos
COPY (SELECT * FROM orders) TO STDOUT WITH CSV HEADER;

-- Exportar empresas
COPY (SELECT * FROM companies) TO STDOUT WITH CSV HEADER;
```

### Verificar Estrutura no Supabase

```sql
-- Ver todas as tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Contar registros
SELECT 'products' as tabela, COUNT(*) FROM products
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'quotes', COUNT(*) FROM quotes;
```

---

## 📝 ARQUIVO .env

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-publica
```

---

## ⚠️ ORDEM DE IMPORTAÇÃO

1. auth.users
2. companies
3. company_users
4. products
5. suppliers
6. quotes
7. orders
8. (demais tabelas)

---

## 🆘 PROBLEMAS COMUNS

**Erro de Foreign Key**: Importe tabelas relacionadas primeiro

**Erro de RLS**: Desabilite temporariamente durante importação

**UUID inválido**: Verifique formato dos dados exportados

---

**Para guia completo, veja: `PLANO_MIGRACAO_LOVABLE_PARA_SUPABASE.md`**


