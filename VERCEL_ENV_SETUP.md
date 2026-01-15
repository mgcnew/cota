# Configuração de Variáveis de Ambiente na Vercel

## Problema
O app está dando erro: `supabaseKey is required` porque as variáveis de ambiente não estão configuradas na Vercel.

## Solução

### Passo 1: Acessar Vercel
1. Vá em https://vercel.com
2. Faça login com sua conta
3. Selecione o projeto `cotaja`

### Passo 2: Configurar Variáveis de Ambiente
1. Clique em **Settings** (Configurações)
2. Vá em **Environment Variables** (Variáveis de Ambiente)
3. Adicione as seguintes variáveis:

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | `https://okprblbcwaconccerwiw.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcHJibGJjd2Fjb25jY2Vyd2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzU0NjAsImV4cCI6MjA4NDAxMTQ2MH0.6mH-m7ySYgg8eW6D0zA9i9bJkZX-e1YlsZUavj1USos` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcHJibGJjd2Fjb25jY2Vyd2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzU0NjAsImV4cCI6MjA4NDAxMTQ2MH0.6mH-m7ySYgg8eW6D0zA9i9bJkZX-e1YlsZUavj1USos` |

### Passo 3: Forçar Novo Deploy
1. Vá em **Deployments**
2. Clique no último deploy
3. Clique em **Redeploy** (Reimplementar)
4. Selecione **Use existing Build Cache** (Usar cache de build existente)
5. Clique em **Redeploy**

Ou use o comando:
```bash
git push origin main
```

### Passo 4: Verificar
1. Aguarde o deploy terminar (deve aparecer "Ready")
2. Acesse https://cotaja.vercel.app
3. Tente fazer login com:
   - Email: `mgc.info.new@gmail.com`
   - Senha: `Mg435425.0`

## Alternativa: Usar Vercel CLI

Se preferir usar a linha de comando:

```bash
# Instalar Vercel CLI (se não tiver)
npm install -g vercel

# Fazer login
vercel login

# Configurar variáveis de ambiente
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY

# Fazer deploy
vercel --prod
```

## Verificação

Após o deploy, você pode verificar se as variáveis estão corretas abrindo o DevTools (F12) e vendo se há erros no console.

Se ainda houver erro `supabaseKey is required`, significa que as variáveis não foram carregadas. Neste caso:
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (Ctrl+F5)
3. Se persistir, aguarde 5 minutos para o cache da Vercel atualizar
