# Boas Práticas para Tabelas - Sistema de Cotações

## 📋 Componentes Criados

### 1. CotacoesTable.tsx
Tabela otimizada para exibição de cotações com melhor UX e acessibilidade.

### 2. PedidosTable.tsx  
Tabela otimizada para exibição de pedidos com design consistente.

## 🎯 Boas Práticas Implementadas

### 🎨 **Design e Visual**

#### **Header da Tabela**
- **Background gradiente**: `from-teal-50/80 to-cyan-50/80` para cotações, `from-purple-50/80 to-pink-50/80` para pedidos
- **Ícones nos cabeçalhos**: Cada coluna tem um ícone representativo
- **Tipografia**: Fonte semibold e cor escura para melhor legibilidade
- **Espaçamento**: `py-4 px-6` para conforto visual

#### **Linhas da Tabela**
- **Zebra striping**: Alternância entre `bg-white` e `bg-gray-50/30`
- **Hover effects**: Gradiente sutil no hover
- **Bordas**: `border-gray-100/60` para separação visual
- **Transições**: `transition-all duration-200` para suavidade

### 📱 **Responsividade**

#### **Breakpoints Inteligentes**
- **Mobile**: Colunas essenciais sempre visíveis
- **Tablet**: `hidden md:table-cell` para colunas secundárias
- **Desktop**: `hidden lg:table-cell` para informações extras

#### **Conteúdo Adaptativo**
- **Truncate**: Textos longos com `truncate` e `max-w-[Xpx]`
- **Informações móveis**: Dados importantes mostrados em mobile
- **Ícones contextuais**: Ajudam na identificação rápida

### ♿ **Acessibilidade**

#### **Screen Readers**
- **Labels semânticos**: `sr-only` para botões de ação
- **Estrutura HTML**: Headers e células bem estruturadas
- **Contexto**: Ícones com significado claro

#### **Navegação por Teclado**
- **Focus states**: Botões com estados de foco visíveis
- **Ordem lógica**: Tabindex natural e intuitivo

### 🎭 **Estados Visuais**

#### **Status Badges**
- **Cores semânticas**: Verde para sucesso, amarelo para pendente, etc.
- **Ícones**: Representação visual do estado
- **Consistência**: Mesmo padrão em todas as tabelas

#### **Botões de Ação**
- **Hover states**: Cores específicas para cada ação
- **Tamanhos**: `h-8 w-8 p-0` para compacidade
- **Agrupamento**: Ações relacionadas próximas

### 🔧 **Performance**

#### **Renderização Otimizada**
- **Key props**: IDs únicos para cada linha
- **Memoização**: Componentes preparados para React.memo
- **Lazy loading**: Estrutura pronta para paginação

#### **Dados Estruturados**
- **TypeScript**: Interfaces bem definidas
- **Props tipadas**: Melhor DX e menos bugs
- **Callbacks**: Funções de ação bem estruturadas

### 📊 **Informações Contextuais**

#### **Dados Ricos**
- **Múltiplas informações**: Título, subtítulo, badges
- **Hierarquia visual**: Tamanhos e cores diferenciados
- **Contexto**: Ícones que explicam o tipo de dado

#### **Formatação Inteligente**
- **Valores monetários**: Destaque em verde
- **Datas**: Formatação consistente
- **IDs**: Fonte monospace para melhor leitura

## 🚀 **Como Usar**

### Importação
```tsx
import { CotacoesTable } from "@/components/tables/CotacoesTable";
import { PedidosTable } from "@/components/tables/PedidosTable";
```

### Implementação
```tsx
<CotacoesTable
  cotacoes={filteredCotacoes}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
  getStatusBadge={getStatusBadge}
/>
```

## 🎨 **Customização**

### Cores do Tema
- **Cotações**: Teal/Cyan
- **Pedidos**: Purple/Pink
- **Neutros**: Gray scale para elementos secundários

### Espaçamentos
- **Células**: `py-4` vertical, `px-6` para primeira/última coluna
- **Conteúdo**: `gap-3` entre elementos
- **Ícones**: `h-4 w-4` padrão, `h-3 w-3` para secundários

## 📈 **Benefícios**

1. **UX Melhorada**: Visual mais limpo e profissional
2. **Acessibilidade**: Compatível com screen readers
3. **Responsividade**: Funciona em todos os dispositivos
4. **Manutenibilidade**: Código organizado e reutilizável
5. **Performance**: Renderização otimizada
6. **Consistência**: Padrão visual unificado

## 🔄 **Próximos Passos**

1. Implementar os componentes nas páginas existentes
2. Adicionar testes unitários
3. Implementar ordenação de colunas
4. Adicionar filtros avançados
5. Implementar seleção múltipla
6. Adicionar exportação de dados