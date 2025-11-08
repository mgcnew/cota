# Otimizações Mobile - Página de Produtos

## 📊 Resumo das Otimizações

Esta documentação descreve todas as otimizações implementadas para melhorar o desempenho da página de produtos no mobile.

## 🎯 Objetivos Alcançados

1. ✅ **Hooks específicos para mobile** - Todos os hooks foram otimizados para o contexto mobile
2. ✅ **Lazy loading avançado** - Componentes e imagens carregam apenas quando necessários
3. ✅ **Filtros server-side** - Redução de processamento no cliente
4. ✅ **Virtualização otimizada** - Renderização apenas de itens visíveis
5. ✅ **Zero efeitos pesados** - Remoção de cálculos desnecessários
6. ✅ **Cache agressivo** - Redução de requisições ao servidor

## 🔧 Hooks Criados/Otimizados

### 1. `useDebounceMobile`
**Localização:** `src/hooks/mobile/useDebounceMobile.ts`

**Otimizações:**
- Delay reduzido para 300ms (vs 400ms desktop)
- Usa `useRef` para evitar re-renders desnecessários
- Verificação de mudanças antes de criar timeout
- Limpeza adequada de timeouts

**Benefício:** Reduz requisições ao servidor durante digitação

### 2. `useIntersectionObserver`
**Localização:** `src/hooks/mobile/useIntersectionObserver.ts`

**Otimizações:**
- Lazy loading de componentes e imagens
- Suporte para `triggerOnce` (desconecta após primeira intersecção)
- Fallback para navegadores antigos
- Configurável via `threshold` e `rootMargin`

**Benefício:** Componentes renderizam apenas quando próximos da viewport

### 3. `useCategoriesMobile`
**Localização:** `src/hooks/mobile/useCategoriesMobile.ts`

**Otimizações:**
- Busca categorias do servidor (não calcula no cliente)
- Cache agressivo (5 minutos)
- Query otimizada (apenas campo `category`)
- Usa `Set` para remover duplicatas eficientemente

**Benefício:** Reduz processamento no cliente e melhora performance

### 4. `useThrottledResize`
**Localização:** `src/hooks/mobile/useThrottledResize.ts`

**Otimizações:**
- Usa `ResizeObserver` quando disponível (mais performático)
- Throttling com `requestAnimationFrame`
- Fallback para `addEventListener` com throttling
- Limpeza adequada de observers e listeners

**Benefício:** Reduz recálculos durante scroll/resize

### 5. `useProductsMobileOptimized`
**Localização:** `src/hooks/mobile/useProductsMobileOptimized.ts`

**Otimizações:**
- Paginação server-side (20 itens por página)
- Filtro de categoria no servidor
- Busca server-side
- Apenas campos essenciais na query
- Cache agressivo via `useMobileQueryConfig`

**Benefício:** Reduz carga inicial e melhora tempo de resposta

### 6. `useServerPagination` (Otimizado)
**Localização:** `src/hooks/mobile/useServerPagination.ts`

**Correções:**
- Corrigido bug de `setPageSize` recursivo
- Callbacks memoizados com `useCallback`
- Reset automático para página 1 ao mudar busca/filtro

**Benefício:** Paginação fluida sem bugs

## 🎨 Componentes Criados/Otimizados

### 1. `MobileProductItemOptimized`
**Localização:** `src/components/mobile/products/MobileProductItemOptimized.tsx`

**Otimizações:**
- Lazy loading com `IntersectionObserver`
- Renderização condicional (placeholder enquanto não visível)
- CSS `containment` para isolamento de layout
- Tratamento de erros de imagem
- Botões com estados `active` para melhor feedback tátil

**Benefício:** Renderiza apenas itens visíveis, reduzindo DOM e melhorando scroll

### 2. `MobileProductsVirtualListOptimized`
**Localização:** `src/components/mobile/products/MobileProductsVirtualListOptimized.tsx`

