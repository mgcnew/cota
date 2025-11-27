"""
Script para substituir a tab de produtos no AddPedidoDialog.tsx
"""

# Ler o arquivo
with open('src/components/forms/AddPedidoDialog.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar as linhas de início e fim
start_line = None
end_line = None

for i, line in enumerate(lines):
    if "{activeTab === 'produtos'" in line and "grid grid-cols-1" in line:
        start_line = i  # Linha 642 (índice 642)
        break

# Procurar o fim (a linha com }</div>} antes da tab de fornecedor)
for i in range(start_line, len(lines)):
    if "</div>}" in lines[i] and i > start_line + 100:  # Garantir que não é uma tag interna
        # Verificar se a próxima linha não vazia contém 'fornecedor'
        for j in range(i+1, min(i+5, len(lines))):
            if "fornecedor" in lines[j]:
                end_line = i
                break
        if end_line:
            break

if start_line is None or end_line is None:
    print(f"Erro: não encontrou as linhas. Start: {start_line}, End: {end_line}")
    exit(1)

print(f"Encontrado: linhas {start_line} até {end_line} (total: {end_line - start_line + 1} linhas)")

# Novo conteúdo para substituir
new_content = """              {activeTab === 'produtos' && (
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
                  calculateTotal={calculateTotal}
                />
              )}
"""

# Construir o novo arquivo
new_lines = lines[:start_line] + [new_content] + lines[end_line+1:]

# Salvar
with open('src/components/forms/AddPedidoDialog.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"✅ Substituição concluída!")
print(f"  - Removidas: {end_line - start_line + 1} linhas")
print(f"  - Adicionadas: {len(new_content.splitlines())} linhas")
print(f"  - Economia: {(end_line - start_line + 1) - len(new_content.splitlines())} linhas")
