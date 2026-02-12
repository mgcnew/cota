import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveModal } from '@/components/responsive/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobileDevice } from "@/hooks/use-mobile-device";
import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: string) => void;
}

type InitStrategy = 'exact-env' | 'ideal-env' | 'any';

export const ScannerModal: React.FC<ScannerModalProps> = ({
  open,
  onOpenChange,
  onScan,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [strategy, setStrategy] = useState<InitStrategy>('exact-env');
  const isMobile = useIsMobileDevice();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const startedRef = useRef(false);
  const initAttemptRef = useRef(0);

  const hints = useMemo(() => {
    const map = new Map();
    map.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.PDF_417,
    ]);
    map.set(DecodeHintType.TRY_HARDER, true);
    return map as Map<DecodeHintType, unknown>;
  }, []);

  const getConstraints = (strat: InitStrategy): MediaStreamConstraints => {
    const base: MediaTrackConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      // @ts-ignore
      focusMode: 'continuous',
    };

    if (strat === 'exact-env') {
      return { video: { ...base, facingMode: { exact: 'environment' } } };
    }
    if (strat === 'ideal-env') {
      return { video: { ...base, facingMode: { ideal: 'environment' } } };
    }
    return { video: base };
  };

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);
      setStrategy('exact-env');
      initAttemptRef.current += 1;
      startedRef.current = false;
    }
  }, [open]);

  // Timeout watchdog
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (open && isLoading && !error) {
      timeout = setTimeout(() => {
        console.debug('[SCANNER] init timeout');
        setIsLoading(false);
        setError('A câmera demorou para iniciar. Verifique permissões e se está em HTTPS.');
      }, 15000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [open, isLoading, error]);

  const stopScanner = () => {
    const reader = readerRef.current;
    if (reader) {
      try {
        reader.reset();
      } catch (e) {
        console.debug('[SCANNER] reset error', e);
      }
    }
    startedRef.current = false;
  };

  const startScanner = async (attemptId: number) => {
    if (!open) return;
    if (!isMobile) return;
    if (startedRef.current) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    startedRef.current = true;
    setIsLoading(true);
    setError(null);

    console.debug('[SCANNER] start init', { attemptId });

    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const warmup = await navigator.mediaDevices.getUserMedia({ video: true });
        warmup.getTracks().forEach(t => t.stop());
      }
    } catch (e) {
      console.debug('[SCANNER] warmup failed', e);
    }

    const reader = new BrowserMultiFormatReader(hints, 500);
    reader.timeBetweenDecodingAttempts = 100;
    readerRef.current = reader;

    const strategies: InitStrategy[] = ['exact-env', 'ideal-env', 'any'];
    for (const strat of strategies) {
      if (!open || attemptId !== initAttemptRef.current) return;

      setStrategy(strat);
      console.debug('[SCANNER] trying strategy', strat);
      try {
        await reader.decodeFromConstraints(getConstraints(strat), videoEl, (result, err) => {
          if (result) {
            const text = result.getText();
            console.debug('[SCANNER] decoded', { text });
            onScan(text);
            onOpenChange(false);
            stopScanner();
            return;
          }
          if (err && err.name !== 'NotFoundException') {
            console.debug('[SCANNER] decode error', err);
          }
        });

        return;
      } catch (e: any) {
        console.debug('[SCANNER] start failed', { strat, name: e?.name, message: e?.message, e });
        stopScanner();
        startedRef.current = true;
        
        if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
          setIsLoading(false);
          setError('Acesso à câmera negado. Verifique as permissões do navegador.');
          return;
        }
        if (e?.name === 'NotFoundError') {
          setIsLoading(false);
          setError('Nenhuma câmera encontrada neste dispositivo.');
          return;
        }
        if (e?.name === 'NotReadableError') {
          setIsLoading(false);
          setError('Câmera em uso ou inacessível. Feche outros apps que usam câmera.');
          return;
        }

        startedRef.current = false;
        continue;
      }
    }

    setIsLoading(false);
    setError('Não foi possível iniciar a câmera traseira.');
    startedRef.current = false;
  };

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    const attemptId = initAttemptRef.current;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const onCanPlay = () => {
      setIsLoading(false);
    };
    videoEl.addEventListener('playing', onCanPlay);
    videoEl.addEventListener('canplay', onCanPlay);
    
    startScanner(attemptId);

    return () => {
      videoEl.removeEventListener('playing', onCanPlay);
      videoEl.removeEventListener('canplay', onCanPlay);
      stopScanner();
    };
  }, [open, isMobile]);

  const restartScanner = () => {
    stopScanner();
    startedRef.current = false;
    setIsLoading(true);
    setError(null);
    setStrategy('exact-env');
    const attemptId = initAttemptRef.current + 1;
    initAttemptRef.current = attemptId;
    startScanner(attemptId);
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
              <Button onClick={restartScanner} variant="outline" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
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
                     ref={videoRef}
                     className="w-full h-full object-cover" 
                     autoPlay 
                     playsInline 
                     muted 
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
