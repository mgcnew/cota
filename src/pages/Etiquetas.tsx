import { useState, useRef, useEffect, useMemo } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { designSystem } from "@/styles/design-system";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScannerModal } from "@/components/etiquetas/ScannerModal";
import { BarcodeGenerator } from "@/components/etiquetas/BarcodeGenerator";
import { Scan, Printer, Trash2, Eye, EyeOff } from "lucide-react";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobileDevice } from "@/hooks/use-mobile-device";

interface ProductLabel {
  id: string;
  name: string;
  barcode: string;
}

export default function Etiquetas() {
  const isMobile = useIsMobileDevice();
  
  // Products State with Persistence
  const [products, setProducts] = useState<ProductLabel[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('etiquetas_products');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return [];
  });

  // Hidden Labels State with Persistence
  const [hiddenLabelIds, setHiddenLabelIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('etiquetas_hidden');
      if (saved) {
        try { return new Set(JSON.parse(saved)); } catch (e) { console.error(e); }
      }
    }
    return new Set();
  });

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [previewBarcode, setPreviewBarcode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Persist effects
  useEffect(() => {
    localStorage.setItem('etiquetas_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('etiquetas_hidden', JSON.stringify(Array.from(hiddenLabelIds)));
  }, [hiddenLabelIds]);

  const handleAddProduct = () => {
    if (!name || !barcode) return;
    setProducts([...products, { id: Date.now().toString(), name, barcode }]);
    setName("");
    setBarcode("");
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    // Also remove from hidden set to clean up
    if (hiddenLabelIds.has(id)) {
      setHiddenLabelIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const toggleLabelVisibility = (id: string) => {
    setHiddenLabelIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleScan = (result: string) => {
    setBarcode(result);
  };

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const isHidden = hiddenLabelIds.has(product.id);
      if (activeTab === 'active') return !isHidden;
      if (activeTab === 'hidden') return isHidden;
      return true;
    }).sort((a, b) => {
      // Sort by visibility first (active first, hidden last) when showing All
      if (activeTab === 'all') {
        const aHidden = hiddenLabelIds.has(a.id);
        const bHidden = hiddenLabelIds.has(b.id);
        if (aHidden !== bHidden) return aHidden ? 1 : -1;
      }
      return 0; // Maintain insertion order otherwise
    });
  }, [products, hiddenLabelIds, activeTab]);

  const counts = useMemo(() => {
    const total = products.length;
    const hidden = products.filter(p => hiddenLabelIds.has(p.id)).length;
    const active = total - hidden;
    return { total, active, hidden };
  }, [products, hiddenLabelIds]);

  const handleExportPDF = async () => {
    if (!printRef.current || filteredProducts.length === 0) {
      toast({
        title: "Atenção",
        description: "Não há etiquetas visíveis para exportar.",
        variant: "warning",
      });
      return;
    }

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
        description: `PDF gerado com ${filteredProducts.length} etiquetas!`,
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
           <div>
             <h1 className="text-2xl font-bold">Gerador de Etiquetas</h1>
             <p className="text-sm text-muted-foreground">Crie e imprima etiquetas personalizadas</p>
           </div>
           <Button onClick={handleExportPDF} disabled={filteredProducts.length === 0}>
             <Printer className="mr-2 h-4 w-4" /> 
             Exportar PDF ({filteredProducts.length})
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
                  {isMobile && (
                    <Button variant="outline" onClick={() => setScannerOpen(true)}>
                      <Scan className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={handleAddProduct} disabled={!name || !barcode}>
              Adicionar à Lista
            </Button>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="bg-muted/50 p-1 w-full sm:w-auto flex justify-start overflow-x-auto">
              <TabsTrigger value="all" className="flex items-center gap-2">
                Todos
                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-bold">{counts.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                Ativos
                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{counts.active}</Badge>
              </TabsTrigger>
              <TabsTrigger value="hidden" className="flex items-center gap-2">
                Ocultos
                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">{counts.hidden}</Badge>
              </TabsTrigger>
            </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isHidden = hiddenLabelIds.has(product.id);
            return (
              <Card 
                key={product.id} 
                className={cn(
                  "relative group transition-all duration-300",
                  isHidden && "opacity-50 grayscale bg-gray-50 dark:bg-gray-900/50"
                )}
              >
                <CardContent className="pt-6 flex flex-col items-center">
                  <div 
                      className="cursor-pointer mb-2 w-full flex justify-center"
                      onClick={() => setPreviewBarcode(product.barcode)}
                  >
                    <BarcodeGenerator value={product.barcode} className="w-full" />
                  </div>
                  <p className="font-medium text-center truncate w-full">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.barcode}</p>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-muted"
                      onClick={() => toggleLabelVisibility(product.id)}
                      title={isHidden ? "Mostrar etiqueta" : "Ocultar etiqueta"}
                    >
                      {isHidden ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-destructive/10"
                      onClick={() => handleDelete(product.id)}
                      title="Excluir etiqueta"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Hidden Container for PDF Generation - Uses filteredProducts */}
        <div className="absolute top-[-9999px] left-[-9999px] w-[210mm] bg-white p-4" ref={printRef}>
            <div className="grid grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
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
          <div className="flex flex-col items-center justify-center p-4 gap-4">
             {previewBarcode && (
                 <>
                   <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-sm flex justify-center items-center overflow-x-auto">
                      <BarcodeGenerator value={previewBarcode} width={4} height={150} />
                   </div>
                   <p className="text-sm text-muted-foreground text-center">
                     Se o leitor não conseguir ler, aumente o brilho da tela.
                   </p>
                 </>
             )}
          </div>
        </ResponsiveModal>
      </div>
    </PageWrapper>
  );
}
