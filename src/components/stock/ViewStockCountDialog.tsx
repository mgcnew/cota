import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, MapPin, Loader2 } from "lucide-react";
import { useStockCounts } from "@/hooks/useStockCounts";
import { useStockCountItems } from "@/hooks/useStockCountItems";
import { useStockSectors } from "@/hooks/useStockSectors";

interface ViewStockCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockCountId: string | null;
}

export function ViewStockCountDialog({
  open,
  onOpenChange,
  stockCountId,
}: ViewStockCountDialogProps) {
  // Sempre chamar os hooks incondicionalmente
  const { stockCounts } = useStockCounts();
  const { items, sectorSummary, isLoading } = useStockCountItems(stockCountId || '');
  const { sectors } = useStockSectors();

  // Encontrar a contagem apenas se stockCountId existir
  const count = stockCountId ? stockCounts.find(c => c.id === stockCountId) : null;

  // Agrupar itens por setor
  const itemsBySector = useMemo(() => {
    const grouped: Record<string, typeof items> = {};
    items.forEach(item => {
      const sectorId = item.sector_id;
      if (!grouped[sectorId]) {
        grouped[sectorId] = [];
      }
      grouped[sectorId].push(item);
    });
    return grouped;
  }, [items]);

  if (!count) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Contagem de Estoque</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum item encontrado nesta contagem.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="setores" className="w-full">
            <TabsList>
              <TabsTrigger value="setores">Por Setor</TabsTrigger>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
            </TabsList>

            <TabsContent value="setores" className="space-y-4">
              {Object.entries(itemsBySector).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum item encontrado</p>
                </div>
              ) : (
                Object.entries(itemsBySector).map(([sectorId, sectorItems]) => {
                  const sector = sectors.find(s => s.id === sectorId);
                  const totalOrdered = sectorItems.reduce((sum, item) => sum + item.quantity_ordered, 0);
                  const totalCounted = sectorItems.reduce((sum, item) => sum + item.quantity_counted, 0);
                  const totalExisting = sectorItems.reduce((sum, item) => sum + item.quantity_existing, 0);

                  return (
                    <Card key={sectorId}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          {sector?.name || "Setor Desconhecido"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Pedido</div>
                            <div className="text-2xl font-bold">{totalOrdered}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Existente</div>
                            <div className="text-2xl font-bold">{totalExisting}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Contado</div>
                            <div className="text-2xl font-bold">{totalCounted}</div>
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">Pedido</TableHead>
                              <TableHead className="text-right">Existente</TableHead>
                              <TableHead className="text-right">Contado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sectorItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell className="text-right">{item.quantity_ordered}</TableCell>
                                <TableCell className="text-right">{item.quantity_existing}</TableCell>
                                <TableCell className="text-right">{item.quantity_counted}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="resumo">
              {sectorSummary.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum resumo disponível</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sectorSummary.map((summary: any) => (
                    <Card key={summary.sector_id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{summary.sector_name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Itens:</span>
                            <span className="font-medium">{summary.total_items}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Pedido:</span>
                            <span className="font-medium">{summary.total_ordered}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Existente:</span>
                            <span className="font-medium">{summary.total_existing}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Contado:</span>
                            <span className="font-medium">{summary.total_counted}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Discrepâncias:</span>
                            <span className="font-medium text-destructive">{summary.discrepancies}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
