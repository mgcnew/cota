# Implementation Plan

## Fase 1: Infraestrutura e Componentes Base

- [x] 1. Criar/Aprimorar componentes reutilizáveis de infraestrutura





  - [x] 1.1 Criar componente PageSkeleton com variantes (dashboard, list, grid, form)


    - Implementar skeleton que replica estrutura de cada tipo de página
    - Usar Skeleton existente como base
    - _Requirements: 1.1, 10.1_


  - [x] 1.2 Criar componente VirtualList wrapper para react-window
    - Implementar threshold configurável (default 20 itens)
    - Suportar altura fixa e variável
    - _Requirements: 2.1, 4.5, 13.5, 15.5_
  - [x] 1.3 Write property test for VirtualList threshold






    - **Property 3: Virtualization Threshold**
    - **Validates: Requirements 2.1, 4.5**
  - [x] 1.4 Aprimorar LazyImage com blur placeholder e WebP support


    - Adicionar blur-up effect durante carregamento
    - Implementar fallback para formatos não suportados
    - _Requirements: 2.4, 17.1, 17.2_
  - [ ]* 1.5 Write property test for LazyImage loading behavior
    - **Property 13: Image Lazy Loading**
    - **Validates: Requirements 2.4, 17.1**

  - [x] 1.6 Criar componente InfiniteScroll com intersection observer

    - Implementar threshold configurável
    - Adicionar loading indicator
    - _Requirements: 5.3, 14.3_
  - [x] 1.7 Criar componente MobileFilters (bottom sheet para filtros)


    - Usar ResponsiveModal como base
    - Implementar apply/reset actions
    - _Requirements: 7.4_

- [x] 2. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

## Fase 2: Otimização de Animações e Touch

- [x] 3. Implementar sistema de animações otimizadas





  - [x] 3.1 Criar utilitário de animações CSS-only


    - Definir classes para transform/opacity only
    - Implementar durations (150ms hover, 200ms transition, 300ms modal)
    - _Requirements: 11.1, 11.4, 11.5_
  - [x] 3.2 Write property test for animation duration limits






    - **Property 8: Animation Duration Limits**
    - **Validates: Requirements 3.2, 7.5, 9.3, 11.5**

  - [x] 3.3 Implementar suporte a prefers-reduced-motion

    - Adicionar classes motion-reduce
    - Desabilitar animações não essenciais
    - _Requirements: 11.2_
  - [x] 3.4 Write property test for reduced motion respect






    - **Property 12: Reduced Motion Respect**
    - **Validates: Requirements 11.2**

  - [x] 3.5 Criar utilitário de touch targets

    - Definir classes para min 44x44px
    - Aplicar em botões e elementos interativos
    - _Requirements: 2.5, 18.1_
  - [x] 3.6 Write property test for touch target minimum size






    - **Property 4: Touch Target Minimum Size**
    - **Validates: Requirements 2.5, 18.1**

- [x] 4. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

## Fase 3: Refatoração da Página Dashboard

- [x] 5. Refatorar página Dashboard para performance mobile





  - [x] 5.1 Implementar DashboardSkeleton específico


    - Criar skeleton que replica hero cards + metrics + charts
    - Mostrar em < 100ms
    - _Requirements: 1.1, 1.5_
  - [x] 5.2 Otimizar ResponsiveGrid para CSS-only layout


    - Remover qualquer JS para detecção de breakpoint no layout
    - Usar apenas Tailwind responsive classes
    - _Requirements: 1.2_
  - [x] 5.3 Write property test for CSS Grid layout








    - **Property 1: CSS Grid Layout Without JavaScript**
    - **Validates: Requirements 1.2**
  - [x] 5.4 Implementar lazy loading para charts


    - Usar React.lazy para EvolutionChart e EconomyChart
    - Carregar após métricas principais
    - _Requirements: 1.3_
  - [x] 5.5 Otimizar MetricCard para mobile


    - Garantir touch targets adequados
    - Simplificar layout em telas pequenas
    - _Requirements: 1.4_

- [x] 6. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

## Fase 4: Refatoração da Página Produtos



