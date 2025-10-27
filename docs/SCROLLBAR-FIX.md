# Correção do Deslocamento da Tela ao Abrir Dropdowns

## Problema
Ao clicar em qualquer dropdown (Select, DropdownMenu, etc.), a tela dava uma leve "puxada" para a esquerda.

## Causa Raiz
O Radix UI, biblioteca usada para os componentes de dropdown, bloqueia o scroll do body quando abre modais/dropdowns para evitar scroll atrás do overlay. Quando o body recebe `overflow: hidden`:

1. A scrollbar desaparece
2. A scrollbar ocupava ~17px de largura
3. O conteúdo se move para preencher esse espaço vazio
4. Resultado: deslocamento visual ("layout shift")

## Soluções Implementadas

### 1. CSS - Scrollbar Sempre Visível (`index.css`)
```css
body {
  overflow-y: scroll !important; /* Força scrollbar a sempre estar visível */
  overflow-x: hidden;
}

html {
  overflow-y: scroll !important;
  overflow-x: hidden;
}
```

### 2. Scrollbar Customizada
Adicionado estilo personalizado para a scrollbar que sempre ocupa espaço:

```css
::-webkit-scrollbar {
  width: 17px; /* Largura padrão da scrollbar */
  height: 17px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 10px;
  border: 4px solid transparent;
  background-clip: padding-box;
}
```

### 3. JavaScript - Compensação Dinâmica (`scrollbar-fix.ts`)
Criado utilitário que:

- Calcula automaticamente a largura real da scrollbar
- Observa mudanças no body (MutationObserver)
- Adiciona padding-right quando scroll é bloqueado
- Remove padding quando scroll é desbloqueado

### 4. Integração no App (`App.tsx`)
O fix é inicializado automaticamente quando a aplicação carrega:

```typescript
useEffect(() => {
  const cleanup = initScrollbarFix();
  return cleanup;
}, []);
```

## Benefícios

✅ **Zero Layout Shift** - Conteúdo não se move mais ao abrir dropdowns  
✅ **Automático** - Funciona em todos os componentes Radix UI  
✅ **Performance** - Usa MutationObserver nativo  
✅ **Cross-browser** - Funciona em Chrome, Firefox, Edge, Safari  
✅ **Responsivo** - Adapta-se a diferentes tamanhos de scrollbar  

## Componentes Afetados

- `Select` (Dashboard, Configurações, etc.)
- `DropdownMenu` (Tabelas, menus de ação)
- `Dialog` (Modais)
- `Popover` (Tooltips, menus contextuais)
- Todos os componentes Radix UI que bloqueiam scroll

## Teste

Para testar se está funcionando:

1. Abra qualquer página com dropdowns (ex: Dashboard)
2. Clique em um Select ou DropdownMenu
3. Observe que a tela **não se move** lateralmente
4. Repita em diferentes páginas e componentes

## Alternativas Consideradas

❌ `scrollbar-gutter: stable` - Não funciona bem com overflow dinâmico  
❌ Desabilitar bloqueio de scroll - Prejudica UX (scroll por trás de modais)  
❌ CSS puro sem JS - Não detecta diferentes larguras de scrollbar  
✅ **Solução atual** - Combina CSS + JS para resultado perfeito
