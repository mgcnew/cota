# Schema da Tabela shopping_list para Supabase

## Instruções para o Lovable

Por favor, crie a seguinte tabela no banco de dados Supabase:

### Tabela: `shopping_list`

```sql
CREATE TABLE shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  notes TEXT,
  category TEXT,
  estimated_price DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_shopping_list_company_id ON shopping_list(company_id);
CREATE INDEX idx_shopping_list_product_id ON shopping_list(product_id);
CREATE INDEX idx_shopping_list_priority ON shopping_list(priority);
CREATE INDEX idx_shopping_list_created_at ON shopping_list(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas itens da sua empresa
CREATE POLICY "Users can view shopping list items from their company"
  ON shopping_list
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

-- Política: Usuários podem inserir itens para sua empresa
CREATE POLICY "Users can insert shopping list items for their company"
  ON shopping_list
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

-- Política: Usuários podem atualizar itens da sua empresa
CREATE POLICY "Users can update shopping list items from their company"
  ON shopping_list
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

-- Política: Usuários podem deletar itens da sua empresa
CREATE POLICY "Users can delete shopping list items from their company"
  ON shopping_list
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_users 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_shopping_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shopping_list_updated_at
  BEFORE UPDATE ON shopping_list
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_list_updated_at();
```

## Campos da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único do item (chave primária) |
| `company_id` | UUID | ID da empresa (FK para companies) |
| `product_id` | UUID | ID do produto (FK para products) |
| `product_name` | TEXT | Nome do produto (desnormalizado para performance) |
| `quantity` | DECIMAL | Quantidade do produto |
| `unit` | TEXT | Unidade de medida (kg, un, cx, etc) |
| `priority` | TEXT | Prioridade: low, medium, high, urgent |
| `notes` | TEXT | Observações sobre o item (opcional) |
| `category` | TEXT | Categoria do produto (opcional) |
| `estimated_price` | DECIMAL | Preço estimado do produto (opcional) |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data da última atualização |

## Funcionalidades Implementadas

✅ **Hooks dedicados**:
- `useShoppingList.ts` - Hook para desktop
- `useShoppingListMobile.ts` - Hook para mobile com infinite scroll

✅ **Componentes**:
- `ListaCompras.tsx` - Página principal responsiva
- `AddProductToListDialog.tsx` - Modal para adicionar produtos
- `ShoppingListTable.tsx` - Tabela para desktop
- `ShoppingListMobileCard.tsx` - Card para mobile
- `ShoppingListMobileList.tsx` - Lista mobile com infinite scroll

✅ **Features**:
- Multi-seleção de produtos
- Criar pedido a partir dos itens selecionados
- Edição inline de quantidade, prioridade e preço estimado
- Busca por nome e observações
- Filtros por prioridade
- Responsivo (desktop e mobile)
- Pull-to-refresh no mobile
- Infinite scroll no mobile

## Próximos Passos

1. **Lovable**: Criar a tabela `shopping_list` no Supabase usando o SQL acima
2. **Lovable**: Regenerar os tipos TypeScript do Supabase
3. Testar a funcionalidade completa
4. Adicionar rota no menu de navegação (opcional)
