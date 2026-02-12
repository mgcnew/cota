import React, { useState } from 'react';
import { useZxing } from 'react-zxing';
import { ResponsiveModal } from '@/components/responsive/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText());
      onOpenChange(false);
    },
    onError(err) {
      console.error("Erro na câmera:", err);
      // Não exibir erro para o usuário se for apenas "No barcode found" que é comum
      if (err.name === "NotAllowedError") {
        setError("Acesso à câmera negado. Por favor, permita o acesso nas configurações do navegador.");
      } else if (err.name === "NotFoundError") {
        setError("Nenhuma câmera encontrada neste dispositivo.");
      } else if (err.name !== "NotFoundException") { // Ignorar erros de scan vazio
        // setError("Erro ao acessar a câmera: " + err.message);
      }
    },
    paused: !open,
    constraints: {
        video: {
            facingMode: 'environment' // Tenta a traseira, mas aceita fallback
        }
    },
    timeBetweenDecodingAttempts: 300,
  });

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
          <div className="relative w-full max-w-sm aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
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

             <div className="absolute bottom-2 right-2">
                <Camera className="text-white/50 w-6 h-6 animate-pulse" />
             </div>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground text-center">
            Posicione o código de barras dentro da área demarcada.
        </p>
        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          Cancelar
        </Button>
      </div>
    </ResponsiveModal>
  );
};
