import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, Download, Copy, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStockSectors } from "@/hooks/useStockSectors";
import { 
  groupItemsBySector, 
  InventoryPDFGenerator, 
  generateConsolidatedTextReport 
} from "@/utils/inventory-report-utils";
import { StockCount, StockCountItem } from "@/hooks/useStockCounts";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface ConsolidatedReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsolidatedReportDialog({
  open,
  onOpenChange,
}: ConsolidatedReportDialogProps) {
  const { toast } = useToast();
  const { sectors } = useStockSectors();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  const fetchFinalizedData = async () => {
    if (!selectedDate) {
      toast({ title: "Data inválida", description: "Selecione uma data para o relatório.", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      // Fetch Finalized Counts for the given date (ignoring time)
      const { data: countsData, error: countsError } = await supabase
        .from("stock_counts")
        .select("*")
        .eq("status", "finalizada")
        .gte("count_date", `${selectedDate}T00:00:00.000Z`)
        .lte("count_date", `${selectedDate}T23:59:59.999Z`);

      if (countsError) throw countsError;

      if (!countsData || countsData.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: `Não há contagens finalizadas para a data ${format(new Date(selectedDate), "dd/MM/yyyy")}.`,
          variant: "destructive",
        });
        setLoading(false);
        return null;
      }

      const countIds = countsData.map((c) => c.id);

      // Fetch Items for those counts
      const { data: itemsData, error: itemsError } = await supabase
        .from("stock_count_items")
        .select(`
          *,
          product:products (name, category_id)
        `)
        .in("stock_count_id", countIds);

      if (itemsError) throw itemsError;

      const groupedData = groupItemsBySector(
        countsData as StockCount[],
        itemsData as unknown as StockCountItem[],
        sectors
      );

      return groupedData;
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao buscar dados",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const data = await fetchFinalizedData();
    if (!data) return;

    const pdfGenerator = new InventoryPDFGenerator();
    const dateObj = new Date(selectedDate);
    // adjustment for local timezone if necessary
    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
    
    pdfGenerator.generateConsolidatedReport(dateObj, data);
    pdfGenerator.save(`Fechamento_Estoque_${format(dateObj, "dd_MM_yyyy")}.pdf`);
    toast({
      title: "PDF Gerado",
      description: "O download começará em breve.",
    });
  };

  const handleCopyWhatsApp = async () => {
    const data = await fetchFinalizedData();
    if (!data) return;

    const dateObj = new Date(selectedDate);
    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
    const textReport = generateConsolidatedTextReport(dateObj, data);

    try {
      await navigator.clipboard.writeText(textReport);
      toast({
        title: "Copiado com sucesso",
        description: "O relatório foi copiado para a área de transferência. Você pode colar no WhatsApp.",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o relatório.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" />
            Relatório de Fechamento Consolidado
          </DialogTitle>
          <DialogDescription>
            Selecione a data para consolidar todas as contagens finalizadas em um único relatório dividido por setor.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Data do Fechamento</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Junta automaticamente todas as contagens finalizadas desta data.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleCopyWhatsApp}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copiar P/ WhatsApp
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto bg-brand hover:bg-brand/90"
            onClick={handleDownloadPDF}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
