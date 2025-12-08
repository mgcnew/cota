import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  compressImageForUpload, 
  needsCompression, 
  getCompressionInfo,
  DEFAULT_MAX_FILE_SIZE 
} from "@/utils/imageCompression";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  isUploading?: boolean;
  className?: string;
}

export function AvatarUpload({
  currentAvatar,
  onUpload,
  onRemove,
  isUploading,
  className,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return "Formato inválido. Use JPG, PNG, WEBP ou GIF.";
    }
    // Allow larger files since we'll compress them
    if (file.size > 10 * 1024 * 1024) {
      return "Arquivo muito grande. Máximo 10MB.";
    }
    return null;
  };

  const handleFileChange = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      let processedFile = file;
      
      // Compress if needed (> 500KB)
      if (needsCompression(file)) {
        setIsCompressing(true);
        const originalSize = file.size;
        processedFile = await compressImageForUpload(file);
        const info = getCompressionInfo(originalSize, processedFile.size);
        
        toast.success(
          `Imagem comprimida: ${info.originalSizeKB}KB → ${info.compressedSizeKB}KB (${info.savedPercent}% menor)`
        );
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(processedFile);
      
      onUpload(processedFile);
    } catch (err) {
      console.error('Error processing image:', err);
      toast.error('Erro ao processar imagem. Tente novamente.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFileChange(file);
  };

  const isProcessing = isUploading || isCompressing;

  const displayImage = preview || currentAvatar;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className={cn(
          "relative h-40 w-40 rounded-full border-2 border-dashed transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25",
          displayImage && "border-solid"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt="Avatar preview"
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 gap-1">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            {isCompressing && (
              <span className="text-xs text-white">Comprimindo...</span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="min-h-[44px] touch-target"
        >
          <Camera className="mr-2 h-4 w-4" />
          {currentAvatar ? "Alterar Foto" : "Adicionar Foto"}
        </Button>

        {(currentAvatar || preview) && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isProcessing}
            className="min-h-[44px] touch-target"
          >
            <X className="mr-2 h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
        disabled={isProcessing}
      />

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG, WEBP ou GIF. Máximo 10MB.
        <br />
        <span className="text-muted-foreground/70">Imagens serão comprimidas para max 500KB</span>
      </p>
    </div>
  );
}
