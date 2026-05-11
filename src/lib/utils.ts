import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza um texto para busca:
 * - Converte para minúsculo
 * - Remove acentos
 * - Remove espaços extras
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Formata uma data para YYYY-MM-DD usando o fuso horário local.
 * Essencial para evitar o erro de 1 dia de atraso do toISOString().
 */
export function formatLocalDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Converte uma data no formato "DD/MM/YYYY" para um timestamp (number) para facilitar comparações.
 * Retorna 0 se a string for inválida ou vazia.
 */
export function parseDateBR(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    // Usa meia noite para garantir comparação estável, ajustando mês para base 0 (0 = Jan)
    return new Date(year, month - 1, day).getTime();
  }
  return 0;
}

/**
 * Extrai o valor numérico de uma string de preço formatada no padrão BR (ex: "R$ 1.234,56").
 * Retorna 0 se a string for inválida ou vazia.
 */
export function extractPrice(priceStr?: string | null): number {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
