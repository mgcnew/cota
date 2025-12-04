# Implementation Plan

- [x] 1. Database Schema Migration




  - [x] 1.1 Create migration file to add new columns to quote_supplier_items table

    - Add column `unidade_preco` (varchar(10), nullable, default null)
    - Add column `fator_conversao` (decimal(10,4), nullable)
    - Add column `quantidade_por_embalagem` (decimal(10,4), nullable)
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 1.2 Create migration to set default values for existing records

    - Set unidade_preco based on product's base unit from products table
    - Set fator_conversao to 1 for existing records
    - _Requirements: 5.4_
  - [x] 1.3 Update Supabase types file with new columns

    - Regenerate types or manually add new fields to QuoteSupplierItem type
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Price Normalization Utility





  - [x] 2.1 Create priceNormalization.ts utility file


    - Define PricingUnit type ('kg' | 'un' | 'cx' | 'pct')
    - Define PriceMetadata interface
    - Define NormalizedPrice interface
    - _Requirements: 2.1_

  - [x] 2.2 Implement normalizePrice function

    - Handle conversion from cx/pct to base unit using fator_conversao
    - Calculate valorUnitario (price per base unit)
    - Calculate valorTotal (total price for purchase quantity)
    - _Requirements: 2.1, 2.2_
  - [ ]* 2.3 Write property test for price normalization
    - **Property 1: Price Normalization Consistency**
    - **Validates: Requirements 2.1**
  - [x] 2.4 Implement calculateEconomy function


    - Normalize all supplier prices to same base
    - Find min and max normalized prices
    - Calculate economy as (max - min) × quantity
    - Return economiaReal, melhorPreco, piorPreco
    - _Requirements: 2.2, 2.4_
  - [x] 2.5 Write property test for economy calculation






    - **Property 2: Economy Calculation Formula**
    - **Validates: Requirements 2.2**
  - [x] 2.6 Write property test for total economy aggregation






    - **Property 3: Total Economy Aggregation**
    - **Validates: Requirements 2.4**

- [x] 3. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update useCotacoes Hook





  - [x] 4.1 Update updateSupplierProductValue mutation


    - Accept new parameters: unidadePreco, fatorConversao, quantidadePorEmbalagem
    - Save all metadata to quote_supplier_items
    - _Requirements: 1.3, 4.2_
  - [x] 4.2 Update quote data fetching to include new fields


    - Include unidade_preco, fator_conversao, quantidade_por_embalagem in select
    - Map to frontend types
    - _Requirements: 1.4_
  - [x] 4.3 Write property test for default pricing unit






    - **Property 7: Default Pricing Unit**
    - **Validates: Requirements 5.5**

- [x] 5. Update QuoteValuesTab UI






  - [x] 5.1 Add pricing unit selector to edit mode

    - Create dropdown with options: kg, unidade, caixa, pacote
    - Show selector when editing a price
    - _Requirements: 1.1_
  - [x] 5.2 Add conditional conversion factor input


    - Show input when pricing unit is 'cx' or 'pct'
    - Add validation to require value > 0
    - _Requirements: 1.2, 1.5_
  - [ ]* 5.3 Write property test for conversion factor requirement
    - **Property 4: Conversion Factor Requirement**
    - **Validates: Requirements 1.5**

  - [x] 5.4 Update price display to show unit label

    - Format as "R$ X.XX/kg" or "R$ X.XX/un"
    - Show original unit if different from base
    - _Requirements: 1.4, 3.4_
  - [x] 5.5 Write property test for price display format






    - **Property 5: Price Display Format**
    - **Validates: Requirements 1.4**

- [x] 6. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Update PriceConverter Integration
  - [ ] 7.1 Modify PriceConverter to return conversion metadata
    - Return object with: convertedValue, targetUnit, conversionFactor
    - Update onConvert callback signature
    - _Requirements: 4.1, 4.3_
  - [ ] 7.2 Update QuoteValuesTab to use PriceConverter metadata
    - Auto-set pricing unit from PriceConverter result
    - Auto-set conversion factor from PriceConverter result
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 7.3 Write property test for PriceConverter integration
    - **Property 8: PriceConverter Integration**
    - **Validates: Requirements 4.1, 4.2**

- [ ] 8. Update Dashboard Economy Calculation
  - [ ] 8.1 Refactor buildSupplierTotals in useDashboard
    - Use normalizePrice utility for each supplier item
    - Consider unidade_preco and fator_conversao in calculations
    - _Requirements: 2.1_
  - [ ] 8.2 Refactor calculateQuoteEconomics in useDashboard
    - Use calculateEconomy utility
    - Return economy in absolute R$ value
    - _Requirements: 2.2, 2.3_
  - [ ]* 8.3 Write property test for best price determination
    - **Property 6: Best Price Determination**
    - **Validates: Requirements 3.3**

- [ ] 9. Update Quote Comparison Tab
  - [ ] 9.1 Update QuoteComparisonTab to show normalized prices
    - Display all prices converted to base unit
    - Show original value and unit when different
    - _Requirements: 3.1, 3.2_
  - [ ]* 9.2 Write property test for comparison display
    - **Property 9: Comparison Display Normalization**
    - **Validates: Requirements 3.2**
  - [ ] 9.3 Update best price highlighting logic
    - Compare normalized values instead of original
    - _Requirements: 3.3_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Add Economy Breakdown Feature
  - [ ] 11.1 Create ProductEconomyBreakdown component
    - Display economy per product in finalized quotes
    - Show product name, best price, worst price, savings
    - Handle single-supplier case with "N/A"
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 11.2 Write property test for economy display completeness
    - **Property 10: Product Economy Display Completeness**
    - **Validates: Requirements 6.2**
  - [ ] 11.3 Add sorting by economy amount
    - Allow sorting products by savings (highest to lowest)
    - _Requirements: 6.4_
  - [ ] 11.4 Integrate ProductEconomyBreakdown into ViewQuoteDialog
    - Add new tab or section for economy breakdown
    - Only show for finalized quotes
    - _Requirements: 6.1_

- [ ] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
