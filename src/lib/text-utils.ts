/**
 * Capitaliza a primeira letra de cada palavra
 * Exceções: preposições comuns (de, da, do, com, e, ou)
 * Exceções especiais: siglas (CPF, CNPJ, ID, etc.)
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return '';
  
  const exceptions = ['de', 'da', 'do', 'dos', 'das', 'com', 'e', 'ou', 'a', 'o'];
  const acronyms = ['cpf', 'cnpj', 'id', 'rg', 'api', 'kg', 'ml', 'l'];
  
  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Se for sigla, mantém maiúscula
      if (acronyms.includes(word)) return word.toUpperCase();
      
      // Se for exceção e não for a primeira palavra, mantém minúscula
      if (index > 0 && exceptions.includes(word)) return word;
      
      // Capitaliza primeira letra
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Capitaliza apenas a primeira letra da frase
 */
export function capitalizeSentence(text: string | null | undefined): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Normaliza input numérico brasileiro (vírgula) para formato de banco (ponto)
 * Exemplos: "98,5" → 98.5 | "100" → 100 | "1.234,56" → 1234.56
 */
export function parseDecimalInput(value: string): number | null {
  if (!value) return null;
  
  // Remove espaços e substitui vírgula por ponto
  const normalized = value.trim().replace(',', '.');
  
  const parsed = parseFloat(normalized);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formata número para exibição brasileira com vírgula
 * Exemplos: 98.5 → "98,5" | 100 → "100" | 1234.56 → "1.234,56"
 */
export function formatDecimalDisplay(value: number, decimals: number = 2): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}
