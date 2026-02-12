import { useState, useRef } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { designSystem } from "@/styles/design-system";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScannerModal } from "@/components/etiquetas/ScannerModal";
import { BarcodeGenerator } from "@/components/etiquetas/BarcodeGenerator";
import { Scan, Printer, Trash2 } from "lucide-react";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface ProductLabel {
  id: string;
  name: string;
  barcode: string;
}

export default function Etiquetas() {
  const [products, setProducts] = useState<ProductLabel[]>([]);
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [previewBarcode, setPreviewBarcode] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleAddProduct = () => {
    if (!name || !barcode) return;
    setProducts([...products, { id: Date.now().toString(), name, barcode }]);
    setName("");
    setBarcode("");
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleScan = (result: string) => {
    setBarcode(result);
  };

  const handleExportPDF = async () => {
    if (!printRef.current || products.length === 0) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Improve quality
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("etiquetas.pdf");
      
      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso!",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageWrapper>
      <div className={designSystem.layout.container.page}>
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-2xl font-bold">Gerador de Etiquetas</h1>
           <Button onClick={handleExportPDF} disabled={products.length === 0}>
             <Printer className="mr-2 h-4 w-4" /> Exportar PDF
           </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ex: Coca Cola 2L"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <div className="flex gap-2">
                  <Input 
                    id="barcode" 
                    value={barcode} 
                    onChange={(e) => setBarcode(e.target.value)} 
                    placeholder="Ex: 789..."
                  />
                  <Button variant="outline" onClick={() => setScannerOpen(true)}>
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={handleAddProduct} disabled={!name || !barcode}>
              Adicionar à Lista
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="relative group">
              <CardContent className="pt-6 flex flex-col items-center">
                <div 
                    className="cursor-pointer mb-2 w-full flex justify-center"
                    onClick={() => setPreviewBarcode(product.barcode)}
                >
                  <BarcodeGenerator value={product.barcode} className="w-full" />
                </div>
                <p className="font-medium text-center truncate w-full">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.barcode}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Hidden Container for PDF Generation */}
        <div className="absolute top-[-9999px] left-[-9999px] w-[210mm] bg-white p-4" ref={printRef}>
            <div className="grid grid-cols-3 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="border p-4 flex flex-col items-center justify-center h-[40mm]">
                        <p className="font-bold text-sm mb-1 truncate w-full text-center">{product.name}</p>
                        <BarcodeGenerator value={product.barcode} width={1.5} height={40} displayValue={true} />
                    </div>
                ))}
            </div>
        </div>

        <ScannerModal 
          open={scannerOpen} 
          onOpenChange={setScannerOpen} 
          onScan={handleScan} 
        />

        <ResponsiveModal
          open={!!previewBarcode}
          onOpenChange={(open) => !open && setPreviewBarcode(null)}
          title="Visualizar Código de Barras"
        >
          <div className="flex items-center justify-center p-4">
             {previewBarcode && (
                 <div className="w-full max-w-2xl">
                    <BarcodeGenerator value={previewBarcode} width={3} height={150} />
                 </div>
             )}
          </div>
        </ResponsiveModal>
      </div>
    </PageWrapper>
  );
}