- [x] 7. Refatorar página Produtos para performance mobile



  - [x] 7.1 Implementar virtualização na lista de produtos


    - Usar VirtualList para listas > 20 itens
    - Manter scroll suave
    - _Requirements: 2.1_

  - [x] 7.2 Otimizar ProductCard para mobile

    - Layout single-column em mobile
    - Touch-optimized spacing
    - _Requirements: 2.2_
  - [x] 7.3 Write property test for mobile card layout















    - **Property 5: Mobile Card Layout**
    - **Validates: Requirements 3.1**

  - [x] 7.4 Verificar debounce no filtro de busca

    - Confirmar 300ms delay no useDebounce
    - _Requirements: 2.3_
  - [x] 7.5 Write property test for debounced search






    - **Property 14: Debounced Search Input**
    - **Validates: Requirements 2.3**
  - [x] 7.6 Implementar lazy loading para imagens de produtos


    - Usar LazyImage com skeleton placeholder
    - _Requirements: 2.4_

  - [x] 7.7 Garantir touch targets em botões de ação

    - Verificar min 44x44px em todos os botões
    - _Requirements: 2.5_

- [x] 8. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

## Fase 5: Refatoração da Página Cotações

- [x] 9. Refatorar página Cotações para performance mobile





  - [x] 9.1 Implementar cards em vez de tabela no mobile


    - Usar view condicional baseado em breakpoint
    - Cards com informações essenciais
    - _Requirements: 3.1_

  - [x] 9.2 Otimizar transição grid/table

    - Animação < 200ms
    - Usar transform/opacity
    - _Requirements: 3.2_

  - [x] 9.3 Implementar paginação com batch de 10 itens

    - Configurar usePagination com pageSize 10
    - _Requirements: 3.3_


  - [x] 9.4 Write property test for pagination batch size









    - **Property 15: Pagination Batch Size**
    - **Validates: Requirements 3.3**
  - [x] 9.5 Padronizar uso de StatusBadge


    - Usar componente compartilhado para todos os status
    - _Requirements: 3.4_
  - [x] 9.6 Write property test for StatusBadge consistency





    - **Property 7: StatusBadge Consistency**
    - **Validates: Requirements 3.4, 5.4**
  - [x] 9.7 Usar ResponsiveModal para modais de cotação


    - Bottom sheet no mobile, dialog no desktop
    - _Requirements: 3.5_
  - [x] 9.8 Write property test for modal pattern by viewport






    - **Property 6: Modal Pattern by Viewport**
    - **Validates: Requirements 3.5, 5.5, 9.1, 9.2**

- [x] 10. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

## Fase 6: Refatoração da Página Fornecedores

- [x] 11. Refatorar página Fornecedores para performance mobile



  - [x] 11.1 Otimizar renderização above-the-fold


    - Priorizar métricas e primeiros cards
    - Lazy load conteúdo abaixo
    - _Requirements: 4.1_

  - [x] 11.2 Implementar cards com detalhes expansíveis
    - Info essencial visível, detalhes em accordion

    - _Requirements: 4.2_
  - [x] 11.3 Otimizar botão WhatsApp para resposta rápida

    - Garantir handler otimizado
    - _Requirements: 4.3_
  - [x] 11.4 Implementar persistência de filtros
    - Salvar estado em URL params ou context
    - _Requirements: 4.4_
  - [x] 11.5 Write property test for filter state persistence







    - **Property 20: Filter State Persistence**
    - **Validates: Requirements 4.4, 14.4**
  - [x] 11.6 Implementar virtualização para lista > 15 itens

    - Usar VirtualList com threshold 15
    - _Requirements: 4.5_

- [x] 12. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

## Fase 7: Refatoração da Página Pedidos

- [x] 13. Refatorar página Pedidos para performance mobile





  - [x] 13.1 Implementar skeleton loading para todas as seções


    - Criar PedidosSkeleton específico
    - _Requirements: 5.1_
  - [x] 13.2 Write property test for loading state consistency






    - **Property 2: Loading State Consistency**
    - **Validates: Requirements 1.5, 5.1, 10.1, 10.2**

  - [x] 13.3 Otimizar OrderCard com memoization

    - Usar React.memo para evitar re-renders
    - _Requirements: 5.2_

  - [x] 13.4 Implementar infinite scroll com batch de 10

    - Usar InfiniteScroll component
    - _Requirements: 5.3_

  - [x] 13.5 Padronizar StatusBadge para status de pedidos

    - Usar mesmo componente de Cotações
    - _Requirements: 5.4_

  - [x] 13.6 Usar ResponsiveModal para detalhes do pedido

    - Bottom sheet no mobile
    - _Requirements: 5.5_

- [x] 14. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

## Fase 8: Refatoração da Página Relatórios

