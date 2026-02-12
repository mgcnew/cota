import React from 'react';
import { useZxing } from 'react-zxing';
import { ResponsiveModal } from '@/components/responsive/ResponsiveModal';
import { Button } from '@/components/ui/button';

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
  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText());
      onOpenChange(false);
    },
    paused: !open,
    constraints: {
        video: {
            facingMode: 'environment'
        }
    }
  });

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Escanear Código de Barras"
      description="Aponte a câmera para o código de barras."
    >
      <div className="flex flex-col items-center justify-center space-y-4 p-4">
        <div className="relative w-full max-w-sm aspect-square bg-black rounded-lg overflow-hidden">
           {open && <video ref={ref} className="w-full h-full object-cover" />}
           {/* Overlay for aiming */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-3/4 h-1/3 border-2 border-red-500 rounded-lg opacity-70"></div>
           </div>
        </div>
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
