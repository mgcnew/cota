/**
 * Property-Based Tests for Product Economy Display Completeness
 * 
 * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
 * **Validates: Requirements 6.2**
 * 
 * Tests that for any product economy display, it should contain: 
 * product name, best price value, worst price value, and savings amount in R$.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  normalizePrice,
  calculateEconomy,
  type PriceMetadata, 
  type PricingUnit,
} from '@/utils/priceNormalization';

/**
 * Arbitrary generator for valid PricingUnit
 */
const pricingUnitArbitrary: fc.Arbitrary<PricingUnit> = fc.constantFrom('kg', 'un', 'cx', 'pct');

/**
 * Arbitrary generator for positive purchase quantities
 */
const purchaseQuantityArbitrary: fc.Arbitrary<number> = fc.double({ 
  min: 0.01, 
  max: 10000, 
  noNaN: true 
});

/**
 * Arbitrary generator for purchase unit strings
 */
const purchaseUnitArbitrary: fc.Arbitrary<string> = fc.constantFrom('kg', 'un', 'g', 'unidade');

/**
 * Represents a product economy display item
 */
interface ProductEconomyDisplay {
  productName: string;
  bestPrice: {
    value: number;
    supplierName: string;
  };
  worstPrice: {
    value: number;
    supplierName: string;
  };
  savingsAmount: number;
  hasMultipleSuppliers: boolean;
}

/**
 * Helper function to create a product economy display from supplier prices
 */
function createProductEconomyDisplay(
  productName: string,
  supplierPrices: Array<{
    supplierId: string;
    supplierName: string;
    priceMetadata: PriceMetadata;
  }>,
  purchaseQuantity: number,
  purchaseUnit: string
): ProductEconomyDisplay | null {
  // Filter valid prices
  const validPrices = supplierPrices.filter(
    (sp) => sp.priceMetadata.valorOferecido > 0
  );

  if (validPrices.length === 0) {
    return null;
  }

  // For single supplier, return with N/A savings
  if (validPrices.length === 1) {
    const normalized = normalizePrice(
      validPrices[0].priceMetadata,
      purchaseQuantity,
      purchaseUnit
    );
    return {
      productName,
      bestPrice: {
        value: normalized.valorUnitario,
        supplierName: validPrices[0].supplierName,
      },
      worstPrice: {
        value: normalized.valorUnitario,
        supplierName: validPrices[0].supplierName,
      },
      savingsAmount: 0,
      hasMultipleSuppliers: false,
    };
  }

  // For multiple suppliers, calculate economy
  const economy = calculateEconomy(
    validPrices.map((sp) => sp.priceMetadata),
    purchaseQuantity,
    purchaseUnit
  );

  // Find best and worst suppliers
  const normalizedPrices = validPrices.map((sp) => ({
    ...sp,
    normalized: normalizePrice(
      sp.priceMetadata,
      purchaseQuantity,
      purchaseUnit
    ),
  }));

  const bestSupplier = normalizedPrices.reduce((prev, current) =>
    current.normalized.valorUnitario < prev.normalized.valorUnitario
      ? current
      : prev
  );

  const worstSupplier = normalizedPrices.reduce((prev, current) =>
    current.normalized.valorUnitario > prev.normalized.valorUnitario
      ? current
      : prev
  );

  return {
    productName,
    bestPrice: {
      value: bestSupplier.normalized.valorUnitario,
      supplierName: bestSupplier.supplierName,
    },
    worstPrice: {
      value: worstSupplier.normalized.valorUnitario,
      supplierName: worstSupplier.supplierName,
    },
    savingsAmount: economy.economiaReal,
    hasMultipleSuppliers: true,
  };
}

/**
 * Helper to verify all required fields are present and valid
 */
function isDisplayComplete(display: ProductEconomyDisplay): boolean {
  return (
    // Product name must be present and non-empty
    display.productName !== undefined &&
    display.productName !== null &&
    display.productName.length > 0 &&
    // Best price must have value and supplier name
    display.bestPrice !== undefined &&
    display.bestPrice.value !== undefined &&
    display.bestPrice.value !== null &&
    display.bestPrice.value >= 0 &&
    display.bestPrice.supplierName !== undefined &&
    display.bestPrice.supplierName !== null &&
    display.bestPrice.supplierName.length > 0 &&
    // Worst price must have value and supplier name
    display.worstPrice !== undefined &&
    display.worstPrice.value !== undefined &&
    display.worstPrice.value !== null &&
    display.worstPrice.value >= 0 &&
    display.worstPrice.supplierName !== undefined &&
    display.worstPrice.supplierName !== null &&
    display.worstPrice.supplierName.length > 0 &&
    // Savings amount must be present and non-negative
    display.savingsAmount !== undefined &&
    display.savingsAmount !== null &&
    display.savingsAmount >= 0
  );
}