- [x] 15. Refatorar página Relatórios para performance mobile





  - [x] 15.1 Implementar lazy loading para charts


    - Usar React.lazy para componentes de gráfico
    - _Requirements: 6.1_
  - [x] 15.2 Criar variantes simplificadas de charts para mobile


    - Reduzir pontos de dados, simplificar legendas
    - _Requirements: 6.2_
  - [x] 15.3 Implementar progress indicator para geração de relatórios


    - Mostrar progresso durante processamento
    - _Requirements: 6.3_
  - [x] 15.4 Otimizar DateRangePicker para mobile


    - Usar bottom sheet para seleção de datas
    - _Requirements: 6.4_
  - [x] 15.5 Implementar toast feedback para exportação


    - Notificar sucesso/erro via toast
    - _Requirements: 6.5_

- [x] 16. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

## Fase 9: Refatoração da Página Analytics

- [x] 17. Refatorar página Analytics para performance mobile




  - [x] 17.1 Priorizar renderização de métricas-chave


    - Carregar insights principais primeiro
    - _Requirements: 7.1_

  - [x] 17.2 Implementar carousel swipeable para insight cards

    - Usar embla-carousel ou similar
    - _Requirements: 7.2_

  - [x] 17.3 Simplificar charts para mobile

    - Versões otimizadas para telas pequenas
    - _Requirements: 7.3_
  - [x] 17.4 Usar MobileFilters para filtros


    - Bottom sheet com opções de filtro
    - _Requirements: 7.4_
  - [x] 17.5 Otimizar animações de atualização de dados


    - Transições suaves < 300ms
    - _Requirements: 7.5_

- [x] 18. Checkpoint - Garantir que todos os testes passam



  - Ensure all tests pass, ask the user if questions arise.

## Fase 10: Refatoração da Página Configurações

- [x] 19. Refatorar página Configurações para performance mobile
  - [x] 19.1 Implementar accordion para seções no mobile
    - Seções colapsáveis para melhor navegação
    - _Requirements: 8.1_
  - [ ]* 19.2 Write property test for collapsible sections
    - **Property 19: Collapsible Sections on Mobile**
    - **Validates: Requirements 8.1**
  - [x] 19.3 Manter scroll position entre seções
    - Preservar posição ao expandir/colapsar
    - _Requirements: 8.2_
  - [x] 19.4 Otimizar inputs para mobile
    - Usar inputMode correto (numeric, email, tel)
    - _Requirements: 8.3_
  - [ ]* 19.5 Write property test for mobile input types
    - **Property 18: Mobile Typography Minimum**
    - **Validates: Requirements 18.3**
  - [x] 19.6 Implementar feedback visual ao salvar
    - Loading state + toast de confirmação
    - _Requirements: 8.4_
  - [x] 19.7 Implementar compressão de imagens no upload

    - Comprimir para max 500KB antes de upload
    - _Requirements: 8.5_

- [x] 20. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

## Fase 11: Páginas Secundárias

- [x] 21. Refatorar páginas secundárias (Lista de Compras, Histórico, Contagem)





  - [x] 21.1 Otimizar Lista de Compras para touch


    - Cards touch-friendly, stepper para quantidades
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 21.2 Implementar virtualização na Lista de Compras

    - VirtualList para listas longas
    - _Requirements: 13.5_

  - [x] 21.3 Otimizar Histórico com agrupamento por data

    - Seções colapsáveis por data
    - _Requirements: 14.1, 14.2_

  - [x] 21.4 Implementar infinite scroll no Histórico

    - Carregar dados antigos sob demanda
    - _Requirements: 14.3_

  - [x] 21.5 Usar tempo relativo no mobile
    - "há 2 horas" em vez de timestamp completo

    - _Requirements: 14.5_
  - [x] 21.6 Otimizar Contagem de Estoque para scanner

    - Input focado, teclado numérico
    - _Requirements: 15.1, 15.2_

  - [x] 21.7 Implementar feedback de salvamento

    - Confirmação visual imediata
    - _Requirements: 15.3_

  - [x] 21.8 Implementar queue offline para contagem

    - Salvar localmente se offline
    - _Requirements: 15.4_

- [ ] 22. Checkpoint - Garantir que todos os testes passam
  - Ensure all tests pass, ask the user if questions arise.

## Fase 12: Páginas de Entrada (Landing, Auth, Pricing)

