import * as React from "react";
import { Check, X, Users, Package, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { mockFornecedores, mockProdutos } from "@/utils/reportData";

interface ReportFiltersProps {
  selectedFornecedores: string[];
  selectedProdutos: string[];
  onFornecedoresChange: (fornecedores: string[]) => void;
  onProdutosChange: (produtos: string[]) => void;
  onReset: () => void;
}

export function ReportFilters({
  selectedFornecedores,
  selectedProdutos,
  onFornecedoresChange,
  onProdutosChange,
  onReset
}: ReportFiltersProps) {
  const [fornecedoresOpen, setFornecedoresOpen] = React.useState(false);
  const [produtosOpen, setProdutosOpen] = React.useState(false);

  const handleFornecedorToggle = (fornecedor: string) => {
    const updated = selectedFornecedores.includes(fornecedor)
      ? selectedFornecedores.filter(f => f !== fornecedor)
      : [...selectedFornecedores, fornecedor];
    onFornecedoresChange(updated);
  };

  const handleProdutoToggle = (produto: string) => {
    const updated = selectedProdutos.includes(produto)
      ? selectedProdutos.filter(p => p !== produto)
      : [...selectedProdutos, produto];
    onProdutosChange(updated);
  };

  const totalFilters = selectedFornecedores.length + selectedProdutos.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Filtros</h3>
        {totalFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar ({totalFilters})
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* Filtro Fornecedores */}
        <Popover open={fornecedoresOpen} onOpenChange={setFornecedoresOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Building2 className="h-3 w-3 mr-1" />
              Fornecedores
              {selectedFornecedores.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1">
                  {selectedFornecedores.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 bg-background border" align="start">
            <Command>
              <CommandInput placeholder="Buscar fornecedores..." />
              <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {mockFornecedores.map((fornecedor) => (
                  <CommandItem key={fornecedor.nome} className="cursor-pointer">
                    <div 
                      className="flex items-center space-x-2 w-full"
                      onClick={() => handleFornecedorToggle(fornecedor.nome)}
                    >
                      <Checkbox
                        checked={selectedFornecedores.includes(fornecedor.nome)}
                        onChange={() => handleFornecedorToggle(fornecedor.nome)}
                      />
                      <span className="flex-1">{fornecedor.nome}</span>
                      {selectedFornecedores.includes(fornecedor.nome) && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Filtro Produtos */}
        <Popover open={produtosOpen} onOpenChange={setProdutosOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Package className="h-3 w-3 mr-1" />
              Produtos
              {selectedProdutos.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1">
                  {selectedProdutos.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 bg-background border" align="start">
            <Command>
              <CommandInput placeholder="Buscar produtos..." />
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {mockProdutos.map((produto) => (
                  <CommandItem key={produto.nome} className="cursor-pointer">
                    <div 
                      className="flex items-center space-x-2 w-full"
                      onClick={() => handleProdutoToggle(produto.nome)}
                    >
                      <Checkbox
                        checked={selectedProdutos.includes(produto.nome)}
                        onChange={() => handleProdutoToggle(produto.nome)}
                      />
                      <span className="flex-1">{produto.nome}</span>
                      {selectedProdutos.includes(produto.nome) && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Filtros Ativos */}
      {totalFilters > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Filtros ativos:</div>
          <div className="flex gap-1 flex-wrap">
            {selectedFornecedores.map((fornecedor) => (
              <Badge 
                key={fornecedor} 
                variant="outline" 
                className="text-xs"
              >
                <Building2 className="h-2 w-2 mr-1" />
                {fornecedor}
                <button
                  onClick={() => handleFornecedorToggle(fornecedor)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            ))}
            {selectedProdutos.map((produto) => (
              <Badge 
                key={produto} 
                variant="outline" 
                className="text-xs"
              >
                <Package className="h-2 w-2 mr-1" />
                {produto}
                <button
                  onClick={() => handleProdutoToggle(produto)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}