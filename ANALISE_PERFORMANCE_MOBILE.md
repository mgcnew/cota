# Análise de Performance Mobile - CotaJá

## Resumo Executivo

Após análise minuciosa do código, identifiquei os seguintes problemas críticos que causam travamentos e má experiência no mobile:

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. **Travamento ao Abrir Menu Hamburguer**
**Causa**: O `Sheet` (menu lateral mobile) usa animações CSS pesadas (`animate-in`, `animate-out`, `slide-in-from-left`) que competem com o main thread.

**Solução**: 
- Usar `will-change: transform` para GPU acceleration
- Reduzir duração das animações de 200ms para 150ms no mobile
- Adicionar `overscroll-behavior: contain` para evitar scroll propagation

### 2. **Backdrop-blur no Header**
**Causa**: `backdrop-blur-xl` no header é extremamente pesado em dispositivos móveis, causando repaint constante durante scroll.

**Solução**: Remover ou reduzir drasticamente o blur no mobile.

### 3. **Modais sem Drawer no Mobile**
**Causa**: Vários dialogs usam `Dialog` em vez de `ResponsiveModal`, forçando modais centralizados que são difíceis de usar no mobile.

**Arquivos afetados**:
- `Dashboard.tsx` - Dialog de atividades
- `CotacoesTab.tsx` - Dialogs lazy-loaded
- Vários outros componentes

### 4. **Listas Grandes sem Virtualização**
**Causa**: Produtos (2381 itens) e outras listas são renderizadas com paginação simples, mas ainda carregam muitos elementos no DOM.

**Solução**: Implementar `VirtualList` para listas com mais de 20 itens.

### 5. **CSS Pesado Global**
**Causa**: 
- Muitas animações CSS com `transition-all duration-300`
- Hover effects aplicados globalmente (incluindo mobile)
- Gradientes complexos em cards

---

## 🟡 PROBLEMAS MODERADOS

### 6. **Tooltips em Mobile**
Tooltips não funcionam bem em touch devices e adicionam overhead.

### 7. **Múltiplos Re-renders**
- `useMemo` e `useCallback` não estão sendo usados consistentemente
- Queries do React Query podem causar re-renders desnecessários

### 8. **Imagens sem Lazy Loading Consistente**
`LazyImage` existe mas não é usado em todos os lugares.

### 9. **Scroll não Fluido**
- `overflow-y: auto !important` forçado globalmente
- Scrollbar hidden com CSS pesado

---

## 📋 PLANO DE AÇÃO (Priorizado)

### Fase 1: Correções Críticas (Imediato)
1. ✅ Otimizar Sheet/Drawer para mobile
2. ✅ Remover backdrop-blur no mobile
3. ✅ Converter Dialog → ResponsiveModal nos componentes principais
4. ✅ Adicionar CSS de performance mobile

### Fase 2: Otimizações de Lista
5. Implementar VirtualList em Produtos
6. Implementar VirtualList em Cotações
7. Lazy load de imagens consistente

### Fase 3: Polish
8. Remover hover effects no mobile
9. Otimizar animações de transição
10. Melhorar touch targets (44px mínimo)

---

## Arquivos a Modificar

1. `src/index.css` - CSS de performance mobile
2. `src/components/ui/sheet.tsx` - Otimizar animações
3. `src/components/layout/AppLayout.tsx` - Remover blur mobile
4. `src/components/layout/AppSidebar.tsx` - Otimizar menu mobile
5. `src/pages/Dashboard.tsx` - Usar ResponsiveModal
6. `src/components/compras/CotacoesTab.tsx` - Usar ResponsiveModal
7. `src/pages/Produtos.tsx` - VirtualList

---

## Métricas de Sucesso

- [ ] Tempo de First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Scroll sem jank (60fps)
- [ ] Menu abre sem travamento
- [ ] Modais com drawer no mobile
