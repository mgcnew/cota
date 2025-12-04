/**
 * LazyImage Component
 * 
 * Implements lazy loading for images with low-resolution placeholder support.
 * Optimized for mobile performance by deferring image loading until needed.
 * 
 * Requirements: 6.3
 * - Apply lazy loading with loading="lazy" attribute
 * - Implement placeholder of low resolution while loading
 */

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Source URL for the image */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Optional low-resolution placeholder image URL */
  placeholder?: string;
  /** Optional blur placeholder (base64 or URL) */
  blurPlaceholder?: string;
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
  width,
  height,
  aspectRatio,
  className,
  containerClassName,
  onLoad,
  onError,
  showSkeleton = true,
  fallback,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate placeholder based on dimensions
  const placeholderSrc = useMemo(() => {
    if (placeholder) return placeholder;
    if (blurPlaceholder) return blurPlaceholder;
    
    const w = typeof width === 'number' ? width : 100;
    const h = typeof height === 'number' ? height : 100;
    return generatePlaceholderSvg(w, h);
  }, [placeholder, blurPlaceholder, width, height]);

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
      {/* Skeleton/Placeholder layer */}
      {showSkeleton && !isLoaded && !hasError && (
        <div 
          className={cn(
            'absolute inset-0 bg-muted animate-pulse',
            blurPlaceholder && 'blur-sm'
          )}
          style={{
            backgroundImage: blurPlaceholder ? `url(${blurPlaceholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      
      {/* Main image with native lazy loading */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
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
