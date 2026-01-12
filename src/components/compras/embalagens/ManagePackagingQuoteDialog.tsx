import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { 
  Package, Building2, DollarSign, CheckCircle2, Clock, 
  TrendingDown, Award, Loader2, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackagingQuoteDisplay, PackagingComparison } from "@/types/packaging";
import { PACKAGING_SALE_UNITS } from "@/types/packaging";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PackagingQuoteDisplay | null;
}

export function ManagePackagingQuoteDialog({ open, onOpenChange, quote }: Props) {
  const { updateSupplierItem, getComparison, updateQuoteStatus } = usePackagingQuotes();
  const [activeTab, setActiveTab] = useState("valores");
  const [editingItem, setEditingItem] = useState<{
    supplierId: string;
    packagingId: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    valorTotal: "",
    unidadeVenda: "kg",
    quantidadeVenda: "",
    quantidadeUnidadesEstimada: "",
    gramatura: "",
    dimensoes: "",
  });

  if (!quote) return null;

  const comparison = getComparison(quote);

  const handleEditItem = (supplierId: string, packagingId: string) => {
    const fornecedor = quote.fornecedores.find(f => f.supplierId === supplierId);
    const item = fornecedor?.itens.find(i => i.packagingId === packagingId);

    setFormData({
      valorTotal: item?.valorTotal?.toString() || "",
      unidadeVenda: item?.unidadeVenda || "kg",
      quantidadeVenda: item?.quantidadeVenda?.toString() || "",
      quantidadeUnidadesEstimada: item?.quantidadeUnidadesEstimada?.toString() || "",
      gramatura: item?.gramatura?.toString() || "",
      dimensoes: item?.dimensoes || "",
    });
    setEditingItem({ supplierId, packagingId });
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    await updateSupplierItem.mutateAsync({
      quoteId: quote.id,
      supplierId: editingItem.supplierId,
      packagingId: editingItem.packagingId,
      valorTotal: parseFloat(formData.valorTotal) || 0,
      unidadeVenda: formData.unidadeVenda,
      quantidadeVenda: parseFloat(formData.quantidadeVenda) || 0,
      quantidadeUnidadesEstimada: parseInt(formData.quantidadeUnidadesEstimada) || 0,
      gramatura: formData.gramatura ? parseFloat(formData.gramatura) : undefined,
      dimensoes: formData.dimensoes || undefined,
    });

    setEditingItem(null);
  };

  const custoPorUnidadePreview = useMemo(() => {
    const valor = parseFloat(formData.valorTotal) || 0;
    const unidades = parseInt(formData.quantidadeUnidadesEstimada) || 0;
    if (valor > 0 && unidades > 0) {
      return (valor / unidades).toFixed(4);
    }
    return null;
  }, [formData.valorTotal, formData.quantidadeUnidadesEstimada]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Gerenciar Cotação de Embalagens
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={quote.status === "ativa" ? "default" : "secondary"}>
              {quote.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {quote.dataInicio} - {quote.dataFim}
            </span>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="valores">
              <DollarSign className="h-4 w-4 mr-2" />
              Valores
            </TabsTrigger>
            <TabsTrigger value="comparativo">
              <TrendingDown className="h-4 w-4 mr-2" />
              Comparativo
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="valores" className="mt-0 space-y-4">
              {quote.itens.map((item) => (
                <div key={item.packagingId} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    {item.packagingName}
                  </h4>

                  <div className="space-y-3">
                    {quote.fornecedores.map((fornecedor) => {
                      const supplierItem = fornecedor.itens.find(
                        si => si.packagingId === item.packagingId
                      );
                      const isEditing = editingItem?.supplierId === fornecedor.supplierId && 
                                       editingItem?.packagingId === item.packagingId;

                      return (
                        <div 
                          key={fornecedor.supplierId}
                          className={cn(
                            "p-3 rounded-lg border",
                            fornecedor.status === "respondido" 
                              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                              : "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{fornecedor.supplierName}</span>
                              {fornecedor.status === "respondido" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                            {!isEditing && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditItem(fornecedor.supplierId, item.packagingId)}
                              >
                                Editar
                              </Button>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-3 mt-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Valor Total (R$)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.valorTotal}
                                    onChange={(e) => setFormData(prev => ({ ...prev, valorTotal: e.target.value }))}
                                    placeholder="0,00"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Unidade de Venda</Label>
                                  <Select 
                                    value={formData.unidadeVenda} 
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, unidadeVenda: v }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PACKAGING_SALE_UNITS.map(u => (
                                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Quantidade na Unidade</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.quantidadeVenda}
                                    onChange={(e) => setFormData(prev => ({ ...prev, quantidadeVenda: e.target.value }))}
                                    placeholder="Ex: 5 (kg)"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Qtd. Unidades Estimada</Label>
                                  <Input
                                    type="number"
                                    value={formData.quantidadeUnidadesEstimada}
                                    onChange={(e) => setFormData(prev => ({ ...prev, quantidadeUnidadesEstimada: e.target.value }))}
                                    placeholder="Ex: 500 sacolas"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Gramatura (opcional)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.gramatura}
                                    onChange={(e) => setFormData(prev => ({ ...prev, gramatura: e.target.value }))}
                                    placeholder="Ex: 0.08 (micras)"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Dimensões (opcional)</Label>
                                  <Input
                                    value={formData.dimensoes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dimensoes: e.target.value }))}
                                    placeholder="Ex: 30x40cm"
                                  />
                                </div>
                              </div>

                              {custoPorUnidadePreview && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                                  <p className="text-sm text-purple-700 dark:text-purple-300">
                                    <strong>Custo por unidade:</strong> R$ {custoPorUnidadePreview}
                                  </p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingItem(null)}
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={handleSaveItem}
                                  disabled={updateSupplierItem.isPending}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  {updateSupplierItem.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                  )}
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          ) : supplierItem?.valorTotal ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Valor:</span>
                                <p className="font-medium">R$ {supplierItem.valorTotal.toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Venda:</span>
                                <p className="font-medium">{supplierItem.quantidadeVenda} {supplierItem.unidadeVenda}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Unidades:</span>
                                <p className="font-medium">{supplierItem.quantidadeUnidadesEstimada}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Custo/un:</span>
                                <p className="font-medium text-purple-600">
                                  R$ {supplierItem.custoPorUnidade?.toFixed(4) || '-'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Aguardando valores...</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="comparativo" className="mt-0 space-y-4">
              {comparison.map((comp) => (
                <div key={comp.packagingId} className="border rounded-lg overflow-hidden">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 border-b">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      {comp.packagingName}
                    </h4>
                  </div>

                  {comp.fornecedores.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Nenhum fornecedor respondeu ainda
                    </div>
                  ) : (
                    <div className="divide-y">
                      {comp.fornecedores.map((f, index) => (
                        <div 
                          key={f.supplierId}
                          className={cn(
                            "p-3 flex items-center gap-4",
                            f.isMelhorPreco && "bg-green-50 dark:bg-green-900/20"
                          )}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 font-bold text-sm">
                            {f.isMelhorPreco ? (
                              <Award className="h-5 w-5 text-amber-500" />
                            ) : (
                              index + 1
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{f.supplierName}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {f.valorTotal.toFixed(2)} por {f.quantidadeVenda} {f.unidadeVenda} 
                              ({f.quantidadeUnidades} un)
                            </p>
                          </div>

                          <div className="text-right">
                            <p className={cn(
                              "font-bold",
                              f.isMelhorPreco ? "text-green-600" : "text-gray-700 dark:text-gray-300"
                            )}>
                              R$ {f.custoPorUnidade.toFixed(4)}/un
                            </p>
                            {!f.isMelhorPreco && (
                              <p className="text-xs text-red-500">
                                +{f.diferencaPercentual.toFixed(1)}%
                              </p>
                            )}
                            {f.isMelhorPreco && (
                              <Badge className="bg-green-600 text-xs">Melhor preço</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {comparison.every(c => c.fornecedores.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum fornecedor respondeu ainda</p>
                  <p className="text-sm">Adicione os valores na aba "Valores"</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <Select 
            value={quote.status} 
            onValueChange={(status) => updateQuoteStatus.mutate({ quoteId: quote.id, status })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativa">Ativa</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
