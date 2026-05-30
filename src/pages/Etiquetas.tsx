import { useState, useRef, useEffect, useMemo } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { designSystem } from "@/styles/design-system";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuickRegistrationModal } from "@/components/etiquetas/QuickRegistrationModal";
import { BarcodeGenerator } from "@/components/etiquetas/BarcodeGenerator";
import { Scan, Printer, Trash2, Eye, EyeOff, Loader2, CheckSquare, X, Search, ScanLine, Plus } from "lucide-react";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobileDevice } from "@/hooks/use-mobile-device";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductLabel {
  id: string;
  name: string;
  barcode: string;
  created_at?: string;
  user_id?: string;
}

type ConfirmAction =
  | { type: "single"; id: string }
  | { type: "multiple"; ids: string[] }
  | { type: "all"; count: number }
  | null;

export default function Etiquetas() {
  const isMobile = useIsMobileDevice();
  const { user } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<ProductLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [hiddenLabelIds, setHiddenLabelIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("etiquetas_hidden");
      if (saved) {
        try { return new Set(JSON.parse(saved)); } catch { /* ignore */ }
      }
    }
    return new Set();
  });

  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [previewBarcode, setPreviewBarcode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch products
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("product_labels")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) throw error;
        setProducts(data || []);
      } catch {
        toast({ title: "Erro", description: "Erro ao carregar etiquetas.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    const channel = supabase
      .channel("schema-db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_labels" }, (payload) => {
        if (payload.eventType === "INSERT") setProducts(prev => [...prev, payload.new as ProductLabel]);
        else if (payload.eventType === "DELETE") setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        else if (payload.eventType === "UPDATE") setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as ProductLabel : p));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, toast]);

  useEffect(() => {
    localStorage.setItem("etiquetas_hidden", JSON.stringify(Array.from(hiddenLabelIds)));
  }, [hiddenLabelIds]);

  const handleAddProduct = async (productName: string, productBarcode: string) => {
    if (!productName || !productBarcode || !user) return false;
    try {
      const { error } = await supabase.from("product_labels").insert({ name: productName, barcode: productBarcode, user_id: user.id });
      if (error) throw error;
      return true;
    } catch {
      toast({ title: "Erro", description: "Erro ao adicionar etiqueta.", variant: "destructive" });
      return false;
    }
  };

  const executeDelete = async (action: ConfirmAction) => {
    if (!action) return;
    try {
      if (action.type === "single") {
        const { error } = await supabase.from("product_labels").delete().eq("id", action.id);
        if (error) throw error;
        setHiddenLabelIds(prev => { const n = new Set(prev); n.delete(action.id); return n; });
        setSelectedIds(prev => { const n = new Set(prev); n.delete(action.id); return n; });
        toast({ title: "Etiqueta removida." });
      } else if (action.type === "multiple") {
        const { error } = await supabase.from("product_labels").delete().in("id", action.ids);
        if (error) throw error;
        setHiddenLabelIds(prev => { const n = new Set(prev); action.ids.forEach(id => n.delete(id)); return n; });
        setSelectedIds(new Set());
        toast({ title: `${action.ids.length} etiquetas removidas.` });
      } else if (action.type === "all") {
        setLoading(true);
        const { error } = await supabase.from("product_labels").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) throw error;
        setProducts([]);
        setHiddenLabelIds(new Set());
        setSelectedIds(new Set());
        toast({ title: "Todas as etiquetas removidas." });
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao remover etiqueta(s).", variant: "destructive" });
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filteredProducts.length ? new Set() : new Set(filteredProducts.map(p => p.id)));
  };

  const toggleLabelVisibility = (id: string) => {
    setHiddenLabelIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const isHidden = hiddenLabelIds.has(p.id);
        if (activeTab === "active") return !isHidden;
        if (activeTab === "hidden") return isHidden;
        return true;
      })
      .filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search))
      .sort((a, b) => {
        if (activeTab === "all") {
          const aH = hiddenLabelIds.has(a.id), bH = hiddenLabelIds.has(b.id);
          if (aH !== bH) return aH ? 1 : -1;
        }
        return 0;
      });
  }, [products, hiddenLabelIds, activeTab, search]);

  const counts = useMemo(() => {
    const total = products.length;
    const hidden = products.filter(p => hiddenLabelIds.has(p.id)).length;
    return { total, active: total - hidden, hidden };
  }, [products, hiddenLabelIds]);

  const productsToExport = useMemo(() => products.filter(p => !hiddenLabelIds.has(p.id)), [products, hiddenLabelIds]);

  const handleExportPDF = async () => {
    if (!printRef.current || productsToExport.length === 0) {
      toast({ title: "Atenção", description: "Não há etiquetas ativas para exportar.", variant: "warning" });
      return;
    }
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, (imgProps.height * pdfWidth) / imgProps.width);
      pdf.save("etiquetas.pdf");
      toast({ title: "Sucesso", description: `PDF gerado com ${productsToExport.length} etiquetas!` });
    } catch {
      toast({ title: "Erro", description: "Erro ao gerar PDF.", variant: "destructive" });
    }
  };

  const confirmLabel = useMemo(() => {
    if (!confirmAction) return { title: "", description: "", destructiveLabel: "" };
    if (confirmAction.type === "single") return {
      title: "Excluir etiqueta?",
      description: "Esta ação não pode ser desfeita.",
      destructiveLabel: "Excluir",
    };
    if (confirmAction.type === "multiple") return {
      title: `Excluir ${confirmAction.ids.length} etiquetas?`,
      description: "As etiquetas selecionadas serão removidas permanentemente.",
      destructiveLabel: `Excluir ${confirmAction.ids.length}`,
    };
    return {
      title: `Limpar todas as ${confirmAction.count} etiquetas?`,
      description: "Todas as etiquetas serão removidas permanentemente. Esta ação não pode ser desfeita.",
      destructiveLabel: "Limpar tudo",
    };
  }, [confirmAction]);

  return (
    <PageWrapper>
      <div className={cn(designSystem.layout.container.page)}>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-border dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex p-2.5 rounded-xl border transition-all bg-card border-border">
              <Scan className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-foreground leading-tight">Gerador de Etiquetas</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Crie e imprima etiquetas com código de barras</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="flex-1 sm:flex-none h-9" disabled={productsToExport.length === 0}>
              <Printer className="mr-2 h-4 w-4" />
              Exportar PDF ({productsToExport.length})
            </Button>
            <Button onClick={() => setQuickModalOpen(true)} size="sm" className="flex-1 sm:flex-none h-9 bg-brand hover:bg-brand/90 text-white">
              <Plus className="mr-2 h-4 w-4" />
              {isMobile ? "Escanear" : "Novo Produto"}
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-5 mb-4">
          {/* Left: tabs + busca */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 p-1 w-full sm:w-auto flex">
                <TabsTrigger value="all" className="flex items-center gap-1.5">
                  Todos
                  <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-bold">{counts.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center gap-1.5">
                  Ativos
                  <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{counts.active}</Badge>
                </TabsTrigger>
                <TabsTrigger value="hidden" className="flex items-center gap-1.5">
                  Ocultos
                  <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-bold">{counts.hidden}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou código…"
                className="pl-8 h-9 text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: bulk actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-2 p-1 bg-brand/5 rounded-lg border border-brand/20 w-full sm:w-auto">
                <span className="text-xs font-bold text-brand px-2 border-r border-brand/20 whitespace-nowrap">
                  {selectedIds.size} selecionado(s)
                </span>
                <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="h-8 text-xs hover:bg-brand/10 text-brand">
                  {selectedIds.size === filteredProducts.length ? "Desmarcar" : "Marcar tudo"}
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setConfirmAction({ type: "multiple", ids: Array.from(selectedIds) })}
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 font-bold"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="h-8 w-8 p-0 text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={toggleSelectAll}
                  className="h-9 border-dashed hover:border-brand hover:text-brand transition-all"
                  disabled={filteredProducts.length === 0}
                >
                  <CheckSquare className="h-4 w-4 mr-2 text-brand" /> Selecionar tudo
                </Button>
                {products.length > 0 && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setConfirmAction({ type: "all", count: products.length })}
                    className="h-9 text-muted-foreground hover:text-destructive text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar tudo
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="p-5 rounded-2xl bg-muted/40 border border-border dark:border-white/5">
              <ScanLine className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {search ? "Nenhuma etiqueta encontrada" : products.length === 0 ? "Nenhuma etiqueta cadastrada" : "Nenhum resultado para este filtro"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? `Sem resultados para "${search}"`
                  : products.length === 0
                  ? "Cadastre o primeiro produto para começar"
                  : "Tente mudar o filtro ou a busca"}
              </p>
            </div>
            {products.length === 0 && (
              <Button onClick={() => setQuickModalOpen(true)} size="sm" className="bg-brand hover:bg-brand/90 text-white">
                <Plus className="h-4 w-4 mr-2" /> Cadastrar primeiro produto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const isHidden = hiddenLabelIds.has(product.id);
              const isSelected = selectedIds.has(product.id);
              return (
                <Card
                  key={product.id}
                  className={cn(
                    "relative group transition-all duration-300 border-2",
                    isSelected ? "border-brand shadow-md ring-1 ring-brand/20" : "border-transparent",
                    isHidden && "opacity-50 grayscale bg-gray-50 dark:bg-gray-900/50"
                  )}
                >
                  <CardContent className="pt-6 flex flex-col items-center">
                    <div className="cursor-pointer mb-2 w-full flex justify-center" onClick={() => setPreviewBarcode(product.barcode)}>
                      <BarcodeGenerator value={product.barcode} className="w-full" />
                    </div>
                    <p className="font-medium text-center truncate w-full">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.barcode}</p>

                    {/* Checkbox */}
                    <div className={cn(
                      "absolute top-2 left-2 transition-all duration-300",
                      isSelected ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100 scale-100"
                    )}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(product.id)}
                        className="h-5 w-5 bg-white dark:bg-zinc-950 border-brand/30 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => toggleLabelVisibility(product.id)}>
                        {isHidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 hover:bg-destructive/10"
                        onClick={() => setConfirmAction({ type: "single", id: product.id })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Hidden PDF container */}
        <div className="absolute top-[-9999px] left-[-9999px] w-[210mm] bg-white p-2" ref={printRef}>
          <div className="grid grid-cols-5 gap-2">
            {productsToExport.map((product) => (
              <div key={product.id} className="border p-2 flex flex-col items-center justify-center h-[35mm] overflow-hidden">
                <p className="font-bold text-[10px] mb-0.5 truncate w-full text-center leading-tight">{product.name}</p>
                <div className="w-full flex justify-center overflow-hidden">
                  <BarcodeGenerator value={product.barcode} width={1.2} height={30} displayValue={true} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <QuickRegistrationModal open={quickModalOpen} onOpenChange={setQuickModalOpen} onSave={handleAddProduct} />

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

        {/* Confirm Dialog */}
        <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmLabel.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmLabel.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => executeDelete(confirmAction)}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                {confirmLabel.destructiveLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageWrapper>
  );
}
