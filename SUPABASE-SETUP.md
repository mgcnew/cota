# 🔐 CONFIGURAÇÃO SUPABASE PARA DEPLOY

## ✅ Boa Notícia!

Seu projeto **JÁ usa Supabase**! Não precisa migrar nada. Só precisa configurar as variáveis de ambiente.

---

## 📋 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

O projeto precisa dessas 2 variáveis:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-aqui
```

---

## 🔧 COMO OBTER AS CREDENCIAIS DO SUPABASE

### Se você JÁ tem um projeto Supabase:

1. Acesse: https://supabase.com/dashboard
2. Entre no seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

### Se você NÃO tem um projeto Supabase ainda:

1. Acesse: https://supabase.com
2. Crie uma conta gratuita
3. Clique em **New Project**
4. Preencha:
   - Nome do projeto
   - Senha do banco de dados
   - Região (escolha mais próxima do Brasil)
5. Aguarde ~2 minutos para criar
6. Vá em **Settings** → **API** e copie as credenciais

---

## 📤 APLICAR AS MIGRATIONS NO SUPABASE

Você tem migrations SQL em `supabase/migrations/`. Precisa aplicá-las:

### Opção 1: Via Supabase Dashboard (Mais Fácil)

1. Acesse seu projeto no Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra cada arquivo de migration em `supabase/migrations/`
4. Execute na ordem (por data/nome do arquivo)
5. Ou execute todos de uma vez copiando o conteúdo

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-id

# Aplicar migrations
supabase db push
```

---

## 🌐 CONFIGURAR NAS PLATAFORMAS DE DEPLOY

### VERCEL:

1. No projeto Vercel → **Settings** → **Environment Variables**
2. Adicione:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = sua chave pública
3. Marque para **Production**, **Preview** e **Development**
4. Clique em **Save**
5. Faça novo deploy

### NETLIFY:

1. No projeto Netlify → **Site settings** → **Environment variables**
2. Adicione as mesmas variáveis
3. Salve
4. Faça novo deploy

### GITHUB PAGES / RAILWAY / OUTROS:

Adicione as variáveis de ambiente nas configurações da plataforma seguindo o mesmo padrão.

---

## ✅ CHECKLIST FINAL

- [ ] Tenho um projeto Supabase criado
- [ ] Apliquei todas as migrations SQL
- [ ] Configurei as variáveis de ambiente na plataforma de deploy
- [ ] Testei o deploy e funciona

---

## 🚨 IMPORTANTE

- **NÃO** compartilhe a chave `service_role` (é privada)
- **USE** apenas a chave `anon/public` (pública, segura)
- As migrations criam toda a estrutura do banco (tabelas, RLS, functions, etc.)

---

## 💡 DICA

Se você já tinha dados no Supabase do Lovable, você pode:
1. Exportar os dados do projeto antigo
2. Importar no novo projeto Supabase
3. Ou simplesmente continuar usando o mesmo projeto Supabase (se já estava usando)

**Precisa de ajuda com algum passo específico?**






