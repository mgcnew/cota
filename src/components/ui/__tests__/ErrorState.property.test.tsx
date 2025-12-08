/**
 * Property-Based Tests for ErrorState Component
 *
 * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
 * **Validates: Requirements 10.5**
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { ErrorState, ErrorStateProps } from '../error-state';

/**
 * Valid error state variants
 */
type ErrorVariant = 'card' | 'inline' | 'fullscreen';
type ErrorSize = 'sm' | 'md' | 'lg';

const variantArb = fc.constantFrom<ErrorVariant>('card', 'inline', 'fullscreen');
const sizeArb = fc.constantFrom<ErrorSize>('sm', 'md', 'lg');

/**
 * Arbitrary for generating error state configurations
 */
const errorConfigArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  message: fc.string({ minLength: 1, maxLength: 500 }),
  retryLabel: fc.string({ minLength: 1, maxLength: 50 }),
  variant: variantArb,
  size: sizeArb,
  isRetrying: fc.boolean(),
});

describe('ErrorState - Property Tests', () => {
  describe('Property 16: Error State with Retry', () => {
    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * For any data fetching error, the UI SHALL display an error state
     * with a retry action button.
     *
     * Property: When onRetry is provided, a retry button is always rendered
     */
    it('always renders retry button when onRetry callback is provided', () => {
      fc.assert(
        fc.property(errorConfigArb, (config) => {
          cleanup();
          const onRetry = vi.fn();
          
          const { container } = render(
            <ErrorState
              title={config.title}
              message={config.message}
              retryLabel={config.retryLabel}
              variant={config.variant}
              size={config.size}
              onRetry={onRetry}
            />
          );
          
          // Find the retry button
          const retryButton = container.querySelector('button');
          
          expect(retryButton).toBeTruthy();
          expect(retryButton).not.toBeNull();
          
          return retryButton !== null;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: Retry button is clickable and calls onRetry callback
     */
    it('retry button calls onRetry callback when clicked', () => {
      fc.assert(
        fc.property(errorConfigArb, (config) => {
          cleanup();
          const onRetry = vi.fn();
          
          const { container } = render(
            <ErrorState
              title={config.title}
              message={config.message}
              onRetry={onRetry}
              isRetrying={false}
            />
          );
          
          const retryButton = container.querySelector('button');
          
          if (retryButton) {
            fireEvent.click(retryButton);
            expect(onRetry).toHaveBeenCalledTimes(1);
            return onRetry.mock.calls.length === 1;
          }
          
          return false;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: Retry button is disabled when isRetrying is true
     */
    it('retry button is disabled when isRetrying is true', () => {
      fc.assert(
        fc.property(errorConfigArb, (config) => {
          cleanup();
          const onRetry = vi.fn();
          
          const { container } = render(
            <ErrorState
              title={config.title}
              message={config.message}
              onRetry={onRetry}
              isRetrying={true}
            />
          );
          
          const retryButton = container.querySelector('button');
          
          expect(retryButton).toBeTruthy();
          expect(retryButton?.hasAttribute('disabled')).toBe(true);
          
          return retryButton?.hasAttribute('disabled') === true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: Retry button is enabled when isRetrying is false
     */
    it('retry button is enabled when isRetrying is false', () => {
      fc.assert(
        fc.property(errorConfigArb, (config) => {
          cleanup();
          const onRetry = vi.fn();
          
          const { container } = render(
            <ErrorState
              title={config.title}
              message={config.message}
              onRetry={onRetry}
              isRetrying={false}
            />
          );
          
          const retryButton = container.querySelector('button');
          
          expect(retryButton).toBeTruthy();
          expect(retryButton?.hasAttribute('disabled')).toBe(false);
          
          return retryButton?.hasAttribute('disabled') === false;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: Error message is always displayed
     */
    it('always displays error title and message', () => {
      fc.assert(
        fc.property(errorConfigArb, (config) => {
          cleanup();
          
          const { container } = render(
            <ErrorState
              title={config.title}
              message={config.message}
              variant={config.variant}
              size={config.size}
            />
          );
          
          const textContent = container.textContent || '';
          
          // Title and message should be present in the rendered output
          expect(textContent).toContain(config.title);
          expect(textContent).toContain(config.message);
          
          return textContent.includes(config.title) && textContent.includes(config.message);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: No retry button when onRetry is not provided
     */
    it('does not render retry button when onRetry is not provided', () => {
      fc.assert(
        fc.property(errorConfigArb, (config) => {
          cleanup();
          
          const { container } = render(
            <ErrorState
              title={config.title}
              message={config.message}
              variant={config.variant}
              size={config.size}
              // No onRetry provided
            />
          );
          
          const retryButton = container.querySelector('button');
          
          expect(retryButton).toBeNull();
          
          return retryButton === null;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: Custom retry label is displayed on the button
     */
    it('displays custom retry label on the button', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (customLabel) => {
            cleanup();
            const onRetry = vi.fn();
            
            const { container } = render(
              <ErrorState
                onRetry={onRetry}
                retryLabel={customLabel}
                isRetrying={false}
              />
            );
            
            const retryButton = container.querySelector('button');
            const buttonText = retryButton?.textContent || '';
            
            expect(buttonText).toContain(customLabel);
            
            return buttonText.includes(customLabel);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: Error icon is always displayed
     */
    it('always displays an error icon', () => {
      fc.assert(
        fc.property(errorConfigArb, (config) => {
          cleanup();
          
          const { container } = render(
            <ErrorState
              title={config.title}
              message={config.message}
              variant={config.variant}
              size={config.size}
            />
          );
          
          // Look for SVG icon (lucide icons render as SVG)
          const icon = container.querySelector('svg');
          
          expect(icon).toBeTruthy();
          
          return icon !== null;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: Retry button has minimum touch target size (44x44px)
     */
    it('retry button has minimum touch target size', () => {
      fc.assert(
        fc.property(errorConfigArb, (config) => {
          cleanup();
          const onRetry = vi.fn();
          
          const { container } = render(
            <ErrorState
              title={config.title}
              message={config.message}
              onRetry={onRetry}
              variant={config.variant}
              size={config.size}
            />
          );
          
          const retryButton = container.querySelector('button');
          
          if (retryButton) {
            const className = retryButton.className;
            // Check for min-w-[44px] and min-h-[44px] classes
            const hasMinWidth = className.includes('min-w-[44px]');
            const hasMinHeight = className.includes('min-h-[44px]');
            
            expect(hasMinWidth).toBe(true);
            expect(hasMinHeight).toBe(true);
            
            return hasMinWidth && hasMinHeight;
          }
          
          return false;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: Loading spinner is shown when isRetrying is true
     */
    it('shows loading spinner when isRetrying is true', () => {
      fc.assert(
        fc.property(errorConfigArb, (config) => {
          cleanup();
          const onRetry = vi.fn();
          
          const { container } = render(
            <ErrorState
              title={config.title}
              message={config.message}
              onRetry={onRetry}
              isRetrying={true}
            />
          );
          
          const retryButton = container.querySelector('button');
          
          if (retryButton) {
            // Check for animate-spin class on the icon inside button
            const spinningIcon = retryButton.querySelector('.animate-spin');
            expect(spinningIcon).toBeTruthy();
            return spinningIcon !== null;
          }
          
          return false;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: Error state renders consistently across all variants
     */
    it('renders consistently across all variants', () => {
      fc.assert(
        fc.property(variantArb, sizeArb, (variant, size) => {
          cleanup();
          const onRetry = vi.fn();
          const title = 'Test Error';
          const message = 'Test error message';
          
          const { container } = render(
            <ErrorState
              title={title}
              message={message}
              onRetry={onRetry}
              variant={variant}
              size={size}
            />
          );
          
          const textContent = container.textContent || '';
          const retryButton = container.querySelector('button');
          const icon = container.querySelector('svg');
          
          // All variants should have title, message, icon, and retry button
          expect(textContent).toContain(title);
          expect(textContent).toContain(message);
          expect(retryButton).toBeTruthy();
          expect(icon).toBeTruthy();
          
          return (
            textContent.includes(title) &&
            textContent.includes(message) &&
            retryButton !== null &&
            icon !== null
          );
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 16: Error State with Retry**
     * **Validates: Requirements 10.5**
     *
     * Property: Default values are applied when props are not provided
     */
    it('applies default values when props are not provided', () => {
      cleanup();
      const onRetry = vi.fn();
      
      const { container } = render(
        <ErrorState onRetry={onRetry} />
      );
      
      const textContent = container.textContent || '';
      
      // Default title should be present
      expect(textContent).toContain('Algo deu errado');
      // Default message should be present
      expect(textContent).toContain('Ocorreu um erro ao carregar os dados');
      // Default retry label should be present
      expect(textContent).toContain('Tentar novamente');
    });
  });
});
