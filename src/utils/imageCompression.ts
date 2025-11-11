/**
 * Utilitários para compressão de imagens em mobile
 * Reduz uso de memória e melhora performance
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Comprime uma imagem para otimizar uso de memória
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calcular novas dimensões mantendo aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Cria preview otimizado de imagem
 */
export async function createOptimizedPreview(
  file: File,
  isMobile: boolean = false
): Promise<string> {
  const options: CompressionOptions = isMobile
    ? { maxWidth: 400, maxHeight: 400, quality: 0.6 }
    : { maxWidth: 800, maxHeight: 800, quality: 0.8 };

  try {
    const compressed = await compressImage(file, options);
    return URL.createObjectURL(compressed);
  } catch (error) {
    console.error('Failed to create preview:', error);
    // Fallback para preview original
    return URL.createObjectURL(file);
  }
}

/**
 * Libera memória de previews
 */
export function revokePreviewUrls(urls: string[]) {
  urls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Failed to revoke URL:', error);
    }
  });
}
