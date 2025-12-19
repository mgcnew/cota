# Prompt para Criar Sistema de Cotações - CotaJá v2

## 🎯 PROMPT PRINCIPAL (Cole isso na IA)

```
Crie um sistema web de gestão de cotações para compras empresariais chamado "CotaJá".

## Stack Técnica (OBRIGATÓRIO)
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (auth + database + storage)
- React Query para cache
- React Router DOM
- Recharts para gráficos
- Zod para validação

## Princípios de Desenvolvimento (IMPORTANTE)
1. MOBILE-FIRST: Toda UI deve ser projetada primeiro para mobile, depois adaptada para desktop
2. SIMPLICIDADE: Menos é mais. Evite over-engineering
3. PERFORMANCE: Lazy loading em todas as rotas, sem animações pesadas
4. CÓDIGO LIMPO: Componentes pequenos e focados, máximo 200 linhas por arquivo

## Estrutura de Dados (Supabase)

### Tabelas Principais:
1. companies (id, name, cnpj, created_at)
2. users (id, email, name, company_id, role, avatar_url)
3. products (id, company_id, name, category, unit, barcode, image_url)
4. suppliers (id, company_id, name, cnpj, phone, email, address)
5. quotes (id, company_id, status, created_at, expires_at)
6. quote_items (id, quote_id, product_id, quantity)
7. quote_suppliers (id, quote_id, supplier_id)
8. quote_prices (id, quote_item_id, supplier_id, price, created_at)
9. orders (id, company_id, supplier_id, quote_id, status, total, created_at)
10. order_items (id, order_id, product_id, quantity, price)

### Status de Cotação: 'rascunho' | 'ativa' | 'concluida' | 'cancelada'
### Status de Pedido: 'pendente' | 'confirmado' | 'entregue' | 'cancelado'

## Páginas (em ordem de prioridade)

### 1. Auth (/auth)
- Login com email/senha
- Cadastro simples
- Recuperação de senha

### 2. Dashboard (/)
- 4 cards de métricas: Total Produtos, Cotações Ativas, Pedidos do Mês, Economia Total
- Gráfico de economia dos últimos 6 meses
- Lista das 5 últimas cotações

### 3. Produtos (/produtos)
- Lista com busca e filtro por categoria
- CRUD completo via modal
- Importação CSV

### 4. Fornecedores (/fornecedores)
- Lista com busca
- CRUD completo via modal
- Exibir histórico de cotações por fornecedor

### 5. Cotações (/cotacoes)
- Lista de cotações com status
- Criar cotação: selecionar produtos + fornecedores
- Gerenciar cotação: inserir preços por fornecedor
- Comparativo de preços
- Converter em pedido

### 6. Pedidos (/pedidos)
- Lista de pedidos com status
- Detalhes do pedido
- Alterar status

### 7. Configurações (/configuracoes)
- Dados da empresa
- Perfil do usuário
- Gerenciar usuários (admin)

## Layout
- Sidebar colapsável no desktop
- Bottom navigation no mobile (5 itens: Dashboard, Produtos, Cotações, Pedidos, Menu)
- Header com logo, busca global e avatar do usuário

## Regras de Negócio
1. Uma cotação pode ter múltiplos produtos e múltiplos fornecedores
2. Cada fornecedor pode dar preço para cada produto da cotação
3. O sistema deve calcular automaticamente o melhor preço por produto
4. Ao converter cotação em pedido, pode gerar múltiplos pedidos (um por fornecedor)
5. Economia = soma das diferenças entre maior e menor preço de cada item

## Componentes UI Essenciais
- Card, Button, Input, Select, Dialog, Table
- Badge para status
- Skeleton para loading
- Toast para feedback
- EmptyState para listas vazias

## NÃO FAÇA
- Animações complexas (framer-motion, etc)
- Múltiplos níveis de abstração desnecessários
- Componentes genéricos demais
- Over-optimization prematura
- Testes unitários (deixe para depois)

## FAÇA
- Código direto e legível
- Componentes específicos para cada caso de uso
- Loading states simples (Skeleton ou Spinner)
- Tratamento de erro básico
- Mobile-first sempre
```

---

## 📋 Ordem de Implementação Sugerida

1. **Setup inicial**: Vite + Tailwind + shadcn/ui + Supabase
2. **Auth**: Login/Cadastro/Logout
3. **Layout**: Sidebar + Header + Bottom Nav
4. **Dashboard**: Cards + Gráfico básico
5. **Produtos**: CRUD completo
6. **Fornecedores**: CRUD completo
7. **Cotações**: Fluxo completo
8. **Pedidos**: Lista e detalhes
9. **Configurações**: Perfil e empresa

---

## 🔑 Dicas para o Prompt

1. **Peça uma coisa de cada vez**: "Agora crie a página de Produtos"
2. **Seja específico**: "O card de produto deve mostrar: nome, categoria, último preço"
3. **Corrija logo**: Se algo não ficou bom, peça para refazer imediatamente
4. **Evite acumular**: Não deixe bugs acumularem, resolva na hora
