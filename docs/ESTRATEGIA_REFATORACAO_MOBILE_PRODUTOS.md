# Estratégia de Refatoração Completa - Página Produtos Mobile

## 🎯 Objetivo
Refazer completamente a página de produtos para mobile do zero, com boas práticas, sem afetar o desktop.

## 📋 Estratégia de Separação

### 1. Estrutura de Arquivos
```
src/pages/
  ├── Produtos.tsx          # Router: apenas detecta mobile e redireciona
  ├── ProdutosDesktop.tsx   # Versão desktop (extrair código atual)
  └── ProdutosMobile.tsx    # Versão mobile (nova, do zero)

src/hooks/
  ├── useProducts.ts        # Hook desktop (manter como está)
  └── mobile/
      └── useProductsMobile.ts  # Hook mobile (otimizado)
```

### 2. Princípios de Separação

#### ✅ O que fazer:
- **Separação total**: Mobile e Desktop são componentes completamente diferentes
- **Hooks dedicados**: Cada versão usa seu próprio hook
- **Code splitting**: Lazy load do componente mobile no desktop
- **Zero dependências cruzadas**: Mobile não importa nada do desktop

#### ❌ O que NÃO fazer:
- Não compartilhar lógica complexa entre mobile/desktop
- Não usar condicionais `isMobile` dentro do componente principal
- Não misturar tipos Product e ProductMobile

### 3. Arquitetura Mobile (Nova)

#### 3.1 Componentes Mobile
```
src/components/mobile/products/
  ├── MobileProductsPage.tsx        # Container principal
  ├── MobileProductsHeader.tsx      # Header com busca
  ├── MobileProductsList.tsx        # Lista virtualizada
  ├── MobileProductCard.tsx         # Card otimizado
  ├── MobileFiltersSheet.tsx        # Bottom sheet de filtros
  └── MobileProductActions.tsx      # Ações (swipe, menu)
```

#### 3.2 Hooks Mobile
```
src/hooks/mobile/
  ├── useProductsMobile.ts          # Query principal
  ├── useProductSearch.ts           # Busca otimizada
  ├── useProductFilters.ts          # Filtros
  └── useProductActions.ts          # Ações (CRUD)
```

### 4. Performance Mobile

#### 4.1 Otimizações Obrigatórias
- ✅ Virtualização de lista (react-window ou @tanstack/react-virtual)
- ✅ Lazy loading de imagens
- ✅ Debounce de busca (300ms)
- ✅ Paginação server-side (20 itens por página)
- ✅ Memoização de componentes
- ✅ Code splitting (lazy import)

#### 4.2 Bundle Size
- Meta: < 150KB gzip para mobile
- Evitar imports pesados no mobile
- Tree shaking ativo

### 5. UX Mobile

#### 5.1 Padrões Mobile-First
- Bottom navigation para ações principais
- Swipe actions para ações rápidas
- Pull-to-refresh
- Bottom sheets para filtros
- Gestos nativos (swipe, long press)

#### 5.2 Feedback Visual
- Skeleton loaders
- Transições suaves
- Feedback tátil (se disponível)
- Loading states claros

## 🔧 Implementação

### Fase 1: Preparação
1. Extrair código desktop para `ProdutosDesktop.tsx`
2. Criar `Produtos.tsx` como router simples
3. Criar estrutura de pastas mobile

### Fase 2: Componentes Base
1. Criar componentes mobile básicos
2. Implementar virtualização
3. Implementar busca e filtros

### Fase 3: Integração
1. Integrar com hooks mobile
2. Adicionar ações (CRUD)
3. Adicionar dialogs mobile

### Fase 4: Otimização
1. Code splitting
2. Lazy loading
3. Performance tuning

## 🚫 Garantias

### Desktop não será afetado porque:
- Componente desktop é completamente separado
- Hooks são independentes
- Nenhuma lógica compartilhada
- Imports condicionais (lazy)

### Outras páginas não serão afetadas porque:
- Apenas `Produtos.tsx` muda (router simples)
- Nenhuma dependência exportada muda
- Hooks mantêm mesma interface pública

