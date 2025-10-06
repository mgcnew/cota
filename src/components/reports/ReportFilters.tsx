import { useState, useEffect } from "react";
import { Check, X, Users, Package, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

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
  const [fornecedoresOpen, setFornecedoresOpen] = useState(false);
  const [produtosOpen, setProdutosOpen] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);

  useEffect(() => {
    loadFornecedores();
    loadProdutos();
  }, []);

  const loadFornecedores = async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name");
    
    if (!error && data) {
      setFornecedores(data);
    }
  };

  const loadProdutos = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    
    if (!error && data) {
      setProdutos(data);
    }
  };

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
    <div className="space-y-6">
      {/* Seção de Filtros */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Filtros de Seleção</h3>
            <p className="text-xs text-gray-600">Escolha fornecedores e produtos específicos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Filtro Fornecedores */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Fornecedores</label>
            <Popover open={fornecedoresOpen} onOpenChange={setFornecedoresOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`w-full justify-between h-10 ${
                    selectedFornecedores.length > 0 
                      ? 'border-purple-300 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>
                      {selectedFornecedores.length > 0 
                        ? `${selectedFornecedores.length} selecionado${selectedFornecedores.length > 1 ? 's' : ''}`
                        : 'Selecionar fornecedores'
                      }
                    </span>
                  </div>
                  {selectedFornecedores.length > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                      {selectedFornecedores.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-white border border-gray-200 shadow-xl rounded-xl" align="start">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-gray-900">Fornecedores</span>
                  </div>
                </div>
                <Command>
                  <CommandInput 
                    placeholder="Buscar fornecedores..." 
                    className="border-0 border-b border-gray-100 rounded-none"
                  />
                  <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                    Nenhum fornecedor encontrado.
                  </CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto p-2">
                    {fornecedores.map((fornecedor) => (
                      <CommandItem 
                        key={fornecedor.id} 
                        className="cursor-pointer rounded-lg hover:bg-purple-50 data-[selected]:bg-purple-50"
                        onSelect={() => handleFornecedorToggle(fornecedor.name)}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <Checkbox
                            checked={selectedFornecedores.includes(fornecedor.name)}
                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{fornecedor.name}</span>
                          </div>
                          {selectedFornecedores.includes(fornecedor.name) && (
                            <Check className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro Produtos */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Produtos</label>
            <Popover open={produtosOpen} onOpenChange={setProdutosOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`w-full justify-between h-10 ${
                    selectedProdutos.length > 0 
                      ? 'border-purple-300 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>
                      {selectedProdutos.length > 0 
                        ? `${selectedProdutos.length} selecionado${selectedProdutos.length > 1 ? 's' : ''}`
                        : 'Selecionar produtos'
                      }
                    </span>
                  </div>
                  {selectedProdutos.length > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                      {selectedProdutos.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-white border border-gray-200 shadow-xl rounded-xl" align="start">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-gray-900">Produtos</span>
                  </div>
                </div>
                <Command>
                  <CommandInput 
                    placeholder="Buscar produtos..." 
                    className="border-0 border-b border-gray-100 rounded-none"
                  />
                  <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                    Nenhum produto encontrado.
                  </CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto p-2">
                    {produtos.map((produto) => (
                      <CommandItem 
                        key={produto.id} 
                        className="cursor-pointer rounded-lg hover:bg-purple-50 data-[selected]:bg-purple-50"
                        onSelect={() => handleProdutoToggle(produto.name)}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <Checkbox
                            checked={selectedProdutos.includes(produto.name)}
                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{produto.name}</span>
                            {produto.category && (
                              <div className="text-xs text-gray-500">{produto.category}</div>
                            )}
                          </div>
                          {selectedProdutos.includes(produto.name) && (
                            <Check className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Filtros Ativos */}
      {totalFilters > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Filtros Aplicados</h3>
              <p className="text-xs text-gray-600">
                {totalFilters} filtro{totalFilters > 1 ? 's' : ''} ativo{totalFilters > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {selectedFornecedores.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Fornecedores ({selectedFornecedores.length})
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedFornecedores.map((fornecedor) => (
                    <Badge 
                      key={fornecedor} 
                      variant="outline" 
                      className="text-xs bg-white border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      {fornecedor}
                      <button
                        onClick={() => handleFornecedorToggle(fornecedor)}
                        className="ml-2 hover:text-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {selectedProdutos.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Produtos ({selectedProdutos.length})
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedProdutos.map((produto) => (
                    <Badge 
                      key={produto} 
                      variant="outline" 
                      className="text-xs bg-white border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      {produto}
                      <button
                        onClick={() => handleProdutoToggle(produto)}
                        className="ml-2 hover:text-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}