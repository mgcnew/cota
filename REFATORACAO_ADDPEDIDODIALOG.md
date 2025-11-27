# Refatoração AddPedidoDialog - Em Progresso

## ✅ Trabalho Concluído

### Arquivos Criados:
1. **`src/components/pedidos/add-dialog/types.ts`**
   - Interfaces: `PedidoItem`, `PreSelectedProduct`, `AddPedidoDialogProps`, `TabConfig`
   - Tipos: `TabStatus`

2. **`src/components/pedidos/add-dialog/helpers.ts`**
   - `calculateTotal()` - Calcula valor total do pedido
   - `canProceedToNext()` - Valida se pode avançar para próxima tab
   - `getTabStatus()` - Retorna status de uma tab
   - `validateProduct()` - Valida dados do produto antes de adicionar

3. **`src/components/pedidos/add-dialog/ProductsTab.tsx`**
   - Componente completo da tab de produtos (~240 linhas)
   - Formulário de adicionar produto
   - Lista de produtos adicionados
   - Animações com framer-motion
   - Totalizador

## 📋 Próximos Passos

### Para completar a refatoração:

1. **Atualizar imports em `AddPedidoDialog.tsx`:**
   ```typescript
   import { ProductsTab } from "../pedidos/add-dialog/ProductsTab";
   import {PedidoItem, AddPedidoDialogProps } from "../pedidos/add-dialog/types";
   import { calculateTotal, canProceedToNext, getTabStatus,validateProduct } from "../pedidos/add-dialog/helpers";
   ```

2. **Remover definições duplicadas** (linhas 24-41):
   - Interface `PedidoItem`
   - Interface `AddPedidoDialogProps`

3. **Substituir implementação local de funções pelas importadas:**
   - Substituir `calculateTotal()` local (linha 310) por `calcTotal(itens)`
   - Substituir `canProceedToNext()` local (linha 330) por `canProceed(activeTab, itens, fornecedor, dataEntrega)`
   - Substituir `getTabStatus()` local (linha 353) por `getStatus(tabId, tabs, currentTabIndex)`
   - Substituir `validateProduct()` local (linha 359) por fazer chamada ao helper

4. **Substituir conteúdo da tab de produtos** (linhas ~641-839):
   Substituir todo o JSX por:
   ```tsx
   {activeTab === 'produtos' && (
     <ProductsTab
       isMobile={isMobile}
       filteredProducts={filteredProducts}
       products={products}
       selectedProduct={selectedProduct}
       handleProductSelect={handleProductSelect}
       debouncedProductSearch={debouncedProductSearch}
       setProductSearch={setProductSearch}
       newProductQuantity={newProductQuantity}
       setNewProductQuantity={setNewProductQuantity}
       newProductUnit={newProductUnit}
       setNewProductUnit={setNewProductUnit}
       newProductPrice={newProductPrice}
       setNewProductPrice={setNewProductPrice}
       errors={errors}
       setErrors={setErrors}
       lastUsedPrices={lastUsedPrices}
       itens={itens}
       handleAddNewProduct={handleAddNewProduct}
       handleRemoveItem={handleRemoveItem}
       handleDuplicateItem={handleDuplicateItem}
       calculateTotal={() => calculateTotal(itens)}
     />
   )}
   ```

## 📈 Ganho Estimado

- **Antes:** ~1488 linhas
- **Depois:** ~1200-1250 linhas
- **Redução:** ~250-300 linhas (17-20%)

## ⚠️ Observações

- ProductsTab é a tab mais complexa do dialog
- As outras 2 tabs (Fornecedor e Detalhes) são mais simples e poderiam ser extraídas mais facilmente
- Todos os testes devem ser executados após a integração
- Verificar que navegação entre tabs continua funcionando
- Verificar que validações estão funcionando

## 🎯 Benefícios

1. **Modularização:** Código mais organizado e fácil de manter
2. **Reutilização:** ProductsTab pode ser reutilizado em outros contextos
3. **Testabilidade:** Componentes menores são mais fáceis de testar
4. **Legibilidade:** Arquivo principal fica menos complexo