describe('Product Economy Display Completeness - Property Tests', () => {
  /**
   * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
   * **Validates: Requirements 6.2**
   * 
   * Property: For any product economy display with multiple suppliers, 
   * all required fields must be present and valid
   */
  it('should contain all required fields for multi-supplier economy display', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(
          fc.record({
            supplierId: fc.string({ minLength: 1, maxLength: 20 }),
            supplierName: fc.string({ minLength: 1, maxLength: 50 }),
            priceMetadata: fc.record({
              valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              unidadePreco: pricingUnitArbitrary,
              fatorConversao: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true })),
            }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (productName, suppliers, quantity, unit) => {
          const display = createProductEconomyDisplay(
            productName,
            suppliers,
            quantity,
            unit
          );

          if (!display) return true; // Skip if no valid prices

          // Verify all required fields are present
          expect(display.productName).toBeDefined();
          expect(display.productName).toBe(productName);
          expect(display.bestPrice).toBeDefined();
          expect(display.bestPrice.value).toBeDefined();
          expect(display.bestPrice.supplierName).toBeDefined();
          expect(display.worstPrice).toBeDefined();
          expect(display.worstPrice.value).toBeDefined();
          expect(display.worstPrice.supplierName).toBeDefined();
          expect(display.savingsAmount).toBeDefined();

          return isDisplayComplete(display);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
   * **Validates: Requirements 6.2**
   * 
   * Property: Product name in display should match the input product name exactly
   */
  it('should preserve product name exactly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(
          fc.record({
            supplierId: fc.string({ minLength: 1, maxLength: 20 }),
            supplierName: fc.string({ minLength: 1, maxLength: 50 }),
            priceMetadata: fc.record({
              valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              unidadePreco: pricingUnitArbitrary,
              fatorConversao: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true })),
            }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (productName, suppliers, quantity, unit) => {
          const display = createProductEconomyDisplay(
            productName,
            suppliers,
            quantity,
            unit
          );

          if (!display) return true;

          expect(display.productName).toBe(productName);
          return display.productName === productName;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
   * **Validates: Requirements 6.2**
   * 
   * Property: Best price value should be less than or equal to worst price value
   */
  it('should have best price <= worst price', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(
          fc.record({
            supplierId: fc.string({ minLength: 1, maxLength: 20 }),
            supplierName: fc.string({ minLength: 1, maxLength: 50 }),
            priceMetadata: fc.record({
              valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              unidadePreco: pricingUnitArbitrary,
              fatorConversao: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true })),
            }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (productName, suppliers, quantity, unit) => {
          const display = createProductEconomyDisplay(
            productName,
            suppliers,
            quantity,
            unit
          );

          if (!display) return true;

          expect(display.bestPrice.value).toBeLessThanOrEqual(display.worstPrice.value);
          return display.bestPrice.value <= display.worstPrice.value;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
   * **Validates: Requirements 6.2**
   * 
   * Property: Savings amount should equal (worst - best) × quantity
   */
  it('should calculate savings as (worst - best) × quantity', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(
          fc.record({
            supplierId: fc.string({ minLength: 1, maxLength: 20 }),
            supplierName: fc.string({ minLength: 1, maxLength: 50 }),
            priceMetadata: fc.record({
              valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              unidadePreco: pricingUnitArbitrary,
              fatorConversao: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true })),
            }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (productName, suppliers, quantity, unit) => {
          const display = createProductEconomyDisplay(
            productName,
            suppliers,
            quantity,
            unit
          );

          if (!display) return true;

          const expectedSavings = (display.worstPrice.value - display.bestPrice.value) * quantity;
          expect(display.savingsAmount).toBeCloseTo(expectedSavings, 5);
          return Math.abs(display.savingsAmount - expectedSavings) < 0.00001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
   * **Validates: Requirements 6.2**
   * 
   * Property: Best price supplier name should be non-empty
   */
  it('should have non-empty best price supplier name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(
          fc.record({
            supplierId: fc.string({ minLength: 1, maxLength: 20 }),
            supplierName: fc.string({ minLength: 1, maxLength: 50 }),
            priceMetadata: fc.record({
              valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              unidadePreco: pricingUnitArbitrary,
              fatorConversao: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true })),
            }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (productName, suppliers, quantity, unit) => {
          const display = createProductEconomyDisplay(
            productName,
            suppliers,
            quantity,
            unit
          );

          if (!display) return true;

          expect(display.bestPrice.supplierName.length).toBeGreaterThan(0);
          return display.bestPrice.supplierName.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
   * **Validates: Requirements 6.2**
   * 
   * Property: Worst price supplier name should be non-empty
   */
  it('should have non-empty worst price supplier name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(
          fc.record({
            supplierId: fc.string({ minLength: 1, maxLength: 20 }),
            supplierName: fc.string({ minLength: 1, maxLength: 50 }),
            priceMetadata: fc.record({
              valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              unidadePreco: pricingUnitArbitrary,
              fatorConversao: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true })),
            }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (productName, suppliers, quantity, unit) => {
          const display = createProductEconomyDisplay(
            productName,
            suppliers,
            quantity,
            unit
          );

          if (!display) return true;

          expect(display.worstPrice.supplierName.length).toBeGreaterThan(0);
          return display.worstPrice.supplierName.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
   * **Validates: Requirements 6.2**
   * 
   * Property: Best and worst price values should always be non-negative
   */
  it('should have non-negative price values', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(
          fc.record({
            supplierId: fc.string({ minLength: 1, maxLength: 20 }),
            supplierName: fc.string({ minLength: 1, maxLength: 50 }),
            priceMetadata: fc.record({
              valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              unidadePreco: pricingUnitArbitrary,
              fatorConversao: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true })),
            }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (productName, suppliers, quantity, unit) => {
          const display = createProductEconomyDisplay(
            productName,
            suppliers,
            quantity,
            unit
          );

          if (!display) return true;

          expect(display.bestPrice.value).toBeGreaterThanOrEqual(0);
          expect(display.worstPrice.value).toBeGreaterThanOrEqual(0);
          return display.bestPrice.value >= 0 && display.worstPrice.value >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
   * **Validates: Requirements 6.2**
   * 
   * Property: Savings amount should always be non-negative
   */
  it('should have non-negative savings amount', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(
          fc.record({
            supplierId: fc.string({ minLength: 1, maxLength: 20 }),
            supplierName: fc.string({ minLength: 1, maxLength: 50 }),
            priceMetadata: fc.record({
              valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              unidadePreco: pricingUnitArbitrary,
              fatorConversao: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true })),
            }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (productName, suppliers, quantity, unit) => {
          const display = createProductEconomyDisplay(
            productName,
            suppliers,
            quantity,
            unit
          );

          if (!display) return true;

          expect(display.savingsAmount).toBeGreaterThanOrEqual(0);
          return display.savingsAmount >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
   * **Validates: Requirements 6.2**
   * 
   * Property: For single supplier, savings should be zero and best/worst prices should be equal
   */
  it('should have zero savings for single supplier', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.record({
          supplierId: fc.string({ minLength: 1, maxLength: 20 }),
          supplierName: fc.string({ minLength: 1, maxLength: 50 }),
          priceMetadata: fc.record({
            valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            unidadePreco: pricingUnitArbitrary,
            fatorConversao: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true })),
          }),
        }),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (productName, supplier, quantity, unit) => {
          const display = createProductEconomyDisplay(
            productName,
            [supplier],
            quantity,
            unit
          );

          if (!display) return true;

          expect(display.savingsAmount).toBe(0);
          expect(display.bestPrice.value).toBeCloseTo(display.worstPrice.value, 5);
          expect(display.hasMultipleSuppliers).toBe(false);
          return display.savingsAmount === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: cotacao-unidade-preco, Property 10: Product Economy Display Completeness**
   * **Validates: Requirements 6.2**
   * 
   * Property: Display should be consistent across multiple calls with same input
   */
  it('should produce consistent display for same input', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(
          fc.record({
            supplierId: fc.string({ minLength: 1, maxLength: 20 }),
            supplierName: fc.string({ minLength: 1, maxLength: 50 }),
            priceMetadata: fc.record({
              valorOferecido: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              unidadePreco: pricingUnitArbitrary,
              fatorConversao: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true })),
            }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        purchaseQuantityArbitrary,
        purchaseUnitArbitrary,
        (productName, suppliers, quantity, unit) => {
          const display1 = createProductEconomyDisplay(
            productName,
            suppliers,
            quantity,
            unit
          );
          const display2 = createProductEconomyDisplay(
            productName,
            suppliers,
            quantity,
            unit
          );

          if (!display1 || !display2) return true;

          expect(display1.productName).toBe(display2.productName);
          expect(display1.bestPrice.value).toBeCloseTo(display2.bestPrice.value, 5);
          expect(display1.worstPrice.value).toBeCloseTo(display2.worstPrice.value, 5);
          expect(display1.savingsAmount).toBeCloseTo(display2.savingsAmount, 5);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
