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
