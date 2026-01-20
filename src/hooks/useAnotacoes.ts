import { useState, useMemo, useCallback, useRef, startTransition } from "react";
import { useNotes, Note, Importance } from "@/hooks/useNotes";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";

export function useAnotacoes() {
  const { toast } = useToast();
  const { notes, isLoading, createNote, updateNote, toggleResolve, deleteNote } = useNotes();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    importance: "medium" as Importance,
    observation: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredNotes = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];

    let filtered = notes.filter(note => !note.resolved);

    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        (note.observation && note.observation.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [notes, debouncedSearch]);

  const resolvedNotes = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];
    return notes.filter(note => note.resolved);
  }, [notes]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Conteúdo é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.title, formData.content]);

  const handleCreateNote = useCallback(async () => {
    if (!validateForm()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    await createNote.mutateAsync({
      title: formData.title.trim(),
      content: formData.content.trim(),
      importance: formData.importance,
      observation: formData.observation?.trim() || undefined,
    });

    setFormData({ title: "", content: "", importance: "medium", observation: "" });
    setErrors({});
    startTransition(() => {
      setShowCreateDialog(false);
    });
  }, [formData, validateForm, createNote, toast]);

  const handleUpdateNote = useCallback(async () => {
    if (!editingNote) return;

    if (!validateForm()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    await updateNote.mutateAsync({
      id: editingNote.id,
      title: formData.title.trim(),
      content: formData.content.trim(),
      importance: formData.importance,
      observation: formData.observation?.trim() || undefined,
    });

    startTransition(() => {
      setEditingNote(null);
      setFormData({ title: "", content: "", importance: "medium", observation: "" });
      setErrors({});
      setShowCreateDialog(false); // Close dialog after update
    });
  }, [editingNote, formData, validateForm, updateNote, toast]);

  const handleEditNote = useCallback((note: Note) => {
    startTransition(() => {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        importance: note.importance,
        observation: note.observation || "",
      });
      setShowCreateDialog(true); // Open dialog for editing
    });
  }, []);

  const handleResolveNote = useCallback(async (noteId: string) => {
    await toggleResolve.mutateAsync(noteId);
  }, [toggleResolve]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta anotação?")) return;
    await deleteNote.mutateAsync(noteId);
  }, [deleteNote]);

  const resetForm = useCallback(() => {
    startTransition(() => {
      setFormData({ title: "", content: "", importance: "medium", observation: "" });
      setEditingNote(null);
      setErrors({});
    });
  }, []);

  return {
    notes,
    isLoading,
    showCreateDialog,
    setShowCreateDialog,
    editingNote,
    setEditingNote,
    searchQuery,
    setSearchQuery,
    formData,
    setFormData,
    errors,
    filteredNotes,
    resolvedNotes,
    handleCreateNote,
    handleUpdateNote,
    handleEditNote,
    handleResolveNote,
    handleDeleteNote,
    resetForm
  };
}
