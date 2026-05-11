import { useState, useCallback, startTransition, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { Quote } from "@/hooks/useCotacoes";

export function useCotacoesDialogs(cotacoes: Quote[] = []) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [gerenciarDialogOpen, setGerenciarDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [relatorioDialogOpen, setRelatorioDialogOpen] = useState(false);
  
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [initialSupplierId, setInitialSupplierId] = useState<string | null>(null);

  // Derive selectedQuote to ensure real-time updates based on cotacoes array
  const selectedQuote = useMemo(() => {
    if (!selectedQuoteId) return null;
    return cotacoes.find(c => c.id === selectedQuoteId) || null;
  }, [cotacoes, selectedQuoteId]);

  // Handle URL param "open=new"
  useEffect(() => {
    const isNew = searchParams.get("open") === "new";
    const supplierId = searchParams.get("supplierId");
    
    if (isNew) {
      if (supplierId) {
        setInitialSupplierId(supplierId);
      }
      setTimeout(() => {
        setAddDialogOpen(true);
        setSearchParams(prev => {
          prev.delete("open");
          prev.delete("supplierId");
          return prev;
        }, { replace: true });
      }, 100);
    }
  }, [searchParams, setSearchParams]);

  // Action handlers wrapped in startTransition to prevent UI freezing
  const handleViewQuote = useCallback((quote: Quote) => {
    startTransition(() => {
      setSelectedQuoteId(quote.id);
      setViewDialogOpen(true);
    });
  }, []);

  const handleGerenciarQuote = useCallback((quote: Quote) => {
    startTransition(() => {
      setSelectedQuoteId(quote.id);
      setGerenciarDialogOpen(true);
    });
  }, []);

  const handleDeleteQuote = useCallback((quote: Quote) => {
    startTransition(() => {
      setSelectedQuoteId(quote.id);
      setDeleteDialogOpen(true);
    });
  }, []);

  // Handle URL param "manageQuote"
  useEffect(() => {
    const manageQuoteId = searchParams.get("manageQuote");
    if (manageQuoteId && cotacoes.length > 0) {
      const quoteToManage = cotacoes.find(c => c.id?.toString() === manageQuoteId.toString());
      if (quoteToManage) {
        setTimeout(() => {
          handleGerenciarQuote(quoteToManage);
          setSearchParams(prev => {
            prev.delete("manageQuote");
            return prev;
          }, { replace: true });
        }, 100);
      }
    }
  }, [searchParams, cotacoes, handleGerenciarQuote, setSearchParams]);

  return {
    addDialogOpen,
    setAddDialogOpen,
    viewDialogOpen,
    setViewDialogOpen,
    gerenciarDialogOpen,
    setGerenciarDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    relatorioDialogOpen,
    setRelatorioDialogOpen,
    selectedQuote,
    initialSupplierId,
    setInitialSupplierId,
    handleViewQuote,
    handleGerenciarQuote,
    handleDeleteQuote
  };
}
