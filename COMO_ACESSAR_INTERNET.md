# 🌐 Como Acessar pela Internet para Testar

## 🚀 **OPÇÃO 1: Deploy Rápido no Vercel (Recomendado - 2 minutos)**

### Passo a passo:

1. **Acesse:** https://vercel.com
2. **Faça login** com GitHub
3. **Clique em "Add New Project"**
4. **Importe seu repositório** (ou faça upload)
5. **Configure:**
   - Framework: **Vite** (detecta automaticamente)
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Adicione Variáveis de Ambiente** (se usar Supabase):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. **Clique em "Deploy"**

✅ **Pronto!** Seu site estará no ar em ~2 minutos  
**URL:** `https://seu-projeto.vercel.app`

---

## 🔥 **OPÇÃO 2: Teste Rápido Local com ngrok (1 minuto)**

### Instalação e uso:

1. **Baixe ngrok:** https://ngrok.com/download
2. **Extraia o arquivo** (ngrok.exe)
3. **No terminal, execute:**

```bash
# 1. Certifique-se que o servidor está rodando
cd cotaja
npm run dev

# 2. Em outro terminal, execute ngrok
ngrok http 8080
```

4. **Copie a URL** que aparece (ex: `https://abc123.ngrok.io`)
5. **Acesse no celular** usando essa URL

✅ **Pronto!** Agora você pode testar no celular pela internet

---

## ☁️ **OPÇÃO 3: Cloudflare Tunnel (Gratuito, sem instalação)**

### Passo a passo:

1. **Instale Cloudflare Tunnel:**
   ```bash
   # Windows (PowerShell como Admin)
   winget install --id Cloudflare.cloudflared
   ```

2. **Execute o tunnel:**
   ```bash
   # Certifique-se que npm run dev está rodando na porta 8080
   cloudflared tunnel --url http://localhost:8080
   ```

3. **Copie a URL** que aparece (ex: `https://random-words.trycloudflare.com`)

✅ **Pronto!** URL pública temporária para testar

---

## 📱 **OPÇÃO 4: Acessar pela Rede Local (Mesma WiFi)**

### Descobrir seu IP local:

1. **No PowerShell, execute:**
   ```powershell
   ipconfig
   ```

2. **Procure por "IPv4"** (ex: `192.168.1.100`)

3. **No celular (mesma WiFi), acesse:**
   ```
   http://192.168.1.100:8080
   ```

⚠️ **Nota:** Só funciona se celular e PC estiverem na mesma rede WiFi

---

## 🎯 **Recomendação**

### Para teste rápido (agora):
→ Use **ngrok** (Opção 2) - 1 minuto, gratuito

### Para teste permanente:
→ Use **Vercel** (Opção 1) - 2 minutos, gratuito, sempre online

---

## 🔧 **Troubleshooting**

### Porta 8080 ocupada?
```bash
# Verificar o que está usando a porta
netstat -ano | findstr :8080

# Ou mude a porta no vite.config.ts
port: 3000
```

### ngrok não funciona?
- Verifique se o firewall não está bloqueando
- Tente usar `ngrok http 8080 --host-header=localhost:8080`

### Vercel com erro?
- Verifique as variáveis de ambiente
- Veja os logs no dashboard do Vercel

---

## 📝 **Comandos Úteis**

```bash
# Ver IP local
ipconfig | findstr IPv4

# Verificar se porta está aberta
netstat -ano | findstr :8080

# Iniciar servidor
cd cotaja
npm run dev

# Build para produção
npm run build
```

