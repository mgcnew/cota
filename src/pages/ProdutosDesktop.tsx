/**
 * ProdutosDesktop.tsx
 * 
 * Versão desktop da página de produtos
 * 
 * NOTA: Este arquivo será criado extraindo o código desktop do arquivo original.
 * Por enquanto, esta é uma versão placeholder para manter o sistema funcionando.
 * 
 * TODO: Extrair código desktop completo do commit anterior
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProducts } from "@/hooks/useProducts";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function ProdutosDesktop() {
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { products, isLoading } = useProducts();

  useEffect(() => {
    if (!loading && !user) {
      setAuthDialogOpen(true);
    }
  }, [loading, user]);

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">Carregando produtos...</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Produtos (Desktop)</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Versão desktop - {products.length} produtos encontrados
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            ⚠️ Esta é uma versão temporária. O código desktop completo será extraído em breve.
          </p>
        </div>
      </PageWrapper>
    </>
  );
}

