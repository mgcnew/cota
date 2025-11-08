import { useMemo } from 'react';

export interface NavColor {
  bg: string;
  shadow: string;
  from: string;
  to: string;
  shadowColor: string;
  glow: string;
}

/**
 * Hook para gerenciar cores do menu mobile
 * 
 * Retorna array de cores para itens do menu com efeitos visuais
 */
export function useMobileNavColors(): NavColor[] {
  return useMemo(() => [
    {
      bg: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/25',
      from: '#3b82f6',
      to: '#2563eb',
      shadowColor: 'rgba(59, 130, 246, 0.25)',
      glow: 'shadow-blue-400/50'
    },
    {
      bg: 'from-orange-500 to-amber-500',
      shadow: 'shadow-orange-500/25',
      from: '#f97316',
      to: '#f59e0b',
      shadowColor: 'rgba(249, 115, 22, 0.25)',
      glow: 'shadow-orange-400/50'
    },
    {
      bg: 'from-indigo-500 to-blue-500',
      shadow: 'shadow-indigo-500/25',
      from: '#6366f1',
      to: '#3b82f6',
      shadowColor: 'rgba(99, 102, 241, 0.25)',
      glow: 'shadow-indigo-400/50'
    },
    {
      bg: 'from-teal-500 to-cyan-500',
      shadow: 'shadow-teal-500/25',
      from: '#14b8a6',
      to: '#06b6d4',
      shadowColor: 'rgba(20, 184, 166, 0.25)',
      glow: 'shadow-teal-400/50'
    },
    {
      bg: 'from-pink-500 to-rose-500',
      shadow: 'shadow-pink-500/25',
      from: '#ec4899',
      to: '#f43f5e',
      shadowColor: 'rgba(236, 72, 153, 0.25)',
      glow: 'shadow-pink-400/50'
    },
    {
      bg: 'from-slate-500 to-gray-500',
      shadow: 'shadow-slate-500/25',
      from: '#64748b',
      to: '#6b7280',
      shadowColor: 'rgba(100, 116, 139, 0.25)',
      glow: 'shadow-slate-400/50'
    },
    {
      bg: 'from-purple-500 to-violet-500',
      shadow: 'shadow-purple-500/25',
      from: '#a855f7',
      to: '#8b5cf6',
      shadowColor: 'rgba(168, 85, 247, 0.25)',
      glow: 'shadow-purple-400/50'
    },
    {
      bg: 'from-green-500 to-emerald-500',
      shadow: 'shadow-green-500/25',
      from: '#22c55e',
      to: '#10b981',
      shadowColor: 'rgba(34, 197, 94, 0.25)',
      glow: 'shadow-green-400/50'
    },
    {
      bg: 'from-fuchsia-500 to-pink-500',
      shadow: 'shadow-fuchsia-500/25',
      from: '#d946ef',
      to: '#ec4899',
      shadowColor: 'rgba(217, 70, 239, 0.25)',
      glow: 'shadow-fuchsia-400/50'
    },
  ], []);
}

