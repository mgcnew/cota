/**
 * Property-Based Tests for Comparison Display Normalization
 * 
 * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
 * **Validates: Requirements 3.2**
 * 
 * Tests that for any supplier price displayed in comparison view, 
 * if the original unit differs from base unit, both original and normalized 
 * values should be shown.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  normalizePrice,
  type PriceMetadata, 
  type PricingUnit,
  getBaseUnit
} from '@/utils/priceNormalization';

/**
 * Arbitrary generator for valid PricingUnit
 */
const pricingUnitArbitrary: fc.Arbitrary<PricingUnit> = fc.constantFrom('kg', 'un', 'cx', 'pct');

/**
 * Arbitrary generator for base units (kg or un)
 */
const baseUnitArbitrary: fc.Arbitrary<'kg' | 'un'> = fc.constantFrom('kg', 'un');

/**
 * Arbitrary generator for purchase unit strings
 */
const purchaseUnitArbitrary: fc.Arbitrary<string> = fc.constantFrom('kg', 'un', 'g', 'unidade');

/**
 * Arbitrary generator for positive purchase quantities
 */
const purchaseQuantityArbitrary: fc.Arbitrary<number> = fc.double({ 
  min: 0.01, 
  max: 10000, 
  noNaN: true 
});

/**
 * Represents a supplier price entry as displayed in the comparison view
 */
interface ComparisonDisplayPrice {
  originalValue: number;           // Original value offered by supplier
  originalUnit: PricingUnit;       // Original unit of the price
  normalizedValue: number;         // Normalized value (per base unit)
  baseUnit: 'kg' | 'un';          // Base unit for normalization
  shouldShowOriginal: boolean;     // Whether original unit differs from base
  fatorConversao?: number;         // Conversion factor if applicable
}

/**
 * Helper function to determine if original unit differs from base unit
 * Returns true if the pricing unit is 'cx' or 'pct' (package types)
 */
function shouldShowOriginalUnit(pricingUnit: PricingUnit): boolean {
  return pricingUnit === 'cx' || pricingUnit === 'pct';
}

/**
 * Helper function to create a comparison display price from metadata
 */
function createComparisonDisplayPrice(
  metadata: PriceMetadata,
  purchaseQuantity: number,
  purchaseUnit: string
): ComparisonDisplayPrice {
  const normalized = normalizePrice(metadata, purchaseQuantity, purchaseUnit);
  const showOriginal = shouldShowOriginalUnit(metadata.unidadePreco);
  
  return {
    originalValue: metadata.valorOferecido,
    originalUnit: metadata.unidadePreco,
    normalizedValue: normalized.valorUnitario,
    baseUnit: normalized.unidadeBase,
    shouldShowOriginal: showOriginal,
    fatorConversao: metadata.fatorConversao,
  };
}

