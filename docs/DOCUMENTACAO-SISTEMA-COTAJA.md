# Documentação do Sistema CotaJá

## 📌 Visão Geral

**CotaJá** é um sistema de gestão de cotações para compras empresariais. Permite que empresas cadastrem produtos, fornecedores, criem cotações comparativas e convertam em pedidos.

---

## 🏗️ Arquitetura Atual

### Stack Tecnológica
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.8.3 | Tipagem |
| Vite | 5.4.19 | Build tool |
| Tailwind CSS | 3.4.17 | Estilização |
| shadcn/ui | - | Componentes UI |
| Supabase | 2.58.0 | Backend (Auth + DB) |
| React Query | 5.83.0 | Cache e estado servidor |
| React Router | 6.30.1 | Roteamento |
| Recharts | 2.15.4 | Gráficos |
| Zod | 3.25.76 | Validação |

### Estrutura de Pastas
```
src/
├── components/
│   ├── auth/          # Autenticação
│   ├── dashboard/     # Componentes do dashboard
│   ├── forms/         # Dialogs e formulários
│   ├── layout/        # AppLayout, Sidebar, Header
│   ├── products/      # Componentes de produtos
│   ├── suppliers/     # Componentes de fornecedores
│   ├── pedidos/       # Componentes de pedidos
│   ├── cotacoes/      # Componentes de cotações
│   ├── reports/       # Relatórios
│   ├── responsive/    # Componentes responsivos
│   ├── settings/      # Configurações
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom hooks (dados + lógica)
├── pages/             # Páginas da aplicação
├── lib/               # Utilitários
└── utils/             # Funções auxiliares
```

---

## 📊 Modelo de Dados

### Entidades Principais

#### 1. Company (Empresa)
```typescript
{
  id: string
  name: string
  cnpj: string
  logo_url?: string
  created_at: timestamp
}
```

#### 2. User (Usuário)
```typescript
{
  id: string
  email: string
  name: string
  company_id: string
  role: 'admin' | 'user' | 'viewer'
  avatar_url?: string
}
```

#### 3. Product (Produto)
```typescript
{
  id: string
  company_id: string
  name: string
  category: string
  unit: string // 'kg', 'un', 'cx', 'lt'
  barcode?: string
  image_url?: string
  created_at: timestamp
}
```

#### 4. Supplier (Fornecedor)
```typescript
{
  id: string
  company_id: string
  name: string
  cnpj?: string
  phone?: string
  email?: string
  address?: string
  created_at: timestamp
}
```

#### 5. Quote (Cotação)
```typescript
{
  id: string
  company_id: string
  status: 'rascunho' | 'ativa' | 'concluida' | 'cancelada'
  created_at: timestamp
  expires_at?: timestamp
}
```

#### 6. QuoteItem (Item da Cotação)
```typescript
{
  id: string
  quote_id: string
  product_id: string
  quantity: number
}
```

#### 7. QuoteSupplier (Fornecedor da Cotação)
```typescript
{
  id: string
  quote_id: string
  supplier_id: string
}
```

#### 8. QuotePrice (Preço na Cotação)
```typescript
{
  id: string
  quote_item_id: string
  supplier_id: string
  price: number
  created_at: timestamp
}
```

#### 9. Order (Pedido)
```typescript
{
  id: string
  company_id: string
  supplier_id: string
  quote_id?: string
  status: 'pendente' | 'confirmado' | 'entregue' | 'cancelado'
  total: number
  created_at: timestamp
}
```

#### 10. OrderItem (Item do Pedido)
```typescript
{
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
}
```

---

## 📱 Páginas do Sistema

### Públicas
| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Landing | Página inicial marketing |
| `/pricing` | Pricing | Planos e preços |
| `/auth` | Auth | Login/Cadastro |

### Protegidas (requer login)
| Rota | Página | Descrição |
|------|--------|-----------|
| `/dashboard` | Dashboard | Visão geral com métricas |
| `/dashboard/produtos` | Produtos | CRUD de produtos |
| `/dashboard/fornecedores` | Fornecedores | CRUD de fornecedores |
| `/dashboard/cotacoes` | Cotações | Gestão de cotações |
| `/dashboard/pedidos` | Pedidos | Lista de pedidos |
| `/dashboard/relatorios` | Relatórios | Analytics e histórico |
| `/dashboard/configuracoes` | Configurações | Perfil e empresa |
| `/dashboard/lista-compras` | Lista de Compras | Lista rápida |
| `/dashboard/contagem-estoque` | Contagem | Inventário |
| `/dashboard/anotacoes` | Anotações | Notas rápidas |

