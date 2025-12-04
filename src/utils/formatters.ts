/**
 * Formatadores otimizados com cache (Intl.NumberFormat/DateTimeFormat)
 * Evita criar novas instâncias em loops
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR');

export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};

export const formatDate = (date: string | Date): string => {
  return dateFormatter.format(new Date(date));
};

export const formatDateShort = (date: string | Date): string => {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/**
 * Formata valor monetário de forma compacta (K, M, B)
 * Ex: 1500 -> R$ 1,5K | 1500000 -> R$ 1,5M
 */
export const formatCurrencyCompact = (value: number): string => {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000_000) {
    return `${sign}R$ ${(absValue / 1_000_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}R$ ${(absValue / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}R$ ${(absValue / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}K`;
  }
  return formatCurrency(value);
};

