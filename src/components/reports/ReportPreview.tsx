import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, ZoomIn, ZoomOut, Eye } from "lucide-react";
import { formatCurrency, formatDate, formatPercentage } from "@/utils/reportData";
import type { ReportData } from "@/utils/reportTemplates";

interface ReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  reportData: ReportData;
  onDownload: (format: 'pdf' | 'excel') => void;
}

export function ReportPreview({
  isOpen,
  onClose,
  reportType,
  reportData,
  onDownload
}: ReportPreviewProps) {
  const [zoom, setZoom] = React.useState(1);

  const getReportTitle = () => {
    switch (reportType) {
      case 'economia': return 'Relatório de Economia';
      case 'fornecedores': return 'Performance de Fornecedores';
      case 'produtos': return 'Análise de Produtos';
      case 'cotacoes': return 'Cotações por Período';
      case 'dashboard': return 'Dashboard Executivo';
      case 'gastos': return 'Análise de Gastos';
      default: return 'Relatório';
    }
  };

  const renderEconomiaPreview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Período</div>
          <div className="font-semibold">{reportData.economiaData.periodo}</div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Economia Total</div>
          <div className="font-semibold text-success text-lg">
            {formatCurrency(reportData.economiaData.economiaGerada)}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Percentual de Economia</div>
          <div className="font-semibold text-success">
            {formatPercentage(reportData.economiaData.economiaPercentual)}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Cotações Realizadas</div>
          <div className="font-semibold">{reportData.economiaData.cotacoesRealizadas}</div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-3">Cotações Detalhadas</h4>
        <div className="space-y-2">
          {reportData.cotacoes.slice(0, 5).map((cotacao) => (
            <div key={cotacao.id} className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <div className="font-medium">{cotacao.produto}</div>
                <div className="text-sm text-muted-foreground">{cotacao.fornecedor}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(cotacao.preco)}</div>
                <div className="text-sm text-success">
                  Economia: {formatCurrency(cotacao.economiaGerada)}
                </div>
              </div>
            </div>
          ))}
          {reportData.cotacoes.length > 5 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              + {reportData.cotacoes.length - 5} cotações adicionais no relatório completo
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFornecedoresPreview = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Top Fornecedores por Performance</h4>
      <div className="space-y-3">
        {reportData.fornecedores.slice(0, 4).map((fornecedor) => (
          <div key={fornecedor.nome} className="flex justify-between items-center p-3 border rounded-lg">
            <div>
              <div className="font-medium">{fornecedor.nome}</div>
              <div className="text-sm text-muted-foreground">
                {fornecedor.cotacoesParticipadas} cotações • {fornecedor.tempoMedioResposta}h resposta
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatCurrency(fornecedor.economiaGerada)}</div>
              <Badge variant="outline">
                {fornecedor.avaliacaoPerformance}/10
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProdutosPreview = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Produtos com Maior Variação</h4>
      <div className="space-y-3">
        {reportData.produtos.map((produto) => (
          <div key={produto.nome} className="flex justify-between items-center p-3 border rounded-lg">
            <div>
              <div className="font-medium">{produto.nome}</div>
              <div className="text-sm text-muted-foreground">{produto.categoria}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatCurrency(produto.precoAtual)}</div>
              <div className={`text-sm ${produto.variacao < 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercentage(produto.variacao)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreviewContent = () => {
    switch (reportType) {
      case 'economia':
        return renderEconomiaPreview();
      case 'fornecedores':
        return renderFornecedoresPreview();
      case 'produtos':
        return renderProdutosPreview();
      default:
        return renderEconomiaPreview();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {getReportTitle()}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview Content */}
          <ScrollArea className="h-96 w-full border rounded-lg p-4">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              {/* Report Header */}
              <div className="mb-6 pb-4 border-b">
                <h1 className="text-2xl font-bold text-foreground">Sistema de Cotações</h1>
                <h2 className="text-lg text-muted-foreground">{getReportTitle()}</h2>
                <p className="text-sm text-muted-foreground">Gerado em: {formatDate(new Date())}</p>
              </div>
              
              {/* Report Content */}
              {renderPreviewContent()}
            </div>
          </ScrollArea>
          
          {/* Download Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Este é apenas um preview. O relatório completo terá mais detalhes e formatação profissional.
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onDownload('excel')}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                onClick={() => onDownload('pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}