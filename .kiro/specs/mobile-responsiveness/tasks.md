# Implementation Plan

- [x] 1. Auditoria e limpeza de código mobile existente




  - [x] 1.1 Identificar e documentar padrões de duplicação existentes


    - Mapear todas as páginas com seções `{/* Mobile Cards View */}` e `{/* Desktop Table View */}`
    - Identificar código que renderiza ambas versões (mobile + desktop) no DOM
    - Listar componentes que usam CSS hiding (`md:hidden`, `hidden md:block`) em vez de renderização condicional
    - _Requirements: 6.5_
  - [x] 1.2 Criar utilitário de renderização condicional


    - Implementar componente `ConditionalRender` que renderiza apenas a versão correta baseado no breakpoint
    - Usar `useIsMobile` existente para evitar renderização dupla
    - Garantir que apenas UMA versão (mobile OU desktop) esteja no DOM por vez
    - _Requirements: 6.1, 6.5_

- [x] 2. Criar infraestrutura base de responsividade





  - [x] 2.1 Criar hook useBreakpoint para detecção de breakpoints


    - Implementar hook que retorna current breakpoint, isMobile, isTablet, isDesktop
    - Reutilizar lógica otimizada do useIsMobile existente
    - Adicionar suporte a SSR com fallback para desktop
    - _Requirements: 1.1, 1.2, 6.5_
  - [x] 2.2 Escrever property test para useBreakpoint






    - **Property 1: Modal rendering matches device type**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.3 Criar classes CSS utilitárias para mobile

    - Adicionar classes touch-target, p-responsive, gap-responsive, text-responsive
    - Configurar no tailwind.config.ts como plugin ou extend
    - _Requirements: 7.1, 9.1, 9.2_
  - [x] 2.4 Escrever property test para touch targets






    - **Property 6: Touch targets meet minimum size**
    - **Validates: Requirements 4.2, 7.1**

- [x] 3. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementar ResponsiveModal






  - [x] 4.1 Criar componente ResponsiveModal

    - Renderizar Drawer em mobile (width < 768px)
    - Renderizar Dialog em desktop/tablet (width >= 768px)
    - Aplicar max-height de 85vh em mobile
    - Incluir indicador de arraste no Drawer
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 4.2 Escrever property test para ResponsiveModal






    - **Property 1: Modal rendering matches device type**
    - **Property 2: Modal height constraint in mobile**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 5. Implementar ResponsiveTable




  - [x] 5.1 Criar componente ResponsiveTable com interface de colunas

    - Definir interface Column com propriedade priority (high/medium/low)
    - Implementar lógica de visibilidade baseada em breakpoint
    - _Requirements: 2.2, 2.3_
  - [x] 5.2 Implementar transformação para cards em mobile

    - Renderizar dados como cards empilhados em mobile
    - Manter informações agrupadas com hierarquia visual
    - Incluir menu de ações via dropdown
    - _Requirements: 2.1, 2.4, 2.5_
  - [x] 5.3 Escrever property tests para ResponsiveTable






    - **Property 3: Table transforms to cards in mobile**
    - **Property 4: Column visibility respects priority**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 6. Checkpoint - Garantir que todos os testes passam




  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implementar ResponsiveCard e grid system




  - [x] 7.1 Criar componente ResponsiveCard


    - Implementar variantes de tamanho (compact/default/large)
    - Aplicar padding responsivo automático (12px mobile, 16px tablet, 24px desktop)
    - Reduzir tamanho de ícones em 25% para mobile
    - _Requirements: 3.1, 3.5_
  - [x] 7.2 Criar componente ResponsiveGrid


    - Implementar grid de 2 colunas em mobile
    - Implementar grid de 2-3 colunas em tablet
    - Implementar grid de 4 colunas em desktop
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 7.3 Escrever property test para grid columns









    - **Property 5: Grid columns match breakpoint**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 8. Implementar formulários responsivos





  - [x] 8.1 Criar componente ResponsiveFormField


    - Empilhar campos verticalmente em mobile
    - Aplicar altura mínima de 44px para inputs
    - _Requirements: 4.1, 4.2_

  - [x] 8.2 Criar componente ResponsiveFormActions

    - Empilhar botões verticalmente em mobile com primário no topo
    - Manter layout horizontal em desktop
    - _Requirements: 4.3_

- [x] 9. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implementar otimizações de performance mobile





  - [x] 10.1 Criar utilitário de animações condicionais


    - Desabilitar hover effects em mobile
    - Reduzir duração de transições para 150ms em mobile
    - Criar classes CSS condicionais para animações
    - _Requirements: 6.1_
  - [x] 10.2 Escrever property test para animações






    - **Property 7: Animations disabled in mobile**
    - **Validates: Requirements 6.1**
  - [x] 10.3 Implementar lazy loading para imagens


    - Adicionar loading="lazy" em imagens
    - Implementar placeholder de baixa resolução
    - _Requirements: 6.3_

- [x] 11. Implementar tipografia responsiva






  - [x] 11.1 Criar classes de tipografia responsiva

    - Texto de corpo: mínimo 14px em mobile
    - Títulos: escala reduzida em 20% para mobile
    - Labels: mínimo 12px
    - Valores monetários: fonte tabular
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  - [x] 11.2 Escrever property test para font sizes






    - **Property 8: Font sizes respect mobile scale**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [-] 12. Implementar espaçamento responsivo




  - [x] 12.1 Criar classes de espaçamento responsivo





    - Padding horizontal: 16px em mobile
    - Gap entre seções: 16px em mobile
    - Headers compactos em mobile
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 12.2 Escrever property test para spacing





    - **Property 9: Spacing respects mobile scale**
    - **Validates: Requirements 9.1, 9.2**

- [x] 13. Checkpoint - Garantir que todos os testes passam








  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Migrar componentes existentes (REMOVER DUPLICAÇÕES)





  - [x] 14.1 Migrar modais existentes para ResponsiveModal


    - Identificar todos os Dialog usados no sistema
    - Substituir por ResponsiveModal mantendo funcionalidade
    - _Requirements: 1.1, 1.2_
  - [x] 14.2 Migrar tabelas existentes para ResponsiveTable


    - Identificar páginas com código duplicado: Cotacoes.tsx, Pedidos.tsx, Fornecedores.tsx
    - REMOVER seções `{/* Mobile Cards View */}` e `{/* Desktop Table View */}` duplicadas
    - Substituir por ResponsiveTable que usa renderização condicional (não CSS hiding)
    - Definir prioridades de colunas
    - _Requirements: 2.1, 2.2, 2.3, 6.5_
  - [x] 14.3 Migrar cards de métricas para ResponsiveCard

    - Atualizar MetricCard para usar ResponsiveCard
    - Aplicar grid responsivo no Dashboard
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 15. Implementar navegação responsiva







  - [x] 15.1 Atualizar sidebar para mobile




    - Converter para menu hamburger em mobile
    - Implementar drawer lateral com 80% de largura
    - Fechar ao tocar fora
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 15.2 Implementar tabs responsivas




    - Converter para scroll horizontal em mobile
    - Adicionar indicador de mais itens
    - _Requirements: 5.5_
  - [x] 15.3 Implementar paginação responsiva




    - Simplificar para prev/next em mobile
    - Manter indicador de página atual
    - _Requirements: 9.5_

- [x] 16. Implementar filtros responsivos






  - [x] 16.1 Criar componente ResponsiveFilters

    - Colapsar filtros em botão em mobile
    - Abrir drawer de filtros ao clicar
    - _Requirements: 9.4_

- [x] 17. Final Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.