**Otimizações:**
- Virtualização com `requestAnimationFrame` para scroll
- Usa `useThrottledResize` para altura do container
- OVERSCAN aumentado para 3 (melhor UX durante scroll)
- CSS `containment` para isolamento
- Loading states melhorados

**Benefício:** Scroll fluido mesmo com muitos itens

### 3. `ProdutosMobileOptimized`
**Localização:** `src/pages/ProdutosMobileOptimized.tsx`

**Otimizações:**
- Todos os dialogs com lazy loading
- Suspense com fallbacks customizados
- Handlers memoizados com `useCallback`
- Filtros server-side
- Busca com debounce otimizado

**Benefício:** Página carrega apenas o necessário, melhorando tempo inicial

## 📈 Métricas de Performance Esperadas

### Antes das Otimizações
- **Tempo de carregamento inicial:** ~2-3s
- **Itens renderizados:** Todos (mesmo fora da viewport)
- **Requisições ao servidor:** Múltiplas (cada mudança de filtro)
- **Cálculo de categorias:** No cliente (processamento pesado)
- **Scroll performance:** Lag com muitos itens

### Depois das Otimizações
- **Tempo de carregamento inicial:** ~0.5-1s
- **Itens renderizados:** Apenas visíveis (~3-5 itens)
- **Requisições ao servidor:** Reduzidas (cache agressivo, debounce)
- **Cálculo de categorias:** No servidor (cache)
- **Scroll performance:** Fluido mesmo com milhares de itens

## 🚀 Como Usar

A página de produtos automaticamente usa a versão otimizada no mobile:

```tsx
// src/pages/Produtos.tsx
// Router automático baseado em useMobile()
if (isMobile) {
  return <ProdutosMobileOptimized />;
}
return <ProdutosDesktop />;
```

## 🔍 Debugging

### Verificar se está usando versão otimizada
1. Abra DevTools
2. Vá para Network
3. Filtre por "products"
4. Verifique se as queries têm `products-mobile-optimized` no nome

### Verificar lazy loading
1. Abra DevTools > Elements
2. Procure por produtos
3. Apenas itens visíveis devem estar no DOM
4. Itens fora da viewport devem ter placeholder

### Verificar cache
1. Abra DevTools > Application > Cache Storage
2. Verifique se há cache do React Query
3. TTL deve ser de 5 minutos (mobile)

## 📝 Notas Técnicas

### Lazy Loading de Imagens
- Usa `IntersectionObserver` com `rootMargin: 100px`
- Carrega imagens antes de ficarem visíveis
- Fallback para inicial de nome do produto

### Virtualização
- Altura fixa de item: 100px
- OVERSCAN: 3 itens (renderiza 3 itens acima/abaixo da viewport)
- Usa `requestAnimationFrame` para scroll suave

### Cache Strategy
- **Mobile:** 5 minutos de staleTime, 10 minutos de gcTime
- **Desktop:** 30 segundos de staleTime, 5 minutos de gcTime
- **Refetch:** Desabilitado no mobile (usa cache)

### Paginação
- **Mobile:** 20 itens por página
- **Desktop:** 50 itens por página
- Reset automático para página 1 ao mudar filtros

## 🐛 Problemas Conhecidos

### 1. IntersectionObserver não disponível
**Solução:** Fallback para renderização imediata

### 2. ResizeObserver não disponível
**Solução:** Fallback para `addEventListener('resize')`

### 3. Primeira renderização pode ser lenta
**Causa:** Carregamento inicial de categorias
**Solução:** Cache agressivo na segunda visita

## 🔄 Próximas Otimizações Possíveis

1. **Service Worker** - Cache offline de produtos
2. **WebP Images** - Conversão automática de imagens
3. **Compression** - Brotli/Gzip para responses
4. **Prefetching** - Carregar próximos itens antecipadamente
5. **IndexedDB** - Cache local para offline

## 📚 Referências

- [React Query - Performance](https://tanstack.com/query/latest/docs/react/guides/window-focus-refetching)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Containment)
- [Virtual Scrolling](https://web.dev/virtualize-long-lists-react-window/)

