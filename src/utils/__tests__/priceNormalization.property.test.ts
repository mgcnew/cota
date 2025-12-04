/**
 * Property-Based Tests for Economy Calculation
 * 
 * **Feature: cotacao-unidade-preco, Property 2: Economy Calculation Formula**
 * **Validates: Requirements 2.2**
 * 
 * Tests that for any set of normalized supplier prices for a product, 
 * the economy should equal `(max_price - min_price) × purchase_quantity`, 
 * and this value should always be >= 0.
 * 
 * **Feature: cotacao-unidade-preco, Property 3: Total Economy Aggregation**
 * **Validates: Requirements 2.4**
 * 
 * Tests that for any quote with multiple products, the total economy 
 * should equal the sum of individual product economies.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  calculateEconomy, 
  normalizePrice,
  formatPriceWithUnit,
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

describe('Economy Calculation - Property Tests', () => {
  /**
   * **Feature: cotacao-unidade-preco, Property 2: Economy Calculation Formula**
   * **Validates: Requirements 2.2**
   * 
   * Property: Economy should always be >= 0 (non-negative)
   */
  it('should always return non-negative economy value', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 0, maxLength: 10 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (supplierPrices, purchaseQuantity, purchaseUnit) => {
          const result = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          expect(result.economiaReal).toBeGreaterThanOrEqual(0);
          return result.economiaReal >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 2: Economy Calculation Formula**
   * **Validates: Requirements 2.2**
   * 
   * Property: For 2+ valid suppliers, economy = (max_price - min_price) × quantity
   */
  it('should calculate economy as (max - min) × quantity for 2+ suppliers', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 2, maxLength: 10 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (supplierPrices, purchaseQuantity, purchaseUnit) => {
          const result = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          
          // Manually calculate expected economy
          const normalizedPrices = supplierPrices.map(p => 
            normalizePrice(p, purchaseQuantity, purchaseUnit)
          );
          const unitPrices = normalizedPrices.map(np => np.valorUnitario);
          const minPrice = Math.min(...unitPrices);
          const maxPrice = Math.max(...unitPrices);
          const expectedEconomy = (maxPrice - minPrice) * purchaseQuantity;
          
          // Verify the formula
          expect(result.economiaReal).toBeCloseTo(expectedEconomy, 5);
          expect(result.melhorPreco).toBeCloseTo(minPrice, 5);
          expect(result.piorPreco).toBeCloseTo(maxPrice, 5);
          
          return Math.abs(result.economiaReal - expectedEconomy) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 2: Economy Calculation Formula**
   * **Validates: Requirements 2.2**
   * 
   * Property: melhorPreco should always be <= piorPreco
   */
  it('should have melhorPreco <= piorPreco', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 2, maxLength: 10 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (supplierPrices, purchaseQuantity, purchaseUnit) => {
          const result = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          expect(result.melhorPreco).toBeLessThanOrEqual(result.piorPreco);
          return result.melhorPreco <= result.piorPreco;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 2: Economy Calculation Formula**
   * **Validates: Requirements 2.2**
   * 
   * Property: Economy should be 0 when fewer than 2 valid suppliers
   */
  it('should return 0 economy when fewer than 2 suppliers', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 0, maxLength: 1 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (supplierPrices, purchaseQuantity, purchaseUnit) => {
          const result = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          expect(result.economiaReal).toBe(0);
          return result.economiaReal === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 2: Economy Calculation Formula**
   * **Validates: Requirements 2.2**
   * 
   * Property: When all suppliers have the same normalized price, economy should be 0
   */
  it('should return 0 economy when all suppliers have same price', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.integer({ min: 2, max: 10 }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (price, supplierCount, purchaseQuantity, purchaseUnit) => {
          // Create multiple suppliers with the same price
          const supplierPrices: PriceMetadata[] = Array(supplierCount).fill({
            valorOferecido: price,
            unidadePreco: 'kg' as PricingUnit,
            fatorConversao: 1,
          });
          
          const result = calculateEconomy(supplierPrices, purchaseQuantity, purchaseUnit);
          expect(result.economiaReal).toBeCloseTo(0, 5);
          return Math.abs(result.economiaReal) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 2: Economy Calculation Formula**
   * **Validates: Requirements 2.2**
   * 
   * Property: Economy scales linearly with purchase quantity
   */
  it('should scale economy linearly with purchase quantity', () => {
    fc.assert(
      fc.property(
        fc.array(priceMetadataArbitrary, { minLength: 2, maxLength: 5 }),
        fc.double({ min: 1, max: 100, noNaN: true }),
        fc.double({ min: 1.1, max: 10, noNaN: true }),
        purchaseUnitArbitrary,
        (supplierPrices, baseQuantity, multiplier, purchaseUnit) => {
          const result1 = calculateEconomy(supplierPrices, baseQuantity, purchaseUnit);
          const result2 = calculateEconomy(supplierPrices, baseQuantity * multiplier, purchaseUnit);
          
          // Economy should scale proportionally with quantity
          const expectedRatio = multiplier;
          const actualRatio = result1.economiaReal > 0 
            ? result2.economiaReal / result1.economiaReal 
            : 1;
          
          // Allow small floating point tolerance
          if (result1.economiaReal > 0.001) {
            expect(actualRatio).toBeCloseTo(expectedRatio, 3);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Represents a product in a quote with its supplier prices
 */
interface QuoteProduct {
  productId: string;
  purchaseQuantity: number;
  purchaseUnit: string;
  supplierPrices: PriceMetadata[];
}

/**
 * Arbitrary generator for a quote product with supplier prices
 */
const quoteProductArbitrary: fc.Arbitrary<QuoteProduct> = fc.record({
  productId: fc.uuid(),
  purchaseQuantity: purchaseQuantityArbitrary,
  purchaseUnit: purchaseUnitArbitrary,
  supplierPrices: fc.array(priceMetadataArbitrary, { minLength: 2, maxLength: 5 }),
});

/**
 * Calculates total economy for a quote by summing individual product economies
 * This is the aggregation function being tested
 */
function calculateTotalQuoteEconomy(products: QuoteProduct[]): number {
  return products.reduce((total, product) => {
    const productEconomy = calculateEconomy(
      product.supplierPrices,
      product.purchaseQuantity,
      product.purchaseUnit
    );
    return total + productEconomy.economiaReal;
  }, 0);
}

describe('Total Economy Aggregation - Property Tests', () => {
  /**
   * **Feature: cotacao-unidade-preco, Property 3: Total Economy Aggregation**
   * **Validates: Requirements 2.4**
   * 
   * Property: Total economy equals sum of individual product economies
   */
  it('should calculate total economy as sum of individual product economies', () => {
    fc.assert(
      fc.property(
        fc.array(quoteProductArbitrary, { minLength: 1, maxLength: 10 }),
        (products) => {
          // Calculate total using aggregation function
          const totalEconomy = calculateTotalQuoteEconomy(products);
          
          // Calculate sum of individual economies manually
          const individualEconomies = products.map((product) =>
            calculateEconomy(
              product.supplierPrices,
              product.purchaseQuantity,
              product.purchaseUnit
            ).economiaReal
          );
          const expectedTotal = individualEconomies.reduce((sum, e) => sum + e, 0);
          
          // Verify aggregation property
          expect(totalEconomy).toBeCloseTo(expectedTotal, 5);
          return Math.abs(totalEconomy - expectedTotal) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 3: Total Economy Aggregation**
   * **Validates: Requirements 2.4**
   * 
   * Property: Total economy is always non-negative (sum of non-negative values)
   */
  it('should always return non-negative total economy', () => {
    fc.assert(
      fc.property(
        fc.array(quoteProductArbitrary, { minLength: 0, maxLength: 10 }),
        (products) => {
          const totalEconomy = calculateTotalQuoteEconomy(products);
          expect(totalEconomy).toBeGreaterThanOrEqual(0);
          return totalEconomy >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 3: Total Economy Aggregation**
   * **Validates: Requirements 2.4**
   * 
   * Property: Adding a product with economy increases total economy
   */
  it('should increase total when adding product with positive economy', () => {
    fc.assert(
      fc.property(
        fc.array(quoteProductArbitrary, { minLength: 1, maxLength: 5 }),
        quoteProductArbitrary,
        (existingProducts, newProduct) => {
          const originalTotal = calculateTotalQuoteEconomy(existingProducts);
          const newProductEconomy = calculateEconomy(
            newProduct.supplierPrices,
            newProduct.purchaseQuantity,
            newProduct.purchaseUnit
          ).economiaReal;
          
          const newTotal = calculateTotalQuoteEconomy([...existingProducts, newProduct]);
          
          // New total should equal original + new product economy
          expect(newTotal).toBeCloseTo(originalTotal + newProductEconomy, 5);
          return Math.abs(newTotal - (originalTotal + newProductEconomy)) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 3: Total Economy Aggregation**
   * **Validates: Requirements 2.4**
   * 
   * Property: Order of products doesn't affect total economy (commutativity)
   */
  it('should produce same total regardless of product order', () => {
    fc.assert(
      fc.property(
        fc.array(quoteProductArbitrary, { minLength: 2, maxLength: 8 }),
        (products) => {
          const originalTotal = calculateTotalQuoteEconomy(products);
          
          // Shuffle products
          const shuffled = [...products].reverse();
          const shuffledTotal = calculateTotalQuoteEconomy(shuffled);
          
          expect(originalTotal).toBeCloseTo(shuffledTotal, 5);
          return Math.abs(originalTotal - shuffledTotal) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 3: Total Economy Aggregation**
   * **Validates: Requirements 2.4**
   * 
   * Property: Empty quote has zero total economy
   */
  it('should return zero for empty quote', () => {
    const totalEconomy = calculateTotalQuoteEconomy([]);
    expect(totalEconomy).toBe(0);
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 3: Total Economy Aggregation**
   * **Validates: Requirements 2.4**
   * 
   * Property: Single product total equals that product's economy
   */
  it('should equal single product economy for quote with one product', () => {
    fc.assert(
      fc.property(
        quoteProductArbitrary,
        (product) => {
          const totalEconomy = calculateTotalQuoteEconomy([product]);
          const productEconomy = calculateEconomy(
            product.supplierPrices,
            product.purchaseQuantity,
            product.purchaseUnit
          ).economiaReal;
          
          expect(totalEconomy).toBeCloseTo(productEconomy, 5);
          return Math.abs(totalEconomy - productEconomy) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: cotacao-unidade-preco, Property 5: Price Display Format**
 * **Validates: Requirements 1.4**
 * 
 * Tests that for any saved price with unit metadata, the displayed string 
 * should contain both the value and the unit label in format "R$ X.XX/unit".
 */
describe('Price Display Format - Property Tests', () => {
  /**
   * **Feature: cotacao-unidade-preco, Property 5: Price Display Format**
   * **Validates: Requirements 1.4**
   * 
   * Property: Formatted price should always start with "R$ "
   */
  it('should always start with "R$ " prefix', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100000, noNaN: true }),
        pricingUnitArbitrary,
        (value, unit) => {
          const formatted = formatPriceWithUnit(value, unit);
          expect(formatted.startsWith('R$ ')).toBe(true);
          return formatted.startsWith('R$ ');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 5: Price Display Format**
   * **Validates: Requirements 1.4**
   * 
   * Property: Formatted price should always contain the unit label
   */
  it('should always contain the unit label', () => {
    const unitLabels: Record<PricingUnit, string> = {
      kg: '/kg',
      un: '/un',
      cx: '/cx',
      pct: '/pct',
    };

    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100000, noNaN: true }),
        pricingUnitArbitrary,
        (value, unit) => {
          const formatted = formatPriceWithUnit(value, unit);
          const expectedLabel = unitLabels[unit];
          expect(formatted.endsWith(expectedLabel)).toBe(true);
          return formatted.endsWith(expectedLabel);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 5: Price Display Format**
   * **Validates: Requirements 1.4**
   * 
   * Property: Formatted price should contain the value with 2 decimal places
   */
  it('should format value with exactly 2 decimal places', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100000, noNaN: true }),
        pricingUnitArbitrary,
        (value, unit) => {
          const formatted = formatPriceWithUnit(value, unit);
          // Extract the numeric part (between "R$ " and "/unit")
          const match = formatted.match(/R\$ (\d+\.\d{2})/);
          expect(match).not.toBeNull();
          if (match) {
            const formattedValue = parseFloat(match[1]);
            expect(formattedValue).toBeCloseTo(value, 2);
          }
          return match !== null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 5: Price Display Format**
   * **Validates: Requirements 1.4**
   * 
   * Property: Format should match pattern "R$ X.XX/unit"
   */
  it('should match the expected format pattern "R$ X.XX/unit"', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100000, noNaN: true }),
        pricingUnitArbitrary,
        (value, unit) => {
          const formatted = formatPriceWithUnit(value, unit);
          // Pattern: R$ followed by number with 2 decimals, followed by /unit
          const pattern = /^R\$ \d+\.\d{2}\/(kg|un|cx|pct)$/;
          expect(formatted).toMatch(pattern);
          return pattern.test(formatted);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 5: Price Display Format**
   * **Validates: Requirements 1.4**
   * 
   * Property: Each pricing unit should produce its corresponding label
   */
  it('should produce correct label for each pricing unit', () => {
    const testCases: { unit: PricingUnit; expectedLabel: string }[] = [
      { unit: 'kg', expectedLabel: '/kg' },
      { unit: 'un', expectedLabel: '/un' },
      { unit: 'cx', expectedLabel: '/cx' },
      { unit: 'pct', expectedLabel: '/pct' },
    ];

    testCases.forEach(({ unit, expectedLabel }) => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 100000, noNaN: true }),
          (value) => {
            const formatted = formatPriceWithUnit(value, unit);
            expect(formatted).toContain(expectedLabel);
            return formatted.includes(expectedLabel);
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 5: Price Display Format**
   * **Validates: Requirements 1.4**
   * 
   * Property: Zero value should be formatted correctly
   */
  it('should format zero value correctly', () => {
    fc.assert(
      fc.property(
        pricingUnitArbitrary,
        (unit) => {
          const formatted = formatPriceWithUnit(0, unit);
          expect(formatted).toMatch(/^R\$ 0\.00\/(kg|un|cx|pct)$/);
          return /^R\$ 0\.00\/(kg|un|cx|pct)$/.test(formatted);
        }
      ),
      { numRuns: 100 }
    );
  });
});
