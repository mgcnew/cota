# CotaJá Design System

Sistema de tokens de design centralizado para garantir consistência visual em toda a aplicação.

## Filosofia

- **Profissional**: Visual clean e corporativo, sem excessos visuais
- **Neutro**: Paleta baseada em Zinc (cinza neutro) para melhor legibilidade
- **Acessível**: Contraste adequado para modo claro e escuro
- **Consistente**: Mesmos tokens aplicados em todos os componentes

## Estrutura do Arquivo

```
src/styles/
├── design-system.ts   # Tokens de design
└── README.md          # Esta documentação
```

## Como Usar

### Importação

```tsx
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";
```

### Exemplos de Uso

#### Layout de Modal

```tsx
<DialogContent className={designSystem.layout.modal.content}>
  <div className={designSystem.layout.modal.header}>
    <h2 className={designSystem.typography.title.md}>Título</h2>
  </div>
  <div className={designSystem.layout.modal.body}>
    {/* Conteúdo */}
  </div>
  <div className={designSystem.layout.modal.footer}>
    {/* Ações */}
  </div>
</DialogContent>
```

#### Cards

```tsx
<div className={cn(designSystem.layout.card.base, designSystem.layout.card.padding.md)}>
  <h3 className={designSystem.typography.title.sm}>Card Title</h3>
  <p className={designSystem.typography.body.default}>Content</p>
</div>
```

#### Botões

```tsx
// Primário
<Button className={designSystem.components.buttons.primary}>Salvar</Button>

// Ghost
<Button className={cn(designSystem.components.buttons.ghost.sm, designSystem.components.buttons.ghost.danger)}>
  Excluir
</Button>

// Ícone
<Button className={designSystem.components.buttons.icon.default}>
  <X className="h-4 w-4" />
</Button>
```

#### Tabs

```tsx
<TabsList className={designSystem.components.tabs.list.transparent}>
  <TabsTrigger className={designSystem.components.tabs.trigger.underline} value="tab1">
    Tab 1
  </TabsTrigger>
</TabsList>
```

#### Tabelas

```tsx
<table className={designSystem.table.container}>
  <thead>
    <tr className={designSystem.table.header.row}>
      <th className={designSystem.table.header.cell}>Coluna</th>
    </tr>
  </thead>
  <tbody>
    <tr className={designSystem.table.body.row}>
      <td className={designSystem.table.body.cell}>Valor</td>
    </tr>
  </tbody>
</table>
```

#### Cores Semânticas

```tsx
// Status de sucesso
<div className={cn(designSystem.colors.success.bg, designSystem.colors.success.text)}>
  Aprovado
</div>

// Status de erro
<div className={cn(designSystem.colors.error.bg, designSystem.colors.error.text)}>
  Erro
</div>
```

## Tokens Disponíveis

### Layout
- `layout.modal` - Estrutura de modais (content, header, body, footer)
- `layout.card` - Cards (base, interactive, muted, padding)
- `layout.section` - Seções (base, header)

### Typography
- `typography.title` - Títulos (lg, md, sm, xs)
- `typography.body` - Corpo (default, small, muted)
- `typography.label` - Labels (default, muted, section)

### Components
- `components.tabs` - Abas (list, trigger)
- `components.buttons` - Botões (primary, secondary, ghost, icon)
- `components.inputs` - Campos (default, sm, withIcon)
- `components.badges` - Badges (default, success, warning, error, info)

### Table
- `table.container` - Container da tabela
- `table.header` - Cabeçalho (row, cell)
- `table.body` - Corpo (row, cell)

### Utils
- `utils.glass` - Efeito glassmorphism
- `utils.scrollbar` - Scrollbar customizada
- `utils.divider` - Divisor horizontal
- `utils.focusRing` - Ring de foco acessível

### Colors
- `colors.success` - Verde (bg, text, border)
- `colors.warning` - Âmbar (bg, text, border)
- `colors.error` - Vermelho (bg, text, border)
- `colors.info` - Azul (bg, text, border)

## Regras de Estilo

1. **Não usar `gray-*`** - Sempre usar `zinc-*` para manter consistência
2. **Evitar `font-black`** - Preferir `font-semibold` ou `font-medium`
3. **Tracking moderado** - Usar `tracking-wide` ou `tracking-wider`, nunca `tracking-[0.2em]`
4. **Tamanhos de fonte** - Mínimo `text-[10px]`, idealmente `text-xs` ou maior
5. **Bordas sutis** - Usar `border-zinc-100/200` no claro e `border-zinc-800/900` no escuro
6. **Sombras funcionais** - Usar `shadow-sm` ou `shadow-md`, nunca `shadow-2xl` em elementos pequenos
