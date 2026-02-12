import React, { useState, useEffect, useRef } from 'react';
import { useZxing } from 'react-zxing';
import { ResponsiveModal } from '@/components/responsive/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobileDevice } from "@/hooks/use-mobile-device";

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: string) => void;
}

type InitStrategy = 'exact-env' | 'ideal-env' | 'any' | 'user';

export const ScannerModal: React.FC<ScannerModalProps> = ({
  open,
  onOpenChange,
  onScan,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [strategy, setStrategy] = useState<InitStrategy>('exact-env');
  const isMobile = useIsMobileDevice();
  const retryCount = useRef(0);

  // Initial constraints based on strategy
  const getConstraints = (strat: InitStrategy): MediaStreamConstraints => {
    const baseVideo: MediaTrackConstraints = {
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 },
      // @ts-ignore - focusMode is supported in some browsers
      focusMode: 'continuous', 
    };

    switch (strat) {
      case 'exact-env':
        return { video: { ...baseVideo, facingMode: { exact: 'environment' } } };
      case 'ideal-env':
        return { video: { ...baseVideo, facingMode: 'environment' } };
      case 'user':
        return { video: { ...baseVideo, facingMode: 'user' } };
      case 'any':
      default:
        return { video: baseVideo };
    }
  };

  // Reset state when opening
  useEffect(() => {
    if (open) {
        setIsLoading(true);
        setError(null);
        setStrategy('exact-env'); // Start with best possible
        retryCount.current = 0;
    }
  }, [open]);

  // Timeout watchdog
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (open && isLoading && !error) {
      timeout = setTimeout(() => {
        // Only show error if we are still loading and haven't failed yet
        setIsLoading(false);
        setError("A câmera está demorando para responder. Tente inverter a câmera ou recarregar.");
      }, 15000); // 15 seconds
    }
    return () => clearTimeout(timeout);
  }, [open, isLoading, error]);

  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText());
      onOpenChange(false);
    },
    onError(err) {
      if (err.name === "NotFoundException") return;
      
      console.warn(`Scan Error (${strategy}):`, err);

      // Handle Initialization/Constraint Errors by downgrading strategy
      if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
        if (strategy === 'exact-env') {
          console.log("Downgrading to ideal-env...");
          setStrategy('ideal-env');
          return;
        } else if (strategy === 'ideal-env') {
          console.log("Downgrading to any...");
          setStrategy('any');
          return;
        }
      }

      // If we are here, we ran out of strategies or hit a permission/hardware error
      setIsLoading(false);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Acesso à câmera negado. Verifique as permissões.");
      } else if (err.name === "NotFoundError") {
          setError("Nenhuma câmera encontrada.");
      } else if (err.name === "NotReadableError") {
          setError("Câmera em uso ou inacessível. Feche outros apps.");
      } else {
          setError(`Erro na câmera: ${err.message || "Desconhecido"}. Tente recarregar.`);
      }
    },
    paused: !open || !isMobile,
    constraints: getConstraints(strategy),
    timeBetweenDecodingAttempts: 300,
  });

  const toggleCamera = () => {
      setStrategy(prev => prev === 'user' ? 'exact-env' : 'user');
      setIsLoading(true);
      setError(null);
  };

  // If accessed on desktop (fallback safety), don't render
  if (!isMobile) {
      return null;
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Escanear Código de Barras"
      description="Aponte a câmera para o código."
    >
      <div className="flex flex-col items-center justify-center space-y-4 p-4">
        {error ? (
          <div className="w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
                <Button onClick={toggleCamera} variant="outline" className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Inverter Câmera
                </Button>
                <Button onClick={() => window.location.reload()} variant="secondary" className="flex-1">
                    Recarregar
                </Button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
              <div className="relative w-full max-w-sm mx-auto aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-lg ring-1 ring-border">
                 {open && (
                   <video 
                     ref={ref} 
                     className="w-full h-full object-cover" 
                     autoPlay 
                     playsInline 
                     muted 
                     onPlaying={() => setIsLoading(false)}
                   />
                 )}
                 
                 {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                            <span className="text-white text-xs">Iniciando câmera...</span>
                            <span className="text-white/50 text-[10px] opacity-50">{strategy}</span>
                        </div>
                    </div>
                 )}

                 {/* Overlay for aiming */}
                 {!isLoading && (
                     <>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="w-3/4 h-1/3 border-2 border-red-500 rounded-lg opacity-70 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-red-500 opacity-50 animate-pulse"></div>
                        </div>
            
                        <div className="absolute bottom-2 right-2 pointer-events-none z-10">
                            <Camera className="text-white/50 w-6 h-6 animate-pulse" />
                        </div>
                     </>
                 )}
              </div>

              {/* Camera Controls */}
              <div className="flex justify-center">
                  <Button variant="ghost" size="sm" onClick={toggleCamera} className="text-xs gap-2" disabled={isLoading}>
                      <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                      {strategy === 'user' ? 'Usar Câmera Traseira' : 'Usar Câmera Frontal'}
                  </Button>
              </div>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground text-center px-4">
            Posicione o código de barras dentro da área demarcada.
            <br/><span className="text-xs opacity-70">Mantenha o foco estável.</span>
        </p>
        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full max-w-sm">
          Cancelar
        </Button>
      </div>
    </ResponsiveModal>
  );
};
