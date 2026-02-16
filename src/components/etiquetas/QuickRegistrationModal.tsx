import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveModal } from '@/components/responsive/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Loader2, Scan, CheckCircle2, RotateCcw, AlertCircle, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { designSystem } from "@/styles/design-system";

interface QuickRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, barcode: string) => Promise<boolean>;
}

type Step = 'scan' | 'form';

const SCANNER_ELEMENT_ID = "quick-scanner-reader";

export function QuickRegistrationModal({
  open,
  onOpenChange,
  onSave
}: QuickRegistrationModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('scan');
  const [barcode, setBarcode] = useState("");
  const [productName, setProductName] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('scan');
      setBarcode("");
      setProductName("");
      setCameraError(null);
    } else {
      stopScanner();
    }
  }, [open]);

  // Handle Scanner Lifecycle
  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      if (!open || step !== 'scan') return;

      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!mounted) return;

      try {
        if (scannerRef.current) {
          await stopScanner();
        }

        const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.QR_CODE
            ]
          },
          (decodedText) => {
            if (mounted) {
              handleScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
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

    if (open && step === 'scan') {
      initScanner();
    }

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [open, step]);

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

  const handleManualEntry = () => {
    stopScanner();
    setStep('form');
    // Focus name input
    setTimeout(() => {
        nameInputRef.current?.focus();
    }, 300);
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(200);
    
    // Play sound (optional, browser policy might block)
    // const audio = new Audio('/scan-beep.mp3');
    // audio.play().catch(() => {});

    await stopScanner();
    setBarcode(decodedText);
    setStep('form');
    
    // Auto-focus name input
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 300);
  };

  const handleRescan = () => {
    setStep('scan');
    setBarcode("");
    setProductName("");
  };

  const handleSubmit = async () => {
    if (!productName.trim() || !barcode.trim()) return;

    setIsSaving(true);
    try {
      const success = await onSave(productName, barcode);
      if (success) {
        // Show success visual feedback
        toast({
          title: "Sucesso!",
          description: "Produto cadastrado.",
          className: "bg-green-50 border-green-200 text-green-800",
        });
        
        // Reset to scan mode for next item (productivity flow)
        setStep('scan');
        setBarcode("");
        setProductName("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={step === 'scan' ? "Escanear Produto" : "Cadastrar Produto"}
      description={step === 'scan' ? "Posicione o código no centro" : "Confirme os dados do produto"}
    >
      <div className="flex flex-col min-h-[400px]">
        {/* SCANNER VIEW */}
        <div className={cn("flex-1 flex flex-col gap-4 transition-all duration-300", step === 'scan' ? "opacity-100" : "hidden opacity-0")}>
          <div className="relative flex-1 bg-black rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center">
            {!isScanning && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <span className="text-sm">Iniciando câmera...</span>
              </div>
            )}
            
            {cameraError && (
               <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background text-foreground p-4 text-center">
                <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                <p className="font-medium">{cameraError}</p>
                <Button variant="outline" size="sm" onClick={() => setStep('scan')} className="mt-4">
                  Tentar Novamente
                </Button>
              </div>
            )}

            <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />
            
            {/* Visual Guide Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none border-[2px] border-white/20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1"></div>
                  
                  {/* Scanning Line Animation */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 animate-[scan_2s_infinite]"></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center flex gap-4 justify-center">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleManualEntry}>
              Digitar Manualmente
            </Button>
          </div>
        </div>

        {/* FORM VIEW */}
        <div className={cn("flex-1 flex flex-col gap-6 p-1 transition-all duration-300", step === 'form' ? "opacity-100" : "hidden opacity-0")}>
           <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex items-center gap-4">
              <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center shadow-sm border">
                <Scan className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Código Detectado</p>
                <p className="text-lg font-mono font-bold tracking-widest text-foreground">{barcode}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={handleRescan} title="Escanear novamente">
                <RotateCcw className="h-4 w-4" />
              </Button>
           </div>

           <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name" className="text-base">Nome do Produto</Label>
                <Input
                  ref={nameInputRef}
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ex: Coca Cola 350ml"
                  className="h-12 text-lg"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                 <Label htmlFor="barcode-edit" className="text-sm text-muted-foreground">Editar Código (se necessário)</Label>
                 <Input
                    id="barcode-edit"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="font-mono text-sm bg-muted/50"
                 />
              </div>
           </div>

           <div className="flex-1"></div>

           <div className="grid grid-cols-2 gap-3 mt-4">
             <Button variant="outline" onClick={handleRescan} className="h-12">
               Cancelar
             </Button>
             <Button 
               onClick={handleSubmit} 
               disabled={!productName || !barcode || isSaving}
               className={cn("h-12 font-bold", designSystem.components.button.primary)}
             >
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
               Salvar
             </Button>
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </ResponsiveModal>
  );
}
