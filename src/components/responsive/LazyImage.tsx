/**
 * LazyImage Component
 * 
 * Implements lazy loading for images with blur-up placeholder support and WebP format.
 * Optimized for mobile performance by deferring image loading until needed.
 * 
 * Requirements: 2.4, 6.3, 17.1, 17.2
 * - Apply lazy loading with loading="lazy" attribute
 * - Implement blur-up placeholder effect during loading
 * - Support WebP format with fallback for unsupported browsers
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Check if WebP is supported by the browser
 */
const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Cache WebP support check result
let webPSupported: boolean | null = null;

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Source URL for the image */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Optional low-resolution placeholder image URL */
  placeholder?: string;
  /** Optional blur placeholder (base64 or URL) for blur-up effect */
  blurPlaceholder?: string;
  /** Optional blur data URL (tiny base64 image for blur effect) */
  blurDataURL?: string;
  /** WebP source URL (will be used if browser supports WebP) */
  webpSrc?: string;
  /** Width of the image (helps prevent layout shift) */
  width?: number | string;
  /** Height of the image (helps prevent layout shift) */
  height?: number | string;
  /** Aspect ratio for responsive sizing (e.g., "16/9", "1/1", "4/3") */
  aspectRatio?: string;
  /** Additional class names */
  className?: string;
  /** Container class names */
  containerClassName?: string;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Whether to show loading skeleton */
  showSkeleton?: boolean;
  /** Custom fallback element when image fails to load */
  fallback?: React.ReactNode;
  /** Enable blur-up effect (default: true when blurPlaceholder or blurDataURL is provided) */
  enableBlurUp?: boolean;
}

/**
 * Generate a simple SVG placeholder with specified dimensions
 */
function generatePlaceholderSvg(width: number, height: number, bgColor = '#e5e7eb'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect fill="${bgColor}" width="${width}" height="${height}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Default placeholder for images
 */
const DEFAULT_PLACEHOLDER = generatePlaceholderSvg(100, 100, '#f3f4f6');

export function LazyImage({
  src,
  alt,
  placeholder,
  blurPlaceholder,
  blurDataURL,
  webpSrc,
  width,
  height,
  aspectRatio,
  className,
  containerClassName,
  onLoad,
  onError,
  showSkeleton = true,
  fallback,
  enableBlurUp,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(webPSupported);

  // Check WebP support on mount
  useEffect(() => {
    if (webpSrc && webPSupported === null) {
      checkWebPSupport().then((supported) => {
        webPSupported = supported;
        setSupportsWebP(supported);
      });
    }
  }, [webpSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Determine the blur source for blur-up effect
  const blurSrc = blurDataURL || blurPlaceholder;
  const shouldBlur = enableBlurUp ?? !!blurSrc;

  // Generate placeholder based on dimensions
  const placeholderSrc = useMemo(() => {
    if (placeholder) return placeholder;
    if (blurSrc) return blurSrc;
    
    const w = typeof width === 'number' ? width : 100;
    const h = typeof height === 'number' ? height : 100;
    return generatePlaceholderSvg(w, h);
  }, [placeholder, blurSrc, width, height]);

  // Calculate aspect ratio style
  const aspectRatioStyle = useMemo(() => {
    if (aspectRatio) {
      return { aspectRatio };
    }
    if (width && height) {
      const w = typeof width === 'number' ? width : parseInt(width, 10);
      const h = typeof height === 'number' ? height : parseInt(height, 10);
      if (!isNaN(w) && !isNaN(h)) {
        return { aspectRatio: `${w}/${h}` };
      }
    }
    return {};
  }, [aspectRatio, width, height]);

  // Determine the final image source (WebP if supported, otherwise original)
  const finalSrc = useMemo(() => {
    if (webpSrc && supportsWebP) {
      return webpSrc;
    }
    return src;
  }, [src, webpSrc, supportsWebP]);

  // Show fallback if error occurred
  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div 
      className={cn(
        'relative overflow-hidden',
        containerClassName
      )}
      style={aspectRatioStyle}
    >
      {/* Blur-up placeholder layer */}
      {showSkeleton && !isLoaded && !hasError && (
        <div 
          className={cn(
            'absolute inset-0 bg-muted',
            !blurSrc && 'animate-pulse',
            shouldBlur && blurSrc && 'blur-lg scale-110 transform'
          )}
          style={{
            backgroundImage: blurSrc ? `url(${blurSrc})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'opacity 300ms ease-out',
          }}
        />
      )}
      
      {/* Main image with native lazy loading */}
      <img
        src={finalSrc}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-all duration-300 ease-out',
          isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm',
          hasError && 'hidden',
          className
        )}
        {...props}
      />
      
      {/* Error state */}
      {hasError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">
            Failed to load image
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified lazy image for basic use cases
 */
export function SimpleLazyImage({
  src,
  alt,
  className,
  ...props
}: Omit<LazyImageProps, 'placeholder' | 'blurPlaceholder' | 'showSkeleton' | 'fallback'>) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      {...props}
    />
  );
}

export default LazyImage;
