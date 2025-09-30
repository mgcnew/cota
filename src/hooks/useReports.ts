import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { PDFReportGenerator, ExcelReportGenerator, generateZipReport } from "@/utils/reportTemplates";
import { processReportData, type ReportFilters } from "@/utils/reportData";

export function useReports() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateReport = useCallback(async (
    reportType: string,
    filters: ReportFilters,
    format: 'pdf' | 'excel' | 'both'
  ) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Simular progresso
      setProgress(20);
      
      const reportData = await processReportData(filters);
      setProgress(50);

      const timestamp = new Date().toISOString().slice(0, 10);
      const baseFilename = `relatorio_${reportType}_${timestamp}`;

      if (format === 'pdf' || format === 'both') {
        const pdfGenerator = new PDFReportGenerator();
        
        switch (reportType) {
          case 'economia':
            pdfGenerator.generateEconomiaReport(reportData);
            break;
          case 'fornecedores':
            pdfGenerator.generateFornecedoresReport(reportData);
            break;
          case 'produtos':
            pdfGenerator.generateProdutosReport(reportData);
            break;
          default:
            pdfGenerator.generateEconomiaReport(reportData);
        }
        
        setProgress(75);
        pdfGenerator.save(`${baseFilename}.pdf`);
      }

      if (format === 'excel' || format === 'both') {
        const excelGenerator = new ExcelReportGenerator();
        setProgress(85);
        excelGenerator.generateEconomiaReport(reportData, `${baseFilename}.xlsx`);
      }

      setProgress(100);
      
      toast({
        title: "Relatório gerado com sucesso!",
        description: `${reportType} foi baixado no formato ${format}.`,
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [toast]);

  const generateAllReports = useCallback(async (filters: ReportFilters) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const reportData = await processReportData(filters);
      const timestamp = new Date().toISOString().slice(0, 10);
      
      toast({
        title: "Gerando todos os relatórios...",
        description: "Isso pode levar alguns segundos.",
      });

      setProgress(20);
      await generateZipReport(reportData, `relatorios_completos_${timestamp}`);
      setProgress(100);

      toast({
        title: "Todos os relatórios foram gerados!",
        description: "Os arquivos foram baixados automaticamente.",
      });

    } catch (error) {
      console.error('Erro ao gerar relatórios:', error);
      toast({
        title: "Erro ao gerar relatórios",
        description: "Ocorreu um erro ao gerar os relatórios. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [toast]);

  const getReportData = useCallback(async (filters: ReportFilters) => {
    return await processReportData(filters);
  }, []);

  return {
    isGenerating,
    progress,
    generateReport,
    generateAllReports,
    getReportData
  };
}