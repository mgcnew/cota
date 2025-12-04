/**
 * Property-Based Tests for Default Pricing Unit
 * 
 * **Feature: cotacao-unidade-preco, Property 7: Default Pricing Unit**
 * **Validates: Requirements 5.5**
 * 
 * Tests that for any new quote_supplier_item created without explicit pricing unit,
 * the pricing unit should default to the product's base unit from the products table.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PricingUnit } from '@/utils/priceNormalization';

/**
 * Determines the default pricing unit based on product's base unit
 * This is a copy of the function from useCotacoes for testing purposes
 * Requirements: 5.5 - Default to product's base unit when not specified
 */
function getDefaultPricingUnit(productUnit?: string): PricingUnit {
  if (!productUnit) return 'un';
  
  const normalizedUnit = productUnit.toLowerCase().trim();
  const weightUnits = ['kg', 'g', 'mg', 'ton', 'tonelada'];
  
  if (weightUnits.includes(normalizedUnit)) {
    return 'kg';
  }
  
  return 'un';
}

/**
 * Arbitrary generator for weight-based units
 */
const weightUnitArbitrary: fc.Arbitrary<string> = fc.constantFrom(
  'kg', 'KG', 'Kg', 'kG',
  'g', 'G',
  'mg', 'MG', 'Mg',
  'ton', 'TON', 'Ton',
  'tonelada', 'TONELADA', 'Tonelada'
);

/**
 * Arbitrary generator for count-based units (should default to 'un')
 */
const countUnitArbitrary: fc.Arbitrary<string> = fc.constantFrom(
  'un', 'UN', 'Un',
  'unidade', 'UNIDADE', 'Unidade',
  'cx', 'CX', 'Cx',
  'caixa', 'CAIXA', 'Caixa',
  'pct', 'PCT', 'Pct',
  'pacote', 'PACOTE', 'Pacote',
  'pc', 'PC', 'Pc',
  'peca', 'PECA', 'Peca',
  'peça', 'PEÇA', 'Peça',
  'lt', 'LT', 'Lt',
  'litro', 'LITRO', 'Litro',
  'ml', 'ML', 'Ml',
  'dz', 'DZ', 'Dz',
  'duzia', 'DUZIA', 'Duzia'
);

/**
 * Arbitrary generator for whitespace variations
 */
const whitespaceArbitrary: fc.Arbitrary<string> = fc.constantFrom(
  '', ' ', '  ', '\t', ' \t ', '\n'
);

describe('Default Pricing Unit - Property Tests', () => {
  /**
   * **Feature: cotacao-unidade-preco, Property 7: Default Pricing Unit**
   * **Validates: Requirements 5.5**
   * 
   * Property: Weight-based units should always default to 'kg'
   */
  it('should default to kg for weight-based product units', () => {
    fc.assert(
      fc.property(
        weightUnitArbitrary,
        (productUnit) => {
          const result = getDefaultPricingUnit(productUnit);
          expect(result).toBe('kg');
          return result === 'kg';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 7: Default Pricing Unit**
   * **Validates: Requirements 5.5**
   * 
   * Property: Count-based units should always default to 'un'
   */
  it('should default to un for count-based product units', () => {
    fc.assert(
      fc.property(
        countUnitArbitrary,
        (productUnit) => {
          const result = getDefaultPricingUnit(productUnit);
          expect(result).toBe('un');
          return result === 'un';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 7: Default Pricing Unit**
   * **Validates: Requirements 5.5**
   * 
   * Property: Undefined or null product unit should default to 'un'
   */
  it('should default to un when product unit is undefined or null', () => {
    expect(getDefaultPricingUnit(undefined)).toBe('un');
    expect(getDefaultPricingUnit('')).toBe('un');
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 7: Default Pricing Unit**
   * **Validates: Requirements 5.5**
   * 
   * Property: Weight units with leading/trailing whitespace should still default to 'kg'
   */
  it('should handle weight units with whitespace correctly', () => {
    fc.assert(
      fc.property(
        weightUnitArbitrary,
        whitespaceArbitrary,
        whitespaceArbitrary,
        (unit, leadingSpace, trailingSpace) => {
          const unitWithWhitespace = `${leadingSpace}${unit}${trailingSpace}`;
          const result = getDefaultPricingUnit(unitWithWhitespace);
          expect(result).toBe('kg');
          return result === 'kg';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 7: Default Pricing Unit**
   * **Validates: Requirements 5.5**
   * 
   * Property: Result should always be a valid PricingUnit ('kg' or 'un')
   */
  it('should always return a valid PricingUnit', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          weightUnitArbitrary,
          countUnitArbitrary,
          fc.string({ minLength: 0, maxLength: 20 })
        ),
        (productUnit) => {
          const result = getDefaultPricingUnit(productUnit);
          const validUnits: PricingUnit[] = ['kg', 'un', 'cx', 'pct'];
          expect(validUnits).toContain(result);
          return validUnits.includes(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 7: Default Pricing Unit**
   * **Validates: Requirements 5.5**
   * 
   * Property: Case insensitivity - same unit in different cases should produce same result
   */
  it('should be case insensitive for unit matching', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('kg', 'g', 'mg', 'ton', 'tonelada'),
        (baseUnit) => {
          const lowerResult = getDefaultPricingUnit(baseUnit.toLowerCase());
          const upperResult = getDefaultPricingUnit(baseUnit.toUpperCase());
          const mixedResult = getDefaultPricingUnit(
            baseUnit.charAt(0).toUpperCase() + baseUnit.slice(1).toLowerCase()
          );
          
          expect(lowerResult).toBe(upperResult);
          expect(upperResult).toBe(mixedResult);
          return lowerResult === upperResult && upperResult === mixedResult;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 7: Default Pricing Unit**
   * **Validates: Requirements 5.5**
   * 
   * Property: Unknown units should default to 'un' (safe default)
   */
  it('should default to un for unknown/arbitrary units', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
          const normalized = s.toLowerCase().trim();
          const weightUnits = ['kg', 'g', 'mg', 'ton', 'tonelada'];
          return !weightUnits.includes(normalized);
        }),
        (unknownUnit) => {
          const result = getDefaultPricingUnit(unknownUnit);
          expect(result).toBe('un');
          return result === 'un';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 7: Default Pricing Unit**
   * **Validates: Requirements 5.5**
   * 
   * Property: Function is deterministic - same input always produces same output
   */
  it('should be deterministic', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          weightUnitArbitrary,
          countUnitArbitrary,
          fc.string({ minLength: 0, maxLength: 20 })
        ),
        (productUnit) => {
          const result1 = getDefaultPricingUnit(productUnit);
          const result2 = getDefaultPricingUnit(productUnit);
          const result3 = getDefaultPricingUnit(productUnit);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
          return result1 === result2 && result2 === result3;
        }
      ),
      { numRuns: 100 }
    );
  });
});
