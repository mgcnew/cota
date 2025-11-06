import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/components/auth/AuthProvider";

export type Importance = "low" | "medium" | "high" | "urgent";

export interface Note {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  content: string;
  importance: Importance;
  observation?: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
  importance: Importance;
  observation?: string;
}

export interface UpdateNoteData {
  id: string;
  title?: string;
  content?: string;
  importance?: Importance;
  observation?: string;
  resolved?: boolean;
}

export function useNotes() {
  const { toast } = useToast();
  const { data: currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todas as anotações
  const {
    data: notes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notes", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("company_id", currentCompany.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Note[];
    },
    enabled: !!currentCompany?.id,
  });

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
      const note = notes.find((n) => n.id === noteId);
      if (!note) throw new Error("Anotação não encontrada");

      const { data, error } = await supabase
        .from("notes")
        .update({ resolved: !note.resolved })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: (data) => {
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
    createNote,
    updateNote,
    toggleResolve,
    deleteNote,
  };
}
