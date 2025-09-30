import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PedidoItem {
  produto: string;
  quantidade: number;
  valorUnitario: number;
}

interface EditPedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  onEdit: (pedido: any) => void;
}

export default function EditPedidoDialog({ open, onOpenChange, pedido, onEdit }: EditPedidoDialogProps) {
  const { toast } = useToast();
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([]);

  const fornecedores = ["Holambra", "Seara", "Davi", "Adriano/Sidio", "Silvia"];
  const statusOptions = ["pendente", "processando", "confirmado", "entregue", "cancelado"];

  useEffect(() => {
    if (pedido) {
      setFornecedor(pedido.fornecedor);
      setDataEntrega(pedido.dataEntrega.split('/').reverse().join('-'));
      setStatus(pedido.status);
      setObservacoes(pedido.observacoes || "");
      
      if (pedido.detalhesItens) {
        setItens(pedido.detalhesItens);
      } else {
        const valorTotal = parseFloat(pedido.total.replace("R$ ", "").replace(".", "").replace(",", "."));
        const valorPorItem = valorTotal / pedido.produtos.length;
        setItens(pedido.produtos.map((p: string) => ({
          produto: p,
          quantidade: 1,
          valorUnitario: valorPorItem
        })));
      }
    }
  }, [pedido]);

  const handleAddItem = () => {
    setItens([...itens, { produto: "", quantidade: 1, valorUnitario: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PedidoItem, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  const calculateTotal = () => {
    return itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);
  };

  const handleSubmit = () => {
    if (!fornecedor || !dataEntrega || itens.some(item => !item.produto || item.quantidade <= 0)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const total = calculateTotal();
    const produtos = itens.map(item => item.produto);

    const pedidoAtualizado = {
      ...pedido,
      fornecedor,
      total: `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      status,
      dataEntrega: dataEntrega.split('-').reverse().join('/'),
      itens: itens.length,
      produtos,
      observacoes,
      detalhesItens: itens,
    };

    onEdit(pedidoAtualizado);
    toast({
      title: "Pedido atualizado",
      description: "Alterações salvas com sucesso",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pedido {pedido?.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Select value={fornecedor} onValueChange={setFornecedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataEntrega">Data de Entrega *</Label>
              <Input
                id="dataEntrega"
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Itens do Pedido *</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-2">
              {itens.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs">Produto</Label>
                    <Input
                      placeholder="Nome do produto"
                      value={item.produto}
                      onChange={(e) => handleItemChange(index, 'produto', e.target.value)}
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label className="text-xs">Qtd</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => handleItemChange(index, 'quantidade', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label className="text-xs">Valor Unit.</Label>
                    <Input
                      type="text"
                      placeholder="R$ 0,00"
                      value={item.valorUnitario > 0 ? `R$ ${item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                        const numValue = parseFloat(value) || 0;
                        handleItemChange(index, 'valorUnitario', numValue);
                      }}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label className="text-xs">Subtotal</Label>
                    <Input
                      value={`R$ ${(item.quantidade * item.valorUnitario).toFixed(2)}`}
                      disabled
                    />
                  </div>
                  {itens.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <div className="text-lg font-semibold">
                Total: R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
