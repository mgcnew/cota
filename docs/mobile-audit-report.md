# Mobile Code Audit Report

## Overview

This document identifies patterns of code duplication and CSS hiding used for mobile/desktop views in the codebase. These patterns result in both versions being rendered in the DOM simultaneously, which impacts performance.

## Pages with Duplicate Mobile/Desktop Views

The following pages render BOTH mobile cards AND desktop tables in the DOM, using CSS hiding (`md:hidden` / `hidden md:block`) instead of conditional rendering:

### 1. Cotacoes.tsx
- **Mobile Cards View**: Line 244 - `<div className="md:hidden space-y-3 p-2">`
- **Desktop Table View**: Line 328 - `<div className="hidden md:block">`
- **Issue**: Both views are always in the DOM

### 2. Fornecedores.tsx
- **Mobile Cards View**: Line 446 - `<div className="md:hidden space-y-3 p-2">`
- **Desktop Table View**: Line 510 - `<div className="hidden md:block overflow-x-auto">`
- **Issue**: Both views are always in the DOM

### 3. Pedidos.tsx
- **Mobile Cards View**: Line 245 - `<div className="md:hidden space-y-3 p-2">`
- **Desktop Table View**: Line 305 - `<div className="hidden md:block overflow-hidden">`
- **Issue**: Both views are always in the DOM

### 4. Produtos.tsx
- **Mobile Cards View**: Line 389 - `<div className="md:hidden space-y-3 p-2">`
- **Desktop Table View**: Line 468 - `<div className="hidden md:block overflow-x-auto w-full">`
- **Issue**: Both views are always in the DOM

## Components Using CSS Hiding

### Layout Components
- **AppSidebar.tsx**: Line 355 - Mobile hamburger button `className="md:hidden"`
- **AppLayout.tsx**: Line 126 - Mobile menu spacer `className="md:hidden w-10 flex-shrink-0"`
- **GlobalSearch.tsx**: Line 418 - Mobile search icon `className="md:hidden"`
- **GlobalSearch.tsx**: Line 432 - Desktop tooltip `className="hidden md:block"`

### UI Components
- **sidebar.tsx**: Lines 256, 339 - Touch area expansion `after:md:hidden`
- **CotacoesTable.tsx**: Line 77 - Mobile product summary `className="md:hidden"`

### Landing Page
- **Landing.tsx**: Line 41 - Mobile menu button `className="md:hidden"`
- **Landing.tsx**: Line 50 - Mobile navigation `className="md:hidden"`

## Recommended Actions

1. **Create `ConditionalRender` component** that uses `useIsMobile` hook to render only ONE version
2. **Migrate pages** (Cotacoes, Fornecedores, Pedidos, Produtos) to use conditional rendering
3. **Keep CSS hiding** for simple layout adjustments (spacers, icons) where performance impact is minimal
4. **Use conditional rendering** for complex components (tables, cards, forms) where DOM size matters

## Impact Assessment

| Page | Estimated DOM Reduction | Priority |
|------|------------------------|----------|
| Cotacoes.tsx | ~50% of list content | High |
| Fornecedores.tsx | ~50% of list content | High |
| Pedidos.tsx | ~50% of list content | High |
| Produtos.tsx | ~50% of list content | High |

## Conclusion

Four main pages have significant code duplication where both mobile and desktop views are rendered simultaneously. Creating a `ConditionalRender` utility component will allow these pages to render only the appropriate view, reducing DOM size and improving mobile performance.
