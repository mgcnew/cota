import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, Clock, Edit2, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
}

interface ViewQuoteDialogProps {
  quote: Quote;
  onUpdateSupplierValue: (quoteId: string, supplierId: string, newValue: number) => void;
  trigger?: React.ReactNode;
}

export default function ViewQuoteDialog({
  quote,
  onUpdateSupplierValue,
  trigger,
}: ViewQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = (supplierId: string, currentValue: number) => {
    setEditingSupplier(supplierId);
    setEditValue(currentValue.toFixed(2));
  };

  const handleSaveEdit = (supplierId: string) => {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue) || numValue < 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor numérico válido.",
        variant: "destructive",
      });
      return;
    }

    onUpdateSupplierValue(quote.id, supplierId, numValue);
    setEditingSupplier(null);
    toast({
      title: "Valor atualizado",
      description: "O valor oferecido foi atualizado com sucesso.",
    });
  };

  const handleCancelEdit = () => {
    setEditingSupplier(null);
    setEditValue("");
  };

  const getMelhorValor = () => {
    const valores = quote.fornecedoresParticipantes
      .filter(f => f.valorOferecido > 0)
      .map(f => f.valorOferecido);
    return valores.length > 0 ? Math.min(...valores) : 0;
  };

  const melhorValor = getMelhorValor();

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
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cotação {quote.id}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="comparative">Comparativo de Preços</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Produto</label>
                <p className="text-lg font-semibold text-foreground">{quote.produto}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">{getStatusBadge(quote.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quantidade</label>
                <p className="text-lg font-semibold text-foreground">{quote.quantidade}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fornecedores Participantes</label>
                <p className="text-lg font-semibold text-foreground">{quote.fornecedores}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                <p className="text-lg font-semibold text-foreground">{quote.dataInicio}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Fim</label>
                <p className="text-lg font-semibold text-foreground">{quote.dataFim}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Melhor Preço</label>
                <p className="text-lg font-semibold text-success">{quote.melhorPreco}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Melhor Fornecedor</label>
                <p className="text-lg font-semibold text-foreground">{quote.melhorFornecedor}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Economia</label>
                <p className="text-lg font-semibold text-success">{quote.economia}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparative" className="mt-4">
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Fornecedor</th>
                    <th className="p-3 text-left text-sm font-medium">Valor Oferecido</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Data Resposta</th>
                    <th className="p-3 text-left text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.fornecedoresParticipantes.map((fornecedor) => {
                    const isMelhorPreco = fornecedor.valorOferecido === melhorValor && melhorValor > 0;
                    const isEditing = editingSupplier === fornecedor.id;

                    return (
                      <tr
                        key={fornecedor.id}
                        className={`border-b hover:bg-muted/30 transition-colors ${
                          isMelhorPreco ? "bg-success/10" : ""
                        }`}
                      >
                        <td className="p-3">
                          <span className="font-medium text-foreground">{fornecedor.nome}</span>
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-32"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span className={`font-semibold ${isMelhorPreco ? "text-success" : "text-foreground"}`}>
                              {fornecedor.valorOferecido > 0
                                ? `R$ ${fornecedor.valorOferecido.toFixed(2)}`
                                : "R$ 0,00"}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {fornecedor.status === "respondido" ? (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Respondido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Pendente
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {fornecedor.dataResposta || "-"}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveEdit(fornecedor.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEdit(fornecedor.id, fornecedor.valorOferecido)}
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
            {melhorValor > 0 && (
              <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm text-success font-medium">
                  ✓ Melhor oferta: R$ {melhorValor.toFixed(2)}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
