# 🚀 GUIA DE DEPLOY - Publicar sem depender do Lovable

## ✅ O projeto está pronto para deploy!

Você pode publicar em várias plataformas. Escolha a que preferir:

---

## 🌟 OPÇÃO 1: VERCEL (Mais Fácil e Recomendado)

### Passo a passo:

1. **Acesse:** https://vercel.com
2. **Faça login** com sua conta GitHub
3. **Clique em "Add New Project"**
4. **Importe seu repositório** `revoltos4820/cotaja`
5. **Configure:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
6. **Adicione Variáveis de Ambiente** (se necessário):
   - Supabase URL
   - Supabase Anon Key
   - Outras variáveis que você usa
7. **Clique em "Deploy"**

### ✅ Pronto! Seu site estará no ar em ~2 minutos

**URL será:** `https://seu-projeto.vercel.app`

---

## 🌐 OPÇÃO 2: NETLIFY

### Passo a passo:

1. **Acesse:** https://netlify.com
2. **Faça login** com GitHub
3. **Clique em "Add new site" → "Import an existing project"**
4. **Escolha seu repositório**
5. **Configure:**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Adicione variáveis de ambiente** (se necessário)
7. **Clique em "Deploy site"**

---

## 📦 OPÇÃO 3: GITHUB PAGES

### Passo a passo:

1. **Crie arquivo `deploy.sh`** (já vou criar)
2. **Configure GitHub Actions** (já vou criar)
3. **Push para o repositório**
4. **Ative GitHub Pages** nas configurações do repositório

---

## 🚂 OPÇÃO 4: RAILWAY

1. **Acesse:** https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Escolha seu repositório**
4. **Railway detecta automaticamente** e faz deploy

---

## 💡 RECOMENDAÇÃO FINAL

**Use VERCEL** porque:
- ✅ Mais fácil e rápido
- ✅ Deploy automático a cada push
- ✅ SSL gratuito
- ✅ CDN global
- ✅ Domínio customizado gratuito
- ✅ Preview de cada commit

---

## 🔧 ARQUIVOS NECESSÁRIOS

Já criei:
- ✅ `vercel.json` - Configuração para Vercel
- ✅ Este guia

**Próximo passo:** Escolha uma plataforma e siga as instruções acima!

---

## ⚠️ IMPORTANTE: Variáveis de Ambiente

Se você usa variáveis de ambiente (Supabase, APIs, etc.), adicione-as nas configurações da plataforma escolhida.

**Exemplo no Vercel:**
- Settings → Environment Variables
- Adicione: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.

---

**Quer que eu te ajude a configurar alguma plataforma específica agora?**






