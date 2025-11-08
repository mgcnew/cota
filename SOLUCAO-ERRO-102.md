# Solução para Erro -102 (ERR_CONNECTION_REFUSED)

## Problema
O servidor Vite não está iniciando na porta 8080, resultando em erro -102 quando tenta acessar http://localhost:8080/

## Correções Aplicadas

### 1. ✅ Configuração do Host Corrigida
**Arquivo:** `vite.config.ts`
- Alterado `host: "0.0.0.0"` para `host: "localhost"`
- Removida configuração HMR específica que pode causar problemas
- Mantido `strictPort: false` para fallback automático

**Motivo:** No Windows, usar `0.0.0.0` pode causar problemas de conexão. `localhost` é mais confiável para desenvolvimento local.

### 2. ✅ Script de Diagnóstico Criado
**Arquivo:** `check-port-8080.ps1`
- Script PowerShell para verificar se a porta 8080 está ocupada
- Mostra processos que estão usando a porta
- Instruções para liberar a porta

## Próximos Passos

### 1. Verificar Porta 8080
Execute no PowerShell:
```powershell
cd cotaja
.\check-port-8080.ps1
```

Se a porta estiver ocupada:
```powershell
# Ver processos usando a porta
netstat -ano | findstr :8080

# Finalizar processo (substitua <PID> pelo número encontrado)
taskkill /PID <PID> /F
```

### 2. Limpar Cache do Vite
```powershell
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
```

### 3. Reiniciar Servidor
```powershell
npm run dev
```

## O que Esperar

Após as correções, você deve ver:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  press h + enter to show help
```

O navegador deve abrir automaticamente em http://localhost:8080/

## Se Ainda Não Funcionar

### Verificar Erros no Terminal
- Execute `npm run dev` e verifique se há mensagens de erro
- Procure por erros de compilação ou imports quebrados

### Testar Build
```powershell
npm run build
```
Se houver erros no build, eles aparecerão aqui.

### Simplificar Configuração (Se Necessário)
Se ainda houver problemas, podemos temporariamente:
- Remover o plugin `lovable-tagger`
- Simplificar a configuração do Vite
- Testar com configuração mínima

## Verificações Adicionais

1. **Node.js e npm estão atualizados?**
   ```powershell
   node --version
   npm --version
   ```

2. **Dependências instaladas?**
   ```powershell
   npm install
   ```

3. **Firewall bloqueando?**
   - Verificar se o Firewall do Windows está bloqueando a porta 8080
   - Adicionar exceção se necessário

4. **Antivírus interferindo?**
   - Alguns antivírus bloqueiam servidores locais
   - Adicionar exceção para o diretório do projeto

