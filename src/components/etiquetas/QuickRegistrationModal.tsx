import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { 
  Loader2, Scan, CheckCircle2, RotateCcw, AlertCircle, Save, 
  X, Keyboard, Camera, Package, Zap
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

interface QuickRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, barcode: string) => Promise<boolean>;
}

type Mode = 'scanner' | 'manual';

const SCANNER_ELEMENT_ID = "quick-scanner-reader";

export function QuickRegistrationModal({
  open,
  onOpenChange,
  onSave
}: QuickRegistrationModalProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [mode, setMode] = useState<Mode>('scanner');
  const [barcode, setBarcode] = useState("");
  const [productName, setProductName] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [lastSavedName, setLastSavedName] = useState("");
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMode('scanner');
      setBarcode("");
      setProductName("");
      setCameraError(null);
      setIsSearching(false);
      setSavedCount(0);
      setLastSavedName("");
    } else {
      stopScanner();
    }
  }, [open]);

  // ── API Lookup ──────────────────────────────────────────────
  const fetchProductInfo = useCallback(async (code: string) => {
    setIsSearching(true);
    try {
      // 1. Open Food Facts BR
      let response = await fetch(`https://br.openfoodfacts.org/api/v0/product/${code}.json`);
      let data = await response.json();
      
      let name = "";
      if (data.status === 1 && data.product) {
         name = data.product.product_name_pt || 
                data.product.product_name || 
                data.product.generic_name_pt || 
                data.product.generic_name || 
                "";
      }

      // Global fallback
      if (!name) {
          response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
          data = await response.json();
          if (data.status === 1 && data.product) {
              name = data.product.product_name_pt || data.product.product_name || "";
          }
      }

      // 2. UPCItemDB fallback
      if (!name) {
          try {
             const responseUpc = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`);
             const dataUpc = await responseUpc.json();
             if (dataUpc.code === 'OK' && dataUpc.items && dataUpc.items.length > 0) {
                 name = dataUpc.items[0].title;
             }
          } catch(e) {
             console.warn("UPC fallback error", e);
          }
      }

      if (name) {
        setProductName(name);
        toast({ 
         title: "Produto encontrado!", 
         description: name,
         className: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200"
        });
      } else {
        toast({
          title: "Produto não localizado",
          description: "Digite o nome manualmente.",
        });
        setTimeout(() => nameInputRef.current?.focus(), 300);
      }
    } catch (e) {
      console.error("Error fetching product", e);
      setTimeout(() => nameInputRef.current?.focus(), 300);
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // ── Scanner Lifecycle ───────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      if (!open || mode !== 'scanner') return;

      await new Promise(resolve => setTimeout(resolve, 150));
      if (!mounted) return;

      try {
        if (scannerRef.current) {
          await stopScanner();
        }

        const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          verbose: false
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted) {
              handleScanSuccess(decodedText);
            }
          },
          () => {
            // Ignore frame errors
          }
        );
        
        if (mounted) setIsScanning(true);
      } catch (err: any) {
        console.error("Error starting scanner:", err);
        if (mounted) {
          let msg = "Erro ao iniciar câmera.";
          if (err?.name === 'NotAllowedError') msg = "Permissão de câmera negada.";
          setCameraError(msg);
        }
      }
    };

    if (open && mode === 'scanner') {
      initScanner();
    }

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [open, mode]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Error stopping scanner:", e);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  // ── Handlers ────────────────────────────────────────────────
  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (navigator.vibrate) navigator.vibrate(200);
    setBarcode(decodedText);
    setProductName("");
    fetchProductInfo(decodedText);
  }, [fetchProductInfo]);

  const handleManualMode = () => {
    stopScanner();
    setMode('manual');
    setTimeout(() => barcodeInputRef.current?.focus(), 300);
  };

  const handleScannerMode = () => {
    setMode('scanner');
    setBarcode("");
    setProductName("");
  };

  const handleRescan = () => {
    setBarcode("");
    setProductName("");
  };

  const handleSubmit = async (keepScanning = false) => {
    if (!productName.trim() || !barcode.trim()) return;

    setIsSaving(true);
    try {
      const success = await onSave(productName, barcode);
      if (success) {
        setLastSavedName(productName);
        setSavedCount(prev => prev + 1);
        
        toast({
          title: "Cadastrado!",
          description: productName,
          className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
        });
        
        if (keepScanning) {
          // Reset for next scan
          setBarcode("");
          setProductName("");
        } else {
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(true);
    }
  };

  const canSave = productName.trim().length > 0 && barcode.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 overflow-hidden shadow-xl flex flex-col m-0",
          ds.colors.surface.page,
          ds.colors.border.default,
          // Mobile first (full screen)
          "fixed inset-0 w-full h-[100dvh] max-h-[100dvh] max-w-none rounded-none border-none",
          "translate-x-0 translate-y-0 top-0 left-0 right-0 bottom-0", 
          // Desktop overrides
          "sm:inset-auto sm:w-[96vw] sm:max-w-[600px] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border",
          "sm:top-[50%] sm:left-[50%] sm:-translate-x-[50%] sm:-translate-y-[50%]"
        )}
        hideClose={isMobile}
      >
        {/* ─── Header ─── */}
        <div className={cn(
          "flex-shrink-0 border-b px-4 py-3 flex items-center justify-between",
          ds.colors.surface.section,
          ds.colors.border.default
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shadow-lg",
              "bg-brand"
            )}>
              <Scan className="h-4 w-4 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className={cn(
                ds.typography.size.sm,
                ds.typography.weight.bold,
                ds.colors.text.primary,
                "leading-none"
              )}>
                Cadastro Rápido
              </DialogTitle>
              <p className={cn(
                ds.typography.size.xs,
                ds.colors.text.secondary,
                "mt-0.5"
              )}>
                {mode === 'scanner' ? 'Escaneie e cadastre' : 'Digite manualmente'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedCount > 0 && (
              <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 font-bold tabular-nums">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {savedCount}
              </Badge>
            )}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className={cn(ds.components.button.ghost, "h-9 w-9")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          
          {/* Scanner View */}
          {mode === 'scanner' && (
            <div className="flex-shrink-0">
              <div className={cn(
                "relative bg-black overflow-hidden flex items-center justify-center",
                isMobile ? "h-[35vh]" : "h-[250px] mx-4 mt-4 rounded-xl"
              )}>
                {!isScanning && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <span className={cn(ds.typography.size.sm)}>Iniciando câmera...</span>
                  </div>
                )}
                
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-zinc-900 text-white p-4 text-center">
                    <AlertCircle className="h-10 w-10 text-red-400 mb-2" />
                    <p className={cn(ds.typography.size.sm, ds.typography.weight.bold)}>{cameraError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setCameraError(null); setMode('scanner'); }} 
                      className="mt-4 border-white/20 text-white hover:bg-white/10"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                )}

                <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />
                
                {/* Scan overlay */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-3 border-l-3 border-brand/70 rounded-tl-lg" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-3 border-r-3 border-brand/70 rounded-tr-lg" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-3 border-l-3 border-brand/70 rounded-bl-lg" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-3 border-r-3 border-brand/70 rounded-br-lg" />
                    
                    <div className="absolute left-0 right-0 h-[2px] bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-[scan-full_3s_infinite]" />
                    
                    <div className="absolute bottom-6 left-0 right-0 text-center">
                      <span className="bg-black/50 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                        Aponte para o código
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mode toggle */}
              <div className="flex items-center justify-center gap-2 py-2 px-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleManualMode}
                  className={cn(ds.typography.size.xs, "gap-1.5 text-muted-foreground")}
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  Digitar manualmente
                </Button>
              </div>
            </div>
          )}

          {/* Manual mode header */}
          {mode === 'manual' && (
            <div className="flex items-center justify-center gap-2 py-3 px-4 border-b border-border/50">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleScannerMode}
                className={cn(ds.typography.size.xs, "gap-1.5 text-muted-foreground")}
              >
                <Camera className="h-3.5 w-3.5" />
                Voltar ao scanner
              </Button>
            </div>
          )}

          {/* ─── Form Section ─── */}
          <div className="flex-1 px-4 py-4 space-y-4">
            
            {/* Scanned barcode indicator */}
            {barcode && mode === 'scanner' && (
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-xl border",
                isSearching 
                  ? "bg-blue-500/5 border-blue-500/20" 
                  : "bg-brand/5 border-brand/20"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  isSearching ? "bg-blue-500/10" : "bg-brand/10"
                )}>
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-brand" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    ds.typography.size.xs,
                    ds.typography.weight.bold,
                    isSearching ? "text-blue-600 dark:text-blue-400" : "text-brand",
                    "uppercase tracking-wider"
                  )}>
                    {isSearching ? "Buscando produto..." : "Código detectado"}
                  </p>
                  <p className={cn(
                    "font-mono tracking-widest",
                    ds.typography.size.lg,
                    ds.typography.weight.bold,
                    ds.colors.text.primary
                  )}>{barcode}</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleRescan} 
                  title="Limpar"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Manual barcode input */}
            {mode === 'manual' && (
              <div className="space-y-1.5">
                <Label className={cn(ds.components.input.label)}>Código de Barras</Label>
                <Input
                  ref={barcodeInputRef}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Ex: 7891234567890"
                  className={cn(ds.components.input.root, "font-mono text-lg h-12 tracking-wider")}
                  autoComplete="off"
                  inputMode="numeric"
                />
              </div>
            )}

            {/* Product name input */}
            <div className="space-y-1.5">
              <Label className={cn(ds.components.input.label)}>Nome do Produto</Label>
              <Input
                ref={nameInputRef}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={barcode ? "Nome será preenchido automaticamente..." : "Escaneie primeiro ou digite o código"}
                className={cn(ds.components.input.root, "h-12 text-base")}
                autoComplete="off"
                disabled={!barcode && mode === 'scanner'}
              />
            </div>

            {/* Barcode edit (scanner mode, when barcode exists) */}
            {mode === 'scanner' && barcode && (
              <div className="space-y-1.5">
                <Label className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>
                  Editar código (se necessário)
                </Label>
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className={cn(ds.components.input.root, "font-mono text-sm h-9 bg-muted/50")}
                />
              </div>
            )}

            {/* Last saved feedback */}
            {lastSavedName && (
              <div className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg text-green-700 dark:text-green-400",
                "bg-green-500/5 border border-green-500/15"
              )}>
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span className={cn(ds.typography.size.xs)}>
                  Último: <strong>{lastSavedName}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer (Fixed) ─── */}
        <div className={cn(
          "flex-shrink-0 border-t px-4 py-3 space-y-2",
          ds.colors.surface.section,
          ds.colors.border.default
        )}>
          <Button 
            onClick={() => handleSubmit(true)} 
            disabled={!canSave || isSaving}
            className={cn(
              ds.components.button.primary,
              "w-full h-12 font-black text-base uppercase tracking-wider gap-2"
            )}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
            Salvar e Próximo
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleSubmit(false)} 
              disabled={!canSave || isSaving} 
              className={cn(ds.components.button.secondary, "h-10 font-bold gap-1.5")}
            >
              <Save className="h-3.5 w-3.5" />
              Apenas Salvar
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className={cn(ds.components.button.ghost, "h-10")}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
      
      <style>{`
        @keyframes scan-full {
          0% { top: 10%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </Dialog>
  );
}
