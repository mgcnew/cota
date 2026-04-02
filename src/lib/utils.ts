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