describe('Comparison Display Normalization - Property Tests', () => {
  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: When pricing unit is 'cx' or 'pct', both original and normalized 
   * values should be marked for display
   */
  it('should mark for display both values when unit is cx or pct', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.constantFrom('cx', 'pct') as fc.Arbitrary<PricingUnit>,
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, fator, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
            fatorConversao: fator,
          };
          
          const display = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          
          // Should show original unit for cx/pct
          expect(display.shouldShowOriginal).toBe(true);
          // Should have both values
          expect(display.originalValue).toBe(value);
          expect(display.normalizedValue).toBeGreaterThan(0);
          
          return display.shouldShowOriginal === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: When pricing unit is 'kg' or 'un' (base units), 
   * original unit should NOT be marked for display
   */
  it('should not mark for display when unit is kg or un', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.constantFrom('kg', 'un') as fc.Arbitrary<PricingUnit>,
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
          };
          
          const display = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          
          // Should NOT show original unit for kg/un
          expect(display.shouldShowOriginal).toBe(false);
          // Normalized value should equal original for base units
          expect(display.normalizedValue).toBeCloseTo(value, 5);
          
          return display.shouldShowOriginal === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: Normalized value should always be positive when original value is positive
   */
  it('should always produce positive normalized value from positive original', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        pricingUnitArbitrary,
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, fator, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
            fatorConversao: fator,
          };
          
          const display = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          
          expect(display.normalizedValue).toBeGreaterThan(0);
          return display.normalizedValue > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: For package units (cx/pct), normalized value should be 
   * original value divided by conversion factor
   */
  it('should calculate normalized value as original / fator for package units', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.constantFrom('cx', 'pct') as fc.Arbitrary<PricingUnit>,
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, fator, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
            fatorConversao: fator,
          };
          
          const display = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          const expectedNormalized = value / fator;
          
          expect(display.normalizedValue).toBeCloseTo(expectedNormalized, 5);
          return Math.abs(display.normalizedValue - expectedNormalized) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: Base unit should match the purchase unit's category 
   * (kg for weight, un for count)
   */
  it('should determine correct base unit from purchase unit', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        pricingUnitArbitrary,
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, fator, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
            fatorConversao: fator,
          };
          
          const display = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          const expectedBaseUnit = getBaseUnit(purchaseUnit);
          
          expect(display.baseUnit).toBe(expectedBaseUnit);
          return display.baseUnit === expectedBaseUnit;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: Display should preserve original value exactly as offered
   */
  it('should preserve original value exactly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        pricingUnitArbitrary,
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, fator, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
            fatorConversao: fator,
          };
          
          const display = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          
          expect(display.originalValue).toBe(value);
          return display.originalValue === value;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: Display should preserve original unit exactly as offered
   */
  it('should preserve original unit exactly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        pricingUnitArbitrary,
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, fator, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
            fatorConversao: fator,
          };
          
          const display = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          
          expect(display.originalUnit).toBe(unit);
          return display.originalUnit === unit;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: When original unit is base unit, normalized and original 
   * values should be equal
   */
  it('should have equal original and normalized when unit is base unit', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.constantFrom('kg', 'un') as fc.Arbitrary<PricingUnit>,
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
          };
          
          const display = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          
          expect(display.normalizedValue).toBeCloseTo(display.originalValue, 5);
          return Math.abs(display.normalizedValue - display.originalValue) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: Conversion factor should be preserved in display when provided
   */
  it('should preserve conversion factor when provided', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.constantFrom('cx', 'pct') as fc.Arbitrary<PricingUnit>,
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, fator, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
            fatorConversao: fator,
          };
          
          const display = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          
          expect(display.fatorConversao).toBe(fator);
          return display.fatorConversao === fator;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: Display consistency - same input should always produce same output
   */
  it('should produce consistent display for same input', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        pricingUnitArbitrary,
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, fator, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
            fatorConversao: fator,
          };
          
          const display1 = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          const display2 = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          
          expect(display1.originalValue).toBe(display2.originalValue);
          expect(display1.normalizedValue).toBeCloseTo(display2.normalizedValue, 5);
          expect(display1.shouldShowOriginal).toBe(display2.shouldShowOriginal);
          expect(display1.baseUnit).toBe(display2.baseUnit);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 9: Comparison Display Normalization**
   * **Validates: Requirements 3.2**
   * 
   * Property: For cx/pct units, normalized value should be less than original 
   * (since we're dividing by conversion factor > 1)
   */
  it('should have normalized < original for package units with fator > 1', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.constantFrom('cx', 'pct') as fc.Arbitrary<PricingUnit>,
        fc.double({ min: 1.01, max: 1000, noNaN: true }), // fator > 1
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (value, unit, fator, quantity, purchaseUnit) => {
          const metadata: PriceMetadata = {
            valorOferecido: value,
            unidadePreco: unit,
            fatorConversao: fator,
          };
          
          const display = createComparisonDisplayPrice(metadata, quantity, purchaseUnit);
          
          // When fator > 1, normalized should be less than original
          expect(display.normalizedValue).toBeLessThan(display.originalValue);
          return display.normalizedValue < display.originalValue;
        }
      ),
      { numRuns: 100 }
    );
  });
});