---

## 🔄 Fluxos Principais

### Fluxo de Cotação
```
1. Criar Cotação
   └── Selecionar produtos + quantidades
   └── Selecionar fornecedores participantes

2. Coletar Preços
   └── Cada fornecedor informa preço por produto
   └── Sistema calcula melhor preço automaticamente

3. Analisar Comparativo
   └── Ver tabela comparativa de preços
   └── Identificar economia potencial

4. Converter em Pedido
   └── Selecionar fornecedor vencedor (por produto ou total)
   └── Gerar pedido(s) automaticamente
```

### Fluxo de Pedido
```
1. Pedido Criado (status: pendente)
   └── Via cotação ou manual

2. Pedido Confirmado
   └── Fornecedor confirmou

3. Pedido Entregue
   └── Mercadoria recebida

4. Pedido Cancelado (opcional)
   └── Cancelamento por qualquer motivo
```

---

## 🎨 Design System

### Cores Principais
- **Primary**: Indigo/Blue (botões, links)
- **Success**: Green (economia, positivo)
- **Warning**: Amber/Orange (alertas, pendente)
- **Destructive**: Red (erros, excluir)
- **Muted**: Gray (textos secundários)

### Componentes UI (shadcn/ui)
- Button, Input, Select, Checkbox
- Card, Badge, Table
- Dialog, Sheet, Drawer
- Tabs, Accordion
- Toast, Sonner
- Skeleton, Loader

### Padrões de Layout
- **Desktop**: Sidebar fixa + conteúdo principal
- **Mobile**: Bottom navigation + conteúdo full-width
- **Cards**: Bordas arredondadas, sombra suave
- **Espaçamento**: Sistema de 4px (p-1, p-2, p-4, etc)

---

## 📈 Métricas e KPIs

### Dashboard
1. **Total de Produtos**: Quantidade cadastrada
2. **Cotações Ativas**: Em andamento
3. **Pedidos do Mês**: Quantidade no período
4. **Economia Total**: Soma das economias

### Cálculo de Economia
```
Para cada item da cotação:
  economia_item = maior_preco - menor_preco

economia_total = soma(economia_item)
percentual = (economia_total / soma_maior_preco) * 100
```

---

## 🔐 Autenticação e Autorização

### Roles
- **admin**: Acesso total, gerencia usuários
- **user**: CRUD completo, sem gerenciar usuários
- **viewer**: Apenas visualização

### Políticas RLS (Supabase)
- Usuários só veem dados da própria empresa
- Admin pode convidar/remover usuários
- Todos podem criar cotações e pedidos

---

## 🚀 Deploy

### Ambiente
- **Frontend**: Vercel ou Lovable
- **Backend**: Supabase (hosted)
- **Storage**: Supabase Storage (imagens)

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 📝 Lições Aprendidas (Problemas do Sistema Atual)

### O que evitar no novo sistema:

1. **Over-engineering de componentes responsivos**
   - Muitas abstrações (VirtualList, LazySection, etc)
   - Solução: Usar CSS simples com Tailwind

2. **Animações pesadas**
   - framer-motion causava lag no mobile
   - Solução: Usar apenas CSS transitions simples

3. **Muitos MetricCards/HeroCards**
   - Sobrecarrega a UI no mobile
   - Solução: Mostrar apenas 2-3 métricas essenciais

4. **Dialogs complexos demais**
   - Muitos campos e abas
   - Solução: Formulários simples e diretos

5. **Lazy loading excessivo**
   - Muitos Suspense boundaries
   - Solução: Lazy load apenas nas rotas principais

6. **Hooks muito acoplados**
   - Muita lógica nos hooks
   - Solução: Hooks simples, lógica nos componentes

---

## ✅ Checklist para Novo Sistema

- [ ] Setup Vite + React + TypeScript
- [ ] Configurar Tailwind + shadcn/ui
- [ ] Conectar Supabase
- [ ] Criar tabelas no banco
- [ ] Implementar Auth
- [ ] Layout responsivo (mobile-first)
- [ ] Dashboard com métricas
- [ ] CRUD Produtos
- [ ] CRUD Fornecedores
- [ ] Fluxo de Cotações
- [ ] Fluxo de Pedidos
- [ ] Configurações
- [ ] Testes básicos
- [ ] Deploy
