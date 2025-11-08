# Como Iniciar o Servidor - Instruções

## ⚠️ PROBLEMA IDENTIFICADO

Você está executando `npm run dev` no diretório **ERRADO**!

O erro "Missing script: 'dev'" acontece porque você está em:
- `C:\Users\davi\Documents\cursor` ❌

Mas precisa estar em:
- `C:\Users\davi\Documents\cursor\cotaja` ✅

## ✅ SOLUÇÃO

### Opção 1: Navegar para o diretório correto

```powershell
# 1. Navegar para o diretório do projeto
cd C:\Users\davi\Documents\cursor\cotaja

# 2. Verificar se está no lugar certo (deve mostrar package.json)
dir package.json

# 3. Iniciar o servidor
npm run dev
```

### Opção 2: Usar o script automatizado

```powershell
# 1. Navegar para o diretório do projeto
cd C:\Users\davi\Documents\cursor\cotaja

# 2. Executar o script
.\iniciar-servidor.ps1
```

### Opção 3: Comando único

```powershell
cd C:\Users\davi\Documents\cursor\cotaja; npm run dev
```

## 📋 Checklist

Antes de executar `npm run dev`, certifique-se de:

- [ ] Estar no diretório `cotaja` (não apenas `cursor`)
- [ ] Ver o arquivo `package.json` quando executar `dir`
- [ ] Ter executado `npm install` (se ainda não fez)

## 🔍 Como Verificar se Está no Diretório Certo

Execute no PowerShell:
```powershell
pwd
```

Deve mostrar:
```
C:\Users\davi\Documents\cursor\cotaja
```

Ou execute:
```powershell
Test-Path package.json
```

Deve retornar: `True`

## 🚀 Após Iniciar o Servidor

Você deve ver:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  press h + enter to show help
```

O navegador deve abrir automaticamente em `http://localhost:8080/`

## ❓ Ainda Não Funciona?

Se mesmo no diretório correto não funcionar, execute:

```powershell
cd C:\Users\davi\Documents\cursor\cotaja
.\verificar-servidor.ps1
```

E compartilhe a saída completa.

