# Sessão e Autenticação Melhorada

## Problema Resolvido
O app estava pedindo para re-autenticar o usuário frequentemente, causando incômodo.

## Causas Identificadas

### 1. Timeout de Inatividade Muito Curto
- **Antes**: 2 horas
- **Depois**: 24 horas
- **Motivo**: Usuários normalmente trabalham por mais de 2 horas sem interrupção

### 2. Detector de Atualização Ativado
- **Antes**: Detectava atualizações do sistema e forçava re-autenticação
- **Depois**: Desabilitado
- **Motivo**: Causava re-autenticação desnecessária quando o app era atualizado

### 3. Configuração de Persistência de Sessão
- **Antes**: Básica (apenas localStorage e autoRefreshToken)
- **Depois**: Melhorada com detectSessionInUrl e flowType PKCE
- **Motivo**: Melhor suporte a refresh automático de tokens

## Mudanças Realizadas

### 1. AuthProvider.tsx
```typescript
// Antes
const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 horas

// Depois
const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas

// Detector de atualização desabilitado
useUpdateDetector({
  onUpdateDetected: () => { ... },
  enabled: false // ← Mudança aqui
});
```

### 2. Supabase Client (client.ts)
```typescript
// Antes
auth: {
  storage: localStorage,
  persistSession: true,
  autoRefreshToken: true,
}

// Depois
auth: {
  storage: localStorage,
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,  // ← Novo
  flowType: 'pkce',          // ← Novo
}
```

### 3. ReAuthDialog.tsx
Mensagem atualizada para refletir o novo timeout de 24 horas.

## Comportamento Esperado Agora

### ✅ Sessão Persistente
- Você faz login uma vez
- A sessão é salva no localStorage
- Ao recarregar a página, você continua logado
- Ao fechar e abrir o navegador, você continua logado

### ✅ Refresh Automático de Token
- O token é automaticamente renovado antes de expirar
- Você não precisa fazer login novamente enquanto estiver usando o app

### ✅ Timeout de Inatividade Longo
- Você pode ficar 24 horas sem usar o app
- Após 24 horas de inatividade, será pedido para fazer login novamente
- Qualquer atividade (clique, digitação, scroll) reseta o contador

### ✅ Sem Detecção de Atualização
- Atualizações do app não forçam re-autenticação
- Você pode atualizar a página sem perder a sessão

## Como Testar

1. **Teste de Persistência**:
   - Faça login
   - Feche o navegador completamente
   - Abra novamente
   - Você deve estar logado

2. **Teste de Refresh de Página**:
   - Faça login
   - Pressione F5 (refresh)
   - Você deve continuar logado

3. **Teste de Inatividade**:
   - Faça login
   - Deixe o app aberto por 24 horas sem usar
   - Após 24 horas, será pedido para fazer login novamente

4. **Teste de Atividade**:
   - Faça login
   - Use o app normalmente (clique, digite, scroll)
   - O contador de inatividade deve ser resetado

## Configurações Disponíveis

Se precisar ajustar no futuro:

### Aumentar/Diminuir Timeout de Inatividade
Edite em `src/components/auth/AuthProvider.tsx`:
```typescript
const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // Altere o número 24
```

Exemplos:
- 1 hora: `1 * 60 * 60 * 1000`
- 8 horas: `8 * 60 * 60 * 1000`
- 7 dias: `7 * 24 * 60 * 60 * 1000`

### Reabilitar Detector de Atualização
Se precisar forçar re-autenticação ao atualizar o app:
```typescript
useUpdateDetector({
  onUpdateDetected: () => { ... },
  enabled: true // ← Mude para true
});
```

## Segurança

As mudanças mantêm a segurança:
- ✅ Tokens são armazenados com segurança no localStorage
- ✅ Tokens são automaticamente renovados
- ✅ Sessão expira após 24 horas de inatividade
- ✅ Re-autenticação é pedida quando necessário
- ✅ Logout limpa a sessão completamente

## Próximos Passos

1. **Teste** o novo comportamento
2. **Reporte** se houver problemas
3. **Ajuste** o timeout se necessário
4. **Considere** adicionar "Lembrar-me" no login (opcional)

## Notas

- A sessão é persistida no localStorage do navegador
- Se limpar o cache/cookies, você será deslogado
- Cada aba do navegador compartilha a mesma sessão
- O timeout é resetado com qualquer atividade do usuário
