import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/components/auth/AuthProvider";
import { useMobileQueryConfig } from "./useMobileQueryConfig";
import { useDebounce } from "@/hooks/useDebounce";
import type { Importance, Note, CreateNoteData, UpdateNoteData } from "../useNotes";

export interface NoteMobile {
  id: string;
  title: string;
  content: string;
  importance: Importance;
  observation?: string;
  resolved: boolean;
  created_at: string;
}

export function useNotesMobile() {
  const { toast } = useToast();
  const { data: currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryConfig = useMobileQueryConfig();

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Resetar página quando busca mudar
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  // Buscar anotações com paginação
  const {
    data: notesData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ notes: NoteMobile[]; total: number }>({
    queryKey: ["notes-mobile", currentCompany?.id, currentPage, pageSize, debouncedSearch],
    queryFn: async () => {
      if (!currentCompany?.id) return { notes: [], total: 0 };

      let query = supabase
        .from("notes")
        .select("id, title, content, importance, observation, resolved, created_at", { count: "exact" })
        .eq("company_id", currentCompany.id)
        .eq("resolved", false) // Apenas anotações ativas no mobile
        .order("created_at", { ascending: false });

      // Aplicar busca se houver
      if (debouncedSearch) {
        query = query.or(`title.ilike.%${debouncedSearch}%,content.ilike.%${debouncedSearch}%`);
      }

      // Aplicar paginação
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        notes: (data || []) as NoteMobile[],
        total: count || 0,
      };
    },
    enabled: !!currentCompany?.id,
    ...queryConfig,
  });

  const notes: NoteMobile[] = Array.isArray(notesData?.notes) ? notesData.notes : [];
  const total = notesData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Objeto de paginação
  const pagination = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    
    return {
      currentPage,
      pageSize,
      totalItems: total,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      goToPage: (page: number) => {
        const validPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(validPage);
      },
      nextPage: () => {
        if (currentPage < totalPages) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      prevPage: () => {
        if (currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        }
      },
      setItemsPerPage: () => {}, // Não usado no mobile
      setPageSize: () => {}, // Não usado no mobile
    };
  }, [currentPage, pageSize, total, totalPages]);

  // Criar nova anotação
  const createNote = useMutation({
    mutationFn: async (noteData: CreateNoteData) => {
      if (!currentCompany?.id || !user?.id) {
        throw new Error("Empresa ou usuário não encontrado");
      }

      const { data, error } = await supabase
        .from("notes")
        .insert({
          company_id: currentCompany.id,
          user_id: user.id,
          title: noteData.title,
          content: noteData.content,
          importance: noteData.importance,
          observation: noteData.observation,
          resolved: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-mobile", currentCompany?.id] });
      queryClient.invalidateQueries({ queryKey: ["notes", currentCompany?.id] });
      toast({
        title: "Anotação criada",
        description: "Sua anotação foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar anotação",
        description: error.message || "Não foi possível criar a anotação.",
        variant: "destructive",
      });
    },
  });

  // Atualizar anotação
  const updateNote = useMutation({
    mutationFn: async (noteData: UpdateNoteData) => {
      const { id, ...updates } = noteData;

      const { data, error } = await supabase
        .from("notes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-mobile", currentCompany?.id] });
      queryClient.invalidateQueries({ queryKey: ["notes", currentCompany?.id] });
      toast({
        title: "Anotação atualizada",
        description: "Sua anotação foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar anotação",
        description: error.message || "Não foi possível atualizar a anotação.",
        variant: "destructive",
      });
    },
  });

  // Marcar como resolvida/não resolvida
  const toggleResolve = useMutation({
    mutationFn: async (noteId: string) => {
      // Buscar a anotação atual
      const { data: noteData, error: fetchError } = await supabase
        .from("notes")
        .select("resolved")
        .eq("id", noteId)
        .single();

      if (fetchError) throw fetchError;
      if (!noteData) throw new Error("Anotação não encontrada");

      const { data, error } = await supabase
        .from("notes")
        .update({ resolved: !noteData.resolved })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-mobile", currentCompany?.id] });
      queryClient.invalidateQueries({ queryKey: ["notes", currentCompany?.id] });
      toast({
        title: data.resolved ? "Anotação resolvida" : "Anotação reaberta",
        description: data.resolved
          ? "A anotação foi marcada como resolvida."
          : "A anotação foi marcada como não resolvida.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a anotação.",
        variant: "destructive",
      });
    },
  });

  // Deletar anotação
  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-mobile", currentCompany?.id] });
      queryClient.invalidateQueries({ queryKey: ["notes", currentCompany?.id] });
      toast({
        title: "Anotação excluída",
        description: "A anotação foi excluída com sucesso.",
        variant: "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir anotação",
        description: error.message || "Não foi possível excluir a anotação.",
        variant: "destructive",
      });
    },
  });

  return {
    notes,
    isLoading,
    error,
    search: searchQuery,
    setSearch: setSearchQuery,
    pagination,
    refetch,
    createNote,
    updateNote,
    toggleResolve,
    deleteNote,
  };
}