- [ ] 23. Otimizar páginas de entrada
  - [ ] 23.1 Otimizar Landing para first contentful paint
    - Above-the-fold em < 1s
    - _Requirements: 16.1_
  - [ ] 23.2 Implementar autofocus no Auth
    - Focar primeiro input automaticamente
    - _Requirements: 16.2_
  - [ ] 23.3 Usar ResponsiveGrid no Pricing
    - Cards de preço em grid responsivo
    - _Requirements: 16.3_
  - [ ] 23.4 Implementar loading state em forms
    - Desabilitar submit + loading indicator
    - _Requirements: 16.4_
  - [ ]* 23.5 Write property test for form submit loading state
    - **Property 17: Form Submit Loading State**
    - **Validates: Requirements 16.4**
  - [ ] 23.6 Implementar prefetch de páginas prováveis
    - Preload Dashboard após login
    - _Requirements: 16.5_

- [ ] 24. Checkpoint - Garantir que todos os testes passam
  - Ensure all tests pass, ask the user if questions arise.

## Fase 13: Lazy Loading e Code Splitting

- [ ] 25. Implementar lazy loading global
  - [ ] 25.1 Configurar React.lazy para todas as páginas
    - Cada página em chunk separado
    - _Requirements: 12.1, 12.2_
  - [ ]* 25.2 Write property test for lazy loading pages
    - **Property 9: Lazy Loading for Pages**
    - **Validates: Requirements 12.2**
  - [ ] 25.3 Implementar lazy loading para dialogs
    - Carregar dialogs apenas quando necessário
    - _Requirements: 12.3_
  - [ ]* 25.4 Write property test for lazy loading dialogs
    - **Property 10: Lazy Loading for Dialogs**
    - **Validates: Requirements 12.3**
  - [ ] 25.5 Separar chart library em chunk próprio
    - Recharts em bundle separado
    - _Requirements: 12.4_
  - [ ] 25.6 Implementar intersection observer para conteúdo off-screen
    - Lazy load seções abaixo do fold
    - _Requirements: 12.5_

- [ ] 26. Checkpoint - Garantir que todos os testes passam
  - Ensure all tests pass, ask the user if questions arise.

## Fase 14: Otimização de Imagens e Assets

- [ ] 27. Otimizar imagens e assets
  - [ ] 27.1 Implementar blur placeholder em todas as imagens
    - Usar LazyImage consistentemente
    - _Requirements: 17.1_
  - [ ] 27.2 Configurar WebP com fallback
    - Servir WebP quando suportado
    - _Requirements: 17.2_
  - [ ] 27.3 Otimizar tamanhos de avatar
    - Thumbnails otimizados por contexto
    - _Requirements: 17.3_
  - [ ] 27.4 Verificar uso de SVG para ícones
    - Lucide icons já são SVG
    - _Requirements: 17.4_
  - [ ] 27.5 Implementar compressão de upload
    - Max 500KB para imagens enviadas
    - _Requirements: 17.5_

- [ ] 28. Checkpoint - Garantir que todos os testes passam
  - Ensure all tests pass, ask the user if questions arise.

## Fase 15: Consistência Visual e Acessibilidade

- [ ] 29. Garantir consistência visual e acessibilidade
  - [ ] 29.1 Auditar e corrigir touch targets
    - Verificar todos os botões têm min 44x44px
    - _Requirements: 18.1_
  - [ ] 29.2 Padronizar spacing scale
    - Usar escala de 4px consistentemente
    - _Requirements: 18.2_
  - [ ] 29.3 Verificar tipografia mobile
    - Body text min 16px no mobile
    - _Requirements: 18.3_
  - [ ] 29.4 Verificar contraste de cores
    - WCAG AA compliance
    - _Requirements: 18.4_
  - [ ] 29.5 Implementar feedback visual em touch
    - Active states em elementos interativos
    - _Requirements: 18.5_

- [ ] 30. Checkpoint - Garantir que todos os testes passam
  - Ensure all tests pass, ask the user if questions arise.

## Fase 16: Error Handling e Estados de Erro

- [ ] 31. Implementar error handling consistente
  - [ ] 31.1 Criar componente ErrorState reutilizável
    - Mensagem de erro + botão retry
    - _Requirements: 10.5_
  - [ ]* 31.2 Write property test for error state with retry
    - **Property 16: Error State with Retry**
    - **Validates: Requirements 10.5**
  - [ ] 31.3 Implementar ErrorBoundary em páginas
    - Capturar erros de render
    - _Requirements: 10.5_
  - [ ] 31.4 Implementar fade-in ao completar loading
    - Transição suave < 200ms
    - _Requirements: 10.4_
  - [ ]* 31.5 Write property test for transform-only animations
,    - **Property 11: Transform-Only Animations**
    - **Validates: Requirements 11.1, 11.4**

- [ ] 32. Final Checkpoint - Garantir que todos os testes passam
  - Ensure all tests pass, ask the user if questions arise.
