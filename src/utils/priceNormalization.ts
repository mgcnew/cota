/**
 * Price Normalization Utility
 * 
 * Handles conversion and normalization of prices across different pricing units
 * to enable accurate comparison and economy calculation.
 * 
 * Requirements: 2.1, 2.2, 2.4
 */

// Pricing unit types supported by the system
export type PricingUnit = 'kg' | 'un' | 'cx' | 'pct';

// Base units for normalization (kg for weight, un for count)
export type BaseUnit = 'kg' | 'un';

/**
 * Metadata about a price entry from a supplier
 */
export interface PriceMetadata {
  valorOferecido: number;           // Value offered by supplier
  unidadePreco: PricingUnit;        // Unit of the offered price
  fatorConversao?: number;          // Conversion factor (e.g., 12 un/cx)
  quantidadePorEmbalagem?: number;  // Quantity per package
}

/**
 * Result of normalizing a price to base unit
 */
export interface NormalizedPrice {
  valorUnitario: number;    // Price per base unit (kg or un)
  valorTotal: number;       // Total price for purchase quantity
  unidadeBase: BaseUnit;    // Base unit used for normalization
}

/**
 * Result of economy calculation between suppliers
 */
export interface EconomyResult {
  economiaReal: number;   // Real economy in R$
  melhorPreco: number;    // Best (lowest) normalized unit price
  piorPreco: number;      // Worst (highest) normalized unit price
}

/**
 * Determines the base unit for a given purchase unit
 * Weight-based units normalize to 'kg', count-based to 'un'
 */
export function getBaseUnit(purchaseUnit: string): BaseUnit {
  const weightUnits = ['kg', 'g', 'mg', 'ton', 'tonelada'];
  const normalizedUnit = purchaseUnit.toLowerCase().trim();
  return weightUnits.includes(normalizedUnit) ? 'kg' : 'un';
}


/**
 * Normalizes a price to the base unit and calculates total cost
 * 
 * Conversion logic:
 * - If pricing unit is 'kg' or 'un' (base units): valorUnitario = valorOferecido
 * - If pricing unit is 'cx' or 'pct': valorUnitario = valorOferecido / fatorConversao
 * 
 * The valorTotal is calculated as: valorUnitario × purchaseQuantity
 * 
 * @param price - Price metadata from supplier
 * @param purchaseQuantity - Quantity being purchased
 * @param purchaseUnit - Unit of purchase (e.g., 'kg', 'un', '300kg')
 * @returns Normalized price with unit price and total
 * 
 * Requirements: 2.1, 2.2
 */
export function normalizePrice(
  price: PriceMetadata,
  purchaseQuantity: number,
  purchaseUnit: string
): NormalizedPrice {
  const unidadeBase = getBaseUnit(purchaseUnit);
  
  let valorUnitario: number;
  
  // Check if pricing unit is a package type that needs conversion
  if (price.unidadePreco === 'cx' || price.unidadePreco === 'pct') {
    // For box/package pricing, divide by conversion factor to get unit price
    const fator = price.fatorConversao ?? 1;
    if (fator <= 0) {
      throw new Error('Fator de conversão deve ser maior que zero');
    }
    valorUnitario = price.valorOferecido / fator;
  } else {
    // For base units (kg, un), the offered value is already the unit price
    valorUnitario = price.valorOferecido;
  }
  
  // Calculate total price for the purchase quantity
  // If purchase unit is boxes and we have units/box, calculate total: boxes × units/box × price/unit
  const isBoxPurchase = purchaseUnit.toLowerCase().startsWith('cx');
  const packagingFactor = (isBoxPurchase && price.quantidadePorEmbalagem) ? price.quantidadePorEmbalagem : 1;
  const valorTotal = valorUnitario * purchaseQuantity * packagingFactor;
  
  return {
    valorUnitario,
    valorTotal,
    unidadeBase,
  };
}


/**
 * Unit labels for display purposes
 */
const UNIT_LABELS: Record<PricingUnit, string> = {
  kg: '/kg',
  un: '/un',
  cx: '/cx',
  pct: '/pct',
};

/**
 * Formats a price value with its unit label
 * 
 * Format: "R$ X.XX/unit"
 * 
 * @param value - The price value to format
 * @param unit - The pricing unit
 * @returns Formatted price string with unit label
 * 
 * Requirements: 1.4, 3.4
 */
export function formatPriceWithUnit(value: number, unit: PricingUnit): string {
  const unitLabel = UNIT_LABELS[unit] || '/un';
  return `R$ ${value.toFixed(2)}${unitLabel}`;
}

/**
 * Calculates the economy (savings) between supplier prices for a product
 * 
 * Economy formula: (max_normalized_price - min_normalized_price) × purchase_quantity
 * 
 * @param supplierPrices - Array of price metadata from different suppliers
 * @param purchaseQuantity - Quantity being purchased
 * @param purchaseUnit - Unit of purchase
 * @returns Economy result with savings amount and best/worst prices
 * 
 * Requirements: 2.2, 2.4
 */
export function calculateEconomy(
  supplierPrices: PriceMetadata[],
  purchaseQuantity: number,
  purchaseUnit: string
): EconomyResult {
  // Filter out invalid prices (null, undefined, zero, or negative)
  const validPrices = supplierPrices.filter(
    (p) => p && p.valorOferecido != null && p.valorOferecido > 0
  );
  
  // Need at least 2 suppliers to calculate economy
  if (validPrices.length < 2) {
    return {
      economiaReal: 0,
      melhorPreco: validPrices.length === 1 
        ? normalizePrice(validPrices[0], purchaseQuantity, purchaseUnit).valorUnitario 
        : 0,
      piorPreco: validPrices.length === 1 
        ? normalizePrice(validPrices[0], purchaseQuantity, purchaseUnit).valorUnitario 
        : 0,
    };
  }
  
  // Normalize all prices to base unit
  const normalizedPrices = validPrices.map((price) =>
    normalizePrice(price, purchaseQuantity, purchaseUnit)
  );
  
  // Find min and max unit prices for meta information
  const unitPrices = normalizedPrices.map((np) => np.valorUnitario);
  const melhorPreco = Math.min(...unitPrices);
  const piorPreco = Math.max(...unitPrices);
  
  // Economy = difference between highest total price offered and lowest total price
  // This correctly accounts for packaging factors (units per box) if they differ or exist
  const totalPrices = normalizedPrices.map((np) => np.valorTotal);
  const economiaReal = Math.max(...totalPrices) - Math.min(...totalPrices);
  
  return {
    economiaReal,
    melhorPreco,
    piorPreco,
  };
}
