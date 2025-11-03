import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return "Formato inválido. Use JPG, PNG, WEBP ou GIF.";
    }
    if (file.size > 2 * 1024 * 1024) {
      return "Arquivo muito grande. Máximo 2MB.";
    }
    return null;
  };

  const handleFileChange = (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onUpload(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const displayImage = preview || currentAvatar;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className={cn(
          "relative h-32 w-32 rounded-full border-2 border-dashed transition-colors",
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
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
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
            disabled={isUploading}
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
        disabled={isUploading}
      />

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG, WEBP ou GIF. Máximo 2MB.
      </p>
    </div>
  );
}
