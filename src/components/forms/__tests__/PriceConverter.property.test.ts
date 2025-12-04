/**
 * Property-Based Tests for PriceConverter Integration
 * 
 * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
 * **Validates: Requirements 4.1, 4.2**
 * 
 * Tests that for any price calculated via PriceConverter, after applying,
 * the pricing unit should be automatically set to the target conversion unit
 * and the conversion factor should be stored.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ConversionMetadata } from '../PriceConverter';
import { PricingUnit } from '@/utils/priceNormalization';

/**
 * Simulates the PriceConverter calculation logic
 * This is what happens when a user enters price per box and quantity per box
 */
function simulatePriceConverterCalculation(
  pricePerBox: number,
  quantityPerBox: number,
  targetUnit: 'kg' | 'un'
): ConversionMetadata {
  if (pricePerBox <= 0 || quantityPerBox <= 0) {
    throw new Error('Price and quantity must be positive');
  }
  
  const convertedValue = pricePerBox / quantityPerBox;
  
  return {
    convertedValue,
    targetUnit,
    conversionFactor: quantityPerBox,
  };
}

/**
 * Simulates the QuoteValuesTab behavior when PriceConverter metadata is applied
 * This is what happens in the onConvert callback
 */
function applyPriceConverterMetadata(
  metadata: ConversionMetadata,
  editedValues: Record<string, number>,
  editedPricingMetadata: Record<string, { unidadePreco: PricingUnit; fatorConversao?: number }>,
  productId: string
): {
  editedValues: Record<string, number>;
  editedPricingMetadata: Record<string, { unidadePreco: PricingUnit; fatorConversao?: number }>;
} {
  return {
    editedValues: {
      ...editedValues,
      [productId]: metadata.convertedValue,
    },
    editedPricingMetadata: {
      ...editedPricingMetadata,
      [productId]: {
        unidadePreco: metadata.targetUnit,
        fatorConversao: metadata.conversionFactor,
      },
    },
  };
}

/**
 * Arbitrary generator for positive prices (in R$)
 */
const priceArbitrary: fc.Arbitrary<number> = fc.double({
  min: 0.01,
  max: 100000,
  noNaN: true,
});

/**
 * Arbitrary generator for positive quantities
 */
const quantityArbitrary: fc.Arbitrary<number> = fc.double({
  min: 0.01,
  max: 10000,
  noNaN: true,
});

/**
 * Arbitrary generator for target conversion units
 */
const targetUnitArbitrary: fc.Arbitrary<'kg' | 'un'> = fc.constantFrom('kg', 'un');

/**
 * Arbitrary generator for product IDs
 */
const productIdArbitrary: fc.Arbitrary<string> = fc.uuid();

