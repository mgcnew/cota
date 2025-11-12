import { useState, useCallback, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface PedidoItem {
  produto: string;
  quantidade: number;
  valorUnitario: number;
  unidade: string;
}

type EditSection = "dados" | "itens" | "observacoes";

/**
 * Hook otimizado para gerenciar estado do dialog de pedidos
 * - Memoização de callbacks
 * - Gerenciamento eficiente de estado
 * - Carregamento otimizado de dados
 */
export function usePedidoDialog(pedido: any, open: boolean) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados do modo
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState<EditSection>("dados");
  
  // Estados do formulário
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Resetar estado quando o dialog abrir/fechar
  useEffect(() => {
    if (open) {
      setIsEditMode(false);
      setActiveSection("dados");
    }
  }, [open]);

  // Carregar dados do pedido
  useEffect(() => {
    if (pedido && open) {
      setFornecedor(pedido.supplier_id || "");
      setDataEntrega(pedido.delivery_date || "");
      setStatus(pedido.status || "");
      setObservacoes(pedido.observacoes || pedido.observations || "");
      
      if (pedido.detalhesItens) {
        setItens(pedido.detalhesItens);
      }
    }
  }, [pedido, open]);

  // Carregar fornecedores
  const loadSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  }, []);

  // Carregar produtos
  const loadProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, unit')
        .order('name')
        .limit(100);
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  }, []);

  // Carregar dados quando o dialog abrir
  useEffect(() => {
    if (open) {
      loadSuppliers();
      loadProducts();
    }
  }, [open, loadSuppliers, loadProducts]);

  // Fornecedor selecionado
  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === fornecedor);
  }, [suppliers, fornecedor]);

  // Calcular total
  const totalValue = useMemo(() => {
    return itens.reduce((acc, item) => {
      return acc + (item.quantidade * item.valorUnitario);
    }, 0);
  }, [itens]);

  // Handlers memoizados
  const handleEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setActiveSection("dados");
    
    // Restaurar valores originais
    if (pedido) {
      setFornecedor(pedido.supplier_id || "");
      setDataEntrega(pedido.delivery_date || "");
      setStatus(pedido.status || "");
      setObservacoes(pedido.observacoes || pedido.observations || "");
      if (pedido.detalhesItens) {
        setItens(pedido.detalhesItens);
      }
    }
  }, [pedido]);

  const handleSubmit = useCallback(async (onEdit?: () => void) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Atualizar pedido
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          supplier_id: fornecedor || null,
          delivery_date: dataEntrega || null,
          status: status,
          observations: observacoes || null,
          total_value: totalValue,
        })
        .eq('id', pedido.id);

      if (orderError) throw orderError;

      // Atualizar itens se necessário
      if (itens.length > 0) {
        // Deletar itens antigos
        await supabase
          .from('order_items')
          .delete()
          .eq('order_id', pedido.id);

        // Inserir novos itens
        const itemsToInsert = itens.map(item => ({
          order_id: pedido.id,
          product_name: item.produto,
          quantity: item.quantidade,
          unit_price: item.valorUnitario,
          total_price: item.quantidade * item.valorUnitario,
          unit: item.unidade || 'un',
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Pedido atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      setIsEditMode(false);
      onEdit?.();
    } catch (error: any) {
      console.error('Erro ao atualizar pedido:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, fornecedor, dataEntrega, status, observacoes, totalValue, itens, pedido, toast]);

  return {
    // Estados
    isEditMode,
    activeSection,
    fornecedor,
    dataEntrega,
    status,
    observacoes,
    itens,
    loading,
    suppliers,
    products,
    selectedSupplier,
    totalValue,
    
    // Setters
    setActiveSection,
    setFornecedor,
    setDataEntrega,
    setStatus,
    setObservacoes,
    setItens,
    
    // Handlers
    handleEditMode,
    handleCancelEdit,
    handleSubmit,
  };
}
