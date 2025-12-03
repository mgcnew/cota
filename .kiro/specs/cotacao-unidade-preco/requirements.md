# Requirements Document

## Introduction

Este documento especifica os requisitos para implementar um sistema de unidade de precificação nas cotações. O objetivo é permitir que o sistema entenda corretamente a unidade em que cada preço foi informado (por kg, por unidade, por caixa, etc.) e calcule a economia real de forma precisa, considerando as quantidades totais de compra.

Atualmente, o sistema armazena apenas o valor oferecido sem contexto da unidade de precificação, o que impede o cálculo correto da economia quando diferentes fornecedores informam preços em unidades diferentes ou quando o preço informado é por unidade de medida (kg) mas a compra é em quantidade (300kg).

## Glossary

- **Sistema de Cotações**: Módulo responsável por gerenciar cotações de preços com fornecedores
- **Unidade de Compra**: A unidade em que o produto será comprado (ex: 300kg, 10 caixas)
- **Unidade de Preço**: A unidade em que o fornecedor informa o preço (ex: por kg, por unidade, por caixa)
- **Fator de Conversão**: Quantidade de unidades de preço contidas em uma embalagem (ex: 1 caixa = 12 unidades)
- **Valor Unitário**: Preço por unidade de medida base (kg ou unidade)
- **Valor Total**: Preço total considerando a quantidade de compra
- **Economia Realizada**: Diferença entre o maior e menor valor total entre fornecedores
- **Quote Supplier Item**: Registro do preço oferecido por um fornecedor para um produto específico

## Requirements

### Requirement 1

**User Story:** As a purchasing manager, I want to specify the pricing unit when entering supplier prices, so that the system can correctly calculate total costs and savings.

#### Acceptance Criteria

1. WHEN a user edits a supplier price for a product THEN the System SHALL display an option to select the pricing unit (kg, unidade, caixa, pacote)
2. WHEN the pricing unit differs from the purchase unit THEN the System SHALL request the conversion factor (quantity per package)
3. WHEN a price is saved THEN the System SHALL store both the offered value and the pricing unit metadata
4. WHEN displaying a saved price THEN the System SHALL show the price with its corresponding unit label (ex: R$ 18,54/kg)
5. WHEN the user selects "caixa" or "pacote" as pricing unit THEN the System SHALL require the quantity per package field

### Requirement 2

**User Story:** As a purchasing manager, I want the system to calculate the real economy based on total purchase value, so that I can see how much money I actually saved.

#### Acceptance Criteria

1. WHEN comparing supplier prices THEN the System SHALL normalize all prices to the same base unit before comparison
2. WHEN calculating economy THEN the System SHALL multiply the unit price difference by the total purchase quantity
3. WHEN displaying economy in the dashboard THEN the System SHALL show the absolute value in R$ (not percentage)
4. WHEN a quote has multiple products THEN the System SHALL sum the economy of each product for the total
5. WHEN fewer than 2 suppliers have valid prices for a product THEN the System SHALL exclude that product from economy calculation

### Requirement 3

**User Story:** As a purchasing manager, I want to see a clear comparison of supplier prices normalized to the same unit, so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. WHEN viewing the quote comparison tab THEN the System SHALL display all prices converted to the base unit (kg or unidade)
2. WHEN a supplier provided price in a different unit THEN the System SHALL show both original and converted values
3. WHEN highlighting the best price THEN the System SHALL compare normalized values, not original values
4. WHEN displaying the price table THEN the System SHALL include a column showing the original pricing unit

### Requirement 4

**User Story:** As a purchasing manager, I want the price converter calculator to automatically save the conversion metadata, so that I don't need to manually specify the pricing unit after using the calculator.

#### Acceptance Criteria

1. WHEN the user uses the PriceConverter to calculate a price THEN the System SHALL automatically set the pricing unit based on the conversion
2. WHEN applying a converted price THEN the System SHALL store the conversion factor used
3. WHEN the PriceConverter is used THEN the System SHALL pre-fill the pricing unit as the target unit of conversion
4. WHEN editing a price that was previously converted THEN the System SHALL display the original conversion parameters

### Requirement 5

**User Story:** As a system administrator, I want the database to support pricing unit metadata, so that all pricing information is properly persisted.

#### Acceptance Criteria

1. WHEN the system initializes THEN the Database SHALL have a column for pricing unit in quote_supplier_items table
2. WHEN the system initializes THEN the Database SHALL have a column for conversion factor in quote_supplier_items table
3. WHEN the system initializes THEN the Database SHALL have a column for quantity per package in quote_supplier_items table
4. WHEN migrating existing data THEN the System SHALL set default pricing unit based on the product's base unit
5. WHEN a new quote_supplier_item is created without pricing unit THEN the System SHALL default to the product's base unit

### Requirement 6

**User Story:** As a purchasing manager, I want to see the economy breakdown per product in a quote, so that I can identify which products generated the most savings.

#### Acceptance Criteria

1. WHEN viewing a finalized quote THEN the System SHALL display economy per product
2. WHEN displaying product economy THEN the System SHALL show: product name, best price, worst price, and savings amount
3. WHEN a product has only one supplier price THEN the System SHALL display "N/A" for economy
4. WHEN sorting products THEN the System SHALL allow sorting by economy amount (highest to lowest)
