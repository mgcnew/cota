import React, { useState, useEffect } from 'react';
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

export const ScannerModal: React.FC<ScannerModalProps> = ({
  open,
  onOpenChange,
  onScan,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const isMobile = useIsMobileDevice();

  // Reset state when opening
  useEffect(() => {
    if (open) {
        setIsLoading(true);
        setError(null);
        setFacingMode('environment'); // Reset to back camera
    }
  }, [open]);

  // Timeout de segurança para não ficar carregando infinitamente
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (open && isLoading && !error) {
      timeout = setTimeout(() => {
        // Se passar 10s e ainda estiver carregando, mostra erro/ajuda
        // Não forçamos isLoading(false) aqui para permitir que a câmera ainda tente abrir, 
        // mas mostramos um aviso visual ou erro.
        // Na verdade, é melhor mostrar o erro e permitir retry.
        setIsLoading(false);
        setError("A câmera está demorando para responder. Tente inverter a câmera ou recarregar.");
      }, 10000); // 10 segundos
    }
    return () => clearTimeout(timeout);
  }, [open, isLoading, error]);

  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText());
      onOpenChange(false);
    },
    onError(err) {
      // Ignore silent errors
      if (err.name === "NotFoundException") return;
      
      console.warn("Erro no scan:", err);
      
      // Se for erro de permissão ou não encontrado, paramos o loading imediatamente.
      // Outros erros podem ser transitórios.
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setIsLoading(false);
          setError("Acesso à câmera negado. Verifique as permissões.");
      } else if (err.name === "NotFoundError") {
          setIsLoading(false);
          setError("Nenhuma câmera encontrada.");
      } else if (err.name === "NotReadableError") {
          setIsLoading(false);
          setError("Câmera em uso ou inacessível.");
      } else if (err.name === "OverconstrainedError") {
          // Se a constraint falhar, tenta inverter automaticamente ou avisa
          console.log("OverconstrainedError, tentando inverter...");
          // Não vamos inverter auto para não criar loop, mas avisamos
          setIsLoading(false);
          setError("Câmera solicitada não disponível. Tente inverter.");
      }
    },
    paused: !open || !isMobile,
    constraints: {
        video: { facingMode: facingMode }
    },
    timeBetweenDecodingAttempts: 300,
  });

  const toggleCamera = () => {
      setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
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
                        </div>
                    </div>
                 )}

                 {/* Overlay for aiming - Only show when ready */}
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
                      {facingMode === 'environment' ? 'Usar Câmera Frontal' : 'Usar Câmera Traseira'}
                  </Button>
              </div>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground text-center px-4">
            Posicione o código de barras dentro da área demarcada.
        </p>
        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full max-w-sm">
          Cancelar
        </Button>
      </div>
    </ResponsiveModal>
  );
};
