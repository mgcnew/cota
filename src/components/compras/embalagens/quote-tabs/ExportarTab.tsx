import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Trophy, Award, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportarTabProps {
  quote: {
    dataInicio: string;
    dataFim: string;
    itens: { packagingId: string }[];
    fornecedores: { supplierId: string }[];
  };
  comparison: any[];
  showHtmlPreview: boolean;
  onTogglePreview: () => void;
  onGeneratePDF: () => void;
  onDownloadHtml: () => void;
  generateHtmlComparative: () => string;
}

export function ExportarTab({
  quote,
  comparison,
  showHtmlPreview,
  onTogglePreview,
  onGeneratePDF,
  onDownloadHtml,
  generateHtmlComparative,
}: ExportarTabProps) {
  const noData = comparison.every(c => c.fornecedores.length === 0);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="text-center py-4">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
            <FileDown className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1.5 tracking-tight">Exportar Relatório</h3>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Gere um PDF ou HTML com o comparativo completo para documentação e aprovação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-border/50 bg-muted/20">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3 w-3" />Conteúdo
              </h4>
            </div>
            <div className="p-3 space-y-2">
              {[
                `Período: ${quote.dataInicio} a ${quote.dataFim}`,
                `${quote.itens.length} embalagens comparadas`,
                `${quote.fornecedores.length} fornecedores participantes`,
                "Tabela de preços detalhada",
                "Destaque dos melhores preços",
                "Ranking de fornecedores"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-border/50 bg-muted/20">
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="h-3 w-3 text-muted-foreground" />Vencedores
              </h4>
            </div>
            <div className="p-3 space-y-1.5">
              {(() => {
                const winsPerSupplier: Record<string, { name: string; wins: number }> = {};
                comparison.forEach(comp => {
                  const winner = comp.fornecedores.find((f: any) => f.isMelhorPreco);
                  if (winner) {
                    if (!winsPerSupplier[winner.supplierId]) {
                      winsPerSupplier[winner.supplierId] = { name: winner.supplierName, wins: 0 };
                    }
                    winsPerSupplier[winner.supplierId].wins++;
                  }
                });
                const sorted = Object.values(winsPerSupplier).sort((a, b) => b.wins - a.wins);
                
                if (sorted.length === 0) return <p className="text-[11px] text-muted-foreground italic">Sem dados suficientes</p>;
                
                return sorted.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className={cn("flex items-center gap-1.5", idx === 0 ? "font-bold text-foreground" : "text-muted-foreground")}>
                      {idx === 0 && <Award className="h-3 w-3 text-brand" />}
                      {w.name}
                    </span>
                    <Badge variant="outline" className={cn("h-5 text-[9px] font-bold", idx === 0 ? "border-border bg-card text-foreground" : "border-border bg-muted text-muted-foreground")}>
                      {w.wins} {w.wins === 1 ? "item" : "itens"}
                    </Badge>
                  </div>
                ));
              })()}
            </div>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-2 pt-2">
          <Button size="lg" onClick={onGeneratePDF} disabled={noData}
            className="bg-brand hover:bg-brand/90 text-white font-bold uppercase tracking-wider text-[11px] shadow-md rounded-xl px-6 h-9">
            <Download className="h-3.5 w-3.5 mr-1.5" />Baixar PDF
          </Button>
          <Button size="lg" onClick={onDownloadHtml} disabled={noData}
            variant="outline" className="font-bold uppercase tracking-wider text-[11px] rounded-xl px-6 h-9 border-border hover:bg-muted">
            <FileText className="h-3.5 w-3.5 mr-1.5" />Baixar HTML
          </Button>
          <Button size="lg" onClick={onTogglePreview} disabled={noData}
            variant="ghost" className="font-bold uppercase tracking-wider text-[11px] rounded-xl px-6 h-9 text-muted-foreground hover:text-foreground hover:bg-muted">
            <Eye className="h-3.5 w-3.5 mr-1.5" />{showHtmlPreview ? "Ocultar" : "Visualizar"}
          </Button>
        </div>

        {showHtmlPreview && (
          <div className="mt-4 border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-3 py-1.5 border-b border-border/50">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Preview</p>
            </div>
            <iframe srcDoc={generateHtmlComparative()} className="w-full h-[400px] sm:h-[500px] border-0" title="HTML Preview" />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
