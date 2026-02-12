import React, { useEffect, useRef, useState } from 'react';
import { ResponsiveModal } from '@/components/responsive/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobileDevice } from "@/hooks/use-mobile-device";

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: string) => void;
}

const SCANNER_ELEMENT_ID = "html5-qrcode-reader";

export const ScannerModal: React.FC<ScannerModalProps> = ({
  open,
  onOpenChange,
  onScan,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobileDevice();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    // Cleanup function to stop scanner when modal closes or component unmounts
    return () => {
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current.stop().catch(err => console.warn("Failed to stop scanner", err));
        isScanningRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      // Stop scanner if modal is closed
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current.stop()
          .then(() => {
            isScanningRef.current = false;
            scannerRef.current?.clear();
          })
          .catch(err => console.warn("Failed to stop scanner on close", err));
      }
      return;
    }

    if (!isMobile) return;

    // Reset state
    setError(null);
    setIsLoading(true);

    // Small delay to ensure DOM element is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => clearTimeout(timer);
  }, [open, isMobile]);

  const startScanner = async () => {
    try {
      // If already scanning, stop first (safety check)
      if (scannerRef.current && isScanningRef.current) {
        await scannerRef.current.stop();
        isScanningRef.current = false;
      }

      // Initialize if not exists
      if (!scannerRef.current) {
        try {
            scannerRef.current = new Html5Qrcode(SCANNER_ELEMENT_ID);
        } catch (e) {
            console.error('Error instantiating scanner:', e);
            throw e;
        }
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // Add support for common barcode formats
        formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE
        ]
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Success callback
          console.log("Scanned:", decodedText);
          
          // Haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }

          onScan(decodedText);
          onOpenChange(false);
        },
        (errorMessage) => {
          // Error callback (called for every frame that doesn't have a code)
          // We don't want to show this to the user, just ignore or debug
          // console.debug("Scanning...", errorMessage);
        }
      );

      isScanningRef.current = true;
      setIsLoading(false);

    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setIsLoading(false);
      
      let msg = "Erro ao iniciar a câmera.";
      if (typeof err === 'string') {
          msg = err;
      } else if (err?.name === 'NotAllowedError') {
          msg = "Permissão da câmera negada.";
      } else if (err?.name === 'NotFoundError') {
          msg = "Nenhuma câmera encontrada.";
      } else if (err?.name === 'NotReadableError') {
          msg = "A câmera pode estar em uso por outro aplicativo.";
      } else if (err?.message) {
          msg = `Erro: ${err.message}`;
      } else {
          msg = `Erro: ${JSON.stringify(err)}`;
      }
      
      setError(msg);
    }
  };

  const handleManualRetry = () => {
    startScanner();
  };

  if (!isMobile) return null;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Escanear Código de Barras"
      description="Aponte a câmera para o código."
    >
      <div className="flex flex-col items-center justify-center space-y-4 p-4 min-h-[300px]">
        
        {/* Error State */}
        {error && (
          <div className="w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={handleManualRetry} variant="outline" className="w-full">
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Scanner Container */}
        <div 
            id={SCANNER_ELEMENT_ID} 
            className={`w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-black ${error ? 'hidden' : 'block'}`}
            style={{ minHeight: '300px' }}
        />

        {/* Loading Indicator */}
        {isLoading && !error && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 rounded-lg">
                <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                <span className="text-white text-sm">Iniciando câmera...</span>
            </div>
        )}

        <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
                Posicione o código de barras no centro da tela.
            </p>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
            </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};
