/**
 * Utilitários para compressão de imagens em mobile
 * Reduz uso de memória e melhora performance
 * Suporta WebP com fallback para JPEG
 * 
 * Requirements: 8.5, 17.2, 17.5
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Maximum file size in bytes. Default: 500KB (512000 bytes) */
  maxFileSize?: number;
  /** Preferred output format. Default: 'webp' with JPEG fallback */
  preferredFormat?: 'webp' | 'jpeg';
}

/**
 * Check if WebP is supported by the browser
 */
let webPSupportCached: boolean | null = null;

export async function checkWebPSupport(): Promise<boolean> {
  if (webPSupportCached !== null) {
    return webPSupportCached;
  }
  
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      webPSupportCached = webP.height === 2;
      resolve(webPSupportCached);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Get the best supported image format
 */
export async function getBestImageFormat(): Promise<'image/webp' | 'image/jpeg'> {
  const supportsWebP = await checkWebPSupport();
  return supportsWebP ? 'image/webp' : 'image/jpeg';
}

/** Default max file size: 500KB */
export const DEFAULT_MAX_FILE_SIZE = 500 * 1024; // 500KB

/**
 * Compresses an image to a target size with iterative quality reduction
 * Uses WebP format when supported for better compression
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image blob
 * 
 * Requirements: 8.5, 17.2, 17.5
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    preferredFormat,
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

        // Iteratively reduce quality until file size is under maxFileSize
        // Uses WebP when supported for better compression
        compressToTargetSize(canvas, quality, maxFileSize, 0.1, preferredFormat)
          .then(resolve)
          .catch(reject);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Iteratively compresses canvas to target file size
 * Reduces quality in steps until target size is achieved
 * Uses WebP format when supported for better compression
 */
async function compressToTargetSize(
  canvas: HTMLCanvasElement,
  initialQuality: number,
  maxFileSize: number,
  minQuality: number = 0.1,
  preferredFormat?: 'webp' | 'jpeg'
): Promise<Blob> {
  let quality = initialQuality;
  let blob: Blob | null = null;
  
  // Try up to 10 iterations to reach target size
  for (let i = 0; i < 10 && quality >= minQuality; i++) {
    blob = await canvasToBlob(canvas, quality, preferredFormat);
    
    if (blob.size <= maxFileSize) {
      return blob;
    }
    
    // Reduce quality by 10% for next iteration
    quality -= 0.1;
  }
  
  // If still too large, try reducing dimensions
  if (blob && blob.size > maxFileSize) {
    const scaledCanvas = scaleCanvas(canvas, 0.75);
    return compressToTargetSize(scaledCanvas, initialQuality, maxFileSize, minQuality, preferredFormat);
  }
  
  // Return best effort result
  return blob || canvasToBlob(canvas, minQuality, preferredFormat);
}

/**
 * Converts canvas to blob with specified quality
 * Uses WebP if supported, falls back to JPEG
 */
async function canvasToBlob(
  canvas: HTMLCanvasElement, 
  quality: number,
  preferredFormat?: 'webp' | 'jpeg'
): Promise<Blob> {
  const format = preferredFormat === 'jpeg' 
    ? 'image/jpeg' 
    : await getBestImageFormat();
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback to JPEG if WebP fails
          if (format === 'image/webp') {
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve(jpegBlob);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              'image/jpeg',
              quality
            );
          } else {
            reject(new Error('Failed to compress image'));
          }
        }
      },
      format,
      quality
    );
  });
}

/**
 * Scales a canvas by a given factor
 */
function scaleCanvas(canvas: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = Math.floor(canvas.width * scale);
  scaledCanvas.height = Math.floor(canvas.height * scale);
  
  const ctx = scaledCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  }
  
  return scaledCanvas;
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

/**
 * Compresses an image for upload, ensuring it's under 500KB
 * Uses WebP format when supported for better compression
 * This is the main function to use before uploading images
 * 
 * @param file - The image file to compress
 * @returns Compressed file ready for upload
 * 
 * Requirements: 8.5, 17.2, 17.5
 */
export async function compressImageForUpload(file: File): Promise<File> {
  // If file is already small enough, return as-is
  if (file.size <= DEFAULT_MAX_FILE_SIZE) {
    return file;
  }

  try {
    const supportsWebP = await checkWebPSupport();
    const compressed = await compressImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
      maxFileSize: DEFAULT_MAX_FILE_SIZE,
    });

    // Determine file extension based on format
    const extension = supportsWebP ? '.webp' : '.jpg';
    const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';

    // Create a new File from the Blob
    const compressedFile = new File(
      [compressed],
      file.name.replace(/\.[^.]+$/, extension),
      { type: mimeType }
    );

    return compressedFile;
  } catch (error) {
    console.error('Failed to compress image for upload:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Checks if a file needs compression based on size
 */
export function needsCompression(file: File): boolean {
  return file.size > DEFAULT_MAX_FILE_SIZE;
}

/**
 * Gets compression info for display to user
 */
export function getCompressionInfo(originalSize: number, compressedSize: number): {
  originalSizeKB: number;
  compressedSizeKB: number;
  savedPercent: number;
} {
  const originalSizeKB = Math.round(originalSize / 1024);
  const compressedSizeKB = Math.round(compressedSize / 1024);
  const savedPercent = Math.round((1 - compressedSize / originalSize) * 100);
  
  return { originalSizeKB, compressedSizeKB, savedPercent };
}
