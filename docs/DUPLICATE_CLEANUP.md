# Sistema de Limpeza de Duplicatas

## 📋 Visão Geral

O Sistema de Limpeza de Duplicatas é uma solução completa para detectar e remover registros duplicados no banco de dados PostgreSQL/Supabase. O sistema oferece múltiplas interfaces de acesso e garante a integridade dos dados durante o processo de limpeza.

## 🏗️ Arquitetura

### Componentes do Sistema

1. **Funções SQL** (`supabase/migrations/20250115000000_remove_duplicates_system.sql`)
   - Funções de detecção de duplicatas
   - Funções de remoção com simulação
   - Funções de estatísticas

2. **Utilitário TypeScript** (`src/utils/duplicateRemover.ts`)
   - Interface programática para o frontend
   - Classe `DuplicateRemover` com métodos tipados
   - Funções utilitárias para uso rápido

3. **Interface Web** (`src/components/debug/DuplicateManager.tsx`)
   - Interface administrativa visual
   - Dashboards e estatísticas em tempo real
   - Operações de simulação e limpeza

4. **Script CLI** (`scripts/cleanup-duplicates.js`)
   - Interface de linha de comando
   - Execução manual e automação
   - Menu interativo

## 🚀 Como Usar

### 1. Interface Web (Recomendado para Administradores)

```tsx
import { DuplicateManager } from '@/components/debug/DuplicateManager';

// Adicione ao seu painel administrativo
<DuplicateManager />
```

**Recursos:**
- Dashboard com estatísticas visuais
- Detecção automática de duplicatas
- Simulação antes da execução
- Histórico de operações
- Interface responsiva

### 2. Script de Linha de Comando

```bash
# Executar o script interativo
npm run cleanup-duplicates

# Ou diretamente
node scripts/cleanup-duplicates.js
```

**Menu de Opções:**
1. Ver estatísticas gerais
2. Detectar produtos duplicados
3. Detectar fornecedores duplicados
4. Simular limpeza de produtos
5. Simular limpeza de fornecedores
6. Simular limpeza completa
7. EXECUTAR limpeza de produtos
8. EXECUTAR limpeza de fornecedores
9. EXECUTAR limpeza completa

### 3. Uso Programático

```typescript
import { createDuplicateRemover } from '@/utils/duplicateRemover';

const remover = await createDuplicateRemover();

// Obter estatísticas
const stats = await remover.getStats();

// Detectar duplicatas
const productDuplicates = await remover.detectProductDuplicates();
const supplierDuplicates = await remover.detectSupplierDuplicates();

// Simular limpeza
const dryRunResults = await remover.cleanupAllDuplicates(true);

// Executar limpeza real
const realResults = await remover.cleanupAllDuplicates(false);
```

## 🔍 Critérios de Detecção

### Produtos Duplicados
- **Critério:** Mesmo `name` E `category` para o mesmo `user_id`
- **Ação:** Mantém o registro mais recente (`created_at`)
- **Referências:** Atualiza `quote_items` e `order_items`

### Fornecedores Duplicados
- **Critério:** Mesmo `name` E `cnpj` para o mesmo `user_id`
- **Ação:** Mantém o registro mais recente (`created_at`)
- **Referências:** Atualiza `quotes`, `quote_suppliers` e `quote_supplier_items`

## 🛡️ Segurança e Integridade

### Medidas de Proteção

1. **Row Level Security (RLS)**
   - Todas as operações respeitam as políticas RLS
   - Usuários só podem limpar seus próprios dados

2. **Simulação Obrigatória**
   - Sempre execute simulação antes da limpeza real
   - Visualize exatamente o que será removido

3. **Preservação de Referências**
   - Atualiza automaticamente todas as tabelas relacionadas
   - Mantém integridade referencial

4. **Logs Detalhados**
   - Registra todas as operações executadas
   - Histórico completo para auditoria

### Validações Automáticas

```sql
-- Exemplo de validação antes da remoção
IF NOT EXISTS (
    SELECT 1 FROM products 
    WHERE user_id = auth.uid() 
    AND id = duplicate_id
) THEN
    RAISE EXCEPTION 'Produto não encontrado ou sem permissão';
END IF;
```

## 📊 Funções SQL Disponíveis

### Estatísticas
```sql
SELECT * FROM get_duplicate_stats();
```

### Detecção
```sql
-- Produtos duplicados
SELECT * FROM detect_product_duplicates();

-- Fornecedores duplicados
SELECT * FROM detect_supplier_duplicates();
```

### Simulação
```sql
-- Simular remoção de produtos
SELECT * FROM simulate_remove_product_duplicates();

-- Simular remoção de fornecedores
SELECT * FROM simulate_remove_supplier_duplicates();
```

### Execução Real
```sql
-- Remover produtos duplicados
SELECT * FROM remove_product_duplicates();

-- Remover fornecedores duplicados
SELECT * FROM remove_supplier_duplicates();
```

## 🔧 Configuração e Instalação

### 1. Aplicar Migration

```bash
# A migration será aplicada automaticamente no próximo deploy
# Ou execute manualmente no Supabase Dashboard
```

### 2. Configurar Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Instalar Dependências

```bash
npm install @supabase/supabase-js
```

## 📈 Monitoramento e Manutenção

### Verificação Regular

Execute verificações regulares para manter o sistema limpo:

```bash
# Verificação semanal recomendada
npm run cleanup-duplicates
```

### Métricas Importantes

- **Total de registros** por tabela
- **Número de duplicatas** detectadas
- **Taxa de crescimento** de duplicatas
- **Tempo de execução** das limpezas

### Alertas Recomendados

1. **Duplicatas > 10:** Executar limpeza
2. **Crescimento > 5% semanal:** Investigar causa
3. **Falhas de execução:** Verificar logs

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de Permissão**
   ```
   Solução: Verificar se o usuário está autenticado
   ```

2. **Timeout na Execução**
   ```
   Solução: Executar limpeza em lotes menores
   ```

3. **Referências Órfãs**
   ```
   Solução: Executar novamente a função de limpeza
   ```

### Logs de Debug

```typescript
// Habilitar logs detalhados
const remover = await createDuplicateRemover();
remover.enableDebugLogs(true);
```

## 📝 Changelog

### v1.0.0 (2025-01-15)
- ✅ Sistema inicial de detecção de duplicatas
- ✅ Funções SQL para produtos e fornecedores
- ✅ Interface web administrativa
- ✅ Script CLI interativo
- ✅ Documentação completa

## 🤝 Contribuição

Para contribuir com melhorias:

1. Teste sempre em ambiente de desenvolvimento
2. Execute simulações antes de implementar
3. Documente novas funcionalidades
4. Mantenha compatibilidade com RLS

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte os logs do sistema
2. Execute diagnósticos com o script CLI
3. Verifique a documentação do Supabase
4. Contate o administrador do sistema

---

**⚠️ IMPORTANTE:** Sempre execute simulações antes de operações reais de limpeza. O sistema foi projetado para ser seguro, mas a prevenção é sempre a melhor prática.