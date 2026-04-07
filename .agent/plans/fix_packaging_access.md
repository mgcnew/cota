# Plano de Correção: Acesso Indisponível em Cotações de Embalagens

O erro "Acesso Indisponível" ocorre quando o portal do fornecedor não consegue localizar os dados da cotação usando o token fornecido. Investigação revelou que, se o `access_token` estiver ausente no banco, o sistema usa o `supplierId` como fallback, mas o RPC do banco de dados não reconhece este ID como um token válido.

## Causas Identificadas
1. **Fallback Inválido**: `WhatsappTab.tsx` usa `supplierId` quando `access_token` é nulo.
2. **Dados Legados**: Cotações de embalagens criadas antes da migração do token podem ter a coluna `access_token` como nula.
3. **RPC Restritivo**: O RPC `get_packaging_vendor_quote_data` não retorna resultados se o token não estiver na coluna `access_token`.

## Etapas de Implementação

### 1. Correção no Banco de Dados (Migration)
Criar uma nova migration para garantir que todos os fornecedores de cotações tenham tokens e que novos registros nunca sejam nulos.
- [ ] Backfill de `access_token` para registros existentes que estejam nulos.
- [ ] Definir a coluna como `NOT NULL`.

### 2. Ajuste logicamente no Frontend
- [ ] **`WhatsappTab.tsx`**: Remover o fallback para `supplierId`. Se o token for nulo, alertar o usuário ou tratar como erro de sincronização (embora a migration deva prevenir isso).
- [ ] **`VendorPortal.tsx`**: Melhorar a captura de erro para exibir mensagens mais amigáveis quando o token for inválido.

### 3. Sincronização de Tipos
- [ ] Verificar se todos os hooks e tipos estão propagando o `access_token` corretamente.

## Verificação
- [ ] Criar uma nova cotação de embalagem.
- [ ] Verificar se o link gerado no WhatsApp contém um UUID de token (e não o ID do fornecedor).
- [ ] Acessar o link e confirmar que o portal carrega os itens.
