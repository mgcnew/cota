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

export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '' || value === '-') return '-';
  
  let num: number;
  if (typeof value === 'string') {
    // Remove R$, spaces and thousands separator, then replace comma with dot
    const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
    num = parseFloat(cleanValue);
  } else {
    num = value;
  }

  if (isNaN(num)) return '-';
  return currencyFormatter.format(num);
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

/**
 * Formata valor monetário de forma amigável e legível
 * Ex: 30000 -> R$ 30 mil | 1500000 -> R$ 1,5 milhão
 */
export const formatCurrencyFriendly = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '' || value === '-') return '-';
  
  let num: number;
  if (typeof value === 'string') {
    // Remove currency symbols and common separators
    let cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
    
    // Handle 'k' or 'K' suffix (e.g., "1k" -> 1000)
    if (cleanValue.toLowerCase().endsWith('k')) {
      num = parseFloat(cleanValue.slice(0, -1)) * 1000;
    } else {
      num = parseFloat(cleanValue);
    }
  } else {
    num = value;
  }

  if (isNaN(num)) return '-';
  
  const absValue = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    const val = absValue / 1_000_000_000;
    return `${sign}R$ ${val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} bilh${val === 1 ? 'ão' : 'ões'}`;
  }
  if (absValue >= 1_000_000) {
    const val = absValue / 1_000_000;
    return `${sign}R$ ${val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} milh${val === 1 ? 'ão' : 'ões'}`;
  }
  if (absValue >= 1_000) {
    const val = absValue / 1_000;
    // Check if it's a whole number to avoid "30,0 mil"
    const formattedVal = val % 1 === 0 
      ? val.toString() 
      : val.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return `${sign}R$ ${formattedVal} mil`;
  }
  
  return formatCurrency(num);
};

/**
 * Converte uma string formatada (ex: "R$ 30 mil", "1.5k") de volta para número
 */
export const parseCurrencyFriendly = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;

  const cleanValue = value.toLowerCase()
    .replace(/[r$\s.]/g, '')
    .replace(',', '.');

  if (cleanValue.includes('bilh')) {
    return parseFloat(cleanValue) * 1_000_000_000;
  }
  if (cleanValue.includes('milh')) {
    return parseFloat(cleanValue) * 1_000_000;
  }
  if (cleanValue.includes('mil') || cleanValue.endsWith('k')) {
    return parseFloat(cleanValue) * 1_000;
  }

  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : num;
};

