Entendido. Focaremos a implementação das correções de teclado especificamente no **`AddPackagingQuoteDialog`** (Nova Cotação), onde ocorre a seleção de produtos. Ele servirá como o "piloto" para validarmos a solução antes de replicar.

### Plano Refinado:

1.  **Atualização Global (`index.html`)**:
    *   Adicionar `interactive-widget=resizes-content`. Isso já deve resolver 80% dos casos no Android automaticamente para todos os modais.

2.  **Criação do Hook (`src/hooks/useKeyboardOffset.ts`)**:
    *   Criar o hook isolado para detectar a altura do teclado via Visual Viewport API.

3.  **Implementação no `AddPackagingQuoteDialog.tsx`**:
    *   **Hook de Teclado**: Utilizar o `useKeyboardOffset` para adicionar um espaçamento inferior (`padding-bottom`) dinâmico no container do Drawer/Dialog quando o teclado estiver aberto.
    *   **Auto-Scroll**: Adicionar o evento `onFocus` nos campos de busca ("Buscar embalagem...", "Buscar fornecedor...") para que eles deslizem para o centro da tela automaticamente.
    *   **Ajuste de Altura**: Garantir que a altura do modal (`h-[90vh]`) respeite a área visível reduzida.

Podemos prosseguir com essa implementação piloto?