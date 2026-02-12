import React, { useState, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import { ResponsiveModal } from '@/components/responsive/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera, RefreshCw, Smartphone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Listar dispositivos de vídeo
  useEffect(() => {
    if (!open) return;

    const getDevices = async () => {
      try {
        // Primeiro solicita permissão para conseguir listar os labels dos dispositivos
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        setError(null);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
        
        // Se já tiver um selecionado, mantém. Se não, tenta encontrar a traseira.
        if (!selectedDeviceId && videoInputs.length > 0) {
            const backCamera = videoInputs.find(d => 
                d.label.toLowerCase().includes('back') || 
                d.label.toLowerCase().includes('traseira') || 
                d.label.toLowerCase().includes('environment')
            );
            if (backCamera) {
                setSelectedDeviceId(backCamera.deviceId);
            } else {
                // Se for mobile e tiver mais de uma, geralmente a última é a traseira em alguns browsers, 
                // mas a primeira é a padrão. Vamos na última se tiver 'facingMode' environment nas constraints, 
                // mas aqui estamos selecionando por ID. Vamos na última como tentativa de pegar a traseira se não tiver label.
                setSelectedDeviceId(videoInputs[videoInputs.length - 1].deviceId);
            }
        }
      } catch (err: any) {
        console.error("Erro ao listar dispositivos:", err);
        setHasPermission(false);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setError("Acesso à câmera negado. Por favor, permita o acesso.");
        } else {
            setError("Erro ao acessar a câmera: " + (err.message || "Desconhecido"));
        }
      }
    };
    
    getDevices();
  }, [open]);

  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText());
      onOpenChange(false);
    },
    onError(err) {
      // Ignorar erros silenciosos de scan
      if (err.name === "NotFoundException") return;
      console.warn("Erro no scan:", err);
    },
    paused: !open || !hasPermission,
    constraints: {
        video: selectedDeviceId 
            ? { deviceId: { exact: selectedDeviceId } } 
            : { facingMode: 'environment' }
    },
    timeBetweenDecodingAttempts: 300,
  });

  const handleDeviceChange = (deviceId: string) => {
      setSelectedDeviceId(deviceId);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Escanear Código de Barras"
      description="Aponte a câmera para o código de barras."
    >
      <div className="flex flex-col items-center justify-center space-y-4 p-4">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
                   />
                 )}
                 
                 {/* Overlay for aiming */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-3/4 h-1/3 border-2 border-red-500 rounded-lg opacity-70 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-red-500 opacity-50 animate-pulse"></div>
                 </div>
    
                 <div className="absolute bottom-2 right-2 pointer-events-none">
                    <Camera className="text-white/50 w-6 h-6 animate-pulse" />
                 </div>
              </div>

              {/* Camera Selector */}
              {videoDevices.length > 1 && (
                  <div className="flex items-center gap-2 max-w-sm mx-auto">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <Select value={selectedDeviceId} onValueChange={handleDeviceChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione a câmera" />
                        </SelectTrigger>
                        <SelectContent>
                            {videoDevices.map((device, index) => (
                                <SelectItem key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Câmera ${index + 1}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                  </div>
              )}
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
