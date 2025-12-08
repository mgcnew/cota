/**
 * Offline Queue Utility for Stock Count Operations
 * Requirements: 15.4 - Queue updates for later sync when connection is unstable
 * 
 * This utility provides:
 * - Local storage persistence for pending operations
 * - Automatic sync when online
 * - Manual sync trigger
 * - Queue status monitoring
 */

export interface QueuedOperation {
  id: string;
  type: 'add' | 'update' | 'delete';
  table: string;
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = 'offline_queue';
const MAX_RETRIES = 3;

/**
 * Get all queued operations from local storage
 */
export function getQueuedOperations(): QueuedOperation[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save queued operations to local storage
 */
function saveQueue(operations: QueuedOperation[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(operations));
  } catch (error) {
    console.error('Failed to save offline queue:', error);
  }
}

/**
 * Add an operation to the offline queue
 */
export function queueOperation(
  type: QueuedOperation['type'],
  table: string,
  data: Record<string, any>
): string {
  const operations = getQueuedOperations();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const operation: QueuedOperation = {
    id,
    type,
    table,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  };
  
  operations.push(operation);
  saveQueue(operations);
  
  return id;
}

/**
 * Remove an operation from the queue
 */
export function removeFromQueue(operationId: string): void {
  const operations = getQueuedOperations();
  const filtered = operations.filter(op => op.id !== operationId);
  saveQueue(filtered);
}

/**
 * Update retry count for an operation
 */
export function incrementRetryCount(operationId: string): void {
  const operations = getQueuedOperations();
  const updated = operations.map(op => {
    if (op.id === operationId) {
      return { ...op, retryCount: op.retryCount + 1 };
    }
    return op;
  });
  saveQueue(updated);
}

/**
 * Clear all queued operations
 */
export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Check if there are pending operations
 */
export function hasPendingOperations(): boolean {
  return getQueuedOperations().length > 0;
}

/**
 * Get count of pending operations
 */
export function getPendingCount(): number {
  return getQueuedOperations().length;
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Process a single queued operation
 * Returns true if successful, false otherwise
 */
export async function processOperation(
  operation: QueuedOperation,
  supabase: any
): Promise<boolean> {
  try {
    switch (operation.type) {
      case 'add':
        const { error: insertError } = await supabase
          .from(operation.table)
          .insert(operation.data);
        if (insertError) throw insertError;
        break;
        
      case 'update':
        const { id, ...updateData } = operation.data;
        const { error: updateError } = await supabase
          .from(operation.table)
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;
        break;
        
      case 'delete':
        const { error: deleteError } = await supabase
          .from(operation.table)
          .delete()
          .eq('id', operation.data.id);
        if (deleteError) throw deleteError;
        break;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to process queued operation:', error);
    return false;
  }
}

/**
 * Sync all queued operations
 * Returns number of successfully synced operations
 */
export async function syncQueue(supabase: any): Promise<{
  synced: number;
  failed: number;
  remaining: number;
}> {
  if (!isOnline()) {
    const operations = getQueuedOperations();
    return { synced: 0, failed: 0, remaining: operations.length };
  }
  
  const operations = getQueuedOperations();
  let synced = 0;
  let failed = 0;
  
  for (const operation of operations) {
    const success = await processOperation(operation, supabase);
    
    if (success) {
      removeFromQueue(operation.id);
      synced++;
    } else {
      incrementRetryCount(operation.id);
      
      // Remove if max retries exceeded
      if (operation.retryCount >= MAX_RETRIES) {
        removeFromQueue(operation.id);
        failed++;
      }
    }
  }
  
  const remaining = getPendingCount();
  return { synced, failed, remaining };
}

/**
 * Hook to listen for online/offline events
 */
export function setupOnlineListener(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
