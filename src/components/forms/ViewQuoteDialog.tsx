import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Package, Users, TrendingDown, Edit2, Save, X, DollarSign } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";

interface FornecedorParticipante {
  id: string;
  nome: string;
  valorOferecido: number;
  dataResposta: string | null;
  observacoes: string;
  status: "pendente" | "respondido";
}

interface Quote {
  id: string;
  produto: string;
  quantidade: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  fornecedores: number;
  melhorPreco: string;
  melhorFornecedor: string;
  economia: string;
  fornecedoresParticipantes: FornecedorParticipante[];
  _raw?: any;
}

interface ViewQuoteDialogProps {
  quote: Quote;
  onUpdateSupplierProductValue?: (quoteId: string, supplierId: string, productId: string, newValue: number) => void;
  trigger?: React.ReactNode;
}

export default function ViewQuoteDialog({ quote, onUpdateSupplierProductValue, trigger }: ViewQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});

  const handleStartEdit = (productId: string, currentValue: number) => {
    setEditingProductId(productId);
    setEditedValues(prev => ({ ...prev, [productId]: currentValue }));
  };

  const handleSaveEdit = (productId: string) => {
    if (selectedSupplier && onUpdateSupplierProductValue && editedValues[productId] !== undefined) {
      onUpdateSupplierProductValue(quote.id, selectedSupplier, productId, editedValues[productId]);
      setEditingProductId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditedValues({});
  };

  // Get products from the quote
  const products = quote._raw?.quote_items || [];
  
  // Get supplier items for selected supplier
  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    const item = quote._raw?.quote_supplier_items?.find(
      (item: any) => item.supplier_id === supplierId && item.product_id === productId
    );
    return item?.valor_oferecido || 0;
  };

  // Calculate best price for each product
  const getBestPriceForProduct = (productId: string): number => {
    const values = quote.fornecedoresParticipantes
      .map(f => getSupplierProductValue(f.id, productId))
      .filter(v => v > 0);
    return values.length > 0 ? Math.min(...values) : 0;
  };

  const getMelhorValor = () => {
    const valores = quote.fornecedoresParticipantes
      .filter(f => f.valorOferecido > 0)
      .map(f => f.valorOferecido);
    return valores.length > 0 ? Math.min(...valores) : 0;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ativa: "default",
      concluida: "secondary",
      pendente: "outline",
      expirada: "destructive"
    };
    
    const labels = {
      ativa: "Ativa",
      concluida: "Concluída",
      pendente: "Pendente",
      expirada: "Expirada"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Cotação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="atualizacao">Atualização de Valores</TabsTrigger>
              <TabsTrigger value="comparativo">Comparativo de Preços</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Produto</p>
                    <p className="font-semibold">{quote.produto}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fornecedores</p>
                    <p className="font-semibold">{quote.fornecedores}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Início</p>
                    <p className="font-semibold">{quote.dataInicio}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Fim</p>
                    <p className="font-semibold">{quote.dataFim}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-success mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Melhor Preço</p>
                    <p className="font-semibold text-success">{quote.melhorPreco}</p>
                    <p className="text-sm text-muted-foreground">{quote.melhorFornecedor}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 mt-1">
                    {getStatusBadge(quote.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="atualizacao" className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selecione o Fornecedor</label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {quote.fornecedoresParticipantes.map(fornecedor => (
                          <SelectItem key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSupplier && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Lista de Produtos
                      </h4>
                      <div className="rounded-lg border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-3 text-left font-medium">Produto</th>
                              <th className="p-3 text-left font-medium">Quantidade</th>
                              <th className="p-3 text-left font-medium">Valor Oferecido</th>
                              <th className="p-3 text-left font-medium">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((product: any) => {
                              const currentValue = getSupplierProductValue(selectedSupplier, product.product_id);
                              const isEditing = editingProductId === product.product_id;
                              const bestPrice = getBestPriceForProduct(product.product_id);
                              const isBestPrice = currentValue > 0 && currentValue === bestPrice;

                              return (
                                <tr key={product.product_id} className="border-b last:border-0">
                                  <td className="p-3">{product.product_name}</td>
                                  <td className="p-3">{product.quantidade} {product.unidade}</td>
                                  <td className="p-3">
                                    {isEditing ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          value={editedValues[product.product_id] || 0}
                                          onChange={(e) => setEditedValues(prev => ({
                                            ...prev,
                                            [product.product_id]: Number(e.target.value)
                                          }))}
                                          className="w-32"
                                          step="0.01"
                                          min="0"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className={isBestPrice ? "font-semibold text-green-600" : ""}>
                                          R$ {currentValue.toFixed(2)}
                                        </span>
                                        {isBestPrice && (
                                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                                            Melhor Preço
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {isEditing ? (
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleSaveEdit(product.product_id)}
                                        >
                                          <Save className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={handleCancelEdit}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleStartEdit(product.product_id, currentValue)}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="comparativo" className="space-y-4">
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Produto</th>
                      {quote.fornecedoresParticipantes.map(fornecedor => (
                        <th key={fornecedor.id} className="p-3 text-center font-medium">
                          {fornecedor.nome}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product: any) => {
                      const bestPrice = getBestPriceForProduct(product.product_id);
                      
                      return (
                        <tr key={product.product_id} className="border-b last:border-0">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{product.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.quantidade} {product.unidade}
                              </p>
                            </div>
                          </td>
                          {quote.fornecedoresParticipantes.map(fornecedor => {
                            const value = getSupplierProductValue(fornecedor.id, product.product_id);
                            const isBestPrice = value > 0 && value === bestPrice;
                            
                            return (
                              <td key={fornecedor.id} className="p-3 text-center">
                                {value > 0 ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={isBestPrice ? "font-semibold text-green-600" : ""}>
                                      R$ {value.toFixed(2)}
                                    </span>
                                    {isBestPrice && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                        Melhor
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
