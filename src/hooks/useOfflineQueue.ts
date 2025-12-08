/**
 * Hook for managing offline queue operations
 * Requirements: 15.4 - Queue updates for later sync when connection is unstable
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  queueOperation,
  syncQueue,
  getPendingCount,
  isOnline,
  setupOnlineListener,
  hasPendingOperations,
} from '@/utils/offlineQueue';

export function useOfflineQueue() {
  const { toast } = useToast();
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(getPendingCount());
  const [isSyncing, setIsSyncing] = useState(false);

  // Update pending count
  const updatePendingCount = useCallback(() => {
    setPendingCount(getPendingCount());
  }, []);

  // Handle coming online - auto sync
  const handleOnline = useCallback(async () => {
    setOnline(true);
    
    if (hasPendingOperations()) {
      toast({
        title: "Conexão restaurada",
        description: "Sincronizando dados pendentes...",
      });
      
      await syncPendingOperations();
    }
  }, [toast]);

  // Handle going offline
  const handleOffline = useCallback(() => {
    setOnline(false);
    toast({
      title: "Sem conexão",
      description: "As alterações serão salvas localmente e sincronizadas quando a conexão for restaurada.",
      variant: "destructive",
    });
  }, [toast]);

  // Setup online/offline listeners
  useEffect(() => {
    const cleanup = setupOnlineListener(handleOnline, handleOffline);
    return cleanup;
  }, [handleOnline, handleOffline]);

  // Sync pending operations
  const syncPendingOperations = useCallback(async () => {
    if (isSyncing || !isOnline()) return;
    
    setIsSyncing(true);
    try {
      const result = await syncQueue(supabase);
      updatePendingCount();
      
      if (result.synced > 0) {
        toast({
          title: "✓ Sincronização concluída",
          description: `${result.synced} operação(ões) sincronizada(s) com sucesso`,
        });
      }
      
      if (result.failed > 0) {
        toast({
          title: "Algumas operações falharam",
          description: `${result.failed} operação(ões) não puderam ser sincronizadas`,
          variant: "destructive",
        });
      }
      
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, toast, updatePendingCount]);

  // Queue an add operation
  const queueAdd = useCallback((table: string, data: Record<string, any>) => {
    const id = queueOperation('add', table, data);
    updatePendingCount();
    
    if (!online) {
      toast({
        title: "Salvo localmente",
        description: "Será sincronizado quando a conexão for restaurada",
      });
    }
    
    return id;
  }, [online, toast, updatePendingCount]);

  // Queue an update operation
  const queueUpdate = useCallback((table: string, data: Record<string, any>) => {
    const id = queueOperation('update', table, data);
    updatePendingCount();
    
    if (!online) {
      toast({
        title: "Salvo localmente",
        description: "Será sincronizado quando a conexão for restaurada",
      });
    }
    
    return id;
  }, [online, toast, updatePendingCount]);

  // Queue a delete operation
  const queueDelete = useCallback((table: string, id: string) => {
    const opId = queueOperation('delete', table, { id });
    updatePendingCount();
    
    if (!online) {
      toast({
        title: "Salvo localmente",
        description: "Será sincronizado quando a conexão for restaurada",
      });
    }
    
    return opId;
  }, [online, toast, updatePendingCount]);

  return {
    online,
    pendingCount,
    isSyncing,
    hasPending: pendingCount > 0,
    queueAdd,
    queueUpdate,
    queueDelete,
    syncPendingOperations,
  };
}
