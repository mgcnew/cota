/**
 * Dedup window for the realtime subscription on `cotacoes`.
 *
 * Whenever a local mutation completes we call `markMutationComplete()`.
 * If realtime fires within DEDUP_WINDOW_MS we skip the redundant
 * `invalidateQueries` because the mutation already updated the cache.
 */

const DEDUP_WINDOW_MS = 1500;

let lastMutationTimestamp = 0;

export function markMutationComplete(): void {
  lastMutationTimestamp = Date.now();
}

export function shouldSkipRealtimeInvalidation(): boolean {
  return Date.now() - lastMutationTimestamp < DEDUP_WINDOW_MS;
}
