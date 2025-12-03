# Implementation Plan

## Summary

Este plano de implementação cobre a refatoração da página de Relatórios, focando em modularização, tipagem TypeScript, performance e testes. A análise do código atual mostra que muitos componentes já existem (ActivityHistory, ReportGenerator, DateRangePicker, PerformanceCharts, InsightsPanel, MetricCard), mas a página principal Relatorios.tsx ainda é muito grande (~1700 linhas) e precisa de refatoração.

---

- [x] 1. Criar tipos compartilhados para o módulo de relatórios





  - Criar arquivo `src/types/reports.ts` com interfaces para DateRange, ReportFilters, ReportType, ActivityItem, Estatisticas, Metric, e outros tipos compartilhados
  - Consolidar tipos duplicados de Relatorios.tsx e ReportGenerator.tsx
  - Exportar tipos para uso em componentes e hooks
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 2. Refatorar componentes de layout da página de Relatórios





  - [x] 2.1 Criar componente ReportsHeader


    - Extrair header com seletor de período, botões de refresh e exportação
    - Implementar interface ReportsHeaderProps conforme design
    - _Requirements: 1.1, 1.3, 5.4_
  - [x] 2.2 Criar componente PeriodDialog


    - Extrair dialog de seleção de período com presets e calendário customizado
    - Implementar validação de datas (end > start)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 2.3 Criar componente FiltersDialog


    - Extrair dialog de filtros avançados (fornecedores, produtos)
    - _Requirements: 1.4_
  - [x] 2.4 Write property test for date range validation





    - **Property 6: Date range validation**
    - **Validates: Requirements 7.3**

- [x] 3. Refatorar componentes da aba Analytics





  - [x] 3.1 Criar componente MetricsGrid para desktop


    - Renderizar 4 métricas em grid responsivo
    - Usar MetricCard existente
    - _Requirements: 2.1, 2.3_
  - [x] 3.2 Criar componente MetricsCarousel para mobile


    - Implementar carousel com navegação para métricas
    - _Requirements: 2.2_
  - [x] 3.3 Criar componente AnalyticsTab


    - Orquestrar MetricsGrid/Carousel, PerformanceCharts e InsightsPanel
    - Implementar lazy loading para charts
    - _Requirements: 2.4, 2.5_
  - [x] 3.4 Write property test for analytics metrics count






    - **Property 1: Analytics displays exactly 4 metrics**
    - **Validates: Requirements 2.1**

- [x] 4. Checkpoint - Verificar componentes de layout





  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Refatorar componentes da aba Relatórios





  - [x] 5.1 Criar componente ReportsTab


    - Orquestrar ReportGenerator existente
    - Adicionar ReportPreview para visualização de dados
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 5.2 Melhorar ReportGenerator com empty state


    - Adicionar mensagem informativa quando não há dados
    - _Requirements: 3.5_
  - [x] 5.3 Write property test for report type selection






    - **Property 2: Report type selection shows relevant options**
    - **Validates: Requirements 3.2**

- [x] 6. Refatorar componentes da aba Histórico




  - [x] 6.1 Criar componente HistoryTab

    - Wrapper para ActivityHistory com props adequadas
    - _Requirements: 4.1_
  - [x] 6.2 Melhorar ActivityHistory com ordenação

    - Garantir ordenação cronológica descendente
    - _Requirements: 4.1_
  - [x] 6.3 Write property test for activity chronological order





    - **Property 3: Activity list is chronologically ordered**
    - **Validates: Requirements 4.1**
  - [x] 6.4 Write property test for activity filtering





    - **Property 4: Activity filtering returns matching items**
    - **Validates: Requirements 4.2, 4.3**
  - [x] 6.5 Write property test for pagination





    - **Property 5: Pagination respects page size**
    - **Validates: Requirements 4.5**

- [x] 7. Checkpoint - Verificar componentes das abas





  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Refatorar página principal Relatorios.tsx





  - [x] 8.1 Simplificar Relatorios.tsx usando novos componentes


    - Substituir código inline pelos componentes extraídos
    - Reduzir arquivo para menos de 200 linhas
    - _Requirements: 1.1, 1.2_

  - [x] 8.2 Criar hook useDatePeriod

    - Extrair lógica de gerenciamento de período para hook customizado
    - _Requirements: 1.3, 7.5_
  - [x] 8.3 Implementar lazy loading das tabs


    - Usar React.lazy para carregar conteúdo das tabs sob demanda
    - _Requirements: 6.2_

- [x] 9. Otimizações de performance


  - [x] 9.1 Implementar memoização nos componentes
    - Usar React.memo nos componentes de lista e cards
    - _Requirements: 6.5_
  - [x] 9.2 Otimizar re-renders com useMemo e useCallback


    - Revisar dependências de hooks e callbacks
    - _Requirements: 6.5_

  - [x] 9.3 Adicionar skeleton loaders

    - Implementar loading states consistentes
    - _Requirements: 2.3, 6.3_

- [x] 10. Melhorias de UX e design





  - [x] 10.1 Implementar transições suaves entre tabs


    - Adicionar animações CSS para mudança de tabs
    - _Requirements: 5.2_
  - [x] 10.2 Padronizar estilos de cards e painéis


    - Aplicar design system consistente
    - _Requirements: 5.1, 5.3_

  - [x] 10.3 Melhorar feedback visual em botões

    - Adicionar estados hover e active
    - _Requirements: 5.4_

- [x] 11. Final Checkpoint - Verificar implementação completa





  - Ensure all tests pass, ask the user if questions arise.
