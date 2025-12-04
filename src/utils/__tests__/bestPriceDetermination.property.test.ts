/**
 * Property-Based Tests for Best Price Determination
 * 
 * **Feature: cotacao-unidade-preco, Property 6: Best Price Determination**
 * **Validates: Requirements 3.3**
 * 
 * Tests that for any set of supplier prices for a product, the best price 
 * should be determined by comparing normalized unit values, not original values.
 * 
 * This is critical because suppliers may quote prices in different units:
 * - Supplier A: R$ 100/caixa (where 1 caixa = 12 unidades)
 * - Supplier B: R$ 8.50/unidade
 * 
 * The best price must be determined by normalizing both to the same unit
 * (e.g., /unidade) before comparison, not by comparing the raw values.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  normalizePrice,
  calculateEconomy,
  type PriceMetadata, 
  type PricingUnit 
} from '../priceNormalization';

/**
 * Arbitrary generator for valid PricingUnit
 */
const pricingUnitArbitrary: fc.Arbitrary<PricingUnit> = fc.constantFrom('kg', 'un', 'cx', 'pct');

/**
 * Arbitrary generator for valid PriceMetadata objects
 * Ensures valorOferecido > 0 and fatorConversao > 0 when needed
 */
const priceMetadataArbitrary: fc.Arbitrary<PriceMetadata> = fc.record({
  valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
  unidadePreco: pricingUnitArbitrary,
  fatorConversao: fc.double({ min: 0.01, max: 1000, noNaN: true }),
  quantidadePorEmbalagem: fc.option(
    fc.double({ min: 0.01, max: 1000, noNaN: true }), 
    { nil: undefined }
  ),
});

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

