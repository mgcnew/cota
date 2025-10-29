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
