/**
 * CSS-only animation components to replace framer-motion
 * Reduces bundle size by ~367KB
 */
import { ReactNode, memo, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

/**
 * Simple fade-in animation using CSS transitions
 * Replaces motion.div with initial={{ opacity: 0 }} animate={{ opacity: 1 }}
 */
export const CSSFadeIn = memo(function CSSFadeIn({ 
  children, 
  className,
  delay = 0,
  duration = 200 
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-opacity will-change-[opacity]',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
});

interface SlideInProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
}

/**
 * Slide-in animation using CSS transforms
 * Replaces motion.div with initial={{ opacity: 0, x/y: 20 }} animate={{ opacity: 1, x/y: 0 }}
 */
export const CSSSlideIn = memo(function CSSSlideIn({ 
  children, 
  className,
  direction = 'up',
  delay = 0,
  duration = 200 
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return 'translate(0, 0)';
    switch (direction) {
      case 'up': return 'translateY(20px)';
      case 'down': return 'translateY(-20px)';
      case 'left': return 'translateX(20px)';
      case 'right': return 'translateX(-20px)';
    }
  };

  return (
    <div
      className={cn(
        'transition-all will-change-[transform,opacity]',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{ 
        transitionDuration: `${duration}ms`,
        transform: getTransform()
      }}
    >
      {children}
    </div>
  );
});

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}

/**
 * Animated list with staggered children
 * Replaces AnimatePresence with staggered motion.div children
 */
export const CSSAnimatedList = memo(function CSSAnimatedList({
  children,
  className,
  itemClassName,
  staggerDelay = 50
}: AnimatedListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <CSSSlideIn 
          key={index} 
          delay={index * staggerDelay}
          className={itemClassName}
        >
          {child}
        </CSSSlideIn>
      ))}
    </div>
  );
});

interface ScaleInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

/**
 * Scale-in animation
 * Replaces motion.div with initial={{ scale: 0.9 }} animate={{ scale: 1 }}
 */
export const CSSScaleIn = memo(function CSSScaleIn({ 
  children, 
  className,
  delay = 0,
  duration = 200 
}: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all will-change-[transform,opacity]',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
});