describe('Best Price Determination - Property Tests', () => {
  /**
   * **Feature: cotacao-unidade-preco, Property 6: Best Price Determination**
   * **Validates: Requirements 3.3**
   * 
   * Property: Best price (melhorPreco) should be the minimum normalized unit price
   * 
   * This test verifies that when comparing supplier prices, the system correctly
   * identifies the best price by normalizing all prices to the same unit first.
   */
  it('should determine best price as minimum normalized unit price', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 2, maxLength: 10 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (supplierPrices, purchaseQuantity, purchaseUnit) => {
          const result = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          
          // Manually calculate normalized prices
          const normalizedPrices = supplierPrices.map(p => 
            normalizePrice(p, purchaseQuantity, purchaseUnit)
          );
          
          // Get all unit prices
          const unitPrices = normalizedPrices.map(np => np.valorUnitario);
          const expectedBestPrice = Math.min(...unitPrices);
          
          // Verify best price matches minimum normalized unit price
          expect(result.melhorPreco).toBeCloseTo(expectedBestPrice, 5);
          return Math.abs(result.melhorPreco - expectedBestPrice) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 6: Best Price Determination**
   * **Validates: Requirements 3.3**
   * 
   * Property: Best price should NOT be determined by comparing original values
   * 
   * This test verifies that the system does NOT simply pick the minimum
   * original value (valorOferecido), but instead normalizes first.
   * 
   * Example: If Supplier A offers 100/cx and Supplier B offers 8.50/un,
   * we cannot compare 100 vs 8.50 directly. We must normalize both to
   * the same unit first.
   */
  it('should not determine best price by comparing original values', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 2, maxLength: 10 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (supplierPrices, purchaseQuantity, purchaseUnit) => {
          const result = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          
          // Get minimum normalized unit price (correct approach)
          const normalizedPrices = supplierPrices.map(p => 
            normalizePrice(p, purchaseQuantity, purchaseUnit)
          );
          const minNormalizedPrice = Math.min(...normalizedPrices.map(np => np.valorUnitario));
          
          // If original values differ from normalized values, best price should match normalized
          // (This is the key property: we normalize before comparing)
          expect(result.melhorPreco).toBeCloseTo(minNormalizedPrice, 5);
          
          // Verify that if there are different units, we're not just using original values
          const hasMultipleUnits = new Set(supplierPrices.map(p => p.unidadePreco)).size > 1;
          if (hasMultipleUnits) {
            // When there are multiple units, normalized and original may differ
            // The important thing is that we use normalized values
            expect(result.melhorPreco).toBeCloseTo(minNormalizedPrice, 5);
          }
          
          return Math.abs(result.melhorPreco - minNormalizedPrice) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 6: Best Price Determination**
   * **Validates: Requirements 3.3**
   * 
   * Property: Best price should be <= all other normalized unit prices
   * 
   * This is a fundamental property: the best price must be less than or equal
   * to every other supplier's normalized unit price.
   */
  it('should have best price <= all other normalized prices', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 2, maxLength: 10 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (supplierPrices, purchaseQuantity, purchaseUnit) => {
          const result = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          
          // Normalize all prices
          const normalizedPrices = supplierPrices.map(p => 
            normalizePrice(p, purchaseQuantity, purchaseUnit)
          );
          
          // Check that best price is <= all normalized prices
          normalizedPrices.forEach(normalized => {
            expect(result.melhorPreco).toBeLessThanOrEqual(normalized.valorUnitario + 0.00001);
          });
          
          return normalizedPrices.every(np => result.melhorPreco <= np.valorUnitario + 0.00001);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 6: Best Price Determination**
   * **Validates: Requirements 3.3**
   * 
   * Property: When a supplier quotes in a package unit (cx/pct), the best price
   * should still be correctly determined after normalizing by conversion factor
   * 
   * Example scenario:
   * - Supplier A: R$ 100/caixa with 12 unidades per caixa = R$ 8.33/unidade
   * - Supplier B: R$ 8.50/unidade
   * 
   * Best price should be Supplier A (R$ 8.33/un), not Supplier B (R$ 8.50/un)
   * even though Supplier B's original value (8.50) is lower than Supplier A's (100)
   */
  it('should correctly determine best price when suppliers use different units', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 100, noNaN: true }),  // Price per unit
        fc.double({ min: 1, max: 100, noNaN: true }),  // Conversion factor
        fc.double({ min: 0.01, max: 100, noNaN: true }), // Alternative unit price
        fc.double({ min: 1, max: 1000, noNaN: true }), // Purchase quantity
        (pricePerUnit, conversionFactor, altUnitPrice, purchaseQuantity) => {
          // Create two suppliers: one with package unit, one with base unit
          const supplierPrices: PriceMetadata[] = [
            {
              valorOferecido: pricePerUnit * conversionFactor,
              unidadePreco: 'cx',
              fatorConversao: conversionFactor,
            },
            {
              valorOferecido: altUnitPrice,
              unidadePreco: 'un',
              fatorConversao: 1,
            },
          ];
          
          const result = calculateEconomy(supplierPrices, purchaseQuantity, 'un');
          
          // Calculate expected best price
          const normalizedPrice1 = pricePerUnit; // After dividing by conversion factor
          const normalizedPrice2 = altUnitPrice;
          const expectedBestPrice = Math.min(normalizedPrice1, normalizedPrice2);
          
          // Verify best price is correctly determined
          expect(result.melhorPreco).toBeCloseTo(expectedBestPrice, 5);
          return Math.abs(result.melhorPreco - expectedBestPrice) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 6: Best Price Determination**
   * **Validates: Requirements 3.3**
   * 
   * Property: Best price determination should be consistent regardless of
   * the order in which suppliers are provided
   * 
   * The best price should be the same whether suppliers are in ascending,
   * descending, or random order.
   */
  it('should determine best price consistently regardless of supplier order', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 2, maxLength: 8 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (supplierPrices, purchaseQuantity, purchaseUnit) => {
          // Calculate best price with original order
          const result1 = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          
          // Shuffle and calculate again
          const shuffled = [...supplierPrices].reverse();
          const result2 = calculateEconomy(shuffled, purchaseQuantity, purchaseUnit);
          
          // Best price should be the same
          expect(result1.melhorPreco).toBeCloseTo(result2.melhorPreco, 5);
          return Math.abs(result1.melhorPreco - result2.melhorPreco) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 6: Best Price Determination**
   * **Validates: Requirements 3.3**
   * 
   * Property: Best price should scale correctly with purchase quantity
   * 
   * The normalized unit price (melhorPreco) should NOT change when purchase
   * quantity changes - only the total price should scale. This verifies that
   * we're comparing unit prices, not total prices.
   */
  it('should have best price independent of purchase quantity', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 2, maxLength: 5 }),
        fc.double({ min: 1, max: 100, noNaN: true }),
        fc.double({ min: 1.1, max: 10, noNaN: true }),
        purchaseUnitArbitrary,
        (supplierPrices, baseQuantity, multiplier, purchaseUnit) => {
          // Calculate best price with base quantity
          const result1 = calculateEconomy(supplierPrices, baseQuantity, purchaseUnit);
          
          // Calculate best price with different quantity
          const result2 = calculateEconomy(supplierPrices, baseQuantity * multiplier, purchaseUnit);
          
          // Best price (unit price) should be the same regardless of quantity
          expect(result1.melhorPreco).toBeCloseTo(result2.melhorPreco, 5);
          return Math.abs(result1.melhorPreco - result2.melhorPreco) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 6: Best Price Determination**
   * **Validates: Requirements 3.3**
   * 
   * Property: When all suppliers have the same normalized unit price,
   * the best price should equal that price
   */
  it('should correctly identify best price when all suppliers have same normalized price', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.integer({ min: 2, max: 10 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (unitPrice, supplierCount, purchaseQuantity, purchaseUnit) => {
          // Create multiple suppliers with the same normalized unit price
          const supplierPrices: PriceMetadata[] = Array(supplierCount).fill({
            valorOferecido: unitPrice,
            unidadePreco: 'kg' as PricingUnit,
            fatorConversao: 1,
          });
          
          const result = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          
          // Best price should equal the unit price
          expect(result.melhorPreco).toBeCloseTo(unitPrice, 5);
          return Math.abs(result.melhorPreco - unitPrice) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 6: Best Price Determination**
   * **Validates: Requirements 3.3**
   * 
   * Property: Best price should be strictly less than worst price when
   * suppliers have different prices
   */
  it('should have best price < worst price when suppliers differ', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 2, maxLength: 10 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (supplierPrices, purchaseQuantity, purchaseUnit) => {
          const result = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          
          // Get normalized prices
          const normalizedPrices = supplierPrices.map(p => 
            normalizePrice(p, purchaseQuantity, purchaseUnit)
          );
          const unitPrices = normalizedPrices.map(np => np.valorUnitario);
          const uniquePrices = new Set(unitPrices);
          
          // If there are multiple different prices, best should be < worst
          if (uniquePrices.size > 1) {
            expect(result.melhorPreco).toBeLessThan(result.piorPreco + 0.00001);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