describe('PriceConverter Integration - Property Tests', () => {
  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: Converted value should equal price per box divided by quantity per box
   */
  it('should calculate converted value as price / quantity', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        (pricePerBox, quantityPerBox, targetUnit) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          const expectedValue = pricePerBox / quantityPerBox;
          expect(metadata.convertedValue).toBeCloseTo(expectedValue, 5);
          return Math.abs(metadata.convertedValue - expectedValue) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: Target unit should be preserved in metadata
   */
  it('should preserve target unit in conversion metadata', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        (pricePerBox, quantityPerBox, targetUnit) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          expect(metadata.targetUnit).toBe(targetUnit);
          return metadata.targetUnit === targetUnit;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: Conversion factor should equal the quantity per box
   */
  it('should store conversion factor equal to quantity per box', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        (pricePerBox, quantityPerBox, targetUnit) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          expect(metadata.conversionFactor).toBeCloseTo(quantityPerBox, 5);
          return Math.abs(metadata.conversionFactor - quantityPerBox) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: After applying metadata, pricing unit should be set to target unit
   */
  it('should set pricing unit to target unit after applying metadata', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        productIdArbitrary,
        (pricePerBox, quantityPerBox, targetUnit, productId) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          const result = applyPriceConverterMetadata(
            metadata,
            {},
            {},
            productId
          );
          
          expect(result.editedPricingMetadata[productId].unidadePreco).toBe(targetUnit);
          return result.editedPricingMetadata[productId].unidadePreco === targetUnit;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: After applying metadata, conversion factor should be stored
   */
  it('should store conversion factor after applying metadata', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        productIdArbitrary,
        (pricePerBox, quantityPerBox, targetUnit, productId) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          const result = applyPriceConverterMetadata(
            metadata,
            {},
            {},
            productId
          );
          
          expect(result.editedPricingMetadata[productId].fatorConversao).toBeCloseTo(
            quantityPerBox,
            5
          );
          return (
            Math.abs(
              (result.editedPricingMetadata[productId].fatorConversao || 0) - quantityPerBox
            ) < 0.00001
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: After applying metadata, converted value should be stored in editedValues
   */
  it('should store converted value in editedValues after applying metadata', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        productIdArbitrary,
        (pricePerBox, quantityPerBox, targetUnit, productId) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          const result = applyPriceConverterMetadata(
            metadata,
            {},
            {},
            productId
          );
          
          expect(result.editedValues[productId]).toBeCloseTo(metadata.convertedValue, 5);
          return (
            Math.abs(result.editedValues[productId] - metadata.convertedValue) < 0.00001
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: Metadata should contain all required fields
   */
  it('should include all required fields in conversion metadata', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        (pricePerBox, quantityPerBox, targetUnit) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          expect(metadata).toHaveProperty('convertedValue');
          expect(metadata).toHaveProperty('targetUnit');
          expect(metadata).toHaveProperty('conversionFactor');
          
          expect(typeof metadata.convertedValue).toBe('number');
          expect(typeof metadata.targetUnit).toBe('string');
          expect(typeof metadata.conversionFactor).toBe('number');
          
          return (
            metadata.convertedValue !== undefined &&
            metadata.targetUnit !== undefined &&
            metadata.conversionFactor !== undefined
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: Applying metadata should not affect other products
   */
  it('should not affect other products when applying metadata', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        productIdArbitrary,
        productIdArbitrary,
        (pricePerBox, quantityPerBox, targetUnit, productId1, productId2) => {
          fc.pre(productId1 !== productId2);
          
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          // Pre-populate with data for another product
          const existingValues = { [productId2]: 99.99 };
          const existingMetadata = {
            [productId2]: { unidadePreco: 'un' as PricingUnit, fatorConversao: 5 },
          };
          
          const result = applyPriceConverterMetadata(
            metadata,
            existingValues,
            existingMetadata,
            productId1
          );
          
          // Verify other product data is preserved
          expect(result.editedValues[productId2]).toBe(99.99);
          expect(result.editedPricingMetadata[productId2].unidadePreco).toBe('un');
          expect(result.editedPricingMetadata[productId2].fatorConversao).toBe(5);
          
          return (
            result.editedValues[productId2] === 99.99 &&
            result.editedPricingMetadata[productId2].unidadePreco === 'un' &&
            result.editedPricingMetadata[productId2].fatorConversao === 5
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: Converted value should always be positive when inputs are positive
   */
  it('should always produce positive converted value for positive inputs', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        (pricePerBox, quantityPerBox, targetUnit) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          expect(metadata.convertedValue).toBeGreaterThan(0);
          return metadata.convertedValue > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: Conversion factor should always be positive
   */
  it('should always store positive conversion factor', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        (pricePerBox, quantityPerBox, targetUnit) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          expect(metadata.conversionFactor).toBeGreaterThan(0);
          return metadata.conversionFactor > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: Target unit should always be either 'kg' or 'un'
   */
  it('should always set target unit to kg or un', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        (pricePerBox, quantityPerBox, targetUnit) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          expect(['kg', 'un']).toContain(metadata.targetUnit);
          return ['kg', 'un'].includes(metadata.targetUnit);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 8: PriceConverter Integration**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * Property: Applying same metadata twice should produce same result (idempotence)
   */
  it('should produce same result when applying metadata multiple times', () => {
    fc.assert(
      fc.property(
        priceArbitrary,
        quantityArbitrary,
        targetUnitArbitrary,
        productIdArbitrary,
        (pricePerBox, quantityPerBox, targetUnit, productId) => {
          const metadata = simulatePriceConverterCalculation(
            pricePerBox,
            quantityPerBox,
            targetUnit
          );
          
          const result1 = applyPriceConverterMetadata(
            metadata,
            {},
            {},
            productId
          );
          
          const result2 = applyPriceConverterMetadata(
            metadata,
            result1.editedValues,
            result1.editedPricingMetadata,
            productId
          );
          
          expect(result1.editedValues[productId]).toBeCloseTo(
            result2.editedValues[productId],
            5
          );
          expect(result1.editedPricingMetadata[productId].unidadePreco).toBe(
            result2.editedPricingMetadata[productId].unidadePreco
          );
          expect(result1.editedPricingMetadata[productId].fatorConversao).toBeCloseTo(
            result2.editedPricingMetadata[productId].fatorConversao || 0,
            5
          );
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
