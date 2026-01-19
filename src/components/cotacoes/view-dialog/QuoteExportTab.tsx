import { Card } from "@/components/ui/card";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Quote } from "./types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface QuoteExportTabProps {
  quote: Quote | null;
  products: any[];
  getSupplierProductValue: (supplierId: string, productId: string) => number;
  getNormalizedUnitPrice: (supplierId: string, productId: string) => number;
}

export function QuoteExportTab({ quote }: QuoteExportTabProps) {
  const handleExportExcel = () => {
    toast({
      title: "Exportando...",
      description: "O download do arquivo Excel iniciará em instantes.",
    });
    // Simulação de exportação
    setTimeout(() => {
      toast({
        title: "Sucesso",
        description: "Arquivo exportado com sucesso!",
      });
    }, 1000);
  };

  const handleExportPDF = () => {
    toast({
      title: "Em breve",
      description: "A exportação para PDF estará disponível na próxima atualização.",
    });
  };

  if (!quote) return null;

  return (
    <div className="h-full w-full p-4 sm:p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Exportar Cotação</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Escolha o formato para baixar os dados desta cotação.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        <Card 
          className="group relative overflow-hidden border border-emerald-200/60 dark:border-emerald-800/40 bg-white dark:bg-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
          onClick={handleExportExcel}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                Planilha Excel
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] mx-auto">
                Relatório completo com todos os produtos, fornecedores e comparativos de preços.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
              <Download className="h-4 w-4 mr-2" />
              Baixar .xlsx
            </Button>
          </div>
        </Card>

        <Card 
          className="group relative overflow-hidden border border-red-200/60 dark:border-red-800/40 bg-white dark:bg-gray-800 hover:border-red-400 dark:hover:border-red-600 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md opacity-75"
          onClick={handleExportPDF}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                Documento PDF
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] mx-auto">
                Relatório formatado para impressão e compartilhamento formal.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
              <Download className="h-4 w-4 mr-2" />
              Baixar .pdf
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
